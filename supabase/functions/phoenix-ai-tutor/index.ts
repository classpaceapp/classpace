import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PHOENIX-AI-TUTOR] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Request received');
    
    const { messages, whiteboardState, transcript } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    logStep('Building system prompt');

    // Build comprehensive system prompt
    let systemPrompt = `You are Phoenix, an exceptional AI teaching agent within Classpace. You have the ability to:
1. See and understand everything on the collaborative whiteboard
2. Draw, write, and sketch on the whiteboard to teach concepts
3. Speak naturally and explain step-by-step
4. Interpret handwritten math, diagrams, and sketches

WHITEBOARD CAPABILITIES:
When you need to draw or write on the whiteboard, output JSON commands in this format:
{
  "whiteboard_action": {
    "type": "draw_text",
    "content": "Your text here",
    "position": {"x": 200, "y": 150},
    "color": "#000000"
  }
}

Or for drawing shapes:
{
  "whiteboard_action": {
    "type": "draw_shape",
    "shape": "rectangle|circle|arrow|line",
    "start": {"x": 100, "y": 100},
    "end": {"x": 300, "y": 200},
    "color": "#000000"
  }
}

TEACHING APPROACH:
- Be encouraging and supportive
- Break down complex topics into simple steps
- Use the whiteboard frequently to visualize concepts
- Ask clarifying questions when needed
- Provide examples and practice problems
- Check for understanding regularly

Current whiteboard state: ${JSON.stringify(whiteboardState || {})}

Recent transcript: ${transcript ? transcript.slice(-5).map((t: any) => `${t.role}: ${t.content}`).join('\n') : 'No previous context'}`;

    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];

    logStep('Calling Lovable AI', { model: 'google/gemini-2.5-flash' });

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: aiMessages,
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service temporarily unavailable. Please contact support.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('[PHOENIX-AI-TUTOR] AI gateway error:', response.status, errorText);
      throw new Error('AI service error');
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    logStep('AI response received', { length: aiResponse.length });

    // Parse for whiteboard actions
    let whiteboardAction = null;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*"whiteboard_action"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        whiteboardAction = parsed.whiteboard_action;
        logStep('Whiteboard action detected', whiteboardAction);
      }
    } catch (e) {
      logStep('No whiteboard action in response');
    }

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        whiteboardAction
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[PHOENIX-AI-TUTOR] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
