import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FAQsTab: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "What makes Classpace different from using ChatGPT or other AI tools?",
      answer: "While AI chatbots provide general information, Classpace is purpose-built for education with context-aware features that understand your learning journey. Phoenix AI remembers your study sessions and provides personalized tutoring. Our platform integrates seamlessly with teacher-created courses (Pods), tracking your progress across materials, quizzes, and assignments. You get structured learning paths, collaborative tools, and educator support—all in one place, not scattered across multiple apps and tabs."
    },
    {
      question: "How does Classpace serve both students and teachers?",
      answer: "For students, Classpace offers Phoenix AI tutor (24/7 homework help), Learnspace (AI study assistant), organized class pods, collaborative tools, and career prep resources. For teachers, we provide Nexus (AI command center for lesson planning, assessments, and analytics), unlimited pod creation, student progress tracking, and a global resource library. Both roles benefit from seamless integration between teaching and learning tools."
    },
    {
      question: "What is Nexus and who can access it?",
      answer: "Nexus is an AI-powered command center exclusively for Teach+ subscribers. It includes: AI Curriculum Architect for course design, AI Lesson Orchestrator for daily planning, AI Assessment Hub with auto-grading, Progress Dashboard for student analytics, Global Resource Library for sharing materials, and Student Profile Analytics. Free plan teachers can see Nexus modules but need to upgrade to access the full functionality."
    },
    {
      question: "What are the subscription plans and pricing?",
      answer: "Students: Free (join unlimited pods, 3 Learnspace AI chats, 1 resource each, Phoenix access) or Learn+ at $7/month (unlimited AI tutoring, resources, image analysis, career tools). Teachers: Free (1 fully functional pod, all collaboration tools) or Teach+ at $7/month (unlimited pods, full Nexus access, AI curriculum/lesson tools, auto-grading assessments, global resource library, career tools)."
    },
    {
      question: "How do Pods work?",
      answer: "Pods are virtual classrooms where teachers organize course content and students collaborate. Teachers create pods, share a 6-character join code, and upload materials, quizzes, flashcards, and assignments. Students join using the code and access materials, chat with classmates, take collaborative notes, use shared whiteboards, and participate in live meetings. Each pod has dedicated tabs for different activities."
    },
    {
      question: "What is Phoenix and how is it different from Learnspace?",
      answer: "Phoenix is your personal AI tutor designed for one-on-one homework help. It offers voice and text interaction, step-by-step problem solving, image analysis for diagrams, and personalized explanations. Learnspace is a broader AI study assistant for generating notes, flashcards, and quizzes from your materials—it's about creating study resources while Phoenix is about interactive tutoring."
    },
    {
      question: "Can I use Classpace features offline or do I need internet?",
      answer: "Classpace requires an internet connection for all AI features, real-time collaboration (chat, whiteboard), and accessing cloud-stored materials. However, you can view downloaded materials offline. We're designed as a connected platform to enable collaboration and instant AI assistance."
    },
    {
      question: "How does the Global Resource Library work?",
      answer: "Available to Teach+ teachers and all students via 'All Resources', this is an open-source library where educators upload and share teaching materials (PDFs, Word docs, PowerPoints, links). Teachers can contribute resources and download others' materials. Students can search, filter by category/type, and download resources to supplement their learning—think of it as a collaborative educational repository."
    },
    {
      question: "What career tools does Classpace offer?",
      answer: "Both Learn+ and Teach+ subscribers get access to Aurora, our AI-powered career suite: Application Builder (resume, cover letter generation), Role Search (discover career paths), and Interview Prep (practice questions, feedback). These tools help students and educators explore opportunities, prepare applications, and ace interviews."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "Go to 'My Plan' in the left sidebar and click 'Cancel Subscription'. You'll retain access to premium features until the end of your billing period. You can re-upgrade anytime if you change your mind."
    },
    {
      question: "Is my data secure on Classpace?",
      answer: "Yes. We use enterprise-grade encryption for data storage and transmission. User authentication is handled securely, and we never share your personal information or learning data with third parties. Your uploaded materials, conversations with AI tutors, and pod content are private to you and your authorized pod members."
    },
    {
      question: "Why can't I access certain features in Nexus?",
      answer: "Nexus is a premium feature for Teach+ subscribers. Free plan teachers can view the Nexus modules to understand their capabilities, but accessing the full AI command center (curriculum design, lesson planning, auto-grading, analytics) requires upgrading to Teach+. This ensures teachers get the most powerful tools while we maintain platform sustainability."
    }
  ];

  return (
    <div className="p-3 md:p-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 md:mb-12">
          <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
              <HelpCircle className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-5xl font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                FAQs
              </h1>
            </div>
          </div>
          <p className="text-sm md:text-lg text-foreground/70">
            Quick answers to common questions
          </p>
        </div>

        <div className="space-y-3 md:space-y-4">
          {faqs.map((faq, index) => (
            <Collapsible 
              key={index}
              open={openFaq === index}
              onOpenChange={() => setOpenFaq(openFaq === index ? null : index)}
            >
              <CollapsibleTrigger asChild>
                <div className="bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 hover:shadow-xl hover:shadow-primary/10 transition-all cursor-pointer border-2 border-border/30 hover:border-orange-500/50">
                  <div className="flex items-center justify-between gap-3 md:gap-4">
                    <h3 className="font-bold text-foreground text-left text-sm md:text-lg">
                      {faq.question}
                    </h3>
                    <ChevronDown 
                      className={`w-4 h-4 md:w-5 md:h-5 text-orange-500 transition-transform flex-shrink-0 ${
                        openFaq === index ? 'transform rotate-180' : ''
                      }`} 
                    />
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl md:rounded-2xl p-4 md:p-6 mt-2 md:mt-3 border-2 border-border/20 shadow-inner">
                  <p className="text-foreground/90 leading-relaxed text-sm md:text-base">
                    {faq.answer}
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>
    </div>
  );
};
