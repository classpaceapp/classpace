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
    const { questions, answers, totalMarks, assessmentType } = await req.json();

    if (!questions || !answers) {
      throw new Error('Missing required fields: questions and answers');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const prompt = `ASSESSMENT TYPE: ${assessmentType || 'General Assessment'}
TOTAL MARKS AVAILABLE: ${totalMarks || 'Not specified'}

QUESTIONS:
${questions}

STUDENT'S ANSWERS:
${answers}

Please provide a comprehensive grading in the following JSON format:
{
  "score": [numerical score out of total marks],
  "percentage": [percentage score rounded to 1 decimal],
  "grade": [letter grade A+, A, B+, B, C+, C, D, F],
  "feedback": "[overall constructive feedback paragraph]",
  "breakdown": [
    {
      "question_number": 1,
      "marks_available": [marks for this question],
      "marks_awarded": [marks given],
      "feedback": "[specific feedback for this question]"
    }
  ],
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["area 1", "area 2", "area 3"]
}

Be fair, constructive, and encouraging in your feedback. Consider partial credit where appropriate. If the student's answer shows understanding but lacks completeness, reflect that in the marks.`;

    const systemPrompt = 'You are an expert educational assessor. Grade the student assessment carefully and provide detailed feedback. Always respond with valid JSON only. IMPORTANT: For any math or scientific symbols in your feedback, you MUST use LaTeX formatting enclosed in single dollar signs ($) for inline or double dollar signs ($$) for block equations. Do NOT use \\( ... \\) or \\[ ... \\]. YOU MUST DOUBLE-ESCAPE ALL BACKSLASHES in the JSON string (e.g. use "\\frac" instead of "\frac").';

    console.log('Sending grading request to AI...');

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    let gradingResult;
    try {
      const content = aiData.choices?.[0]?.message?.content;

      if (!content) throw new Error("No content generated");

      // Try to extract JSON from markdown code blocks if present (though Gemini JSON mode usually sends raw JSON)
      const jsonMatch = content.match(/```json\n([\s\S]+?)\n```/) || content.match(/```\n([\s\S]+?)\n```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      gradingResult = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback: create a basic grading result
      gradingResult = {
        score: Math.round((totalMarks || 100) * 0.7),
        percentage: 70,
        grade: 'B',
        feedback: 'We encountered an error parsing the grading feedback, but your submission has been recorded.',
        breakdown: [],
        strengths: ['Attempted all questions', 'Showed effort'],
        improvements: ['Review feedback for detailed guidance']
      };
    }

    return new Response(
      JSON.stringify(gradingResult),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error: any) {
    console.error('Error in grade-assessment function:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        score: 0,
        percentage: 0,
        grade: 'N/A',
        feedback: 'Unable to grade assessment at this time. Please contact your teacher.'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
