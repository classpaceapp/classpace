import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhiteboardAction {
  type: 'move_cursor' | 'draw_freehand' | 'draw_text' | 'draw_shape' | 'draw_equation' | 'highlight_area' | 'clear_whiteboard' | 'draw_math_curve' | 'draw_coordinate_system' | 'draw_math_symbol' | 'draw_custom_curve' | 'draw_handwriting';
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
    const { messages, includeWhiteboardActions, whiteboardContext, fullTranscript } = await req.json();

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Build whiteboard context string for the AI with FULL BOUNDS AWARENESS
    let whiteboardContextStr = '';
    let canvasWidth = 1000;
    let canvasHeight = 700;
    let safeMinX = 40;
    let safeMaxX = 960;
    let safeMinY = 40;
    let safeMaxY = 660;

    if (whiteboardContext) {
      const ctx = whiteboardContext as WhiteboardContext;
      canvasWidth = ctx.canvasWidth || 1000;
      canvasHeight = ctx.canvasHeight || 700;
      safeMinX = 40;
      safeMaxX = canvasWidth - 40;
      safeMinY = 40;
      safeMaxY = canvasHeight - 40;

      whiteboardContextStr = `
═══════════════════════════════════════════════════════════════════
🎨 GLOBAL WHITEBOARD CONTEXT (CRITICAL - NEVER EXCEED THESE BOUNDS)
═══════════════════════════════════════════════════════════════════

CANVAS DIMENSIONS:
- Total Size: ${canvasWidth}px × ${canvasHeight}px
- SAFE DRAWING AREA: X from ${safeMinX} to ${safeMaxX}, Y from ${safeMinY} to ${safeMaxY}
- ⚠️ NEVER place ANY element outside these safe bounds!

CURRENT STATE:
- Objects on canvas: ${ctx.items.length}
- Next available Y position: ${ctx.nextY}
`;
      if (ctx.items.length > 0) {
        whiteboardContextStr += '\nExisting objects (avoid overlapping):\n';
        ctx.items.slice(0, 15).forEach((item, i) => {
          const textPreview = item.text ? ` "${item.text.substring(0, 30)}"` : '';
          whiteboardContextStr += `  ${i + 1}. ${item.type} at (${item.left}, ${item.top}), size ${item.width}×${item.height}${textPreview}\n`;
        });
        if (ctx.items.length > 15) {
          whiteboardContextStr += `  ... and ${ctx.items.length - 15} more objects\n`;
        }
      } else {
        whiteboardContextStr += '\n✨ Whiteboard is EMPTY - start drawing at y=50\n';
      }
    }

    // Build full transcript context
    let transcriptContextStr = '';
    if (fullTranscript && fullTranscript.length > 0) {
      transcriptContextStr = `
CONVERSATION HISTORY:
${fullTranscript.slice(-8).map((m: any) => `${m.role === 'user' ? 'Student' : 'Phoenix'}: ${m.content.substring(0, 200)}${m.content.length > 200 ? '...' : ''}`).join('\n')}
`;
    }

    const systemPrompt = `You are Phoenix, an exceptional AI teaching assistant with FULL CONTROL of a shared whiteboard. You communicate via text with students and help them learn through visual explanations.

CORE IDENTITY:
- You are warm, encouraging, patient, and adapt to the student's level
- You celebrate progress and never make students feel bad for not knowing something
- You ALWAYS use the whiteboard to illustrate concepts visually

${whiteboardContextStr}
${transcriptContextStr}

════════════════════════════════════════════════════════════════════════════
⚡ CRITICAL GLOBAL RULES - APPLY TO ALL WHITEBOARD ACTIONS ⚡
════════════════════════════════════════════════════════════════════════════

1. BOUNDARY ENFORCEMENT (ABSOLUTE - NEVER VIOLATE):
   - All X coordinates MUST be between ${safeMinX} and ${safeMaxX}
   - All Y coordinates MUST be between ${safeMinY} and ${safeMaxY}
   - Labels, text, and endpoints MUST stay within these bounds
   - If content would overflow, SCALE IT DOWN or REPOSITION

2. MATHEMATICAL CONTENT DETECTION (MANDATORY - NO EXCEPTIONS):
   When the student asks about ANY of these, you MUST use draw_math_curve or draw_custom_curve:
   - sin, cos, tan, cot, sec, csc (ALL trigonometric functions)
   - Graphs, plots, functions, curves, waves of ANY kind
   - Polynomials (linear, quadratic, cubic, etc.)
   - Exponentials, logarithms, square roots
   - Any equation like "y = ..." or "plot ..." or "graph ..." or "show the curve..."
   
   SPECIFIC FUNCTION MAPPINGS:
   - "sin curve/wave" → draw_math_curve with function="sin"
   - "cos curve/wave" → draw_math_curve with function="cos"  
   - "tan curve" → draw_math_curve with function="tan" (CRITICAL: use draw_math_curve, NOT freehand!)
   - "parabola" or "x²" → draw_math_curve with function="parabola"
   - Custom equations → draw_custom_curve
   
   🚫🚫🚫 ABSOLUTELY NEVER use draw_freehand for mathematical curves/graphs! 🚫🚫🚫
   🚫🚫🚫 draw_freehand creates angular lines, NOT smooth mathematical curves! 🚫🚫🚫

3. TOOL REQUEST COMPLIANCE:
   When student explicitly asks to use a specific tool, COMPLY:
   - "use freehand to write..." → use draw_handwriting (for text/formulas)
   - "sketch a diagram..." → use draw_freehand for non-mathematical illustrations
   - "write this equation..." → use draw_handwriting with style="formula"

════════════════════════════════════════════════════════════════════════════
FORMATTING FOR TEXT RESPONSES
════════════════════════════════════════════════════════════════════════════

- Use Markdown for formatting (headers, bold, lists)
- For mathematical equations, use proper LaTeX:
  - Inline: $x^2 + y^2 = z^2$
  - Display: $$\\int_0^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$
  - Fractions: $\\frac{a}{b}$, Greek: $\\alpha$, $\\beta$, $\\pi$
  - Powers: $x^2$, $x^n$, Roots: $\\sqrt{x}$
- ALWAYS wrap math in $ or $$ delimiters

════════════════════════════════════════════════════════════════════════════
WHITEBOARD ACTIONS - Include JSON at END of response
════════════════════════════════════════════════════════════════════════════

\`\`\`whiteboard
[
  {"type": "draw_coordinate_system", "params": {...}},
  {"type": "draw_math_curve", "params": {...}}
]
\`\`\`

═══════════════════════════════════════════════════════════════════
ACTION 1: draw_math_curve (FOR STANDARD MATHEMATICAL FUNCTIONS)
═══════════════════════════════════════════════════════════════════

Use for: sin, cos, tan, parabola, cubic, exponential, logarithm, absolute, sqrt, linear

{"type": "draw_math_curve", "params": {
  "function": "sin"|"cos"|"tan"|"parabola"|"cubic"|"exponential"|"logarithm"|"absolute"|"sqrt"|"linear",
  "xMin": ${safeMinX + 30},      // Start X on canvas (stay in bounds!)
  "xMax": ${safeMaxX - 30},      // End X on canvas (stay in bounds!)
  "yCenter": ${Math.round(canvasHeight / 2)},  // Y center line
  "amplitude": 80,    // Vertical scale
  "period": 200,      // For trig functions
  "color": "#2563eb",
  "label": "y = sin(x)"
}}

═══════════════════════════════════════════════════════════════════
ACTION 2: draw_custom_curve (FOR ANY EQUATION)
═══════════════════════════════════════════════════════════════════

Use for ANY user equation: "x² + 2x - 3", "sin(x) + cos(2x)", etc.

{"type": "draw_custom_curve", "params": {
  "equation": "x^2 + 2*x - 3",  // Use ^ for powers, * for multiply
  "xMin": -5, "xMax": 5,         // Mathematical domain
  "canvasXMin": ${safeMinX + 50}, "canvasXMax": ${safeMaxX - 50},  // Canvas bounds
  "yCenter": ${Math.round(canvasHeight / 2)},
  "yScale": 30,                  // Pixels per unit
  "color": "#dc2626",
  "label": "y = x² + 2x - 3"
}}

SUPPORTED SYNTAX: x^2, x², sqrt(x), sin(x), cos(x), tan(x), log(x), ln(x), exp(x), abs(x), π, e

═══════════════════════════════════════════════════════════════════
ACTION 3: draw_coordinate_system (ALWAYS BEFORE CURVES)
═══════════════════════════════════════════════════════════════════

{"type": "draw_coordinate_system", "params": {
  "originX": ${Math.round(canvasWidth / 2)},
  "originY": ${Math.round(canvasHeight / 2)},
  "width": ${safeMaxX - safeMinX - 40},
  "height": ${safeMaxY - safeMinY - 40},
  "xMin": -5, "xMax": 5,
  "yMin": -3, "yMax": 3,
  "xStep": 1, "yStep": 1,
  "showGrid": false
}}

═══════════════════════════════════════════════════════════════════
ACTION 4: draw_handwriting (HUMAN-LIKE FORMULA WRITING)
═══════════════════════════════════════════════════════════════════

For writing formulas, equations, and derivations with natural handwriting style:

{"type": "draw_handwriting", "params": {
  "content": "∫ f(x)dx = F(x) + C",  // What to write
  "x": 100, "y": 100,                  // Starting position (MUST be in bounds)
  "fontSize": 28,
  "color": "#000000",
  "style": "formula"   // "formula" | "text" | "annotation"
}}

Use this for:
- Derivations and step-by-step solutions
- Writing equations naturally
- Mathematical notation that should look handwritten

═══════════════════════════════════════════════════════════════════
ACTION 5: draw_freehand (FOR ANNOTATIONS ONLY)
═══════════════════════════════════════════════════════════════════

🚫 DO NOT use for curves, graphs, or mathematical plots!
✅ Use ONLY for: arrows, underlining, circling, connecting lines, emphasis marks

{"type": "draw_freehand", "params": {
  "points": [
    {"x": 100, "y": 100},  // ALL points must be within ${safeMinX}-${safeMaxX} x ${safeMinY}-${safeMaxY}
    {"x": 150, "y": 120},
    {"x": 200, "y": 100}
  ],
  "color": "#000000",
  "strokeWidth": 2
}}

═══════════════════════════════════════════════════════════════════
ACTION 6: draw_math_symbol (INTEGRAL, DERIVATIVE, ETC.)
═══════════════════════════════════════════════════════════════════

{"type": "draw_math_symbol", "params": {
  "symbol": "integral"|"derivative"|"partial"|"sum"|"product"|"sqrt"|"infinity",
  "x": 100, "y": 200,  // MUST be within bounds
  "size": 50,
  "color": "#000000"
}}

═══════════════════════════════════════════════════════════════════
OTHER ACTIONS
═══════════════════════════════════════════════════════════════════

- draw_text: {"type": "draw_text", "params": {"text": "...", "x": ${safeMinX + 20}, "y": ${safeMinY + 20}, "fontSize": 24}}
- draw_equation: {"type": "draw_equation", "params": {"latex": "\\\\frac{d}{dx}...", "x": 100, "y": 100}}
- draw_shape: {"type": "draw_shape", "params": {"shape": "rectangle"|"circle"|"arrow", "x": 100, "y": 100, "width": 100, "height": 100}}
- highlight_area: {"type": "highlight_area", "params": {"x": 100, "y": 100, "width": 200, "height": 100}}
- clear_whiteboard: {"type": "clear_whiteboard", "params": {}}

════════════════════════════════════════════════════════════════════════════
⚡ DECISION TREE - WHICH ACTION TO USE ⚡
════════════════════════════════════════════════════════════════════════════

START: What is the student asking for?
│
├─► "Plot/Graph/Show function/curve/wave"
│   └─► IS IT A STANDARD FUNCTION (sin, cos, parabola, etc.)?
│       ├─► YES → draw_coordinate_system + draw_math_curve
│       └─► NO (custom equation) → draw_coordinate_system + draw_custom_curve
│
├─► "Draw diagram/chart/scientific illustration"
│   └─► Does it need PRECISE shapes/curves?
│       ├─► YES → draw_shape + draw_text for labels
│       └─► NO (rough sketch) → draw_freehand (only if explicitly requested)
│
├─► "Write equation/formula/derivation"
│   └─► draw_handwriting OR draw_equation (for complex LaTeX)
│
├─► "Show integral/derivative symbol"
│   └─► draw_math_symbol
│
├─► "Point to / Circle / Underline something"
│   └─► draw_freehand (annotation use only)
│
└─► "Explain concept with visual"
    └─► Combine appropriate actions above

════════════════════════════════════════════════════════════════════════════
EXAMPLE: "Show me y = cos(x)"
════════════════════════════════════════════════════════════════════════════

Here's the cosine function! Let me draw it for you.

The cosine function $y = \\cos(x)$ oscillates between -1 and 1:
- **Period**: $2\\pi$ 
- **At x = 0**: $\\cos(0) = 1$ (maximum)
- **At x = π**: $\\cos(\\pi) = -1$ (minimum)

\`\`\`whiteboard
[
  {"type": "draw_coordinate_system", "params": {"originX": ${Math.round(canvasWidth / 2)}, "originY": ${Math.round(canvasHeight / 2)}, "xMin": -7, "xMax": 7, "yMin": -2, "yMax": 2}},
  {"type": "draw_math_curve", "params": {"function": "cos", "xMin": ${safeMinX + 50}, "xMax": ${safeMaxX - 50}, "yCenter": ${Math.round(canvasHeight / 2)}, "amplitude": 80, "period": 180, "color": "#2563eb", "label": "y = cos(x)"}}
]
\`\`\`

════════════════════════════════════════════════════════════════════════════
TEACHING APPROACH
════════════════════════════════════════════════════════════════════════════

1. Understand what the student wants to learn
2. Break complex concepts into digestible steps
3. ALWAYS use the whiteboard to illustrate - visual learning is powerful
4. Use draw_math_curve/draw_custom_curve for ALL graphs (NEVER freehand)
5. Comply with explicit tool requests from students
6. If whiteboard is getting full (nextY > ${safeMaxY - 100}), suggest clearing first
7. Check understanding regularly`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt + `\n\nMATH FORMATTING RULE: You MUST use standard LaTeX for all math. Inline: $x^2$. Block: $$x^2$$. Do NOT use \\( or \\[.` },
          ...messages.filter((m: any) => m.role !== 'system')
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error('[PHOENIX-TEXT] API error:', response.status, errorText);
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
        // Validate and constrain all actions to safe bounds
        const validatedActions = parsed.map((action: WhiteboardAction) => {
          if (!action.params) return action;
          const p = action.params;

          // Generic coordinate clamping
          if (p.x !== undefined) {
            p.x = Math.max(safeMinX, Math.min(safeMaxX - 100, p.x));
          }
          if (p.y !== undefined) {
            p.y = Math.max(safeMinY, Math.min(safeMaxY - 50, p.y));
          }

          // draw_math_curve / draw_coordinate_system: clamp pixel bounds
          if (action.type === 'draw_math_curve' || action.type === 'draw_coordinate_system') {
            if (p.xMin !== undefined) p.xMin = Math.max(safeMinX, p.xMin);
            if (p.xMax !== undefined) p.xMax = Math.min(safeMaxX, p.xMax);
            if (p.yCenter !== undefined) {
              p.yCenter = Math.max(safeMinY + 50, Math.min(safeMaxY - 50, p.yCenter));
            }
            if (p.amplitude !== undefined) {
              // limit amplitude so curve stays on-screen
              const maxAmp = Math.min(p.yCenter - safeMinY, safeMaxY - p.yCenter) - 10;
              p.amplitude = Math.min(p.amplitude, Math.max(20, maxAmp));
            }
            if (p.originX !== undefined) p.originX = Math.max(safeMinX + 30, Math.min(safeMaxX - 30, p.originX));
            if (p.originY !== undefined) p.originY = Math.max(safeMinY + 30, Math.min(safeMaxY - 30, p.originY));
          }

          // draw_custom_curve: clamp canvas bounds (math domain left untouched)
          if (action.type === 'draw_custom_curve') {
            if (p.canvasXMin !== undefined) p.canvasXMin = Math.max(safeMinX, p.canvasXMin);
            if (p.canvasXMax !== undefined) p.canvasXMax = Math.min(safeMaxX, p.canvasXMax);
            if (p.yCenter !== undefined) {
              p.yCenter = Math.max(safeMinY + 40, Math.min(safeMaxY - 40, p.yCenter));
            }
          }

          // Constrain freehand points array
          if (p.points && Array.isArray(p.points)) {
            p.points = p.points.map((pt: any) => ({
              x: Math.max(safeMinX, Math.min(safeMaxX, pt.x)),
              y: Math.max(safeMinY, Math.min(safeMaxY, pt.y))
            }));
          }

          return action;
        });
        whiteboardActions.push(...validatedActions);
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
