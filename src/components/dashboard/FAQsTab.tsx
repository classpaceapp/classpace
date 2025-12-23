import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, HelpCircle, BookOpen, CreditCard, Users, Sparkles, Shield, Rocket, GraduationCap } from 'lucide-react';

type Category = 'all' | 'getting-started' | 'features' | 'subscriptions' | 'pods' | 'ai-tools' | 'security' | 'careers';

interface FAQ {
  question: string;
  answer: string;
  category: Category;
}

const categories: { id: Category; label: string; icon: React.ElementType; color: string; bgColor: string }[] = [
  { id: 'all', label: 'All', icon: HelpCircle, color: 'text-purple-600', bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { id: 'getting-started', label: 'Getting Started', icon: BookOpen, color: 'text-blue-600', bgColor: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
  { id: 'features', label: 'Features', icon: Sparkles, color: 'text-amber-600', bgColor: 'bg-gradient-to-r from-amber-500 to-orange-500' },
  { id: 'subscriptions', label: 'Plans & Billing', icon: CreditCard, color: 'text-emerald-600', bgColor: 'bg-gradient-to-r from-emerald-500 to-teal-500' },
  { id: 'pods', label: 'Pods & Classes', icon: Users, color: 'text-indigo-600', bgColor: 'bg-gradient-to-r from-indigo-500 to-violet-500' },
  { id: 'ai-tools', label: 'AI Tools', icon: Sparkles, color: 'text-pink-600', bgColor: 'bg-gradient-to-r from-pink-500 to-rose-500' },
  { id: 'security', label: 'Security', icon: Shield, color: 'text-slate-600', bgColor: 'bg-gradient-to-r from-slate-500 to-gray-600' },
  { id: 'careers', label: 'Careers', icon: Rocket, color: 'text-cyan-600', bgColor: 'bg-gradient-to-r from-cyan-500 to-blue-500' },
];

const faqs: FAQ[] = [
  // Getting Started
  { category: 'getting-started', question: "What is Classpace?", answer: "Classpace is an AI-powered learning platform that connects teachers and students in virtual classrooms called 'Pods'. Teachers can create and manage classes, share materials, create quizzes, and use AI tools for curriculum planning. Students can join classes, access learning materials, use AI tutors like Phoenix for homework help, and create personal study resources." },
  { category: 'getting-started', question: "How do I sign up?", answer: "Visit the login page and click 'Sign Up'. Choose your role (Student or Teacher), enter your details (name, email, password), and you're ready to go! Email confirmation is automatic in most cases." },
  { category: 'getting-started', question: "What makes Classpace different from ChatGPT or other AI tools?", answer: "Classpace is purpose-built for education with context-aware features. Phoenix AI remembers your study sessions and provides personalized tutoring. The platform integrates seamlessly with teacher-created courses (Pods), tracking progress across materials and assignments. You get structured learning paths, collaborative tools, and educator support—all in one unified interface." },
  { category: 'getting-started', question: "Can I use Classpace on mobile?", answer: "Yes! Classpace is fully responsive and works on all devices. The mobile experience includes a convenient bottom navigation bar for quick access to key features like Dashboard, Pods, Phoenix AI, and more." },
  
  // Features
  { category: 'features', question: "What is Phoenix AI?", answer: "Phoenix is your personal AI tutor available 24/7. It offers real-time voice and text interaction, step-by-step problem solving, image analysis for diagrams and homework, personalized explanations, and an interactive whiteboard for visual learning. Phoenix can help with any subject and adapts to your learning style." },
  { category: 'features', question: "What is Nexus?", answer: "Nexus is an AI-powered teaching command center exclusively for Teach+ subscribers. It includes: AI Curriculum Architect for course design, AI Lesson Orchestrator for daily planning, AI Assessment Hub with auto-grading, Progress Dashboard for student analytics, Global Resource Library, and Student Profile Analytics." },
  { category: 'features', question: "What is My Resources?", answer: "My Resources is your personal study toolkit where you can create AI-generated flashcards, quizzes, and notes on any topic. Free students get 1 of each; Learn+ subscribers get unlimited resources. All resources are saved to your account for anytime access." },
  { category: 'features', question: "What is the Global Resource Library?", answer: "The Global Resource Library (available in 'All Resources') is an open-source repository where educators upload and share teaching materials. Students and teachers can search, filter by category/subject, and download resources like PDFs, presentations, and documents." },
  { category: 'features', question: "What collaboration tools are available in Pods?", answer: "Each Pod includes: Materials (shared files and links), Chat (real-time messaging), Notes (AI-generated and collaborative), Quizzes (teacher-created assessments), Flashcards (study aids), Whiteboards (collaborative drawing), and Meetings (video call links)." },
  
  // Subscriptions
  { category: 'subscriptions', question: "What are the subscription plans?", answer: "Students: Free (join unlimited pods, 3 Learnspace chats, 1 resource each, Phoenix access) or Learn+ at $7/month (unlimited AI tutoring, unlimited resources, image analysis, Aurora careers toolkit). Teachers: Free (1 fully functional pod, all collaboration tools) or Teach+ at $7/month (unlimited pods, full Nexus access, AI curriculum/lesson tools, auto-grading, global resource library, Aurora careers toolkit)." },
  { category: 'subscriptions', question: "How do I upgrade my plan?", answer: "Go to 'My Plan' in the left sidebar and click the upgrade button. You'll be redirected to a secure Stripe checkout. Once payment completes, your premium features activate instantly." },
  { category: 'subscriptions', question: "How do I cancel my subscription?", answer: "Go to 'My Plan' in the left sidebar and click 'Cancel Subscription'. You'll retain access to premium features until the end of your billing period. You can re-upgrade anytime if you change your mind." },
  { category: 'subscriptions', question: "Is there a free trial?", answer: "While we don't offer a traditional free trial, our Free plans include substantial functionality. Students can join unlimited pods and access Phoenix AI. Teachers get 1 fully functional pod with all collaboration tools. This lets you experience Classpace before upgrading." },
  { category: 'subscriptions', question: "What payment methods are accepted?", answer: "We accept all major credit and debit cards (Visa, Mastercard, American Express) through our secure Stripe payment system. Your payment information is never stored on our servers." },
  
  // Pods & Classes
  { category: 'pods', question: "How do Pods work?", answer: "Pods are virtual classrooms. Teachers create pods, share a unique 6-character join code, and add content (materials, quizzes, flashcards, notes). Students join using the code and instantly access all pod content. Each pod has dedicated tabs for different activities." },
  { category: 'pods', question: "How do I join a Pod as a student?", answer: "Get the 6-character Pod code from your teacher. Go to your Dashboard or the Pods page, enter the code in the 'Join with Code' section, and click Join. You'll immediately see all the pod's content." },
  { category: 'pods', question: "How many students can join a Pod?", answer: "There's no limit! Both free and premium teachers can have unlimited students in each pod." },
  { category: 'pods', question: "Can Pods be public or private?", answer: "Yes! Teachers can set pods as Public (discoverable in the 'Discover Public Classes' section) or Private (invite-only via the pod code). This lets teachers control who can find and join their classes." },
  { category: 'pods', question: "How do I create a Pod as a teacher?", answer: "Click 'Create Pod' on your Dashboard. Enter a title, description, and subject. Choose public or private visibility. A unique 6-character code is automatically generated for you to share with students." },
  
  // AI Tools
  { category: 'ai-tools', question: "How does Phoenix AI tutor work?", answer: "Phoenix uses advanced AI to provide personalized tutoring. You can ask questions via text or voice, upload images of homework problems, and get step-by-step explanations. Phoenix also features an interactive whiteboard where it can draw diagrams, graphs, and mathematical curves to help visualize concepts." },
  { category: 'ai-tools', question: "What can the AI Teaching Assistant do?", answer: "The AI Teaching Assistant (in the Dashboard) helps teachers with lesson planning, generating assessment questions, explaining complex topics, creating differentiated materials, and drafting communications. It's context-aware and understands educational needs." },
  { category: 'ai-tools', question: "How does AI-generated content work in My Resources?", answer: "Simply enter a topic, curriculum, and optional subtopic. Our AI generates comprehensive flashcards, quizzes, or study notes tailored to your specifications. You can regenerate if needed and all content is saved to your account." },
  { category: 'ai-tools', question: "Does Phoenix support math and science diagrams?", answer: "Yes! Phoenix can draw mathematical curves (sine, cosine, tan, exponential, logarithmic, etc.), coordinate systems, graphs, and diagrams on its interactive whiteboard. It uses smooth, handwriting-style rendering for a natural tutoring experience." },
  
  // Security
  { category: 'security', question: "Is my data secure?", answer: "Yes. We use enterprise-grade encryption for data storage and transmission. User authentication is handled securely, and we never share your personal information or learning data with third parties. Your materials, AI conversations, and pod content are private." },
  { category: 'security', question: "Who can see my learning activity?", answer: "Your personal resources and AI chat history are visible only to you. Pod content is visible to all pod members. Teachers can see student participation within their pods but not students' personal resources or AI conversations." },
  { category: 'security', question: "How is payment information handled?", answer: "All payments are processed through Stripe, a PCI-compliant payment processor. Your credit card details are never stored on our servers—they go directly to Stripe's secure systems." },
  
  // Careers
  { category: 'careers', question: "What is Aurora?", answer: "Aurora is our AI-powered career toolkit available to Learn+ and Teach+ subscribers. It includes Application Builder (resume and cover letter generation), Role Search (discover career paths and opportunities), and Interview Prep (practice questions and feedback)." },
  { category: 'careers', question: "How does Interview Prep work?", answer: "Enter a job role or paste a job description. Aurora generates tailored interview questions. You can practice answering on camera, record your responses, and review your performance. It's perfect for preparing for real interviews." },
  { category: 'careers', question: "Can teachers use Aurora?", answer: "Absolutely! Aurora is available to both Learn+ students and Teach+ teachers. Educators can use it to explore career opportunities, prepare for interviews, or help students with career guidance." },
];

export const FAQsTab: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');

  const filteredFaqs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  const getCategoryInfo = (categoryId: Category) => {
    return categories.find(c => c.id === categoryId) || categories[0];
  };

  return (
    <div className="p-3 md:p-8 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-10">
          <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
              <HelpCircle className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-5xl font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                FAQs
              </h1>
              <p className="text-sm md:text-lg text-foreground/70">
                Quick answers to common questions
              </p>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="mb-6 md:mb-10">
          <div className="flex flex-wrap gap-2 md:gap-3">
            {categories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-3 rounded-full font-semibold text-xs md:text-sm transition-all duration-300 ${
                    isSelected
                      ? `${category.bgColor} text-white shadow-lg scale-105`
                      : 'bg-card hover:bg-muted border-2 border-border/50 text-foreground hover:border-primary/30'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQ Count */}
        <div className="mb-4 md:mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {filteredFaqs.length} {filteredFaqs.length === 1 ? 'question' : 'questions'}
            {selectedCategory !== 'all' && ` in ${getCategoryInfo(selectedCategory).label}`}
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-3 md:space-y-4">
          {filteredFaqs.map((faq, index) => {
            const categoryInfo = getCategoryInfo(faq.category);
            const isOpen = openFaq === index;
            
            return (
              <Collapsible 
                key={index}
                open={isOpen}
                onOpenChange={() => setOpenFaq(isOpen ? null : index)}
              >
                <CollapsibleTrigger asChild>
                  <div className={`bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 hover:shadow-xl transition-all cursor-pointer border-2 ${
                    isOpen ? 'border-primary/50 shadow-lg' : 'border-border/30 hover:border-primary/30'
                  }`}>
                    <div className="flex items-start justify-between gap-3 md:gap-4">
                      <div className="flex items-start gap-3 md:gap-4">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl ${categoryInfo.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <categoryInfo.icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        </div>
                        <h3 className="font-bold text-foreground text-left text-sm md:text-lg leading-snug pt-1">
                          {faq.question}
                        </h3>
                      </div>
                      <ChevronDown 
                        className={`w-5 h-5 md:w-6 md:h-6 text-primary transition-transform flex-shrink-0 mt-1 ${
                          isOpen ? 'rotate-180' : ''
                        }`} 
                      />
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="bg-gradient-to-br from-muted/60 to-muted/40 rounded-xl md:rounded-2xl p-4 md:p-6 mt-2 border-2 border-border/20 shadow-inner ml-0 md:ml-14">
                    <p className="text-foreground/90 leading-relaxed text-sm md:text-base">
                      {faq.answer}
                    </p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredFaqs.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No questions found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};
