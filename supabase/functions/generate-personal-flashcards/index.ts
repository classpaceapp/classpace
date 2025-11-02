import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, curriculum, topic, subtopic, cardCount } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Authentication failed");

    // Check existing flashcard count
    const { data: existingFlashcards, error: countError } = await supabaseClient
      .from("personal_flashcards")
      .select("id")
      .eq("user_id", user.id)
      .eq("archived", false);

    if (countError) throw new Error("Failed to check flashcard limit");

    const currentCount = existingFlashcards?.length || 0;
    const limit = 1; // Free plan limit

    if (currentCount >= limit) {
      return new Response(
        JSON.stringify({ 
          error: "LIMIT_REACHED", 
          limit,
          message: "You've reached your free plan limit of 1 flashcard set. Upgrade to create more!"
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Construct search query
    const truncatedSubtopic = subtopic ? subtopic.slice(0, 500) : "";
    const searchQuery = `${curriculum} ${topic} ${truncatedSubtopic} educational content flashcards`.trim();

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
    const searchContext = searchResults.results
      ?.map((r: any) => `${r.title}\n${r.content}`)
      .join("\n\n")
      .slice(0, 12000);

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

    const promptSubtopic = subtopic ? subtopic.slice(0, 1000) : "";
    const userPrompt = `Create ${cardCount} educational flashcards about:
Curriculum: ${curriculum}
Topic: ${topic}
${promptSubtopic ? `Subtopic: ${promptSubtopic}` : ""}

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
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0]?.message?.content;
    
    if (!content) throw new Error("No content generated");

    // Parse and clean the response
    const cleanContent = content
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    
    const flashcardsData = JSON.parse(cleanContent);

    if (!flashcardsData.flashcards || !Array.isArray(flashcardsData.flashcards)) {
      throw new Error("Invalid flashcards format");
    }

    // Clean each flashcard
    const cleanedFlashcards = flashcardsData.flashcards.slice(0, cardCount).map((card: any, index: number) => ({
      hint: card.hint.replace(/\*\*/g, "").replace(/\*/g, "").trim(),
      content: card.content.replace(/\*\*/g, "").replace(/\*/g, "").trim(),
      card_order: index + 1,
    }));

    // Create flashcard set
    const { data: flashcardSet, error: setError } = await supabaseClient
      .from("personal_flashcards")
      .insert({
        user_id: user.id,
        title,
        curriculum,
        topic,
        subtopic,
        card_count: cleanedFlashcards.length,
      })
      .select()
      .single();

    if (setError) throw new Error("Failed to create flashcard set");

    // Insert cards
    const cardsToInsert = cleanedFlashcards.map((card: any) => ({
      flashcard_set_id: flashcardSet.id,
      hint: card.hint,
      content: card.content,
      card_order: card.card_order,
    }));

    const { error: cardsError } = await supabaseClient
      .from("personal_flashcard_cards")
      .insert(cardsToInsert);

    if (cardsError) throw new Error("Failed to insert flashcards");

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
    console.error("[GENERATE-PERSONAL-FLASHCARDS]", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
