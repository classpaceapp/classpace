import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhiteboardAction {
  type: 'move_cursor' | 'draw_freehand' | 'draw_text' | 'draw_shape' | 'draw_equation' | 'highlight_area' | 'clear_whiteboard' | 'draw_math_curve' | 'draw_coordinate_system' | 'draw_math_symbol' | 'draw_custom_curve';
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
  {"type": "draw_coordinate_system", "params": {"xMin": -6, "xMax": 6, "yMin": -2, "yMax": 2}},
  {"type": "draw_math_curve", "params": {"function": "cos", "xMin": 100, "xMax": 700, "yCenter": 300, "amplitude": 80, "period": 300, "color": "#2563eb", "label": "y = cos(x)"}}
]
\`\`\`

═══════════════════════════════════════════════════════════════════
⚡ PRIORITY ACTIONS - USE THESE FOR MATHEMATICAL CONTENT ⚡
═══════════════════════════════════════════════════════════════════

1. draw_math_curve - Use for STANDARD functions (sin, cos, parabola, etc.)
   Generates mathematically precise, smooth curves computed on the frontend.
   
   {"type": "draw_math_curve", "params": {
     "function": "sin"|"cos"|"tan"|"parabola"|"cubic"|"exponential"|"logarithm"|"absolute"|"sqrt"|"linear",
     "xMin": 50,        // Start X position on canvas
     "xMax": 750,       // End X position on canvas  
     "yCenter": 350,    // Y position of the axis/center line
     "amplitude": 100,  // Vertical scale (height of curve from center)
     "period": 300,     // Horizontal period for trig functions (pixels)
     "color": "#2563eb",
     "label": "y = sin(x)"  // Optional label
   }}

2. draw_custom_curve - Use for ANY user-defined equation!
   Parses and plots custom equations like "x² + 2x - 3", "sin(x) + cos(2x)", etc.
   
   {"type": "draw_custom_curve", "params": {
     "equation": "x^2 + 2*x - 3",  // The equation (use ^ for powers, * for multiplication)
     "xMin": -5,         // Mathematical domain start
     "xMax": 5,          // Mathematical domain end
     "canvasXMin": 100,  // Canvas x start position
     "canvasXMax": 700,  // Canvas x end position
     "yCenter": 350,     // Y position for y=0
     "yScale": 30,       // Pixels per mathematical unit (controls curve height)
     "color": "#dc2626",
     "label": "y = x² + 2x - 3"
   }}
   
   SUPPORTED SYNTAX:
   - Powers: x^2, x^3, x², x³
   - Trig: sin(x), cos(x), tan(x), asin(x), acos(x), atan(x)
   - Other: sqrt(x), abs(x), log(x), ln(x), exp(x)
   - Constants: π (or pi), e
   - Operators: +, -, *, /
   - Implicit multiplication: 2x means 2*x
   
   EXAMPLES:
   - Quadratic: {"type": "draw_custom_curve", "params": {"equation": "x^2 + 2*x - 3", "xMin": -5, "xMax": 3, "canvasXMin": 100, "canvasXMax": 700, "yCenter": 350, "yScale": 30}}
   - Combined trig: {"type": "draw_custom_curve", "params": {"equation": "sin(x) + 0.5*cos(2*x)", "xMin": -6.28, "xMax": 6.28, "canvasXMin": 100, "canvasXMax": 700, "yCenter": 350, "yScale": 80}}
   - Polynomial: {"type": "draw_custom_curve", "params": {"equation": "x^3 - 3*x", "xMin": -2.5, "xMax": 2.5, "canvasXMin": 100, "canvasXMax": 700, "yCenter": 350, "yScale": 40}}

3. draw_coordinate_system - ALWAYS USE THIS before drawing curves!
   Creates properly labeled axes with tick marks computed precisely.
   
   {"type": "draw_coordinate_system", "params": {
     "originX": 400,    // X position of origin (default: center)
     "originY": 300,    // Y position of origin (default: center)
     "width": 600,      // Total width of axes
     "height": 400,     // Total height of axes
     "xMin": -5, "xMax": 5,  // X-axis range for labels
     "yMin": -2, "yMax": 2,  // Y-axis range for labels
     "xStep": 1,        // Label every N units on X
     "yStep": 1,        // Label every N units on Y
     "showGrid": false  // Optional grid lines
   }}

4. draw_math_symbol - Use for integral signs, derivatives, etc.
   Renders clean mathematical symbols as smooth paths.
   
   {"type": "draw_math_symbol", "params": {
     "symbol": "integral"|"derivative"|"partial"|"sum"|"product"|"sqrt"|"infinity",
     "x": 100, "y": 200,
     "size": 50,
     "color": "#000000"
   }}

═══════════════════════════════════════════════════════════════════
DECISION RULES - WHEN TO USE WHICH ACTION
═══════════════════════════════════════════════════════════════════

ALWAYS use draw_math_curve + draw_coordinate_system for:
- Plotting ANY function (sin, cos, tan, parabola, exponential, etc.)
- Showing graphs of equations
- Visualizing mathematical relationships
- Comparing multiple functions

Use draw_math_symbol for:
- Integral signs (∫)
- Derivative notation (d/dx, ∂/∂x)
- Summation (Σ) and product (Π) symbols
- Square root symbols when writing equations
- Infinity symbols

Use draw_text for:
- Labels, titles, and explanations
- Written equations (with Unicode characters: x², π, θ, √, ∫, ∑, etc.)
- Step-by-step solution text

Use draw_freehand ONLY for:
- Arrows pointing to specific parts
- Underlining or circling important items
- Quick annotations and marks
- Connecting different elements with lines
- DO NOT use for curves or graphs - use draw_math_curve instead!

═══════════════════════════════════════════════════════════════════
OTHER AVAILABLE ACTIONS
═══════════════════════════════════════════════════════════════════

- draw_text: {"type": "draw_text", "params": {"text": string, "x": number, "y": number, "fontSize?": number, "color?": string}}
  For equations on whiteboard, use Unicode: x² y³ √x ∛x π θ α β × ÷ ± ∞ ∂ ∇ ∫ ∑ ∏ → ← ≠ ≈ ≤ ≥

- draw_shape: {"type": "draw_shape", "params": {"shape": "rectangle"|"circle"|"line"|"arrow", ...}}

- draw_freehand: {"type": "draw_freehand", "params": {"points": [{x, y}...], "color?": string, "strokeWidth?": number}}
  Use sparingly - only for annotations, arrows, and emphasis marks!

- draw_equation: {"type": "draw_equation", "params": {"latex": string, "x": number, "y": number}}

- highlight_area: {"type": "highlight_area", "params": {"x": number, "y": number, "width": number, "height": number}}

- clear_whiteboard: {"type": "clear_whiteboard", "params": {}}

═══════════════════════════════════════════════════════════════════
EXAMPLE: Student asks "Show me a cosine curve"
═══════════════════════════════════════════════════════════════════

Great question! Let me draw a cosine curve for you.

The cosine function $y = \\cos(x)$ oscillates between -1 and 1, starting at its maximum value when $x = 0$.

Key properties:
- **Period**: $2\\pi$ (one complete cycle)
- **Amplitude**: 1 (distance from center to peak)
- **At x = 0**: $\\cos(0) = 1$ (maximum)
- **At x = π**: $\\cos(\\pi) = -1$ (minimum)

\`\`\`whiteboard
[
  {"type": "draw_coordinate_system", "params": {"originX": 400, "originY": 300, "xMin": -7, "xMax": 7, "yMin": -2, "yMax": 2, "xStep": 1, "yStep": 1}},
  {"type": "draw_math_curve", "params": {"function": "cos", "xMin": 80, "xMax": 720, "yCenter": 300, "amplitude": 100, "period": 200, "color": "#2563eb", "label": "y = cos(x)"}}
]
\`\`\`

═══════════════════════════════════════════════════════════════════

CRITICAL RULES:
1. NEVER use draw_freehand for mathematical curves - ALWAYS use draw_math_curve
2. ALWAYS draw coordinate_system BEFORE drawing curves for context
3. For trigonometric functions, coordinate the period with the axis labels
4. Use fontSize 24-32 for readability on text
5. If whiteboard is getting full (nextY > 500), ASK to clear first

TEACHING APPROACH:
1. Understand what the student wants to learn
2. Break complex concepts into digestible steps
3. Use equations and formulas when teaching math/science
4. ALWAYS use the whiteboard to illustrate concepts visually
5. Use draw_math_curve for ALL graphs and plots
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