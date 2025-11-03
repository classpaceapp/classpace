import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RoleSearchRequest {
  mode: 'structured' | 'natural';
  industry?: string;
  location?: string;
  naturalQuery?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mode, industry, location, naturalQuery }: RoleSearchRequest = await req.json();

    console.log("Processing role search request:", { mode, industry, location });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const TAVILY_API_KEY = Deno.env.get("TAVILY_API_KEY");

    if (!LOVABLE_API_KEY || !TAVILY_API_KEY) {
      throw new Error("API keys not configured");
    }

    // Construct search query based on mode
    let searchQuery = '';
    if (mode === 'structured') {
      searchQuery = `${industry} careers jobs hiring ${location} 2025 apply now company career pages`;
    } else {
      searchQuery = naturalQuery || '';
    }

    console.log("Executing deep web search with query:", searchQuery);

    // Step 1: Deep web search using Tavily - NO domain restrictions to find company career pages
    const searchResponse = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: searchQuery,
        search_depth: "advanced",
        max_results: 15,
        include_raw_content: true,
      }),
    });

    if (!searchResponse.ok) {
      throw new Error("Failed to search for roles");
    }

    const searchData = await searchResponse.json();
    console.log(`Found ${searchData.results?.length || 0} potential matches`);

    // Step 2: Use Aurora AI to analyze and format results
    const systemPrompt = `You are Aurora, an expert career advisor and opportunity finder. Your role is to help candidates discover perfectly matched job opportunities.

CRITICAL HUMANIZATION RULES:
1. NEVER use em dashes (—) in your writing
2. Use simple, conversational punctuation (periods, commas, semicolons only)
3. Present information clearly and naturally
4. Remove any asterisks (*) or unusual formatting
5. Show genuine insight about each opportunity
6. Be honest about fit and match quality

CRITICAL FORMATTING RULES:
1. Structure your response with clear paragraphs separated by double line breaks
2. Use proper HTML for links: <a href="URL" target="_blank" rel="noopener noreferrer" class="text-teal-600 hover:text-teal-700 underline font-semibold">Link Text</a>
3. Bold job titles and company names for emphasis
4. Add spacing between each opportunity listing
5. Create a clean, scannable format

Your task is to analyze the search results and present the most relevant opportunities. For each role:
- Provide the job title and company (bolded)
- Include the direct application link as a properly formatted HTML anchor
- Explain why this role matches the candidate's criteria
- Note any standout features or requirements
- Be honest if it's not a perfect match but still worth considering

Format your response as a well-organized list with proper spacing and clickable links. Make it feel like advice from a knowledgeable friend, not a robot.`;

    const userPrompt = `Search Criteria:
${mode === 'structured' ? `Industry: ${industry}
Location: ${location}` : `Natural Query: ${naturalQuery}`}

Search Results:
${JSON.stringify(searchData.results || [], null, 2)}

Please analyze these opportunities and present the best matches in a clear, actionable format. Focus on quality over quantity, and be thoughtful about fit.`;

    console.log("Generating role analysis with Aurora AI");

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
      
      throw new Error("Failed to analyze roles");
    }

    const aiData = await aiResponse.json();
    const analysisText = aiData.choices?.[0]?.message?.content;

    if (!analysisText) {
      throw new Error("No analysis generated");
    }

    // Clean and sanitize the output, then convert to HTML
    let cleanedText = analysisText
      .replace(/—/g, '-') // Replace em dashes
      .replace(/\*/g, '') // Remove asterisks
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Convert to proper HTML with paragraphs and preserve links
    // Split by double newlines to get paragraphs
    const paragraphs = cleanedText.split(/\n\n+/);
    const htmlContent = paragraphs
      .map(para => {
        // If paragraph already contains HTML tags, keep as is
        if (para.includes('<a ') || para.includes('<p>')) {
          return para;
        }
        // Otherwise, wrap in paragraph tags
        return `<p>${para}</p>`;
      })
      .join('\n\n');

    console.log("Role analysis completed successfully");

    return new Response(
      JSON.stringify({ success: true, result: htmlContent }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in aurora-role-search:", error);
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
