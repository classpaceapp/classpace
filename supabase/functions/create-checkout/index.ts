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

    // Direct price IDs for subscriptions (verified in Stripe dashboard)
    const TEACHER_PREMIUM_PRICE_ID = 'price_1SNXCkBm9rSu4II6UpqZQo8F'; // Teach+ $7/month
    const STUDENT_PREMIUM_PRICE_ID = 'price_1SNXB4Bm9rSu4II6PkbvuBQa'; // Learn+ $7/month
    
    const finalPriceId = isStudent ? STUDENT_PREMIUM_PRICE_ID : TEACHER_PREMIUM_PRICE_ID;
    const planName = isStudent ? "Classpace Learn+" : "Classpace Teach+";

    logStep("Using direct price ID for checkout", { isStudent, finalPriceId, planName });

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
