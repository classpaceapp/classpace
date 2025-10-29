import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create client with ANON key for JWT validation
  const supabaseAuth = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  // Create client with SERVICE ROLE for database operations
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !user?.email) {
      throw new Error(`Authentication error: ${userError?.message || 'User not found'}`);
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Get request body to determine which plan
    const body = await req.json().catch(() => ({}));
    const { isStudent } = body;

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Product IDs from Stripe (verified)
    const TEACHER_PRODUCT_ID = 'prod_TJeHNIEXymOooF'; // Classpace Teach+
    const STUDENT_PRODUCT_ID = 'prod_TK2C5qgNV85Jlc'; // Classpace Learn+
    
    const targetProductId = isStudent ? STUDENT_PRODUCT_ID : TEACHER_PRODUCT_ID;
    const planName = isStudent ? "Classpace Learn+" : "Classpace Teach+";

    logStep("Fetching default price for product", { isStudent, targetProductId, planName });

    // Get the product to retrieve its default price
    let finalPriceId: string;
    try {
      const product = await stripe.products.retrieve(targetProductId);
      if (!product.default_price) {
        throw new Error(`No default price set for product ${targetProductId}`);
      }
      finalPriceId = typeof product.default_price === 'string' 
        ? product.default_price 
        : product.default_price.id;
      logStep("Retrieved default price from product", { finalPriceId });
    } catch (priceError) {
      logStep("ERROR retrieving default price, attempting fallback", { error: priceError });

      // Fallback A: Try searching products by name keywords within this Stripe account
      try {
        // Prefer specific product names but fall back to generic keywords
        const queries = isStudent
          ? ["name:'Classpace Learn+'", "name~'Learn'"]
          : ["name:'Classpace Teach+'", "name~'Teach'"];

        let foundProductId: string | null = null;
        for (const q of queries) {
          try {
            // @ts-ignore - search may not be enabled in some accounts
            const result = await (stripe.products as any).search({ query: q, limit: 1 });
            if (result?.data?.length) {
              foundProductId = result.data[0].id;
              logStep("Found product via search", { q, foundProductId });
              break;
            }
          } catch (_) {
            // search not available; continue to next fallback
          }
        }

        if (foundProductId) {
          const product = await stripe.products.retrieve(foundProductId);
          if (product.default_price) {
            finalPriceId = typeof product.default_price === 'string'
              ? product.default_price
              : product.default_price.id;
            logStep("Using default price from searched product", { finalPriceId });
          } else {
            const pricesForProduct = await stripe.prices.list({ product: foundProductId, active: true, limit: 1 });
            if (pricesForProduct.data.length) {
              finalPriceId = pricesForProduct.data[0].id;
              logStep("Using first active price from searched product", { finalPriceId });
            }
          }
        }
      } catch (_) {}

      // Fallback B: Global scan of active recurring monthly prices; pick best match by keyword, else first
      if (!finalPriceId) {
        const prices = await stripe.prices.list({ active: true, expand: ['data.product'], limit: 100 });
        const recurring = prices.data.filter((p: any) => p.type === 'recurring' && p.recurring?.interval === 'month');
        const keyword = isStudent ? 'learn' : 'teach';

        // Prefer a price whose product name matches our intent
        const preferred = recurring.find((p: any) => {
          const name = (p.product as any)?.name?.toLowerCase?.() || '';
          return name.includes(keyword) || name.includes('classpace');
        });

        const chosen = preferred || recurring[0] || prices.data[0];
        if (!chosen) {
          throw new Error('No suitable active prices found in this Stripe account. Please create one monthly recurring price.');
        }
        finalPriceId = chosen.id;
        logStep("Using global fallback price", { finalPriceId, chosenProduct: (chosen.product as any)?.id });
      }
    }

    logStep("Final price ID selected for checkout", { finalPriceId });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      // Proactively create a customer tied to this Supabase user to avoid email edits breaking linkage
      const created = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id }
      });
      customerId = created.id;
      logStep("Created new customer", { customerId });
    }

    const origin = req.headers.get("origin") || "http://localhost:3000";
    
    // Get user profile to determine redirect URL
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const dashboardUrl = profileData?.role === 'teacher' ? '/dashboard' : '/student-dashboard';
    const roleParam = (isStudent === true) || (profileData?.role === 'learner') ? 'student' : 'teacher';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: finalPriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}${dashboardUrl}?subscription=success&role=${roleParam}`,
      cancel_url: `${origin}${dashboardUrl}?subscription=cancelled&role=${roleParam}`,
      subscription_data: {
        metadata: {
          plan_name: planName
        }
      }
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
