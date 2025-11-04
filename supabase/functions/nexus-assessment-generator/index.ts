import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      assessmentType, 
      subject, 
      gradeLevel, 
      topic, 
      numQuestions,
      curriculum 
    } = await req.json();
    
    if (!assessmentType || !subject || !gradeLevel || !topic || !numQuestions) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const TAVILY_API_KEY = Deno.env.get('TAVILY_API_KEY');
    if (!TAVILY_API_KEY) {
      throw new Error('TAVILY_API_KEY is not configured');
    }

    // Research the topic using Tavily
    const searchQuery = `${subject} ${topic} ${gradeLevel} ${assessmentType} questions teaching assessment`;
    
    const tavilyResponse = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: searchQuery,
        search_depth: 'advanced',
        max_results: 5,
      }),
    });

    if (!tavilyResponse.ok) {
      throw new Error(`Tavily API error: ${tavilyResponse.status}`);
    }

    const tavilyData = await tavilyResponse.json();
    const researchContext = tavilyData.results
      ?.map((r: any) => r.content)
      .join('\n\n')
      .slice(0, 2500);

    // Generate assessment with Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `Based on this educational context:

${researchContext}

Create a comprehensive ${assessmentType} assessment with ${numQuestions} questions for:
- Subject: ${subject}
- Topic: ${topic}
- Grade Level: ${gradeLevel}
${curriculum ? `- Curriculum: ${curriculum}` : ''}

Requirements:
1. Mix of difficulty levels (easy, medium, hard)
2. Variety of question types (multiple choice, short answer, problem-solving)
3. Clear, age-appropriate language
4. Include answer key with explanations
5. Align with curriculum standards

Format mathematical expressions clearly using proper notation.
Structure the output with:
- Assessment title
- Instructions for students
- Questions (numbered)
- Answer key at the end`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert educational assessment creator. Generate comprehensive, curriculum-aligned assessments with clear questions, varied difficulty, and detailed answer keys. Ensure all mathematical content is properly formatted. Avoid using markdown symbols like asterisks for emphasis - use plain text with proper capitalization and punctuation instead.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let assessment = aiData.choices[0]?.message?.content || '';

    // Clean up the response - remove markdown formatting and unnecessary symbols
    assessment = assessment
      .replace(/\*\*/g, '') // Remove bold markers
      .replace(/\*/g, '') // Remove emphasis markers
      .replace(/#{1,6}\s/g, '') // Remove markdown headers
      .replace(/`{1,3}/g, '') // Remove code markers
      .replace(/_{2}/g, '') // Remove underline markers
      .replace(/_/g, '') // Remove emphasis underscores
      .trim();

    return new Response(
      JSON.stringify({ assessment }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Assessment generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});