import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: any) => {
  console.log(`[SMART-ASSISTANT] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseAuth = createClient(supabaseUrl, anon);
    const supabaseAdmin = createClient(supabaseUrl, service, { auth: { persistSession: false } });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");
    const token = authHeader.replace("Bearer ", "");

    const { data: authData, error: authErr } = await supabaseAuth.auth.getUser(token);
    if (authErr || !authData.user) throw new Error(`Auth failed: ${authErr?.message || 'no user'}`);
    const user = authData.user;
    log("User authenticated", { userId: user.id });

    const { messages } = await req.json().catch(() => ({ messages: [] }));
    if (!Array.isArray(messages)) throw new Error("messages must be an array");

    // Get user profile and subscription
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const role = (profile?.role as string) || 'learner';
    const userName = `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || 'User';
    
    log("Building context for role", { role, userName });

    let context: any = {
      user: {
        id: user.id,
        name: userName,
        email: profile?.email,
        role,
        subscription: subscription ? {
          tier: subscription.tier,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end
        } : { tier: 'free', status: 'active' }
      }
    };

    if (role === 'teacher') {
      // TEACHER: Get ALL their data
      
      // 1. Get all pods they own
      const { data: pods } = await supabaseAdmin
        .from('pods')
        .select('id, title, subject, description, pod_code, is_public, created_at, updated_at')
        .eq('teacher_id', user.id)
        .order('updated_at', { ascending: false });
      
      const podIds = (pods || []).map(p => p.id);
      context.pods = pods || [];
      log("Fetched teacher pods", { count: pods?.length || 0 });

      if (podIds.length > 0) {
        // 2. Get all students in their pods with profiles
        const { data: members } = await supabaseAdmin
          .from('pod_members')
          .select('pod_id, user_id, joined_at')
          .in('pod_id', podIds);
        
        const studentIds = [...new Set((members || []).map(m => m.user_id))];
        let studentProfiles: any[] = [];
        if (studentIds.length > 0) {
          const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, first_name, last_name, email')
            .in('id', studentIds);
          studentProfiles = profiles || [];
        }
        
        context.students = (members || []).map(m => {
          const studentProfile = studentProfiles.find(p => p.id === m.user_id);
          return {
            podId: m.pod_id,
            podTitle: pods?.find(p => p.id === m.pod_id)?.title,
            studentId: m.user_id,
            name: studentProfile ? `${studentProfile.first_name || ''} ${studentProfile.last_name || ''}`.trim() : 'Unknown',
            email: studentProfile?.email,
            joinedAt: m.joined_at
          };
        });
        log("Fetched students", { count: context.students.length });

        // 3. Get all notes in their pods
        const { data: notes } = await supabaseAdmin
          .from('pod_notes')
          .select('id, pod_id, title, topic, subtopic, curriculum, content, created_at')
          .in('pod_id', podIds)
          .order('created_at', { ascending: false })
          .limit(50);
        context.podNotes = (notes || []).map(n => ({
          ...n,
          podTitle: pods?.find(p => p.id === n.pod_id)?.title,
          contentPreview: n.content?.slice(0, 500)
        }));

        // 4. Get all materials
        const { data: materials } = await supabaseAdmin
          .from('pod_materials')
          .select('id, pod_id, title, description, category, file_name, file_type, created_at')
          .in('pod_id', podIds)
          .order('created_at', { ascending: false })
          .limit(50);
        context.materials = (materials || []).map(m => ({
          ...m,
          podTitle: pods?.find(p => p.id === m.pod_id)?.title
        }));

        // 5. Get all quizzes
        const { data: quizzes } = await supabaseAdmin
          .from('pod_quizzes')
          .select('id, pod_id, title, quiz_type, subject, topic, curriculum, year_level, questions, created_at, archived')
          .in('pod_id', podIds)
          .order('created_at', { ascending: false })
          .limit(30);
        context.quizzes = (quizzes || []).map(q => ({
          id: q.id,
          podTitle: pods?.find(p => p.id === q.pod_id)?.title,
          title: q.title,
          type: q.quiz_type,
          subject: q.subject,
          topic: q.topic,
          questionCount: Array.isArray(q.questions) ? q.questions.length : 0,
          archived: q.archived,
          createdAt: q.created_at
        }));

        // 6. Get quiz responses (student attempts)
        const quizIds = (quizzes || []).map(q => q.id);
        if (quizIds.length > 0) {
          const { data: responses } = await supabaseAdmin
            .from('quiz_responses')
            .select('id, quiz_id, user_id, score, submitted_at')
            .in('quiz_id', quizIds)
            .order('submitted_at', { ascending: false })
            .limit(100);
          
          context.quizResponses = (responses || []).map(r => {
            const quiz = quizzes?.find(q => q.id === r.quiz_id);
            const student = context.students.find((s: any) => s.studentId === r.user_id);
            return {
              quizTitle: quiz?.title,
              studentName: student?.name || 'Unknown',
              score: r.score,
              submittedAt: r.submitted_at
            };
          });
        }

        // 7. Get flashcards
        const { data: flashcards } = await supabaseAdmin
          .from('pod_flashcards')
          .select('id, pod_id, title, topic, curriculum, card_count, created_at')
          .in('pod_id', podIds)
          .order('created_at', { ascending: false })
          .limit(30);
        context.flashcards = (flashcards || []).map(f => ({
          ...f,
          podTitle: pods?.find(p => p.id === f.pod_id)?.title
        }));

        // 8. Get sessions
        const { data: sessions } = await supabaseAdmin
          .from('sessions')
          .select('id, pod_id, title, started_at, ended_at, ai_recap')
          .in('pod_id', podIds)
          .order('started_at', { ascending: false })
          .limit(20);
        context.sessions = (sessions || []).map(s => ({
          ...s,
          podTitle: pods?.find(p => p.id === s.pod_id)?.title
        }));
      }

      // 9. Get Nexus assessments
      const { data: assessments } = await supabaseAdmin
        .from('nexus_assessments')
        .select('id, title, subject, curriculum, year_level, assessment_type, num_questions, total_marks, public_link_code, created_at')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      context.assessments = assessments || [];

      // 10. Get assessment responses
      const assessmentIds = (assessments || []).map(a => a.id);
      if (assessmentIds.length > 0) {
        const { data: assessmentResponses } = await supabaseAdmin
          .from('assessment_responses')
          .select('id, assessment_id, student_name, score, submitted_at')
          .in('assessment_id', assessmentIds)
          .order('submitted_at', { ascending: false })
          .limit(50);
        context.assessmentResponses = (assessmentResponses || []).map(r => ({
          assessmentTitle: assessments?.find(a => a.id === r.assessment_id)?.title,
          studentName: r.student_name,
          score: r.score,
          submittedAt: r.submitted_at
        }));
      }

      // 11. Get saved curriculums and lessons
      const { data: curriculums } = await supabaseAdmin
        .from('saved_curriculums')
        .select('id, subject, grade_level, duration, learning_goals, created_at')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      context.savedCurriculums = curriculums || [];

      const { data: lessons } = await supabaseAdmin
        .from('saved_lessons')
        .select('id, subject, curriculum, grade_level, duration, topic, created_at')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      context.savedLessons = lessons || [];

      log("Teacher context built", { 
        pods: context.pods?.length,
        students: context.students?.length,
        quizzes: context.quizzes?.length,
        assessments: context.assessments?.length
      });

    } else {
      // STUDENT: Get ALL their data
      
      // 1. Get pods they're members of
      const { data: memberPods } = await supabaseAdmin
        .from('pod_members')
        .select('pod_id, joined_at')
        .eq('user_id', user.id);
      
      const podIds = (memberPods || []).map(m => m.pod_id);
      
      if (podIds.length > 0) {
        const { data: pods } = await supabaseAdmin
          .from('pods')
          .select('id, title, subject, description, teacher_id, created_at')
          .in('id', podIds);
        
        // Get teacher info for each pod
        const teacherIds = [...new Set((pods || []).map(p => p.teacher_id))];
        let teacherProfiles: any[] = [];
        if (teacherIds.length > 0) {
          const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, first_name, last_name')
            .in('id', teacherIds);
          teacherProfiles = profiles || [];
        }
        
        context.pods = (pods || []).map(p => ({
          ...p,
          teacherName: teacherProfiles.find(t => t.id === p.teacher_id)
            ? `${teacherProfiles.find(t => t.id === p.teacher_id).first_name || ''} ${teacherProfiles.find(t => t.id === p.teacher_id).last_name || ''}`.trim()
            : 'Unknown',
          joinedAt: memberPods?.find(m => m.pod_id === p.id)?.joined_at
        }));

        // 2. Get notes from their pods
        const { data: podNotes } = await supabaseAdmin
          .from('pod_notes')
          .select('id, pod_id, title, topic, subtopic, content, created_at')
          .in('pod_id', podIds)
          .order('created_at', { ascending: false })
          .limit(30);
        context.podNotes = (podNotes || []).map(n => ({
          ...n,
          podTitle: context.pods?.find((p: any) => p.id === n.pod_id)?.title,
          contentPreview: n.content?.slice(0, 300)
        }));

        // 3. Get materials from their pods
        const { data: materials } = await supabaseAdmin
          .from('pod_materials')
          .select('id, pod_id, title, description, category, file_name, created_at')
          .in('pod_id', podIds)
          .order('created_at', { ascending: false })
          .limit(30);
        context.podMaterials = (materials || []).map(m => ({
          ...m,
          podTitle: context.pods?.find((p: any) => p.id === m.pod_id)?.title
        }));

        // 4. Get quizzes from their pods
        const { data: quizzes } = await supabaseAdmin
          .from('pod_quizzes')
          .select('id, pod_id, title, quiz_type, subject, topic, created_at')
          .in('pod_id', podIds)
          .eq('archived', false)
          .order('created_at', { ascending: false })
          .limit(20);
        context.podQuizzes = (quizzes || []).map(q => ({
          ...q,
          podTitle: context.pods?.find((p: any) => p.id === q.pod_id)?.title
        }));

        // 5. Get their quiz responses
        const quizIds = (quizzes || []).map(q => q.id);
        if (quizIds.length > 0) {
          const { data: responses } = await supabaseAdmin
            .from('quiz_responses')
            .select('id, quiz_id, score, submitted_at')
            .eq('user_id', user.id)
            .in('quiz_id', quizIds)
            .order('submitted_at', { ascending: false });
          context.myQuizAttempts = (responses || []).map(r => ({
            quizTitle: quizzes?.find(q => q.id === r.quiz_id)?.title,
            score: r.score,
            submittedAt: r.submitted_at
          }));
        }

        // 6. Get flashcards from their pods
        const { data: flashcards } = await supabaseAdmin
          .from('pod_flashcards')
          .select('id, pod_id, title, topic, card_count, created_at')
          .in('pod_id', podIds)
          .order('created_at', { ascending: false })
          .limit(20);
        context.podFlashcards = (flashcards || []).map(f => ({
          ...f,
          podTitle: context.pods?.find((p: any) => p.id === f.pod_id)?.title
        }));
      }

      // 7. Get personal notes
      const { data: personalNotes } = await supabaseAdmin
        .from('personal_notes')
        .select('id, title, topic, subtopic, curriculum, content, created_at, archived')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      context.personalNotes = (personalNotes || []).map(n => ({
        ...n,
        contentPreview: n.content?.slice(0, 300)
      }));

      // 8. Get personal quizzes
      const { data: personalQuizzes } = await supabaseAdmin
        .from('personal_quizzes')
        .select('id, title, quiz_type, subject, topic, curriculum, created_at, archived')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      context.personalQuizzes = personalQuizzes || [];

      // 9. Get personal flashcards
      const { data: personalFlashcards } = await supabaseAdmin
        .from('personal_flashcards')
        .select('id, title, topic, curriculum, card_count, created_at, archived')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      context.personalFlashcards = personalFlashcards || [];

      // 10. Get Phoenix sessions
      const { data: phoenixSessions } = await supabaseAdmin
        .from('phoenix_sessions')
        .select('id, title, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(10);
      context.phoenixSessions = phoenixSessions || [];

      // 11. Get learning chat history summary
      const { data: learningChats } = await supabaseAdmin
        .from('learning_chats')
        .select('id, title, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(10);
      context.learnspaceChats = learningChats || [];

      log("Student context built", {
        pods: context.pods?.length,
        personalNotes: context.personalNotes?.length,
        personalQuizzes: context.personalQuizzes?.length
      });
    }

    // Build system prompt based on role
    const systemPrompt = role === 'teacher' 
      ? `You are Classpace's intelligent Teaching Assistant - an expert AI companion designed specifically for educators. You have COMPLETE access to all of ${userName}'s teaching data on Classpace.

Your capabilities:
- Full visibility into all pods, students, quizzes, assessments, materials, notes, flashcards, sessions, and curricula
- Provide data-backed insights about student performance and engagement
- Suggest improvements based on actual teaching patterns and student results
- Help with lesson planning, assessment creation, and curriculum development
- Answer specific questions about any student, pod, quiz, or material

Communication style:
- Be warm, professional, and encouraging
- Provide specific, actionable advice backed by the data you have access to
- When asked about specific data (e.g., "how many students", "which quiz"), give precise answers
- If data is not available, clearly say so and suggest how to add it
- Use the teacher's name occasionally to personalize responses
- Keep responses focused and helpful - avoid unnecessary verbosity

IMPORTANT: Always base your answers on the actual context data provided. Never fabricate statistics or information.`
      : `You are Classpace's intelligent Learning Assistant - an expert AI tutor designed specifically for students. You have COMPLETE access to all of ${userName}'s learning data on Classpace.

Your capabilities:
- Full visibility into their pods, classes, notes, quizzes, flashcards, and learning progress
- Provide personalized study recommendations based on their actual materials
- Help them understand concepts from their notes and class materials
- Track their quiz performance and suggest areas for improvement
- Support their learning journey with context-aware guidance

Communication style:
- Be friendly, encouraging, and supportive
- Provide specific help based on their actual notes, quizzes, and materials
- When they ask about specific content, reference what you can see in their data
- Be thorough when explaining concepts, but keep it accessible
- Celebrate their progress and encourage continued learning
- If they haven't started using certain features, gently encourage them to try

IMPORTANT: Always base your answers on the actual context data provided. Never fabricate information about their progress or materials.`;

    // Truncate context to fit within limits (keep most recent/relevant)
    const contextStr = JSON.stringify(context);
    const truncatedContext = contextStr.length > 100000 ? contextStr.slice(0, 100000) + '...(truncated)' : contextStr;

    const gatewayBody = {
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: "system", content: systemPrompt },
        { role: "system", content: `Here is ${userName}'s complete Classpace data:\\n\\n${truncatedContext}` },
        ...messages,
      ],
      stream: true,
    };

    log("Calling AI gateway", { messageCount: messages.length });

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gatewayBody),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits needed. Please contact support." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      log("AI gateway error", { status: aiResp.status, body: t });
      return new Response(JSON.stringify({ error: "AI service error. Please try again." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stream the response back
    return new Response(aiResp.body, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      },
    });

  } catch (e) {
    log("ERROR", { message: e instanceof Error ? e.message : String(e) });
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

