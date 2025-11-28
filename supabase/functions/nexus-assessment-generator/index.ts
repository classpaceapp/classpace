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
    const { 
      assessmentType, 
      subject, 
      title,
      gradeLevel, 
      topic, 
      numQuestions,
      totalMarks,
      curriculum 
    } = await req.json();
    
    if (!assessmentType || !subject || !title || !gradeLevel || !topic || !numQuestions || !totalMarks || !curriculum) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const TAVILY_API_KEY = Deno.env.get('TAVILY_API_KEY');
    if (!TAVILY_API_KEY) {
      throw new Error('TAVILY_API_KEY is not configured');
    }

    console.log('Starting assessment generation with Tavily research...');

    // Perform detailed web search using Tavily for curriculum-specific content
    const searchQuery = `${curriculum} ${gradeLevel} ${subject} ${topic} ${assessmentType} academic questions exam problems curriculum standards teaching materials`;
    
    console.log('Search query:', searchQuery);

    const tavilyResponse = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: searchQuery,
        search_depth: 'advanced',
        max_results: 8,
        include_answer: true,
        include_raw_content: false,
      }),
    });

    if (!tavilyResponse.ok) {
      console.error('Tavily API error:', tavilyResponse.status);
      throw new Error(`Tavily API error: ${tavilyResponse.status}`);
    }

    const tavilyData = await tavilyResponse.json();
    console.log('Tavily research completed, results:', tavilyData.results?.length || 0);
    
    const researchContext = tavilyData.results
      ?.map((r: any) => r.content)
      .join('\n\n')
      .slice(0, 4000);

    // Generate assessment with Lovable AI using curriculum-specific research
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `Using this curriculum-specific educational research:

${researchContext}

Create a comprehensive, academically rigorous ${assessmentType} for ${curriculum} curriculum:

ASSESSMENT DETAILS:
- Title: ${title}
- Subject: ${subject}
- Topic: ${topic}
- Grade Level: ${gradeLevel}
- Number of Questions: ${numQuestions}
- Total Marks: ${totalMarks}
- Assessment Type: ${assessmentType}

CRITICAL REQUIREMENTS:
1. ALL questions must be directly related to ${topic} in ${subject}
2. Questions must align with ${curriculum} curriculum standards for grade ${gradeLevel}
3. Distribute ${totalMarks} marks appropriately across ${numQuestions} questions
4. Include varied difficulty levels (30% easy, 50% medium, 20% challenging)
5. Mix question types: multiple choice, short answer, problem-solving, essay
6. For mathematical content: Use LaTeX notation ONLY
   - Inline math: $x = 5$
   - Display math: $$E = mc^2$$
   - Use $\\times$ for multiplication (NOT * or x)
   - Use $\\frac{a}{b}$ for fractions (NOT 1/2)
   - Use $\\sqrt{x}$ for square roots
7. ABSOLUTELY NO tables - use simple numbered lists instead
8. NO HTML tags, NO underline tags, NO bold, NO italics - PLAIN TEXT ONLY except for LaTeX math
9. NO backslashes except in LaTeX math expressions
10. NO meta questions, NO generic questions - ONLY curriculum-specific academic content
11. Each question must have clear mark allocation
12. Include detailed marking rubric/answer key at the end

FORMAT:
${title}

Instructions for Students:
- Time allocation
- Total marks
- Exam rules

QUESTIONS:

Question 1 (X marks):
[Question text with proper mathematical formatting using LaTeX where needed]

Question 2 (X marks):
[Question text]

... continue for all ${numQuestions} questions

MARKING RUBRIC & ANSWER KEY:
[Detailed answers and marking criteria for each question]

CRITICAL: Use ONLY plain text and LaTeX for math. NO markdown, NO tables, NO excessive backslashes. Use proper capitalization and punctuation for emphasis.`;

    console.log('Sending to AI for generation...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert educational assessment creator specializing in curriculum-aligned, academically rigorous assessments. Generate assessments with proper LaTeX formatting for mathematical content. CRITICAL RULES: Use ONLY plain text and LaTeX math (wrapped in $ or $$) - absolutely NO markdown symbols (*, **, #, _, `, etc.), NO tables of any kind (\\begin{tabular}, etc.), NO backslashes anywhere except inside LaTeX math delimiters ($ or $$). For blanks in fill-in-the-blank questions, use underscores like _____ or write "(blank)" - NEVER use backslashes. All emphasis should be through proper capitalization and punctuation only. For matching questions, use simple numbered lists, NOT tables.' 
          },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let assessment = aiData.choices[0]?.message?.content || '';

    console.log('Assessment generated, cleaning response...');

    // ULTRA-AGGRESSIVE cleaning - preserve LaTeX math, remove everything else
    console.log('Starting aggressive cleaning...');
    
    // Step 1: Extract and protect LaTeX math expressions
    const mathExpressions: string[] = [];
    let tempAssessment = assessment;
    
    // Protect display math ($$...$$)
    tempAssessment = tempAssessment.replace(/\$\$([^\$]+)\$\$/g, (match, content) => {
      mathExpressions.push(match);
      return `__MATH_${mathExpressions.length - 1}__`;
    });
    
    // Protect inline math ($...$)
    tempAssessment = tempAssessment.replace(/\$([^\$]+)\$/g, (match, content) => {
      mathExpressions.push(match);
      return `__MATH_${mathExpressions.length - 1}__`;
    });
    
    console.log(`Protected ${mathExpressions.length} math expressions`);
    
    // Step 2: Aggressive cleaning on non-math content
    tempAssessment = tempAssessment
      // Remove code blocks
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      // Remove ALL LaTeX table environments
      .replace(/\\begin\{tabular\}[\s\S]*?\\end\{tabular\}/g, '')
      .replace(/\\begin\{table\}[\s\S]*?\\end\{table\}/g, '')
      .replace(/\\begin\{array\}[\s\S]*?\\end\{array\}/g, '')
      // Remove ALL backslashes now (math is protected)
      .replace(/\\/g, '')
      // Remove markdown formatting
      .replace(/\*\*\*/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/^\s*>\s+/gm, '')
      // Remove ALL HTML-like tags
      .replace(/<\/?[^>]+(>|$)/g, '')
      // Remove table-related syntax
      .replace(/\|/g, '')
      // Final whitespace cleanup
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{3,}/g, ' ')
      .trim();
    
    // Step 3: Restore protected math expressions
    mathExpressions.forEach((expr, index) => {
      tempAssessment = tempAssessment.replace(`__MATH_${index}__`, expr);
    });
    
    assessment = tempAssessment;
    console.log('Cleaning completed');

    // CRITICAL: Strip the answer key section to prevent answer leak in public assessments
    // Find and remove everything after "MARKING RUBRIC", "ANSWER KEY", or similar headers
    const answerSectionPatterns = [
      /MARKING RUBRIC[\s\S]*/i,
      /ANSWER KEY[\s\S]*/i,
      /ANSWERS[\s\S]*/i,
      /MARKING SCHEME[\s\S]*/i,
      /MARK SCHEME[\s\S]*/i,
      /SOLUTIONS[\s\S]*/i
    ];

    for (const pattern of answerSectionPatterns) {
      if (pattern.test(assessment)) {
        assessment = assessment.replace(pattern, '').trim();
        console.log('Removed answer section for security');
        break;
      }
    }

    console.log('Assessment cleaned and ready');

    return new Response(
      JSON.stringify({ assessment }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Assessment generation error:', error);
    
    // Provide user-friendly error messages
    let userMessage = 'Failed to generate assessment';
    let errorDetails = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorDetails.includes('Tavily') || errorDetails.includes('search')) {
      userMessage = 'INPUT_TOO_LONG';
      errorDetails = 'The topic or parameters provided are too detailed. Please simplify your input and try again with a shorter, more focused topic description (under 100 words).';
    } else if (errorDetails.includes('429') || errorDetails.includes('rate limit')) {
      userMessage = 'RATE_LIMIT';
      errorDetails = 'Too many requests. Please wait a moment before generating another assessment.';
    } else if (errorDetails.includes('LOVABLE_API_KEY') || errorDetails.includes('TAVILY_API_KEY')) {
      userMessage = 'CONFIGURATION_ERROR';
      errorDetails = 'System configuration error. Please contact support.';
    }
    
    return new Response(
      JSON.stringify({ 
        error: userMessage,
        details: errorDetails
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});