import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Boxes, User, MoreHorizontal, Sparkles } from 'lucide-react';
import learnspaceLogo from '@/assets/learnspace-logo.png';
import phoenixLogo from '@/assets/phoenix-logo.png';
import { useToast } from '@/hooks/use-toast';

interface BottomNavBarProps {
  userRole: 'teacher' | 'learner';
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ userRole }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const PHOENIX_COMING_SOON = true;

  const teacherTabs = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Pods', href: '/teacher-pods', icon: Boxes },
    { name: 'AI', href: '/ai-chat', icon: Sparkles },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'More', href: '/more', icon: MoreHorizontal },
  ];

  const learnerTabs = [
    { name: 'Home', href: '/student-dashboard', icon: Home },
    { name: 'Pods', href: '/student-pods', icon: Boxes },
    { name: 'Learnspace', href: '/learnspace', icon: 'learnspace' },
    { name: 'Phoenix', href: '/phoenix', icon: 'phoenix' },
    { name: 'More', href: '/more', icon: MoreHorizontal },
  ];

  const tabs = userRole === 'teacher' ? teacherTabs : learnerTabs;

  const handleNavigation = (href: string, name: string) => {
    if (userRole === 'learner' && href === '/phoenix' && PHOENIX_COMING_SOON) {
      toast({ title: 'Phoenix', description: 'Coming soon' });
      return;
    }
    navigate(href);
  };

  const isActive = (href: string) => {
    if (href === '/more') {
      // More tab is active when on any page not in the main tabs
      const mainPaths = tabs.map(t => t.href).filter(h => h !== '/more');
      return !mainPaths.some(path => location.pathname === path);
    }
    return location.pathname === href;
  };

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-border shadow-2xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          
          return (
            <button
              key={tab.name}
              onClick={() => handleNavigation(tab.href, tab.name)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 ${
                active ? 'text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 ${
                active 
                  ? tab.name === 'Home' ? 'bg-gradient-to-br from-blue-500 to-blue-600 scale-105 shadow-md' 
                  : tab.name === 'Pods' ? 'bg-gradient-to-br from-purple-500 to-purple-600 scale-105 shadow-md'
                  : tab.name === 'AI' ? 'bg-gradient-to-br from-pink-500 to-pink-600 scale-105 shadow-md'
                  : tab.name === 'Learnspace' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 scale-105 shadow-md'
                  : tab.name === 'Phoenix' ? 'bg-gradient-to-br from-orange-500 to-orange-600 scale-105 shadow-md'
                  : tab.name === 'Profile' ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 scale-105 shadow-md'
                  : 'bg-gradient-to-br from-gray-500 to-gray-600 scale-105 shadow-md'
                  : 'hover:bg-muted'
              }`}>
                {typeof tab.icon === 'string' ? (
                  tab.icon === 'learnspace' ? (
                    <img src={learnspaceLogo} alt="Learnspace" className={`h-4 w-4 transition-all ${active ? 'brightness-125' : ''}`} />
                  ) : tab.icon === 'phoenix' ? (
                    <img src={phoenixLogo} alt="Phoenix" className={`h-4 w-4 transition-all ${active ? 'brightness-125' : ''}`} />
                  ) : null
                ) : (
                  React.createElement(tab.icon, { 
                    className: `h-4 w-4 transition-colors ${active ? 'text-white' : ''}` 
                  })
                )}
              </div>
              <span className={`text-xs mt-1 transition-all ${
                active 
                  ? tab.name === 'Home' ? 'font-semibold text-blue-600' 
                  : tab.name === 'Pods' ? 'font-semibold text-purple-600'
                  : tab.name === 'AI' ? 'font-semibold text-pink-600'
                  : tab.name === 'Learnspace' ? 'font-semibold text-emerald-600'
                  : tab.name === 'Phoenix' ? 'font-semibold text-orange-600'
                  : tab.name === 'Profile' ? 'font-semibold text-indigo-600'
                  : 'font-semibold text-gray-600'
                  : 'font-medium'
              }`}>
                {tab.name}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavBar;
