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

    // Newly created Stripe products
const TEACHER_PREMIUM_PRODUCT_ID = 'prod_TKAYgtgNv6CA1B'; // Teach+ ($7/month)
const STUDENT_PREMIUM_PRODUCT_ID = 'prod_TKAaovd6FnPPyq'; // Learn+ ($7/month)

const targetProductId = isStudent ? STUDENT_PREMIUM_PRODUCT_ID : TEACHER_PREMIUM_PRODUCT_ID;

const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

// Fetch product to derive its default price (fallback to first active recurring price)
const product = await stripe.products.retrieve(targetProductId);
let finalPriceId: string | undefined;

if (product.default_price) {
  if (typeof product.default_price === 'string') {
    finalPriceId = product.default_price;
  } else {
    // default_price expanded object
    finalPriceId = (product.default_price as any).id as string | undefined;
  }
}

if (!finalPriceId) {
  // Fallback: find an active recurring price for the product
  const prices = await stripe.prices.list({ product: targetProductId, active: true, limit: 10 });
  const recurring = prices.data.find((p: any) => p.type === 'recurring' && p.active) || prices.data[0];
  if (recurring?.id) {
    finalPriceId = recurring.id;
    logStep('Falling back to first active price', { priceId: finalPriceId });
  }
}

if (!finalPriceId) {
  throw new Error(`No active price found for product '${targetProductId}' in Stripe`);
}

logStep("Resolved price for checkout", { isStudent, targetProductId, finalPriceId });

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
    
    // Verify price exists before creating session
    try {
      const priceObj = await stripe.prices.retrieve(finalPriceId);
      logStep("Verified price", { priceId: priceObj.id, active: priceObj.active, currency: priceObj.currency });
    } catch (e) {
      logStep("Price verification failed", { finalPriceId, error: String(e) });
      throw e;
    }

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
