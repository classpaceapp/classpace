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

  try {
    const { curriculum, yearLevel, subject, topic, subtopic, quizType } = await req.json();
    
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check quiz limit for free tier (1 quiz)
    const { data: existingQuizzes, error: countError } = await supabaseClient
      .from('personal_quizzes')
      .select('id')
      .eq('user_id', user.id)
      .eq('archived', false);

    if (countError) throw new Error('Failed to check quiz limit');

    const currentCount = existingQuizzes?.length || 0;
    const limit = 1;

    if (currentCount >= limit) {
      return new Response(JSON.stringify({ 
        error: 'quiz_limit_reached',
        message: 'You have reached the quiz creation limit. Upgrade for unlimited quizzes.' 
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Construct web search query
    const searchParts = [curriculum, yearLevel, subject, topic, subtopic, 'past papers', 'examination questions']
      .filter(Boolean);
    const searchQuery = searchParts.join(' ');

    console.log('Searching for:', searchQuery);

    // Perform web search using Tavily
    const searchResponse = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('TAVILY_API_KEY')}`,
      },
      body: JSON.stringify({
        query: searchQuery,
        search_depth: 'advanced',
        max_results: 10,
      }),
    });

    let searchResults: any = { results: [] };
    if (!searchResponse.ok) {
      const tavilyErrorText = await searchResponse.text();
      console.error('Tavily API error:', searchResponse.status, tavilyErrorText);
    } else {
      searchResults = await searchResponse.json();
    }
    console.log('Search results obtained:', searchResults.results?.length || 0);

    // Use Lovable AI to generate quiz from search results
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const contextText = searchResults.results?.map((r: any) => 
      `Source: ${r.url}\n${r.content}`
    ).join('\n\n') || 'No search results found';

    const systemPrompt = `You are an expert educator creating ${quizType === 'mcq' ? 'multiple choice' : 'essay-type'} quiz questions.
    
CRITICAL INSTRUCTION: Create ONLY content-based questions that test actual knowledge and understanding of the subject matter. 
NEVER create meta questions about the curriculum itself, exam papers, or practice questions.

FORBIDDEN question types:
- Questions that reference exam papers or past papers
- Questions about "exam style practice questions"
- Any meta-references to the curriculum or assessment structure

REQUIRED question types:
- Direct questions testing concepts, formulas, and principles
- Application questions using real scenarios
- Problem-solving questions with specific numerical or analytical challenges
- Conceptual understanding questions

Based on the provided curriculum information and web search results, create a comprehensive quiz with 10 high-quality CONTENT-BASED questions.
The questions should test actual understanding of the subject matter for the specified curriculum, year level, and topic.

Curriculum: ${curriculum || 'Not specified'}
Year Level: ${yearLevel || 'Not specified'}
Subject: ${subject || 'Not specified'}
Topic: ${topic || 'Not specified'}
Subtopic: ${subtopic || 'Not specified'}

${quizType === 'mcq' ? `
For MCQ questions, provide:
- Clear, concise question text
- Four options (A, B, C, D)
- Correct answer
- Brief explanation

Return JSON format:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this is correct"
    }
  ]
}
` : `
For essay questions, provide:
- Thought-provoking question
- Expected key points for a good answer
- Suggested word count

Return JSON format:
{
  "questions": [
    {
      "question": "Essay question text",
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "suggestedWordCount": 300
    }
  ]
}
`}

Use the web search results below to inform your questions and ensure they align with the actual curriculum standards and examination patterns.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Web search context:\n\n${contextText}\n\nPlease generate the quiz questions in JSON format.` }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errorText = await aiResponse.text();
      console.error('AI API error:', status, errorText);
      const payload = {
        error: status === 429 ? 'rate_limited' : status === 402 ? 'payment_required' : 'ai_gateway_error',
        message: errorText,
      };
      return new Response(JSON.stringify(payload), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    
    // Clean the AI response content to remove control characters
    let content = aiData.choices[0].message.content;
    content = content.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    
    const generatedQuiz = JSON.parse(content);

    console.log('Quiz generated successfully with', generatedQuiz.questions.length, 'questions');

    return new Response(JSON.stringify(generatedQuiz), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error generating quiz:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
