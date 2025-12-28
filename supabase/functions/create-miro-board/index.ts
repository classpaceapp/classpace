import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-MIRO-BOARD] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { title, podId } = await req.json();
    if (!title || !podId) throw new Error("Title and podId are required");

    const RAW_MIRO_TOKEN = (Deno.env.get("MIRO_ACCESS_TOKEN") ?? "").trim();
    // Allow users to paste token with or without the "Bearer " prefix
    const MIRO_ACCESS_TOKEN = RAW_MIRO_TOKEN.replace(/^Bearer\s+/i, "");
    if (!MIRO_ACCESS_TOKEN) throw new Error("MIRO_ACCESS_TOKEN not configured");

    logStep("Creating Miro board", { title });

    // Create a new Miro board using the API
    const miroResponse = await fetch("https://api.miro.com/v2/boards", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MIRO_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: title,
        policy: {
          sharingPolicy: {
            access: "edit",
            teamAccess: "edit"
          }
        }
      })
    });

    if (!miroResponse.ok) {
      const errorText = await miroResponse.text();
      logStep("Miro API error", { status: miroResponse.status, error: errorText });
      throw new Error(`Failed to create Miro board: ${errorText}`);
    }

    const miroBoard = await miroResponse.json();
    logStep("Miro board created", { boardId: miroBoard.id });

    return new Response(JSON.stringify({
      boardId: miroBoard.id,
      viewLink: miroBoard.viewLink,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});