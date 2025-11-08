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
      searchQuery = `${industry} careers jobs hiring ${location} 2025 apply now company career pages site:careers OR site:jobs`;
    } else {
      searchQuery = naturalQuery || '';
    }

    console.log("Executing deep web search with query:", searchQuery);

    // Step 1: Deep web search using Tavily - EXCLUDE generic job boards, prioritize company career pages
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
        exclude_domains: [
          "indeed.com",
          "indeed.co.uk",
          "glassdoor.com",
          "glassdoor.co.uk",
          "monster.com",
          "careerbuilder.com",
          "ziprecruiter.com",
          "totaljobs.com",
          "reed.co.uk"
        ],
        include_domains: [
          "brightnetwork.co.uk",
          "targetjobs.co.uk",
          "milkround.com",
          "gradcracker.com",
          "linkedin.com/jobs"
        ]
      }),
    });

    if (!searchResponse.ok) {
      throw new Error("Failed to search for roles");
    }

    const searchData = await searchResponse.json();
    console.log(`Found ${searchData.results?.length || 0} potential matches`);

    // Step 2: Use Aurora AI to analyze and format results
    const systemPrompt = `You are Aurora, an expert career advisor and opportunity finder. Your role is to help candidates discover perfectly matched job opportunities directly on company career pages.

CRITICAL SOURCING RULES:
1. ONLY present opportunities from direct company career pages or reputable job aggregators (Bright Network, TargetJobs, LinkedIn, etc.)
2. NEVER include links from Indeed, Glassdoor, Monster, or other generic job boards
3. If you see a result from Indeed/Glassdoor, you MUST perform a deep web search to find the same role on the company's official career page
4. Search pattern: "[Company Name] [Job Title] careers apply" to find the official company application link
5. If you cannot find the company's direct application page, do NOT include that opportunity
6. Prioritize quality over quantity - only show roles with direct company application links

CRITICAL HUMANIZATION RULES:
1. NEVER use em dashes (—) in your writing
2. Use simple, conversational punctuation (periods, commas, semicolons only)
3. Present information clearly and naturally
4. Remove any asterisks (*) or unusual formatting
5. Show genuine insight about each opportunity
6. Be honest about fit and match quality

CRITICAL FORMATTING RULES:
1. Structure your response with clear paragraphs separated by DOUBLE line breaks
2. Use proper HTML for links: <a href="URL" target="_blank" rel="noopener noreferrer" class="text-teal-600 hover:text-teal-700 underline font-semibold">Link Text</a>
3. ALL links MUST have target="_blank" to open in new tabs
4. Bold job titles and company names for emphasis
5. Add DOUBLE spacing between each opportunity listing
6. Create a clean, scannable format with clear blank lines between sections

Your task is to analyze the search results and present the most relevant opportunities with DIRECT COMPANY APPLICATION LINKS ONLY. For each role:
- Provide the job title and company (bolded)
- Include the DIRECT COMPANY application link as a properly formatted HTML anchor (with target="_blank")
- Explain why this role matches the candidate's criteria
- Note any standout features or requirements
- Be honest if it's not a perfect match but still worth considering
- Mention that you've verified this is the company's official application page

Format your response as a well-organized list with DOUBLE spacing and clickable links that open in new tabs. Make it feel like advice from a knowledgeable friend who has done the legwork to find direct company application pages, not a robot.`;

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

    // Clean and sanitize the output, preserving newlines for paragraphing
    let cleanedText = analysisText
      .replace(/—/g, '-') // Replace em dashes
      .replace(/\*/g, '') // Remove asterisks
      .replace(/\r\n/g, '\n')
      .replace(/^\s*#+\s*/gm, '') // Remove markdown headings like ###
      .replace(/^>\s?/gm, '') // Remove blockquotes
      .trim();

    // Convert Markdown links [text](url) to HTML anchors
    cleanedText = cleanedText.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-teal-600 hover:text-teal-700 underline font-semibold">$1</a>');
    // Autolink plain URLs
    cleanedText = cleanedText.replace(/(?<!["'>])(https?:\/\/[^\s)]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-teal-600 hover:text-teal-700 underline font-semibold">$1</a>');

    // Build HTML blocks with DOUBLE spacing: wrap bullet groups as lists and others as paragraphs
    const blocks = cleanedText.split(/\n{2,}/);
    const htmlContent = blocks.map((block) => {
      const lines = block.split(/\n/);
      const isList = lines.every((l) => /^\s*[-*•]\s+/.test(l));
      if (isList) {
        const items = lines.map((l) => l.replace(/^\s*[-*•]\s+/, '').trim());
        return `<ul class="list-disc pl-6 space-y-1">${items.map((it) => `<li>${it}</li>`).join('')}</ul>`;
      }
      return `<p>${block}</p>`;
    }).join('<br><br>\n'); // DOUBLE spacing with <br><br> between all paragraphs

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
