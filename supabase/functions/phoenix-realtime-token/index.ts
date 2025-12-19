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
    console.log('[PHOENIX-REALTIME] Generating ephemeral token');
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const { systemPrompt } = await req.json();

    // Build the comprehensive Phoenix system prompt
    const phoenixSystemPrompt = systemPrompt || `You are Phoenix, an exceptional AI teaching agent. You are speaking directly with a student in real-time voice conversation while simultaneously controlling a shared whiteboard.

CORE IDENTITY:
- You are warm, encouraging, and patient
- You adapt your teaching style to the student's level
- You celebrate small wins and progress
- You never make students feel bad for not knowing something

WHITEBOARD CAPABILITIES (use these functions AS you speak, not before or after):
- move_cursor: Smoothly animate your cursor before drawing
- draw_freehand: Draw freehand strokes (for diagrams, arrows, underlining)
- draw_text: Write text visually on the whiteboard. For math, use Unicode symbols: × ÷ ± √ ∫ ∑ π θ α β γ ∞ ≠ ≤ ≥ → ← ↔ ∂ Δ ∇
- draw_shape: Draw rectangles, circles, ellipses, arrows, lines
- draw_equation: Write equations visually. IMPORTANT: Use plain text with visual math symbols, NOT LaTeX. Example: "x² + y² = z²" not "x^2 + y^2 = z^2". Use: ² ³ ⁴ ½ ⅓ ¼ ⅔ ¾ √ ∛ for powers/fractions
- highlight_area: Highlight a region to draw attention
- clear_whiteboard: Clear the whiteboard. ASK PERMISSION before clearing unless the board is too full.
- capture_screenshot: Take a screenshot to analyze what you see

CRITICAL WHITEBOARD RULES:
1. ALWAYS call whiteboard functions WHILE you are explaining, not before or after
2. Before drawing, check if there's space. If the board looks full, ask to clear it first
3. NEVER overlap existing content - find empty space or clear first
4. Use visual Unicode characters for math, NOT LaTeX syntax. Write "x = -2/35" as "x = −2/35" or "x = −²⁄₃₅"
5. Keep whiteboard content organized - use different y positions for each line
6. Start new content at y=50, increment by 40 for each line

TEACHING APPROACH:
1. Greet the student warmly when they first connect
2. Ask what they want to learn
3. Break complex concepts into digestible steps
4. USE THE WHITEBOARD AS YOU EXPLAIN - call functions during your speech
5. Draw diagrams, write equations, highlight key points
6. Check for understanding regularly

VOICE INTERACTION TIPS:
- Keep responses conversational, not lecture-like
- Use natural speech patterns
- Pause for student questions
- Acknowledge student inputs with affirmations

Remember: You can SEE the whiteboard via screenshots. When the student draws something, capture a screenshot to analyze it.`;

    // Request ephemeral token from OpenAI for WebRTC connection
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice: "alloy",
        instructions: phoenixSystemPrompt,
        tools: [
          {
            type: "function",
            name: "move_cursor",
            description: "Smoothly animate the cursor to a position on the whiteboard. Use this to guide student attention or before drawing.",
            parameters: {
              type: "object",
              properties: {
                x: { type: "number", description: "X coordinate (0-1000)" },
                y: { type: "number", description: "Y coordinate (0-700)" },
                duration: { type: "number", description: "Animation duration in ms (default 500)" }
              },
              required: ["x", "y"]
            }
          },
          {
            type: "function",
            name: "draw_freehand",
            description: "Draw a freehand stroke on the whiteboard. Perfect for arrows, underlining, circling, or sketching diagrams.",
            parameters: {
              type: "object",
              properties: {
                points: { 
                  type: "array", 
                  items: { 
                    type: "object", 
                    properties: { 
                      x: { type: "number" }, 
                      y: { type: "number" } 
                    } 
                  },
                  description: "Array of {x, y} points forming the stroke"
                },
                color: { type: "string", description: "Stroke color (hex, default #000000)" },
                strokeWidth: { type: "number", description: "Stroke width (default 2)" }
              },
              required: ["points"]
            }
          },
          {
            type: "function",
            name: "draw_text",
            description: "Write text on the whiteboard at a specific position.",
            parameters: {
              type: "object",
              properties: {
                text: { type: "string", description: "The text to write" },
                x: { type: "number", description: "X coordinate" },
                y: { type: "number", description: "Y coordinate" },
                fontSize: { type: "number", description: "Font size (default 20)" },
                color: { type: "string", description: "Text color (hex, default #000000)" }
              },
              required: ["text", "x", "y"]
            }
          },
          {
            type: "function",
            name: "draw_shape",
            description: "Draw a shape on the whiteboard.",
            parameters: {
              type: "object",
              properties: {
                shape: { type: "string", enum: ["rectangle", "circle", "ellipse", "arrow", "line"], description: "Shape type" },
                x: { type: "number", description: "Starting X coordinate" },
                y: { type: "number", description: "Starting Y coordinate" },
                width: { type: "number", description: "Width of shape" },
                height: { type: "number", description: "Height of shape" },
                color: { type: "string", description: "Stroke color (hex)" },
                fill: { type: "string", description: "Fill color (hex, optional)" }
              },
              required: ["shape", "x", "y", "width", "height"]
            }
          },
          {
            type: "function",
            name: "draw_equation",
            description: "Render a mathematical equation using LaTeX notation.",
            parameters: {
              type: "object",
              properties: {
                latex: { type: "string", description: "LaTeX equation string" },
                x: { type: "number", description: "X coordinate" },
                y: { type: "number", description: "Y coordinate" },
                fontSize: { type: "number", description: "Font size (default 24)" }
              },
              required: ["latex", "x", "y"]
            }
          },
          {
            type: "function",
            name: "highlight_area",
            description: "Highlight a rectangular area to draw student attention.",
            parameters: {
              type: "object",
              properties: {
                x: { type: "number" },
                y: { type: "number" },
                width: { type: "number" },
                height: { type: "number" },
                color: { type: "string", description: "Highlight color (default yellow)" }
              },
              required: ["x", "y", "width", "height"]
            }
          },
          {
            type: "function",
            name: "clear_whiteboard",
            description: "Clear the entire whiteboard.",
            parameters: {
              type: "object",
              properties: {}
            }
          },
          {
            type: "function",
            name: "capture_screenshot",
            description: "Request a screenshot of the current whiteboard state to analyze what the student has drawn.",
            parameters: {
              type: "object",
              properties: {
                reason: { type: "string", description: "Why you need the screenshot" }
              },
              required: ["reason"]
            }
          }
        ],
        tool_choice: "auto",
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 800
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PHOENIX-REALTIME] OpenAI error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('[PHOENIX-REALTIME] Session created successfully');

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[PHOENIX-REALTIME] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
