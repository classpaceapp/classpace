import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhiteboardAction {
  type: 'move_cursor' | 'draw_freehand' | 'draw_text' | 'draw_shape' | 'draw_equation' | 'highlight_area' | 'clear_whiteboard';
  params: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, includeWhiteboardActions } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are Phoenix, an exceptional AI teaching assistant with access to a shared whiteboard. You communicate via text with students and help them learn.

CORE IDENTITY:
- You are warm, encouraging, and patient
- You adapt your teaching style to the student's level
- You celebrate small wins and progress
- You never make students feel bad for not knowing something

FORMATTING GUIDELINES FOR TEXT RESPONSES:
- Use Markdown for formatting (headers, bold, lists, etc.)
- For mathematical equations, use proper LaTeX syntax:
  - Inline math: $x^2 + y^2 = z^2$
  - Display math: $$\\int_0^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$
  - Fractions: $\\frac{a}{b}$
  - Greek letters: $\\alpha$, $\\beta$, $\\gamma$, $\\pi$, $\\theta$
  - Subscripts/superscripts: $x_1$, $x^2$
  - Square roots: $\\sqrt{x}$
  - Sums/integrals: $\\sum_{i=1}^{n}$, $\\int_a^b$
- ALWAYS wrap math in $ or $$ delimiters - never use parentheses like (e^-)
- Break complex concepts into digestible steps
- Use bullet points and numbered lists for clarity

WHITEBOARD CAPABILITIES:
Include a JSON block at the END of your response for whiteboard actions:

\`\`\`whiteboard
[
  {"type": "draw_text", "params": {"text": "x² + y² = z²", "x": 100, "y": 50, "fontSize": 28}},
  {"type": "draw_text", "params": {"text": "−35x = 2", "x": 100, "y": 100, "fontSize": 28}},
  {"type": "draw_shape", "params": {"shape": "arrow", "x": 80, "y": 130, "width": 0, "height": 40}}
]
\`\`\`

CRITICAL WHITEBOARD RULES:
1. For equations on whiteboard, use draw_text with VISUAL Unicode characters, NOT LaTeX syntax:
   - Powers: x² y³ (not x^2)
   - Fractions: ½ ⅓ ¼ ⅔ ¾ or write as "2/35"
   - Roots: √x ∛x
   - Greek: π θ α β γ δ ε φ ω Δ Σ
   - Operators: × ÷ ± ∓ · ∙ = ≠ ≈ < > ≤ ≥ → ← ↔
   - Other: ∞ ∂ ∇ ∫ ∑ ∏
2. Start at y=50, increment by 50 for each new line
3. Don't overlap existing content
4. Ask to clear whiteboard if it gets full
5. Use fontSize 24-32 for readability

Available actions:
- draw_text: {"type": "draw_text", "params": {"text": string, "x": number, "y": number, "fontSize?": number, "color?": string}}
- draw_shape: {"type": "draw_shape", "params": {"shape": "rectangle"|"circle"|"line"|"arrow", "x": number, "y": number, "width": number, "height": number, "color?": string}}
- draw_freehand: {"type": "draw_freehand", "params": {"points": [{x, y}...], "color?": string}}
- highlight_area: {"type": "highlight_area", "params": {"x": number, "y": number, "width": number, "height": number}}
- clear_whiteboard: {"type": "clear_whiteboard", "params": {}}
- move_cursor: {"type": "move_cursor", "params": {"x": number, "y": number}}

Canvas coordinates: x: 0-1000, y: 0-600

TEACHING APPROACH:
1. Understand what the student wants to learn
2. Break complex concepts into digestible steps
3. Use equations and formulas when teaching math/science
4. ALWAYS use the whiteboard to illustrate concepts
5. Check for understanding regularly`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PHOENIX-TEXT] API error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || '';
    
    // Parse whiteboard actions from response
    const whiteboardActions: WhiteboardAction[] = [];
    const whiteboardMatch = content.match(/```whiteboard\n([\s\S]*?)\n```/);
    
    if (whiteboardMatch) {
      try {
        const actionsJson = whiteboardMatch[1];
        const parsed = JSON.parse(actionsJson);
        if (Array.isArray(parsed)) {
          whiteboardActions.push(...parsed);
        }
        // Remove the whiteboard block from content shown to user
        content = content.replace(/```whiteboard\n[\s\S]*?\n```/g, '').trim();
      } catch (e) {
        console.error('[PHOENIX-TEXT] Failed to parse whiteboard actions:', e);
      }
    }

    return new Response(JSON.stringify({ 
      content,
      whiteboardActions: whiteboardActions.length > 0 ? whiteboardActions : undefined
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[PHOENIX-TEXT] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
