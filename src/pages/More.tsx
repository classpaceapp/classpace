import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  HelpCircle, 
  MessageSquare, 
  LifeBuoy,
  GraduationCap,
  Sparkles,
  ChevronRight
} from 'lucide-react';

const More: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const userRole = profile?.role === 'teacher' ? 'teacher' : 'learner';

  const teacherMoreItems = [
    { name: 'Educators', href: '/educators', icon: GraduationCap, color: 'text-teal-500' },
    { name: 'My Plan', href: '/my-plan', icon: Sparkles, color: 'text-pink-500' },
    { name: 'Documentation', href: '/documentation', icon: FileText, color: 'text-green-500' },
    { name: 'FAQs', href: '/faqs', icon: HelpCircle, color: 'text-orange-500' },
    { name: 'Support', href: '/support-tab', icon: LifeBuoy, color: 'text-red-500' }
  ];

  const learnerMoreItems = [
    { name: 'Educators', href: '/educators', icon: GraduationCap, color: 'text-teal-500' },
    { name: 'My Plan', href: '/my-plan', icon: Sparkles, color: 'text-pink-500' },
    { name: 'Documentation', href: '/documentation', icon: FileText, color: 'text-green-500' },
    { name: 'FAQs', href: '/faqs', icon: HelpCircle, color: 'text-orange-500' },
    { name: 'Support', href: '/support-tab', icon: LifeBuoy, color: 'text-red-500' }
  ];

  const moreItems = userRole === 'teacher' ? teacherMoreItems : learnerMoreItems;

  return (
    <DashboardLayout userRole={userRole}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 md:mb-8">
            More
          </h1>
          
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl rounded-3xl overflow-hidden">
            <CardContent className="p-2">
              {moreItems.map((item, index) => (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={`flex items-center justify-between w-full p-4 rounded-2xl transition-all duration-200 hover:bg-secondary/50 ${
                    index !== moreItems.length - 1 ? 'border-b border-border/50' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center`}>
                      <item.icon className={`h-6 w-6 ${item.color}`} />
                    </div>
                    <span className="text-lg font-semibold text-foreground">{item.name}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default More;
