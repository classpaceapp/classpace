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

    // Get request body if provided (for specifying price)
    const body = await req.json().catch(() => ({}));
    const { priceId, isStudent } = body;

    // Determine price ID: prefer request body, otherwise resolve dynamically later
    let finalPriceId: string | undefined = priceId;
    logStep("Initial price resolution", { providedPriceId: finalPriceId, isStudent });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Validate provided priceId (if any); fall back to dynamic resolution if invalid/inactive
    if (finalPriceId) {
      try {
        const price = await stripe.prices.retrieve(finalPriceId);
        if (!price.active) {
          logStep("Provided price is inactive, falling back to dynamic resolution", { finalPriceId });
          finalPriceId = undefined;
        } else {
          logStep("Using provided priceId", { finalPriceId });
        }
      } catch (e) {
        logStep("Provided priceId is invalid, falling back to dynamic resolution", { providedPriceId: finalPriceId });
        finalPriceId = undefined;
      }
    }

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      logStep("No existing customer, will create on checkout");
    }

    // Resolve price dynamically by product name if not provided or invalid
    if (!finalPriceId) {
      const candidateNames = (isStudent === true)
        ? ["Learn+", "Learn +", "Classpace Learn+", "Classpace Learn +", "Learnspace Learn+", "Learnspace Learn +"]
        : ["Teach+", "Teach +", "Classpace Teach+", "Classpace Teach +", "Learnspace Teach+", "Learnspace Teach +"];

      // List active products and find by flexible name matching
      const products = await stripe.products.list({ active: true, limit: 100 });
      let product = products.data.find((p) => candidateNames.includes(p.name.trim()));
      if (!product) {
        const keyword = (isStudent === true) ? "learn" : "teach";
        product = products.data.find((p) => p.name.toLowerCase().includes(keyword) && p.name.includes("+"));
      }
      if (!product) {
        const expected = (isStudent === true) ? "Learn+" : "Teach+";
        throw new Error(`Stripe product not found for ${expected}. Ensure it exists and is active in the current Stripe mode (test vs live).`);
      }

      // Prefer a monthly recurring price; otherwise take the first active price
      const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
      const recurringMonthly = prices.data.find((pr) => pr.type === "recurring" && pr.recurring?.interval === "month");
      finalPriceId = (recurringMonthly || prices.data[0])?.id;
      if (!finalPriceId) {
        throw new Error(`No active price found for product ${product.name}. Create/activate a monthly recurring price in the same Stripe mode.`);
      }
      logStep("Resolved price dynamically", { productId: product.id, productName: product.name, finalPriceId });
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
          plan_name: isStudent ? "Classpace Learn+" : "Classpace Teach+"
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
