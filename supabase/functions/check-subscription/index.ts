import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
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
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    logStep("Authenticating user with token");
    
    // Use ANON client to verify the JWT token
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
    if (userError || !user?.email) {
      throw new Error(`Authentication error: ${userError?.message || 'User not found'}`);
    }
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, returning free tier");
      
      // Update subscription record to free
      await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          tier: 'free',
          status: 'active'
        });
      
      return new Response(JSON.stringify({ 
        subscribed: false,
        tier: 'free',
        product_id: null,
        subscription_end: null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const hasActiveSub = subscriptions.data.length > 0;
    let productId = null;
    let subscriptionEnd = null;
    let tier = 'free';

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      logStep("Active subscription found", { subscriptionId: subscription.id, endDate: subscriptionEnd });
      productId = subscription.items.data[0].price.product as string;
      
      // Get user profile to determine if student or teacher
      const { data: profileData } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      // Determine tier based on product ID and user role
      const TEACHER_PREMIUM_PRODUCT_ID = 'prod_TI64fNw74rXOQ4';
      const STUDENT_PREMIUM_PRODUCT_ID = 'prod_TJS0AgYeVzi9Gv';
      
      if (productId === TEACHER_PREMIUM_PRODUCT_ID) {
        tier = 'teacher_premium';
      } else if (productId === STUDENT_PREMIUM_PRODUCT_ID) {
        tier = 'student_premium';
      } else if (profileData?.role === 'teacher') {
        tier = 'teacher_premium';
      } else {
        tier = 'student_premium';
      }
      
      logStep("Determined subscription tier", { productId, tier, userRole: profileData?.role });
      
      // Update subscription record
      await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          tier: tier,
          status: 'active',
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          current_period_end: subscriptionEnd
        });
    } else {
      logStep("No active subscription found");
      
      // Update to free tier
      await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          tier: 'free',
          status: 'active',
          stripe_customer_id: customerId
        });
    }

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      tier: tier,
      product_id: productId,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
