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
    const { subject, curriculum, gradeLevel, duration, topic } = await req.json();
    
    if (!subject || !curriculum || !gradeLevel || !duration) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const TAVILY_API_KEY = Deno.env.get('TAVILY_API_KEY');
    if (!TAVILY_API_KEY) {
      throw new Error('TAVILY_API_KEY is not configured');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Perform comprehensive web searches
    const searchQueries = [
      `${curriculum} ${subject} grade ${gradeLevel} ${topic || ''} lesson plan teaching strategies`,
      `${curriculum} ${subject} grade ${gradeLevel} ${topic || ''} learning objectives standards`,
      `${curriculum} ${subject} grade ${gradeLevel} ${topic || ''} teaching resources materials tools`,
      `${curriculum} ${subject} grade ${gradeLevel} ${topic || ''} classroom activities exercises examples`,
      `${curriculum} ${subject} grade ${gradeLevel} ${topic || ''} assessment methods evaluation strategies`
    ];

    const searchResults = await Promise.all(
      searchQueries.map(query => 
        fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query,
            search_depth: 'advanced',
            max_results: 4,
            include_domains: ['education', 'edu', 'curriculum', 'teaching'],
          }),
        }).then(r => r.json())
      )
    );

    // Combine all research
    const researchContext = searchResults
      .flatMap(result => result.results || [])
      .map((r: any) => `${r.title}\n${r.content}\nSource: ${r.url}`)
      .join('\n\n')
      .slice(0, 8000);

    const prompt = `Based on this comprehensive research about ${curriculum} ${subject} curriculum for Grade ${gradeLevel}:

${researchContext}

Create a THOROUGH, COMPREHENSIVE lesson plan for:
- Subject: ${subject}
- Curriculum: ${curriculum}
- Grade Level: ${gradeLevel}
- Duration: ${duration}
${topic ? `- Topic: ${topic}` : ''}

Structure the lesson plan with these sections:

1. LESSON OVERVIEW
   - Title and learning objectives (3-5 clear, measurable objectives)
   - Duration breakdown
   - Required materials and resources

2. OPENING (5-10 minutes)
   - Hook/engagement activity
   - Exact script for introduction
   - Connection to prior knowledge

3. INSTRUCTION (Main Body)
   - Core concepts with detailed explanations
   - EXACT TEACHING SCRIPT with examples and analogies
   - Visual aids and demonstrations to use
   - Key vocabulary and definitions

4. GUIDED PRACTICE (20-30 minutes)
   - Step-by-step activities
   - Example problems with solutions
   - Scaffolding strategies

5. INDEPENDENT PRACTICE
   - Student activities and exercises
   - Differentiation strategies for different levels

6. ASSESSMENT & EVALUATION
   - Formative assessment methods
   - Exit ticket or check for understanding
   - Success criteria

7. ONLINE RESOURCES & TOOLS
   - Specific websites, videos, interactive tools
   - Links to curriculum-aligned resources
   - Technology integration suggestions

8. HOMEWORK/EXTENSION
   - Follow-up activities
   - Extension for advanced learners

9. REFLECTION & NOTES
   - Teaching tips and common misconceptions
   - Adaptations for different learning styles

Make it detailed, practical, and ready for immediate classroom implementation.`;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
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
                  content: 'You are an expert educator and curriculum specialist. Create detailed, comprehensive lesson plans with exact teaching scripts and practical resources. Format responses using ONLY plain text with clear structure - NO markdown, NO asterisks, NO special formatting characters. Use simple line breaks and indentation for structure.' 
                },
                { role: 'user', content: prompt }
              ],
              stream: true,
            }),
          });

          if (!aiResponse.ok) {
            throw new Error(`AI API error: ${aiResponse.status}`);
          }

          const reader = aiResponse.body?.getReader();
          if (!reader) throw new Error('No response body');

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  let content = parsed.choices?.[0]?.delta?.content || '';
                  
                  // Clean content
                  content = content
                    .replace(/\*\*/g, '')
                    .replace(/\*/g, '')
                    .replace(/#{1,6}\s/g, '')
                    .replace(/`{1,3}/g, '')
                    .replace(/_{2}/g, '')
                    .replace(/~/g, '');
                  
                  if (content) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Lesson generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
