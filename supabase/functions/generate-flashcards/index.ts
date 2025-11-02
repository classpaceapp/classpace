import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-FLASHCARDS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { title, curriculum, topic, subtopic, cardCount, podId } = await req.json();
    
    logStep("Request data", { title, curriculum, topic, subtopic, cardCount, podId });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Authentication failed");
    
    logStep("User authenticated", { userId: user.id });

    // Get user's profile to check role
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const isTeacher = profile?.role === "teacher";
    const limit = isTeacher ? 1 : 6;

    // Check existing flashcard count for this user in this pod
    const { data: existingFlashcards, error: countError } = await supabaseClient
      .from("pod_flashcards")
      .select("id")
      .eq("pod_id", podId)
      .eq("created_by", user.id);

    if (countError) {
      logStep("Error checking flashcard count", { error: countError });
      throw new Error("Failed to check flashcard limit");
    }

    const currentCount = existingFlashcards?.length || 0;
    logStep("Current flashcard count", { currentCount, limit, isTeacher });

    if (currentCount >= limit) {
      logStep("User reached limit");
      return new Response(
        JSON.stringify({ 
          error: "LIMIT_REACHED", 
          limit,
          isTeacher,
          message: isTeacher 
            ? "You've reached your free plan limit of 1 flashcard set. Upgrade to create more!"
            : "You've reached your limit of 6 flashcard sets. Upgrade to create more!"
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Construct search query
    const searchQuery = `${curriculum} ${topic} ${subtopic || ""} educational content flashcards`.trim();
    logStep("Search query", { searchQuery });

    // Get Tavily API key
    const tavilyApiKey = Deno.env.get("TAVILY_API_KEY");
    if (!tavilyApiKey) throw new Error("TAVILY_API_KEY not configured");

    // Search with Tavily
    const tavilyResponse = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: searchQuery,
        search_depth: "advanced",
        max_results: 5,
      }),
    });

    if (!tavilyResponse.ok) {
      throw new Error(`Tavily search failed: ${tavilyResponse.status}`);
    }

    const searchResults = await tavilyResponse.json();
    logStep("Search results retrieved", { resultCount: searchResults.results?.length });

    const searchContext = searchResults.results
      ?.map((r: any) => `${r.title}\n${r.content}`)
      .join("\n\n")
      .slice(0, 8000);

    // Generate flashcards with Lovable AI
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an expert educator creating flashcards for students. Generate exactly ${cardCount} flashcards based on the provided search results.

CRITICAL FORMATTING RULES:
1. Return ONLY valid JSON with no markdown formatting, no code blocks, no backticks
2. Each flashcard must have:
   - "hint": A concise question or prompt (front of card)
   - "content": A clear, detailed answer (back of card)
3. For mathematical equations, use LaTeX notation wrapped in $ for inline or $$ for display math
   Example: "The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$"
4. Remove ALL unnecessary punctuation like **, *, bullet points
5. Make content clear, educational, and accurate
6. Number each card sequentially

Return format:
{
  "flashcards": [
    {
      "hint": "What is...",
      "content": "The answer is..."
    }
  ]
}`;

    const userPrompt = `Create ${cardCount} educational flashcards about:
Curriculum: ${curriculum}
Topic: ${topic}
${subtopic ? `Subtopic: ${subtopic}` : ""}

Use this educational content as reference:
${searchContext}

Generate exactly ${cardCount} flashcards with clear hints and comprehensive content. Use LaTeX for any mathematical expressions.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      logStep("AI API error", { status: aiResponse.status, error: errorText });
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0]?.message?.content;
    
    if (!content) throw new Error("No content generated");

    logStep("AI content generated");

    // Parse and clean the response
    let flashcardsData;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim();
      
      flashcardsData = JSON.parse(cleanContent);
    } catch (parseError) {
      logStep("Parse error", { content, error: parseError });
      throw new Error("Failed to parse AI response");
    }

    if (!flashcardsData.flashcards || !Array.isArray(flashcardsData.flashcards)) {
      throw new Error("Invalid flashcards format");
    }

    // Clean each flashcard
    const cleanedFlashcards = flashcardsData.flashcards.slice(0, cardCount).map((card: any, index: number) => ({
      hint: card.hint.replace(/\*\*/g, "").replace(/\*/g, "").trim(),
      content: card.content.replace(/\*\*/g, "").replace(/\*/g, "").trim(),
      card_order: index + 1,
    }));

    logStep("Flashcards cleaned", { count: cleanedFlashcards.length });

    // Create flashcard set
    const { data: flashcardSet, error: setError } = await supabaseClient
      .from("pod_flashcards")
      .insert({
        pod_id: podId,
        created_by: user.id,
        title,
        curriculum,
        topic,
        subtopic,
        card_count: cleanedFlashcards.length,
      })
      .select()
      .single();

    if (setError) {
      logStep("Error creating flashcard set", { error: setError });
      throw new Error("Failed to create flashcard set");
    }

    logStep("Flashcard set created", { setId: flashcardSet.id });

    // Insert cards
    const cardsToInsert = cleanedFlashcards.map((card: any) => ({
      flashcard_set_id: flashcardSet.id,
      hint: card.hint,
      content: card.content,
      card_order: card.card_order,
    }));

    const { error: cardsError } = await supabaseClient
      .from("flashcard_cards")
      .insert(cardsToInsert);

    if (cardsError) {
      logStep("Error inserting cards", { error: cardsError });
      throw new Error("Failed to insert flashcards");
    }

    logStep("Flashcards inserted successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        flashcardSet,
        cards: cleanedFlashcards 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    logStep("ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
