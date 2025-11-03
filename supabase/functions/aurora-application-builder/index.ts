import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

  try {
    const { cvBase64, cvFilename, linkedinUrl, jobRoleUrl, request }: ApplicationBuilderRequest = await req.json();

    console.log("Processing application builder request");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");

    if (!LOVABLE_API_KEY || !TAVILY_API_KEY) {
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

    // Step 4: Generate application with Aurora (Lovable AI) with humanization
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
1. Structure your response with clear paragraphs separated by double line breaks
2. Use proper spacing between sections
3. Create a clean, readable format that's easy to copy and paste
4. Add appropriate line breaks for readability

Your task is to analyze the candidate's CV, the job role details, and any LinkedIn information, then craft exactly what they've requested in their prompt. The output should be:
- Professional yet personable
- Tailored specifically to the role
- Highlighting relevant experience and skills
- Authentic and human in tone
- Free from any AI-like formatting or phrases
- Properly formatted with clear paragraphs and spacing

Context provided:
- CV information (simplified representation)
- Job role details from web search
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

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      if (aiResponse.status === 402) {
        throw new Error("AI service requires payment. Please contact support.");
      }
      
      throw new Error("Failed to generate application");
    }

    const aiData = await aiResponse.json();
    const generatedText = aiData.choices?.[0]?.message?.content;

    if (!generatedText) {
      throw new Error("No response generated");
    }

    // Clean and sanitize the output, then convert to HTML
    let cleanedText = generatedText
      .replace(/—/g, '-') // Replace em dashes
      .replace(/\*/g, '') // Remove asterisks
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Convert to proper HTML with paragraphs
    // Split by double newlines to get paragraphs
    const paragraphs = cleanedText.split(/\n\n+/);
    const htmlContent = paragraphs
      .map(para => {
        // If paragraph already contains HTML tags, keep as is
        if (para.includes('<p>')) {
          return para;
        }
        // Otherwise, wrap in paragraph tags
        return `<p>${para}</p>`;
      })
      .join('\n\n');

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
