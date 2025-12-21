import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhiteboardAction {
  type: 'move_cursor' | 'draw_freehand' | 'draw_text' | 'draw_shape' | 'draw_equation' | 'highlight_area' | 'clear_whiteboard';
  params: Record<string, any>;
}

interface WhiteboardLayoutItem {
  type: string;
  left: number;
  top: number;
  width: number;
  height: number;
  text?: string;
}

interface WhiteboardContext {
  items: WhiteboardLayoutItem[];
  canvasWidth: number;
  canvasHeight: number;
  nextY: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, includeWhiteboardActions, whiteboardContext, fullTranscript } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build whiteboard context string for the AI
    let whiteboardContextStr = '';
    if (whiteboardContext) {
      const ctx = whiteboardContext as WhiteboardContext;
      whiteboardContextStr = `
CURRENT WHITEBOARD STATE:
- Canvas size: ${ctx.canvasWidth}x${ctx.canvasHeight} pixels
- Number of objects: ${ctx.items.length}
- Next safe Y position to write: ${ctx.nextY}
`;
      if (ctx.items.length > 0) {
        whiteboardContextStr += '- Existing objects:\n';
        ctx.items.forEach((item, i) => {
          const textPreview = item.text ? ` "${item.text}"` : '';
          whiteboardContextStr += `  ${i + 1}. ${item.type} at (${item.left}, ${item.top}), size ${item.width}x${item.height}${textPreview}\n`;
        });
      } else {
        whiteboardContextStr += '- Whiteboard is EMPTY - feel free to start at y=50\n';
      }
    }

    // Build full transcript context
    let transcriptContextStr = '';
    if (fullTranscript && fullTranscript.length > 0) {
      transcriptContextStr = `
CONVERSATION HISTORY (for context - you can reference what was discussed before):
${fullTranscript.map((m: any) => `${m.role === 'user' ? 'Student' : 'Phoenix'}: ${m.content.substring(0, 200)}${m.content.length > 200 ? '...' : ''}`).join('\n')}
`;
    }

    const systemPrompt = `You are Phoenix, an exceptional AI teaching assistant with access to a shared whiteboard. You communicate via text with students and help them learn.

CORE IDENTITY:
- You are warm, encouraging, and patient
- You adapt your teaching style to the student's level
- You celebrate small wins and progress
- You never make students feel bad for not knowing something

${whiteboardContextStr}
${transcriptContextStr}

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
  {"type": "draw_freehand", "params": {"points": [{"x": 100, "y": 150}, {"x": 120, "y": 130}, {"x": 150, "y": 150}], "color": "#000000", "strokeWidth": 3}}
]
\`\`\`

CRITICAL WHITEBOARD RULES - FOLLOW THESE EXACTLY:
1. ALWAYS check the "Next safe Y position" from the whiteboard context above
2. NEVER place content at y positions where existing objects already exist
3. If the whiteboard has existing objects, start your NEW content at the "Next safe Y position" or below
4. If whiteboard is getting full (nextY > 500), ASK to clear it first before drawing more
5. For equations on whiteboard, use draw_text with VISUAL Unicode characters, NOT LaTeX syntax:
   - Powers: x² y³ (not x^2)
   - Fractions: ½ ⅓ ¼ ⅔ ¾ or write as "a/b"
   - Roots: √x ∛x
   - Greek: π θ α β γ δ ε φ ω Δ Σ
   - Operators: × ÷ ± ∓ · ∙ = ≠ ≈ < > ≤ ≥ → ← ↔
   - Other: ∞ ∂ ∇ ∫ ∑ ∏
6. Increment y by 50 for each new line of content
7. Use fontSize 24-32 for readability
8. x position should usually be 50-100 for left-aligned content

FREEHAND DRAWING - USE THIS FOR VISUAL EXPLANATIONS:
The draw_freehand action is POWERFUL for creating handwritten-style math, diagrams, and visual explanations.
USE draw_freehand when:
- Drawing mathematical curves, graphs, or plots (parabolas, sine waves, exponential curves)
- Creating visual diagrams (vectors, geometric shapes with labels, coordinate axes)
- Illustrating physical concepts (force diagrams, circuit diagrams, chemical bonds)
- Showing step-by-step solutions where handwriting would be more intuitive
- Drawing arrows, underlines, circles around important parts, annotations

draw_freehand example for a parabola:
{"type": "draw_freehand", "params": {"points": [
  {"x": 50, "y": 200}, {"x": 75, "y": 150}, {"x": 100, "y": 120}, {"x": 125, "y": 100}, 
  {"x": 150, "y": 90}, {"x": 175, "y": 100}, {"x": 200, "y": 120}, {"x": 225, "y": 150}, {"x": 250, "y": 200}
], "color": "#2563eb", "strokeWidth": 3}}

draw_freehand example for an arrow:
{"type": "draw_freehand", "params": {"points": [
  {"x": 100, "y": 100}, {"x": 200, "y": 100}, {"x": 185, "y": 90}, {"x": 200, "y": 100}, {"x": 185, "y": 110}
], "color": "#000000", "strokeWidth": 2}}

PREFER freehand for:
- Mathematical graphs and curves
- Physics diagrams and force vectors
- Geometric constructions
- Annotations and emphasis marks
- Any visual that benefits from a hand-drawn aesthetic

Available actions:
- draw_text: {"type": "draw_text", "params": {"text": string, "x": number, "y": number, "fontSize?": number, "color?": string}}
- draw_shape: {"type": "draw_shape", "params": {"shape": "rectangle"|"circle"|"line"|"arrow", "x": number, "y": number, "width": number, "height": number, "color?": string}}
- draw_freehand: {"type": "draw_freehand", "params": {"points": [{x, y}...], "color?": string, "strokeWidth?": number}} - USE THIS for curves, graphs, diagrams!
- highlight_area: {"type": "highlight_area", "params": {"x": number, "y": number, "width": number, "height": number}}
- clear_whiteboard: {"type": "clear_whiteboard", "params": {}} - USE ONLY WHEN ASKED OR WHEN BOARD IS FULL
- move_cursor: {"type": "move_cursor", "params": {"x": number, "y": number}}

TEACHING APPROACH:
1. Understand what the student wants to learn
2. Break complex concepts into digestible steps
3. Use equations and formulas when teaching math/science
4. ALWAYS use the whiteboard to illustrate concepts - students learn visually
5. Use draw_freehand for curves, graphs, and diagrams - it's more intuitive than text
6. Check for understanding regularly`;

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
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue." }), {
          status: 402,
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

    console.log('[PHOENIX-TEXT] Response generated, whiteboard actions:', whiteboardActions.length);

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