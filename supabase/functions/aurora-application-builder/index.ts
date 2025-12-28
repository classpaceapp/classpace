import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApplicationBuilderRequest {
  cvBase64: string;
  cvFilename: string;
  linkedinUrl?: string;
  jobRoleUrl: string;
  request: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'No authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { cvBase64, cvFilename, linkedinUrl, jobRoleUrl, request }: ApplicationBuilderRequest = await req.json();

    console.log("Processing application builder request");

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");

    if (!OPENAI_API_KEY || !TAVILY_API_KEY) {
      throw new Error("API keys not configured");
    }

    // Step 1: Parse CV using document parsing (simulated - in production use actual parsing)
    console.log("Parsing CV:", cvFilename);

    // Step 2: Fetch job role details using Tavily
    console.log("Fetching job role details from:", jobRoleUrl);
    const jobRoleResponse = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: `job description details from ${jobRoleUrl}`,
        search_depth: "advanced",
        max_results: 3,
        include_raw_content: true,
      }),
    });

    if (!jobRoleResponse.ok) {
      throw new Error("Failed to fetch job role details");
    }

    const jobRoleData = await jobRoleResponse.json();
    console.log("Job role data fetched successfully");

    // Step 3: Optionally fetch LinkedIn profile
    let linkedinData = null;
    if (linkedinUrl) {
      console.log("Fetching LinkedIn profile:", linkedinUrl);
      const linkedinResponse = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query: `LinkedIn profile information from ${linkedinUrl}`,
          search_depth: "basic",
          max_results: 2,
        }),
      });

      if (linkedinResponse.ok) {
        linkedinData = await linkedinResponse.json();
        console.log("LinkedIn data fetched successfully");
      }
    }

    // Step 4: Generate application with Aurora (Gemini) with humanization
    console.log("Generating application with Aurora AI");

    const systemPrompt = `You are Aurora, an expert career advisor and application writer. Your role is to help candidates create compelling, human, and authentic application materials.

CRITICAL HUMANIZATION RULES:
1. NEVER use em dashes (—) in your writing
2. Use simple, conversational punctuation (periods, commas, semicolons only)
3. Write naturally as a human would, avoiding overly formal or robotic language
4. Remove any asterisks (*), unusual formatting, or AI-typical patterns
5. Use contractions where natural (I'm, you're, we're)
6. Vary sentence structure and length for natural flow
7. Show genuine enthusiasm without sounding artificial

CRITICAL FORMATTING RULES:
1. Structure your response with clear paragraphs separated by DOUBLE line breaks
2. Use proper spacing between ALL sections - always have a blank line between paragraphs
3. Create a clean, readable format that's easy to copy and paste
4. Add appropriate line breaks for readability

CRITICAL APPLICATION QUESTIONS FEATURE:
- If the job role page contains specific application questions, YOU MUST extract and answer EACH question individually
- Number each question and provide a tailored answer using information from the CV and LinkedIn profile
- Format as: "Question 1: [question text]" followed by the answer, then blank line before next question

Your task is to analyze the candidate's CV, the job role details, and any LinkedIn information, then craft exactly what they've requested in their prompt. The output should be:
- Professional yet personable
- Tailored specifically to the role
- Highlighting relevant experience and skills
- Authentic and human in tone
- Free from any AI-like formatting or phrases
- Properly formatted with clear paragraphs and DOUBLE spacing between all sections

Context provided:
- CV information (simplified representation)
- Job role details from web search (check for application questions!)
- LinkedIn profile (if provided)
- Candidate's specific request

Generate a response that feels like it was written by a thoughtful, experienced professional, not an AI.`;

    const userPrompt = `Job Role Information:
${JSON.stringify(jobRoleData.results?.slice(0, 2) || [], null, 2)}

${linkedinData ? `LinkedIn Profile Information:
${JSON.stringify(linkedinData.results?.slice(0, 1) || [], null, 2)}` : ''}

CV Filename: ${cvFilename}
(Note: Full CV content would be parsed here)

Candidate's Request:
${request}

Please create the requested application materials following all humanization guidelines. Make it compelling, authentic, and perfectly tailored to this opportunity.`;

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      throw new Error("Failed to generate application");
    }

    const aiData = await aiResponse.json();
    const generatedText = aiData.choices?.[0]?.message?.content;

    if (!generatedText) {
      throw new Error("No response generated");
    }

    // Clean and sanitize the output, preserving newlines for paragraphing
    let cleanedText = generatedText
      .replace(/—/g, '-') // Replace em dashes
      .replace(/\*/g, '') // Remove asterisks
      .replace(/\r\n/g, '\n')
      .replace(/^\s*#+\s*/gm, '') // Remove markdown headings like ###
      .replace(/^>\s?/gm, '') // Remove blockquotes
      .trim();

    // Convert Markdown links [text](url) to HTML anchors
    cleanedText = cleanedText.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-600 hover:text-emerald-700 underline font-semibold">$1</a>');

    // Build HTML blocks with DOUBLE spacing: wrap bullet groups as lists and others as paragraphs
    const blocks = cleanedText.split(/\n{2,}/);
    const htmlContent = blocks.map((block: string) => {
      const lines = block.split(/\n/);
      const isList = lines.every((l) => /^\s*[-*•]\s+/.test(l));
      if (isList) {
        const items = lines.map((l) => l.replace(/^\s*[-*•]\s+/, '').trim());
        return `<ul class="list-disc pl-6 space-y-1">${items.map((it) => `<li>${it}</li>`).join('')}</ul>`;
      }
      return `<p>${block}</p>`;
    }).join('<br><br>\n'); // DOUBLE spacing with <br><br> between all paragraphs

    console.log("Application generated successfully");

    return new Response(
      JSON.stringify({ success: true, result: htmlContent }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in aurora-application-builder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
