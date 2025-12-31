import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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
    const {
      assessmentType,
      subject,
      title,
      gradeLevel,
      topic,
      numQuestions,
      totalMarks,
      curriculum
    } = await req.json();

    if (!assessmentType || !subject || !title || !gradeLevel || !topic || !numQuestions || !totalMarks || !curriculum) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const TAVILY_API_KEY = Deno.env.get('TAVILY_API_KEY');
    if (!TAVILY_API_KEY) {
      throw new Error('TAVILY_API_KEY is not configured');
    }

    console.log('Starting assessment generation with Tavily research...');

    // Perform detailed web search using Tavily for curriculum-specific content
    // Truncate topic for search query to avoid hitting Tavily's 400 char limit
    const searchTopic = topic.length > 200 ? topic.substring(0, 200) + '...' : topic;
    const searchQuery = `${curriculum} ${gradeLevel} ${subject} ${searchTopic} ${assessmentType} academic questions exam problems curriculum standards teaching materials`;

    console.log('Search query:', searchQuery);

    const tavilyResponse = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: searchQuery,
        search_depth: 'advanced',
        max_results: 8,
        include_answer: true,
        include_raw_content: false,
      }),
    });

    if (!tavilyResponse.ok) {
      console.error('Tavily API error:', tavilyResponse.status);
      throw new Error(`Tavily API error: ${tavilyResponse.status}`);
    }

    const tavilyData = await tavilyResponse.json();
    console.log('Tavily research completed, results:', tavilyData.results?.length || 0);

    const researchContext = tavilyData.results
      ?.map((r: any) => r.content)
      .join('\n\n')
      .slice(0, 4000);

    // Generate assessment with OpenAI API
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const prompt = `Using this curriculum-specific educational research:

${researchContext}

Create a comprehensive, academically rigorous ${assessmentType} for ${curriculum} curriculum:

ASSESSMENT DETAILS:
- Title: ${title}
- Subject: ${subject}
- Topic: ${topic}
- Grade Level: ${gradeLevel}
- Number of Questions: ${numQuestions}
- Total Marks: ${totalMarks}
- Assessment Type: ${assessmentType}

CRITICAL OUTPUT FORMAT:
You MUST return a JSON object with a "questions" field containing an array of exactly ${numQuestions} question objects.
Structure:
{
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice" | "short_answer" | "essay" | "problem_solving",
      "text": "Question text here (use LaTeX for math)",
      "marks": 5,
      "options": ["A", "B", "C", "D"], // Only for multiple_choice, make sure to include the label or just the text
      "answer_key": "Correct answer explanation"
    }
  ]
}

CRITICAL CONTENT RULES:
1. ALL questions must be directly related to ${topic} in ${subject}
2. Questions must align with ${curriculum} curriculum standards for grade ${gradeLevel}
3. Distribute ${totalMarks} marks appropriately across the questions.
4. Include varied difficulty levels (30% easy, 50% medium, 20% challenging)
5. For mathematical content: Use LaTeX notation ONLY.
   - Inline math: $x = 5$
   - Display math: $$E = mc^2$$
   - Use \\times for multiplication (NOT * or x)
   - Use \\frac{a}{b} for fractions
   - You MUST escape backslashes in the JSON string (e.g. "\\\\frac").
6. ABSOLUTELY NO markdown formatting (no **, ##). Plain text only in the "text" field.

Make sure the JSON is valid and parsable.`;

    const systemPrompt = 'You are an expert educational assessment creator. You MUST respond with valid JSON only. Do not wrap the JSON in markdown code blocks. Ensure all LaTeX backslashes are double-escaped so they are valid in a JSON string.';

    console.log('Sending to AI for generation...');

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '{}';

    console.log('AI response received, parsing JSON...');

    let generatedData;
    try {
      generatedData = JSON.parse(content);
    } catch (e) {
      console.error('JSON Parse Error', e);
      // Fallback or attempt to clean json
      throw new Error('Failed to generate valid JSON assessment');
    }

    // validate structure
    if (!generatedData.questions || !Array.isArray(generatedData.questions)) {
      throw new Error('Invalid assessment structure generated');
    }

    console.log(`Generated ${generatedData.questions.length} structured questions.`);

    return new Response(
      JSON.stringify({ assessment: generatedData.questions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Assessment generation error:', error);

    // Provide user-friendly error messages
    let userMessage = 'Failed to generate assessment';
    let errorDetails = error instanceof Error ? error.message : 'Unknown error';

    if (errorDetails.includes('Tavily') || errorDetails.includes('search')) {
      userMessage = 'INPUT_TOO_LONG';
      errorDetails = 'The topic or parameters provided are too detailed. Please simplify your input and try again with a shorter, more focused topic description (under 100 words).';
    } else if (errorDetails.includes('429') || errorDetails.includes('rate limit')) {
      userMessage = 'RATE_LIMIT';
      errorDetails = 'Too many requests. Please wait a moment before generating another assessment.';
    } else if (errorDetails.includes('OPENAI_API_KEY') || errorDetails.includes('TAVILY_API_KEY')) {
      userMessage = 'CONFIGURATION_ERROR';
      errorDetails = 'System configuration error. Please contact support.';
    }

    return new Response(
      JSON.stringify({
        error: userMessage,
        details: errorDetails
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});