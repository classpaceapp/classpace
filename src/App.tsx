
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import Profile from "./pages/Profile";
import PodView from "./pages/PodView";
import StudentPodView from "./pages/StudentPodView";
import SessionView from "./pages/SessionView";
import WhiteboardView from "./pages/WhiteboardView";
import TldrawWhiteboard from "./pages/TldrawWhiteboard";
import PublicPodsDiscovery from "./pages/PublicPodsDiscovery";
import TeacherPodsPage from "./pages/TeacherPodsPage";
import StudentPodsPage from "./pages/StudentPodsPage";
import MyResources from "./pages/MyResources";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Pricing from "./pages/Pricing";
import Refunds from "./pages/Refunds";
import OurJourney from "./pages/OurJourney";
import Documentation from "./pages/Documentation";
import AIChat from "./pages/AIChat";
import Learnspace from "./pages/Learnspace";
import Phoenix from "./pages/Phoenix";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";
import FAQs from "./pages/FAQs";
import SupportPage from "./pages/SupportPage";
import MyPlan from "./pages/MyPlan";
import Educators from "./pages/Educators";
import EducatorProfile from "./pages/EducatorProfile";
import QuizView from "./pages/QuizView";
import SubscriptionReturnHandler from "@/components/subscription/SubscriptionReturnHandler";
import Careers from "./pages/Careers";
import StudentCareers from "./pages/StudentCareers";
import ExcalidrawWhiteboard from "./pages/ExcalidrawWhiteboard";
import Investors from "./pages/Investors";
import More from "./pages/More";
import TeacherNexus from "./pages/TeacherNexus";
import PublicAssessment from "./pages/PublicAssessment";

const queryClient = new QueryClient();

// Component to handle scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <SubscriptionReturnHandler />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requireRole="teacher">
                  <TeacherDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student-dashboard" 
              element={
                <ProtectedRoute requireRole="learner">
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/pod/:id" 
              element={
                <ProtectedRoute requireRole="teacher">
                  <PodView />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/pod/:id" 
              element={
                <ProtectedRoute requireRole="learner">
                  <StudentPodView />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/discover-pods" 
              element={
                <ProtectedRoute requireRole="learner">
                  <PublicPodsDiscovery />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher-pods" 
              element={
                <ProtectedRoute requireRole="teacher">
                  <TeacherPodsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student-pods" 
              element={
                <ProtectedRoute requireRole="learner">
                  <StudentPodsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/session/:sessionId" 
              element={
                <ProtectedRoute>
                  <SessionView />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/whiteboard/:id" 
              element={
                <ProtectedRoute>
                  <WhiteboardView />
                </ProtectedRoute>
              } 
            />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/refunds" element={<Refunds />} />
            <Route path="/our-journey" element={<OurJourney />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/investors" element={<Investors />} />
            <Route 
              path="/excalidraw/:whiteboardId" 
              element={
                <ProtectedRoute>
                  <ExcalidrawWhiteboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/documentation" element={
              <ProtectedRoute>
                <Documentation />
              </ProtectedRoute>
            } />
            <Route path="/ai-chat" element={
              <ProtectedRoute>
                <AIChat />
              </ProtectedRoute>
            } />
            <Route path="/learnspace" element={
              <ProtectedRoute requireRole="learner">
                <Learnspace />
              </ProtectedRoute>
            } />
            <Route path="/phoenix" element={
              <ProtectedRoute requireRole="learner">
                <Phoenix />
              </ProtectedRoute>
            } />
            <Route path="/my-resources" element={
              <ProtectedRoute requireRole="learner">
                <MyResources />
              </ProtectedRoute>
            } />
            <Route path="/student-careers" element={
              <ProtectedRoute>
                <StudentCareers />
              </ProtectedRoute>
            } />
            <Route path="/teacher-nexus" element={
              <ProtectedRoute requireRole="teacher">
                <TeacherNexus />
              </ProtectedRoute>
            } />
            <Route path="/support" element={<Support />} />
            <Route path="/faqs" element={
              <ProtectedRoute>
                <FAQs />
              </ProtectedRoute>
            } />
            <Route path="/support-tab" element={
              <ProtectedRoute>
                <SupportPage />
              </ProtectedRoute>
            } />
            <Route path="/my-plan" element={
              <ProtectedRoute>
                <MyPlan />
              </ProtectedRoute>
            } />
            <Route path="/educators" element={
              <ProtectedRoute>
                <Educators />
              </ProtectedRoute>
            } />
            <Route path="/educator/:userId" element={
              <ProtectedRoute>
                <EducatorProfile />
              </ProtectedRoute>
            } />
            <Route path="/more" element={
              <ProtectedRoute>
                <More />
              </ProtectedRoute>
            } />
            <Route path="/assessment/:code" element={<PublicAssessment />} />
            <Route 
              path="/quiz/:quizId" 
              element={
                <ProtectedRoute>
                  <QuizView />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
