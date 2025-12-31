import React, { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, HelpCircle, Sparkles, CreditCard, Users, Shield, Rocket, BookOpen, Compass, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FAQ {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  bgGradient: string;
  borderColor: string;
  faqs: FAQ[];
}

export const FAQsTab: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('getting-started');

  const categories: FAQCategory[] = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      icon: Rocket,
      color: 'text-emerald-600',
      bgGradient: 'from-emerald-500 to-teal-500',
      borderColor: 'border-emerald-500/50',
      faqs: [
        {
          question: "What is Classpace and how does it work?",
          answer: "Classpace is an AI-powered educational platform connecting teachers and students through virtual classrooms called 'Pods'. Teachers create Pods with materials, quizzes, flashcards, and collaborative tools. Students join using a 6-character code and access all resources. The platform includes AI tutoring (Phoenix), study tools (My Resources), and career preparation (Aurora)."
        },
        {
          question: "How do I create an account?",
          answer: "Visit the login page and click 'Sign Up'. Choose your role (Teacher or Student), enter your name, email, and password. Your account is automatically confirmed, and you'll be directed to your role-specific dashboard immediately."
        },
        {
          question: "What makes Classpace different from ChatGPT or other AI tools?",
          answer: "Unlike general AI chatbots, Classpace is purpose-built for education. Phoenix AI provides personalized tutoring within your learning context, remembering your study sessions. The platform integrates AI seamlessly with teacher-created courses, progress tracking, collaborative tools, and structured learning paths—all in one unified platform."
        },
        {
          question: "Can I use Classpace on mobile devices?",
          answer: "Yes! Classpace is fully responsive and works on smartphones, tablets, and desktops. Access all features including Phoenix AI tutoring, Pod materials, chat, and resources from any device with a web browser."
        }
      ]
    },
    {
      id: 'pods-classes',
      name: 'Pods & Classes',
      icon: BookOpen,
      color: 'text-blue-600',
      bgGradient: 'from-blue-500 to-indigo-500',
      borderColor: 'border-blue-500/50',
      faqs: [
        {
          question: "How do Pods work?",
          answer: "Pods are virtual classrooms where teachers organize content and students collaborate. Teachers create Pods, share a unique 6-character join code, and upload materials, quizzes, flashcards, and assignments. Students join with the code and access everything: materials, chat with classmates, collaborative notes, shared whiteboards, and live meetings."
        },
        {
          question: "How do I join a Pod as a student?",
          answer: "Get the 6-character Pod code from your teacher. Go to 'Pods' in the sidebar, click 'Join Pod', enter the code, and you'll instantly have access to all class materials and features. You can also discover and join public Pods via the 'Discover Public Classes' option."
        },
        {
          question: "How many Pods can I create or join?",
          answer: "Students can join unlimited Pods on any plan. Teachers on the Free plan can create 1 fully-functional Pod. Teach+ subscribers ($7/month) can create unlimited Pods."
        },
        {
          question: "What features are available inside a Pod?",
          answer: "Each Pod includes: Materials tab (PDFs, documents, links), Quizzes (AI-generated or custom), Flashcards (AI-generated study cards), Notes (collaborative or personal), Chat (real-time messaging), Whiteboards (interactive drawing), Meetings (scheduled video call links), and Members (view classmates/students)."
        },
        {
          question: "Can I make my Pod public or private?",
          answer: "Yes! When creating or editing a Pod, you can toggle visibility. Public Pods appear in 'Discover Public Classes' for any student to join. Private Pods require the unique code to join, keeping your class invitation-only."
        }
      ]
    },
    {
      id: 'ai-features',
      name: 'AI & Phoenix',
      icon: Sparkles,
      color: 'text-purple-600',
      bgGradient: 'from-purple-500 to-pink-500',
      borderColor: 'border-purple-500/50',
      faqs: [
        {
          question: "What is Phoenix AI and how is it different from the AI Assistant?",
          answer: "Phoenix is your personal AI tutor for one-on-one homework help with voice and text interaction, step-by-step problem solving, and image analysis. The AI Assistant (in the sidebar) is a general helper for quick questions. Phoenix offers deeper, more interactive tutoring with whiteboard visualization and multi-modal input."
        },
        {
          question: "What AI features are available to students?",
          answer: "Free students get: Phoenix AI tutor access, 3 AI Assistant chats, and 1 each of flashcards/quizzes/notes in My Resources. Learn+ students ($7/month) get: unlimited Phoenix tutoring, unlimited AI Assistant chats, unlimited My Resources generation, advanced image analysis, and Aurora career tools."
        },
        {
          question: "What is Nexus for teachers?",
          answer: "Nexus is the AI-powered teaching command center exclusively for Teach+ subscribers. It includes: AI Curriculum Architect (course design), AI Lesson Orchestrator (daily lesson plans), AI Assessment Hub (auto-grading quizzes), Progress Dashboard (student analytics), Global Resource Library (share/download materials), and Student Profile Analytics."
        },
        {
          question: "Can AI generate quizzes and flashcards?",
          answer: "Yes! Both students and teachers can generate AI-powered quizzes and flashcards. Specify your curriculum, topic, and preferences, and the AI creates study materials instantly. Teachers can also create assessments with auto-grading through Nexus."
        }
      ]
    },
    {
      id: 'subscriptions',
      name: 'Plans & Pricing',
      icon: CreditCard,
      color: 'text-amber-600',
      bgGradient: 'from-amber-500 to-orange-500',
      borderColor: 'border-amber-500/50',
      faqs: [
        {
          question: "What are the subscription plans and pricing?",
          answer: "Students: Free (join unlimited pods, 3 AI Assistant chats, 1 resource each, Phoenix access) or Learn+ at $7/month (unlimited AI tutoring, unlimited resources, image analysis, career tools, All Resources library). Teachers: Free (1 fully functional pod, all collaboration tools) or Teach+ at $7/month (unlimited pods, full Nexus AI suite, auto-grading, analytics, career tools)."
        },
        {
          question: "What's included in the Free plan?",
          answer: "Students get: join unlimited Pods, Phoenix AI tutor access, 3 AI Assistant chats, 1 flashcard set, 1 quiz, 1 note in My Resources. Teachers get: 1 Pod with full features (materials, quizzes, flashcards, notes, whiteboards, meetings, chat, unlimited students)."
        },
        {
          question: "What do Learn+ and Teach+ unlock?",
          answer: "Learn+ ($7/mo): Unlimited AI Assistant chats, unlimited flashcards/quizzes/notes, advanced image analysis, All Resources library access, Aurora career tools. Teach+ ($7/mo): Unlimited Pods, full Nexus (curriculum/lesson/assessment AI), auto-grading, analytics, Global Resource Library, Aurora career tools."
        },
        {
          question: "How do I cancel my subscription?",
          answer: "Go to 'My Plan' in the sidebar and click 'Cancel Subscription'. You'll retain access to premium features until the end of your billing period. You can re-upgrade anytime."
        },
        {
          question: "Is there a refund policy?",
          answer: "We offer refunds within 7 days of your first subscription payment if you're unsatisfied. Contact support through the Support page to request a refund."
        }
      ]
    },
    {
      id: 'teachers',
      name: 'For Teachers',
      icon: GraduationCap,
      color: 'text-teal-600',
      bgGradient: 'from-teal-500 to-cyan-500',
      borderColor: 'border-teal-500/50',
      faqs: [
        {
          question: "How do I create my first Pod?",
          answer: "From your dashboard, click 'Create Pod'. Enter a title, description, and subject. Choose public or private visibility. A unique 6-character code is auto-generated—share this with students to let them join."
        },
        {
          question: "How do I share materials with students?",
          answer: "Inside your Pod, go to the 'Materials' tab. Upload PDFs, Word docs, PowerPoints, images, or add external links (YouTube, articles). Materials appear immediately for all enrolled students."
        },
        {
          question: "Can I create quizzes and assessments?",
          answer: "Yes! Use the 'Quizzes' tab in your Pod to create AI-generated or custom quizzes. Teach+ subscribers also access the AI Assessment Hub in Nexus for auto-graded assessments with public shareable links."
        },
        {
          question: "How do I track student progress?",
          answer: "Teach+ subscribers have access to the Progress Dashboard in Nexus, showing quiz scores, engagement metrics, and student analytics. You can also view the Members tab in each Pod to see enrolled students."
        },
        {
          question: "What is the Global Resource Library?",
          answer: "Available to Teach+ teachers, this is an open-source library where educators upload and share teaching resources (PDFs, documents, presentations, links). Download materials from other teachers and contribute your own. Students access this via 'All Resources'."
        }
      ]
    },
    {
      id: 'students',
      name: 'For Students',
      icon: Users,
      color: 'text-rose-600',
      bgGradient: 'from-rose-500 to-pink-500',
      borderColor: 'border-rose-500/50',
      faqs: [
        {
          question: "How do I get help with homework?",
          answer: "Use Phoenix AI tutor! Click 'Phoenix' in the sidebar, type or speak your question, and get step-by-step explanations. You can upload images of problems for Phoenix to analyze. Phoenix works for math, science, languages, and any subject."
        },
        {
          question: "What is My Resources?",
          answer: "My Resources is your personal study toolkit. Generate AI-powered flashcards, quizzes, and notes for any topic. Free users get 1 of each; Learn+ users get unlimited. Access your resources anytime to study and review."
        },
        {
          question: "Can I study with classmates?",
          answer: "Yes! Each Pod has collaborative features: real-time Chat for discussions, shared Notes for group study, Whiteboards for visual collaboration, and Meetings for video calls. Work together on materials your teacher provides."
        },
        {
          question: "What are Aurora career tools?",
          answer: "Aurora is the AI-powered career suite for Learn+ subscribers: Application Builder (generate resumes, cover letters), Role Search (discover career paths matching your skills), and Interview Prep (practice questions and feedback). Prepare for your future alongside your studies."
        },
        {
          question: "How do I access more learning resources?",
          answer: "Learn+ subscribers can access 'All Resources' in the sidebar—a global library of teaching materials shared by educators worldwide. Search, filter by category, and download PDFs, documents, and links to supplement your learning."
        }
      ]
    },
    {
      id: 'careers',
      name: 'Careers & Aurora',
      icon: Compass,
      color: 'text-indigo-600',
      bgGradient: 'from-indigo-500 to-violet-500',
      borderColor: 'border-indigo-500/50',
      faqs: [
        {
          question: "What is Aurora?",
          answer: "Aurora is Classpace's AI-powered career suite available to Learn+ and Teach+ subscribers. It includes three tools: Application Builder (resume and cover letter generation), Role Search (career path discovery), and Interview Prep (practice questions with AI feedback)."
        },
        {
          question: "How does Application Builder work?",
          answer: "Enter your details, experience, and target role. Aurora generates professional resumes and cover letters tailored to specific job applications. Edit, refine, and download your materials."
        },
        {
          question: "What is Role Search?",
          answer: "Enter your skills, interests, and experience. Aurora suggests matching career paths, industries, and roles you might not have considered. Great for students exploring options and professionals considering transitions."
        },
        {
          question: "How does Interview Prep help?",
          answer: "Choose a role or paste a job description. Aurora generates relevant interview questions. Practice your answers and receive AI feedback on how to improve your responses."
        }
      ]
    },
    {
      id: 'security',
      name: 'Security & Privacy',
      icon: Shield,
      color: 'text-slate-600',
      bgGradient: 'from-slate-500 to-gray-600',
      borderColor: 'border-slate-500/50',
      faqs: [
        {
          question: "Is my data secure on Classpace?",
          answer: "Yes. We use enterprise-grade encryption for data storage and transmission. User authentication is handled securely, and we never share your personal information or learning data with third parties. Your materials, AI conversations, and Pod content are private."
        },
        {
          question: "Who can see my Pod content?",
          answer: "Only members of your Pod can see its content. Teachers control enrollment, and students can only access Pods they've joined. Private Pods require the unique code; public Pods are discoverable but content is still member-only."
        },
        {
          question: "Can I delete my account?",
          answer: "Yes. Contact support to request account deletion. This will remove your profile, Pod memberships, and generated resources. Note that content you've shared in collaborative Pods (chat messages, shared notes) may persist for other members."
        },
        {
          question: "How is payment information handled?",
          answer: "All payments are processed securely through Stripe. We never store your full credit card details—Stripe handles payment information with industry-standard PCI compliance."
        }
      ]
    }
  ];

  const activeData = categories.find(c => c.id === activeCategory) || categories[0];

  return (
    <div className="p-3 md:p-8 min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
            <div className="w-14 h-14 md:w-20 md:h-20 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-xl shadow-pink-500/20">
              <HelpCircle className="w-7 h-7 md:w-10 md:h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                FAQs
              </h1>
              <p className="text-sm md:text-lg text-muted-foreground mt-1">
                Find answers to common questions
              </p>
            </div>
          </div>
        </div>

        {/* Category Selector */}
        <div className="mb-8 overflow-x-auto pb-2 -mx-3 px-3">
          <div className="flex gap-2 md:gap-3 min-w-max">
            {categories.map((category) => {
              const IconComponent = category.icon;
              const isActive = activeCategory === category.id;

              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setActiveCategory(category.id);
                    setOpenFaq(null);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 md:px-5 md:py-3 rounded-xl md:rounded-2xl font-semibold text-sm md:text-base transition-all duration-300 whitespace-nowrap ${isActive
                    ? `bg-gradient-to-r ${category.bgGradient} text-white shadow-lg scale-105`
                    : 'bg-card hover:bg-muted border border-border/50 text-muted-foreground hover:text-foreground'
                    }`}
                >
                  <IconComponent className={`w-4 h-4 md:w-5 md:h-5 ${isActive ? 'text-white' : category.color}`} />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Category Header */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`bg-gradient-to-r ${activeData.bgGradient} rounded-2xl md:rounded-3xl p-6 md:p-8 mb-6 md:mb-8 shadow-xl`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center">
                  <activeData.icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white">{activeData.name}</h2>
                  <p className="text-white/80 text-sm md:text-base">{activeData.faqs.length} questions answered</p>
                </div>
              </div>
            </div>

            {/* FAQs List */}
            <div className="space-y-3 md:space-y-4">
              {activeData.faqs.map((faq, index) => (
                <Collapsible
                  key={index}
                  open={openFaq === index}
                  onOpenChange={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <CollapsibleTrigger asChild>
                    <div className={`bg-card backdrop-blur-sm rounded-xl md:rounded-2xl p-4 md:p-6 hover:shadow-xl transition-all cursor-pointer border-2 ${openFaq === index ? activeData.borderColor : 'border-border/30 hover:border-border'
                      }`}>
                      <div className="flex items-center justify-between gap-3 md:gap-4">
                        <h3 className="font-bold text-foreground text-left text-sm md:text-lg leading-snug">
                          {faq.question}
                        </h3>
                        <ChevronDown
                          className={`w-5 h-5 md:w-6 md:h-6 ${activeData.color} transition-transform flex-shrink-0 ${openFaq === index ? 'transform rotate-180' : ''
                            }`}
                        />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`bg-muted/50 rounded-xl md:rounded-2xl p-4 md:p-6 mt-2 border-2 border-border/20`}
                    >
                      <p className="text-foreground/90 leading-relaxed text-sm md:text-base">
                        {faq.answer}
                      </p>
                    </motion.div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Help Footer */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-2xl p-6 md:p-8 border border-border/30">
            <h3 className="text-lg md:text-xl font-bold text-foreground mb-2">Still have questions?</h3>
            <p className="text-muted-foreground mb-4">Our support team is here to help you succeed.</p>
            <a
              href="/support-tab"
              className={`inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all`}
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};