import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  FileText, 
  HelpCircle, 
  MessageSquare, 
  LifeBuoy,
  LogOut,
  User,
  Home,
  Sparkles,
  Flame,
  Boxes,
  GraduationCap,
  Library,
  Rocket,
  Compass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import learnspaceLogo from '@/assets/learnspace-logo.png';
import phoenixLogo from '@/assets/phoenix-logo.png';
import BottomNavBar from './BottomNavBar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: 'teacher' | 'learner';
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, userRole }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const PHOENIX_COMING_SOON = true;

  const teacherNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, color: 'text-blue-500' },
    { name: 'Pods', href: '/teacher-pods', icon: Boxes, color: 'text-indigo-500' },
    { name: 'Careers', href: '/student-careers', icon: Rocket, color: 'text-emerald-500' },
    { name: 'Nexus', href: '/teacher-nexus', icon: Compass, color: 'text-violet-500' },
    { name: 'Educators', href: '/educators', icon: GraduationCap, color: 'text-teal-500' },
    { name: 'Profile', href: '/profile', icon: User, color: 'text-purple-500' },
    { name: 'My Plan', href: '/my-plan', icon: Sparkles, color: 'text-pink-500' },
    { name: 'Documentation', href: '/documentation', icon: FileText, color: 'text-green-500' },
    { name: 'FAQs', href: '/faqs', icon: HelpCircle, color: 'text-orange-500' },
    { name: 'AI Chat', href: '/ai-chat', icon: MessageSquare, color: 'text-cyan-500' },
    { name: 'Support', href: '/support-tab', icon: LifeBuoy, color: 'text-red-500' }
  ];

  const learnerNavItems = [
    { name: 'Dashboard', href: '/student-dashboard', icon: Home, color: 'text-blue-500' },
    { name: 'Pods', href: '/student-pods', icon: Boxes, color: 'text-indigo-500' },
    { name: 'Learnspace', href: '/learnspace', icon: 'learnspace', color: '' },
    { name: 'Phoenix', href: '/phoenix', icon: 'phoenix', color: '' },
    { name: 'My Resources', href: '/my-resources', icon: Library, color: 'text-amber-500' },
    { name: 'Careers', href: '/student-careers', icon: Rocket, color: 'text-emerald-500' },
    { name: 'Educators', href: '/educators', icon: GraduationCap, color: 'text-teal-500' },
    { name: 'Profile', href: '/profile', icon: User, color: 'text-purple-500' },
    { name: 'My Plan', href: '/my-plan', icon: Sparkles, color: 'text-pink-500' },
    { name: 'Documentation', href: '/documentation', icon: FileText, color: 'text-green-500' },
    { name: 'FAQs', href: '/faqs', icon: HelpCircle, color: 'text-orange-500' },
    { name: 'Support', href: '/support-tab', icon: LifeBuoy, color: 'text-red-500' }
  ];

  const navigationItems = userRole === 'teacher' ? teacherNavItems : learnerNavItems;

  const userInitials = profile?.first_name && profile?.last_name 
    ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`
    : user?.email?.charAt(0).toUpperCase() || 'U';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleNavigation = (href: string) => {
    if (userRole === 'learner' && href === '/phoenix' && PHOENIX_COMING_SOON) {
      toast({ title: 'Phoenix', description: 'Coming soon' });
      setSidebarOpen(false);
      return;
    }
    if (href === '/dashboard') {
      // Navigate to role-specific dashboard
      if (userRole === 'learner') {
        navigate('/student-dashboard');
      } else {
        navigate('/dashboard');
      }
    } else if (href === '/student-careers') {
      // Both teachers and learners use the same careers route
      navigate('/student-careers');
    } else {
      navigate(href);
    }
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-background/80 backdrop-blur-md border-border/50"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar - Fixed transparency issue with solid background */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-card backdrop-blur-md border-r border-border shadow-2xl transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 border-b border-border/50">
          <img 
            src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png" 
            alt="Classpace Logo" 
            className="w-8 h-8"
          />
          <span className="text-xl font-bold" style={{ color: 'hsl(280, 70%, 40%)' }}>
            Classpace
          </span>
        </div>

        {/* Navigation */}
        <nav className={`p-4 overflow-y-auto max-h-[calc(100vh-200px)] ${userRole === 'learner' ? 'space-y-1' : 'space-y-2'}`}>
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.href;
            
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className={`flex items-center gap-2.5 px-3 rounded-xl transition-all duration-200 w-full text-left ${
                  userRole === 'learner' ? 'py-2 text-xs' : 'py-3'
                } ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}
              >
                {typeof item.icon === 'string' ? (
                  item.icon === 'learnspace' ? (
                    <img src={learnspaceLogo} alt="Learnspace" className={userRole === 'learner' ? 'h-3.5 w-3.5 flex-shrink-0' : 'h-5 w-5'} />
                  ) : item.icon === 'phoenix' ? (
                    <img src={phoenixLogo} alt="Phoenix" className={userRole === 'learner' ? 'h-3.5 w-3.5 flex-shrink-0' : 'h-5 w-5'} />
                  ) : null
                ) : (
                  React.createElement(item.icon, { 
                    className: `${userRole === 'learner' ? 'h-3.5 w-3.5 flex-shrink-0' : 'h-5 w-5'} ${!isActive && item.color ? item.color : ''}` 
                  })
                )}
                <span className="font-medium truncate">{item.name}</span>
                {userRole === 'learner' && item.icon === 'phoenix' && PHOENIX_COMING_SOON && (
                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 flex-shrink-0">Soon</Badge>
                )}
              </button>
            );
          })}
        </nav>

        {/* User section */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border/50 bg-card">
          <div className={`flex items-center mb-3 ${userRole === 'learner' ? 'gap-2' : 'gap-3'}`}>
            <Avatar className={userRole === 'learner' ? 'h-8 w-8 flex-shrink-0' : 'h-10 w-10'}>
              {profile?.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt="Profile avatar" />
              )}
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-foreground truncate ${userRole === 'learner' ? 'text-xs' : 'text-sm'}`}>
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className={`text-muted-foreground truncate ${userRole === 'learner' ? 'text-[10px]' : 'text-xs'}`}>
                {user?.email}
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className={`w-full justify-start text-muted-foreground hover:text-foreground ${
              userRole === 'learner' ? 'h-8 text-xs gap-1.5 px-2' : 'gap-2'
            }`}
          >
            <LogOut className={userRole === 'learner' ? 'h-3 w-3' : 'h-4 w-4'} />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="transition-all duration-300 ease-in-out md:ml-64 min-h-screen pb-20 md:pb-0">
        {/* Top bar - Compact on mobile */}
        <header className="bg-card/30 backdrop-blur-md border-b border-border/50 px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="md:hidden" /> {/* Spacer for mobile menu button */}
            
            <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-4 ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 focus:outline-none">
                    <Avatar className="h-8 w-8">
                      {profile?.avatar_url && (
                        <AvatarImage src={profile.avatar_url} alt="Profile avatar" />
                      )}
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-foreground">
                        {profile?.first_name} {profile?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {userRole === 'teacher' ? 'Teacher' : 'Student'}
                      </p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        {children}
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavBar userRole={userRole} />
    </div>
  );
};

export default DashboardLayout;