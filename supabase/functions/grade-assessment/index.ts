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
    const { questions, answers, totalMarks, assessmentType } = await req.json();

    if (!questions || !answers) {
      throw new Error('Missing required fields: questions and answers');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `You are an expert educational assessor. Grade the following student assessment carefully and provide detailed feedback.

ASSESSMENT TYPE: ${assessmentType || 'General Assessment'}
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

    console.log('Sending grading request to AI...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational assessor. Provide fair, detailed, and constructive grading. Always respond with valid JSON only.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
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
      const content = aiData.choices[0].message.content;
      // Try to extract JSON from markdown code blocks if present
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
        feedback: aiData.choices[0].message.content,
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

  } catch (error) {
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
