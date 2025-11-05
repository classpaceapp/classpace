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
    const { subject, gradeLevel, duration, learningGoals } = await req.json();
    
    if (!subject || !gradeLevel || !duration) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const TAVILY_API_KEY = Deno.env.get('TAVILY_API_KEY');
    if (!TAVILY_API_KEY) {
      throw new Error('TAVILY_API_KEY is not configured');
    }

    // Use Tavily to research current curriculum standards
    const searchQuery = `${subject} curriculum standards grade ${gradeLevel} ${duration} learning objectives teaching plan`;
    
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
      .slice(0, 3000);

    // Now use Lovable AI to generate comprehensive curriculum
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `Based on this research about ${subject} curriculum standards:

${researchContext}

Create a comprehensive, standards-aligned curriculum plan for:
- Subject: ${subject}
- Grade Level: ${gradeLevel}
- Duration: ${duration}
${learningGoals ? `- Learning Goals: ${learningGoals}` : ''}

Structure the curriculum into 3-5 units, each with:
1. Unit title and duration (in weeks)
2. Key learning objectives (3-5 per unit)
3. Core topics and concepts
4. Suggested assessment methods
5. Standards alignment (if applicable)

Make it practical, comprehensive, and ready for classroom implementation.`;

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
            content: 'You are an expert curriculum designer. Create detailed, practical curriculum plans that are standards-aligned and ready for classroom implementation. Format responses with clear structure using headers and lists.' 
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
    const curriculum = aiData.choices[0]?.message?.content || '';

    return new Response(
      JSON.stringify({ curriculum }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Curriculum generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});