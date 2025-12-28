import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TEACHER-ASSISTANT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseAuth = createClient(supabaseUrl, anon);
    const supabaseAdmin = createClient(supabaseUrl, service, { auth: { persistSession: false } });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");
    const token = authHeader.replace("Bearer ", "");

    const { data: authData, error: authErr } = await supabaseAuth.auth.getUser(token);
    if (authErr || !authData.user) throw new Error(`Auth failed: ${authErr?.message || 'no user'}`);
    const user = authData.user;
    logStep("User authenticated", { userId: user.id });

    const { messages } = await req.json().catch(() => ({ messages: [] }));
    if (!Array.isArray(messages)) throw new Error("messages must be an array");

    // Identify role
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, first_name, last_name')
      .eq('id', user.id)
      .single();

    const role = (profile?.role as string) || 'teacher';

    // Build pod context for this user
    // If teacher: pods they own. Otherwise: pods they are a member of.
    let podIds: string[] = [];
    let pods: any[] = [];

    if (role === 'teacher') {
      const { data: teacherPods } = await supabaseAdmin
        .from('pods')
        .select('id, title, subject, description, updated_at')
        .eq('teacher_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(10);
      pods = teacherPods || [];
      podIds = pods.map((p) => p.id);
    } else {
      // learner: via pod_members
      const { data: memberPods } = await supabaseAdmin
        .from('pod_members')
        .select('pod_id')
        .eq('user_id', user.id)
        .limit(25);
      podIds = (memberPods || []).map((m) => m.pod_id);
      if (podIds.length) {
        const { data: podRows } = await supabaseAdmin
          .from('pods')
          .select('id, title, subject, description, updated_at')
          .in('id', podIds)
          .order('updated_at', { ascending: false })
          .limit(10);
        pods = podRows || [];
      }
    }

    // Pull recent notes and materials for context
    let notes: any[] = [];
    let materials: any[] = [];

    if (podIds.length) {
      const { data: noteRows } = await supabaseAdmin
        .from('pod_notes')
        .select('id, pod_id, title, content, created_at')
        .in('pod_id', podIds)
        .order('created_at', { ascending: false })
        .limit(20);
      notes = noteRows || [];

      const { data: matRows } = await supabaseAdmin
        .from('pod_materials')
        .select('id, pod_id, title, description, category, file_name, file_type, file_url, created_at')
        .in('pod_id', podIds)
        .order('created_at', { ascending: false })
        .limit(20);
      materials = matRows || [];
    }

    const context = {
      user: {
        id: user.id,
        name: `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || undefined,
        role,
      },
      pods,
      notes,
      materials,
    };

    const systemPrompt = `You are Classpace's AI Teaching Assistant. Provide concise, helpful answers. Use the provided context from the teacher's pods (titles, notes, materials) to answer specifically. If a user asks about a specific pod, prefer its related notes and materials. If information is not present in context, say so briefly. Avoid fabrications. IMPORTANT: Format ALL math and science using LaTeX enclosed in $ (inline) or $$ (block). Do NOT use \\( or \\[ delimiters.`;

    const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt + `\n\nContext JSON:\n${JSON.stringify(context).slice(0, 120000)}` },
          ...messages.filter((m: any) => m.role !== 'system')
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      logStep("AI gateway error", { status: aiResp.status, t });
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const responseText = data.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ response: responseText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    logStep("ERROR", { message: e instanceof Error ? e.message : String(e) });
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
