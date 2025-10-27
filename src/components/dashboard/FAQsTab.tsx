import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600">
            Find answers to common questions about Classpace
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Collapsible 
              key={index}
              open={openFaq === index}
              onOpenChange={() => setOpenFaq(openFaq === index ? null : index)}
            >
              <CollapsibleTrigger asChild>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 hover:border-purple-300">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 text-left pr-4">
                      {faq.question}
                    </h3>
                    <ChevronDown 
                      className={`w-5 h-5 text-purple-600 transition-transform duration-200 flex-shrink-0 ${
                        openFaq === index ? 'transform rotate-180' : ''
                      }`} 
                    />
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 mt-2 border border-gray-200 shadow-md">
                  <p className="text-gray-700 leading-relaxed">
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
