import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const FAQsTab: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "What's the difference between Learn + and Teach + subscriptions?",
      answer: "Learn + is designed for students and includes AI tutoring with Phoenix, unlimited learning sessions, image analysis for homework help, and personalized learning insights. Teach + is for educators and provides unlimited pods, advanced analytics, AI teaching assistant, and priority support. Both are $7/month."
    },
    {
      question: "What's included in the Learn + subscription?",
      answer: "Learn + includes unlimited AI tutoring sessions with Phoenix (voice and text), advanced homework help with image analysis, personalized learning recommendations, access to collaborative whiteboards for interactive learning, and unlimited chat history storage."
    },
    {
      question: "What's included in the Teach + subscription?",
      answer: "Teach + unlocks unlimited AI pods for classroom management, advanced AI teaching assistant, comprehensive student analytics, priority support, faster refresh rates, bigger class sizes, and exclusive access to new teaching features as they're released."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes. You can cancel your Learn + or Teach + subscription anytime through your dashboard. You'll continue to have access to premium features until the end of your current billing period."
    },
    {
      question: "Is there a free plan available?",
      answer: "Yes! Both teachers and students have access to free plans. Teachers get 1 AI Pod with core features, while students can join unlimited pods and use Learnspace with limited chat history. You can upgrade to Learn + or Teach + anytime for $7/month."
    },
    {
      question: "Do students and teachers need separate subscriptions?",
      answer: "Yes. Teach + is specifically for educators managing classrooms and creating pods. Learn + is for students who want enhanced AI tutoring features with Phoenix and personalized learning. Each subscription is tailored to different needs and use cases."
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
