import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { jobRoleLink, jobDescription, numQuestions } = await req.json();

    if (!numQuestions || numQuestions < 1 || numQuestions > 7) {
      throw new Error('Number of questions must be between 1 and 7');
    }

    console.log('Generating interview questions:', { jobRoleLink, hasDescription: !!jobDescription, numQuestions });

    // Initialize Tavily API
    const tavilyApiKey = Deno.env.get('TAVILY_API_KEY');
    if (!tavilyApiKey) throw new Error('TAVILY_API_KEY not configured');

    // Deep web search for interview questions
    const searchQuery = jobRoleLink
      ? `interview questions for ${jobRoleLink}`
      : `interview questions ${jobDescription}`;

    console.log('Tavily search query:', searchQuery);

    const tavilyResponse = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: searchQuery,
        search_depth: 'advanced',
        max_results: 15,
        include_domains: ['glassdoor.com', 'indeed.com', 'interviewprep.org', 'leetcode.com', 'hackerrank.com'],
      }),
    });

    if (!tavilyResponse.ok) {
      throw new Error(`Tavily API error: ${await tavilyResponse.text()}`);
    }

    const tavilyData = await tavilyResponse.json();
    console.log('Tavily results:', tavilyData.results?.length || 0, 'results');

    const webContext = tavilyData.results
      ?.map((r: any) => `${r.title}\n${r.content}`)
      .join('\n\n') || 'No specific interview questions found.';

    // Use Lovable AI to generate questions
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) throw new Error('LOVABLE_API_KEY not configured');

    const systemPrompt = `You are Aurora, an expert interview coach specializing in creating realistic interview questions.

Your task: Generate EXACTLY ${numQuestions} interview questions for this role.

CRITICAL REQUIREMENTS:
1. Questions MUST be realistic and commonly asked in actual interviews
2. Base questions on the web research provided (Glassdoor, Indeed, etc.)
3. Include a mix of:
   - Behavioral questions (Tell me about a time...)
   - Technical/role-specific questions
   - Situational questions (What would you do if...)
4. For EACH question, determine an appropriate time limit:
   - Simple questions: 45-60 seconds
   - Moderate questions: 90-120 seconds
   - Complex/detailed questions: 150-300 seconds

OUTPUT FORMAT (JSON):
{
  "questions": [
    {
      "text": "The interview question",
      "timeLimit": 90,
      "category": "behavioral|technical|situational"
    }
  ]
}

IMPORTANT: Return ONLY valid JSON, no other text.`;

    const userPrompt = `Job Role: ${jobRoleLink || 'Not provided'}
Job Description: ${jobDescription || 'Not provided'}

Web Research Results:
${webContext}

Generate ${numQuestions} realistic interview questions with appropriate time limits.`;

    console.log('Calling Lovable AI...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', errorText);
      throw new Error(`AI gateway error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      throw new Error('No content received from AI');
    }

    console.log('AI response received');

    // Parse JSON response
    let questionsData;
    try {
      // Try to extract JSON from potential markdown code blocks
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        questionsData = JSON.parse(jsonMatch[0]);
      } else {
        questionsData = JSON.parse(aiContent);
      }
    } catch (e) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('Failed to parse interview questions from AI response');
    }

    if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
      throw new Error('Invalid questions format from AI');
    }

    // Ensure we have exactly the requested number
    const questions = questionsData.questions.slice(0, numQuestions);

    console.log('Generated questions:', questions.length);

    return new Response(
      JSON.stringify({ questions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in aurora-interview-questions:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate interview questions' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});