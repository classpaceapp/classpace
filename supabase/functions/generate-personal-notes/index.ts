import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);

    if (!authHeader) {
      console.error('No Authorization header found in request');
      return new Response(
        JSON.stringify({ error: 'No authorization header provided. Please ensure you are logged in.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');

    console.log('Creating Supabase client with URL:', supabaseUrl);
    console.log('Supabase key present:', !!supabaseKey);

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabaseClient = createClient(
      supabaseUrl,
      supabaseKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const jwt = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(jwt);

    if (userError) {
      console.error('auth.getUser error:', userError);
      throw new Error('Failed to authenticate user');
    }
    if (!user) {
      console.error('No user after getUser with JWT');
      throw new Error('Unauthorized - no user found');
    }

    // Check subscription tier and note limit
    const { data: subscription } = await supabaseClient
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .single();

    const tier = subscription?.tier || 'free';

    // Check existing active notes count
    const { data: existingNotes, error: countError } = await supabaseClient
      .from('personal_notes')
      .select('id')
      .eq('user_id', user.id)
      .eq('archived', false);

    if (countError) throw countError;

    // Free tier: 1 note set max
    if (tier === 'free' && existingNotes && existingNotes.length >= 1) {
      return new Response(
        JSON.stringify({ error: 'LIMIT_REACHED', message: 'You have reached the limit for free tier' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const { title, curriculum, topic, subtopic, additionalDetails } = await req.json();

    if (!title || !curriculum || !topic) {
      throw new Error('Title, curriculum, and topic are required');
    }

    console.log('Generating notes:', { title, curriculum, topic, subtopic, additionalDetails });

    // Build comprehensive search query
    let searchQuery = `${curriculum} ${topic}`;
    if (subtopic) searchQuery += ` ${subtopic}`;
    searchQuery += ' detailed study notes educational content';

    // Search with Tavily API
    const tavilyApiKey = Deno.env.get('TAVILY_API_KEY');
    if (!tavilyApiKey) {
      throw new Error('TAVILY_API_KEY not configured');
    }

    console.log('Searching Tavily with query:', searchQuery);

    const tavilyResponse = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: searchQuery,
        search_depth: 'advanced',
        max_results: 5,
        include_answer: true,
        include_raw_content: false,
      }),
    });

    if (!tavilyResponse.ok) {
      const errorText = await tavilyResponse.text();
      console.error('Tavily API error:', errorText);
      throw new Error(`Tavily API error: ${tavilyResponse.status}`);
    }

    const tavilyData = await tavilyResponse.json();
    console.log('Tavily search completed, results:', tavilyData.results?.length || 0);

    // Compile search results
    let contextData = tavilyData.answer || '';
    if (tavilyData.results && tavilyData.results.length > 0) {
      contextData += '\n\nAdditional Information:\n';
      tavilyData.results.forEach((result: any, index: number) => {
        contextData += `\n${index + 1}. ${result.title}\n${result.content}\n`;
      });
    }

    // Generate notes using OpenAI API
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const formatInstructions = additionalDetails || 'Use clear paragraphs with headings and subheadings';

    const aiPrompt = `You are an expert educational content creator. Generate comprehensive, detailed study notes based on the following:

Curriculum: ${curriculum}
Topic: ${topic}
${subtopic ? `Subtopic: ${subtopic}` : ''}

Format Requirements: ${formatInstructions}

Web Search Results:
${contextData}

CRITICAL FORMATTING RULES:
1. Create detailed, well-structured notes with clear hierarchy
2. Use ## for main headings, ### for subheadings
3. For ALL mathematical expressions, use LaTeX notation:
   - Inline math: $x = 5$
   - Display equations: $$E = mc^2$$
   - Use \\times for multiplication (NOT * or x)
   - Use \\frac{a}{b} for fractions
   - Use \\sqrt{x} for square roots
   - Example: "The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$"
4. For underlined text, use <u>text</u> HTML tags
5. DO NOT use asterisks (*) for emphasis or bullets
6. Use proper markdown: ## for headings, - for bullet points
7. Remove ALL improper characters like ** or * * around text
8. Make content comprehensive, clear, and educational
9. Include examples where relevant
10. Organize content logically with good flow

Generate the notes in clean markdown format now:`;

    console.log('Calling Gemini API for note generation...');

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: aiPrompt }
        ],
        temperature: 0.7
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let notesContent = aiData.choices?.[0]?.message?.content;

    console.log('AI generation completed, content length:', notesContent.length);

    // Clean and sanitize content
    notesContent = notesContent
      // Remove markdown code blocks
      .replace(/```markdown\s*/g, '')
      .replace(/```\s*/g, '')
      // Remove all hashtags that aren't at start of lines (preserve headings)
      .replace(/(?<!^|\n)(#{1,6})(?!\s)/gm, '')
      // Remove bold/italic markdown (but preserve headings and lists)
      .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/(?<!\$)\*(?!\$)(.+?)(?<!\$)\*(?!\$)/g, '$1')
      // Remove control characters but keep newlines, tabs, and LaTeX
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize multiple newlines
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();

    // Save to database
    const { data: noteData, error: insertError } = await supabaseClient
      .from('personal_notes')
      .insert({
        user_id: user.id,
        title,
        curriculum,
        topic,
        subtopic: subtopic || null,
        additional_details: additionalDetails || null,
        content: notesContent,
        archived: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    console.log('Notes saved successfully, ID:', noteData.id);

    return new Response(
      JSON.stringify({ success: true, noteId: noteData.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in generate-personal-notes:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});