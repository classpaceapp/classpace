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
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    } else {
      logStep("No existing customer, will create on checkout");
    }

    // Resolve price dynamically by product name if not provided
    if (!finalPriceId) {
      const targetName = isStudent ? "Classpace Learn+" : "Classpace Teach+";
      // List products in test mode and find by exact name
      const products = await stripe.products.list({ active: true, limit: 100 });
      const product = products.data.find((p) => p.name === targetName);
      if (!product) {
        throw new Error(`Stripe product not found: ${targetName}. Ensure it exists in the same mode as the API key (test vs live).`);
      }
      // Prefer a monthly recurring price; otherwise take the first active price
      const prices = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
      const recurringMonthly = prices.data.find((pr) => pr.type === "recurring" && pr.recurring?.interval === "month");
      finalPriceId = (recurringMonthly || prices.data[0])?.id;
      if (!finalPriceId) {
        throw new Error(`No active price found for product ${targetName}. Create/activate a price in the same Stripe mode.`);
      }
      logStep("Resolved price dynamically", { productId: product.id, finalPriceId });
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
