import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FAQsTab: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "What's the difference between Learn+ and Teach+ subscriptions?",
      answer: "Learn+ is for students - it unlocks unlimited Learnspace AI chats, unlimited My Resources (flashcards, quizzes, notes), and Aurora Careers Toolkit. Teach+ is for educators - it unlocks unlimited pods, full Nexus AI teaching command center (curriculum planning, lesson generation, assessments, analytics, resource library), Phoenix AI tutor, and Aurora Careers Toolkit. Both are $7/month."
    },
    {
      question: "What's included in the Learn+ subscription?",
      answer: "Learn+ includes unlimited Learnspace AI chats (with image analysis), unlimited personal flashcards, quizzes, and notes generation in My Resources, Phoenix AI tutor access, full access to Aurora Careers Toolkit (application building, role search, interview preparation), access to global resource library, and the ability to join unlimited pods created by teachers."
    },
    {
      question: "What's included in the Teach+ subscription?",
      answer: "Teach+ unlocks unlimited pod creation (including materials, quizzes, flashcards, notes, whiteboards, live meetings, chat), full Nexus AI teaching command center (AI curriculum architect, lesson orchestrator, assessment hub, progress dashboard, time optimizer, global resource library, student profiles), Phoenix AI tutor access, and full access to Aurora Careers Toolkit with AI-powered application building, role search, and interview preparation tools."
    },
    {
      question: "What is Nexus and who can access it?",
      answer: "Nexus is an intelligent teaching command center exclusive to Teach+ subscribers. It includes: AI Curriculum Architect for planning courses, AI Lesson Orchestrator for creating lessons, Assessment Hub for generating tests, Progress Dashboard for analytics, Time Optimizer for workload insights, Resource Library for sharing teaching materials globally, and Student Profiles for tracking individual progress. Free teacher accounts can view Nexus but need Teach+ to use the features."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes. You can cancel your Learn+ or Teach+ subscription anytime through My Plan in your dashboard. You'll continue to have access to premium features until the end of your current billing period."
    },
    {
      question: "Is there a free plan available?",
      answer: "Yes! Free plan for students includes: join unlimited pods, Learnspace AI (limited to 3 chats), My Resources (1 flashcard/quiz/note each), Phoenix AI tutor. Free plan for teachers includes: 1 pod with full features (materials, quizzes, flashcards, notes, whiteboards, meetings)."
    },
    {
      question: "Do students and teachers need separate subscriptions?",
      answer: "Yes. Teach+ is specifically for educators managing multiple classrooms. Learn+ is for students who want unlimited AI learning resources. Both subscriptions include full access to Aurora Careers Toolkit (including interview preparation). Each subscription is tailored to different needs at the same $7/month price."
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
