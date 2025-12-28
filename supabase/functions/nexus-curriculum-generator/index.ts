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

    // Now use OpenAI API to generate comprehensive curriculum with streaming
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
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

    const systemPrompt = 'You are an expert curriculum designer. Create detailed, practical curriculum plans that are standards-aligned and ready for classroom implementation. Format responses using plain text with clear structure. IMPORTANT: You MAY use Markdown for structure (bold, etc). For ANY math or science formulas, you MUST use LaTeX enclosed in $ (inline) or $$ (block).';

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        stream: true
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    // Create a ReadableStream to handle the streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiResponse.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data.trim() === '[DONE]') continue; // Gemini might not send [DONE] exactly same way, but just in case

                try {
                  const parsed = JSON.parse(data);
                  let content = parsed.choices?.[0]?.delta?.content || '';

                  // Aggressively clean the content as it streams
                  content = content
                    .replace(/\*\*/g, '')
                    .replace(/\*/g, '')
                    .replace(/#{1,6}\s/g, '')
                    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
                    .replace(/`{1,3}/g, '')
                    .replace(/_{2}/g, '')
                    .replace(/~/g, '');

                  if (content) {
                    // Send to client in the format they expect (OpenAI style data: { content: ... })
                    const sseData = `data: ${JSON.stringify({ content })}\n\n`;
                    controller.enqueue(encoder.encode(sseData));
                  }
                } catch (e) {
                  // console.error('Parse error:', e); 
                  // Sometimes Gemini sends metadata or heartbeat, ignore parse errors
                }
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
        } finally {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
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
    console.error('Curriculum generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
