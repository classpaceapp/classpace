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

    // Try to find Stripe customer by metadata (robust if email changed at checkout)
    let customerId: string | null = null;
    try {
      // @ts-ignore - customers.search is available in Stripe API
      const found = await stripe.customers.search({
        // Search by our stored Supabase user id
        query: `metadata['supabase_user_id']:'${user.id}'`,
        limit: 1,
      } as any);
      if ((found as any)?.data?.length) {
        customerId = (found as any).data[0].id as string;
        logStep("Found Stripe customer via metadata", { customerId });
      }
    } catch (e) {
      logStep("Customer search by metadata not available or failed");
    }

    // Fallback to email lookup
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found Stripe customer via email", { customerId });
      }
    }
    
    if (!customerId) {
      logStep("No customer found, returning free tier");
      
      // Update subscription record to free
      await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          tier: 'free',
          status: 'active'
        }, { onConflict: 'user_id' });
      
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

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
    });

    logStep("Fetched subscriptions", { 
      count: subscriptions.data.length,
      statuses: subscriptions.data.map(s => s.status)
    });

    // Consider active-like statuses
    const eligibleStatuses = new Set(["active", "trialing"]);
    const eligibleSubs = subscriptions.data.filter((s) => eligibleStatuses.has(s.status));

    logStep("Eligible subscriptions", { count: eligibleSubs.length });

    if (eligibleSubs.length === 0) {
      logStep("No active subscription found");
      
      // Update to free tier
      await supabaseAdmin
        .from('subscriptions')
        .upsert({
          user_id: user.id,
          tier: 'free',
          status: 'active',
          stripe_customer_id: customerId
        }, { onConflict: 'user_id' });

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

    const selectedSub = eligibleSubs.sort((a, b) => b.current_period_end - a.current_period_end)[0];
    const subscription = selectedSub;
    
    // Safely extract product ID
    let productId: string | null = null;
    try {
      const priceObj = subscription.items.data[0]?.price;
      if (priceObj && typeof priceObj === 'object') {
        productId = (typeof priceObj.product === 'string') 
          ? priceObj.product 
          : (priceObj.product as any)?.id || null;
      }
    } catch (e) {
      logStep("Error extracting product ID", { error: String(e) });
    }

    // Safely extract subscription end date
    let subscriptionEnd: string;
    try {
      if (!subscription.current_period_end) {
        throw new Error("current_period_end is undefined");
      }
      const periodEndDate = new Date(subscription.current_period_end * 1000);
      if (isNaN(periodEndDate.getTime())) {
        throw new Error(`Invalid date from timestamp: ${subscription.current_period_end}`);
      }
      subscriptionEnd = periodEndDate.toISOString();
    } catch (e) {
      logStep("Error converting subscription end date", { 
        error: String(e), 
        timestamp: subscription.current_period_end 
      });
      // Use a far future date as fallback
      subscriptionEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    }

    logStep("Active subscription found", { 
      subscriptionId: subscription.id, 
      endDate: subscriptionEnd,
      productId 
    });
    
    // Get user profile to determine if student or teacher
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    // Determine tier based on product ID and user role (TEST MODE)
    const TEACHER_PREMIUM_PRODUCT_ID = 'prod_TJxkwOv1P5aKdZ';  // TEST MODE
    const STUDENT_PREMIUM_PRODUCT_ID = 'prod_TJxlJpDbSJojMr';  // TEST MODE
    
    let tier = 'free';
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
    const { error: upsertError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        tier: tier,
        status: 'active',
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        current_period_end: subscriptionEnd
      }, { onConflict: 'user_id' });
    
    if (upsertError) {
      logStep("Database upsert error", { error: upsertError.message });
      throw new Error(`Failed to update subscription: ${upsertError.message}`);
    }

    return new Response(JSON.stringify({
      subscribed: true,
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
