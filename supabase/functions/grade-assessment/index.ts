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

  try {
    const { questions, answers, totalMarks, assessmentType, curriculum } = await req.json();

    if (!questions || !answers) {
      throw new Error('Missing required fields: questions and answers');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Prepare content for prompt based on structure
    let questionsContent = "";
    let answersContent = "";

    // Parse Questions
    if (Array.isArray(questions)) {
      questionsContent = questions.map((q: any, idx: number) =>
        `Q${idx + 1} (ID: ${q.id || idx}): ${q.text} [${q.marks} marks] ${q.type ? `(${q.type})` : ''} ${q.options ? `\nOptions: ${q.options.join(', ')}` : ''}`
      ).join('\n\n');
    } else {
      questionsContent = String(questions);
    }

    // Parse Answers
    if (typeof answers === 'object' && answers !== null && !answers.response) {
      // Structured object: { "questionId": "answer" }
      if (Array.isArray(questions)) {
        answersContent = questions.map((q: any, idx: number) => {
          const ans = answers[q.id || idx.toString()] || answers[idx.toString()] || "No answer provided";
          return `Q${idx + 1} Answer: ${ans}`;
        }).join('\n\n');
      } else {
        answersContent = JSON.stringify(answers, null, 2);
      }
    } else if (typeof answers === 'object' && answers.response) {
      // Legacy structured: { response: "string" }
      answersContent = answers.response;
    } else {
      // Legacy string
      answersContent = String(answers);
    }

    const prompt = `ASSESSMENT TYPE: ${assessmentType || 'General Assessment'}
CURRICULUM: ${curriculum || 'Standard'}
TOTAL MARKS AVAILABLE: ${totalMarks || 'Not specified'}

QUESTIONS:
${questionsContent}

STUDENT'S ANSWERS:
${answersContent}

Please provide a comprehensive grading in the following JSON format:
{
  "score": [numerical score out of total marks],
  "percentage": [percentage score rounded to 1 decimal],
  "grade": [letter grade A+, A, B+, B, C+, C, D, F],
  "feedback": "[overall constructive feedback paragraph]",
  "breakdown": [
    {
      "question_number": [integer, corresponding to Q1, Q2 etc.],
      "marks_available": [marks for this question],
      "marks_awarded": [marks given],
      "feedback": "[specific feedback for this question]"
    }
  ],
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["area 1", "area 2", "area 3"],
  "curriculum_analysis": "[Optional: specific analysis of how well the student met ${curriculum} standards]"
}

STRICT GRADING RUBRIC:
1. EVIDENCE-BASED MARKING: Grades must be assigned STRICTLY based on the accuracy and completeness of the answer.
2. INCORRECT ANSWERS: If an answer is factually incorrect (especially for Multiple Choice, classifications, or definitions), you MUST award 0 marks. Do NOT give "effort" points for incorrect answers.
3. PARTIAL CREDIT: Only award partial credit if the answer contains PARTIALLY CORRECT technical information. Vague or generic answers that do not address the specific question must receive 0 marks.
4. CONSISTENCY: Your feedback MUST align with the marks. If you say an answer is "incorrect", the marks MUST be 0.
5. ${curriculum ? `CURRICULUM ALIGNMENT: Since the curriculum is "${curriculum}", you MUST evaluate the student's answers specifically against the standards, key terminology, and expectations of this curriculum.` : ''}

Evaluate each question individually and sum the marks for the total score.`;

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
      const text = await aiResponse.text();
      console.error('AI Error:', text);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    let gradingResult;
    try {
      const content = aiData.choices?.[0]?.message?.content;
      if (!content) throw new Error("No content generated");
      gradingResult = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback
      gradingResult = {
        score: 0,
        percentage: 0,
        grade: 'N/A',
        feedback: 'We encountered an error processing the grading results. Please ask your teacher for manual review.',
        breakdown: [],
        strengths: [],
        improvements: []
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
        grade: 'E',
        feedback: 'System error during grading.',
        breakdown: []
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
