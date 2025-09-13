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
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: 'teacher' | 'learner';
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, userRole }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    {
      name: 'Documentation',
      href: '/documentation',
      icon: FileText,
      current: location.pathname === '/documentation'
    },
    {
      name: 'FAQs',
      href: '/our-journey',
      icon: HelpCircle,
      current: location.pathname === '/our-journey'
    },
    {
      name: 'AI Chat',
      href: '/ai-chat',
      icon: MessageSquare,
      current: location.pathname === '/ai-chat'
    },
    {
      name: 'Support',
      href: '/support',
      icon: LifeBuoy,
      current: location.pathname === '/support'
    }
  ];

  const userInitials = profile?.first_name && profile?.last_name 
    ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`
    : user?.email?.charAt(0).toUpperCase() || 'U';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleNavigation = (href: string) => {
    navigate(href);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200/50">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Classpace
            </span>
          </div>
          <button
            type="button"
            className="lg:hidden text-gray-500 hover:text-gray-700 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-6">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className={`group flex w-full items-center px-4 py-3 text-left text-sm font-medium rounded-xl transition-all duration-200 ${
                    item.current
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${
                    item.current ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'
                  }`} />
                  {item.name}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User section at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200/50 bg-white/50">
          <div className="flex items-center space-x-3 mb-4">
            <Avatar className="h-10 w-10 ring-2 ring-blue-500/20">
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {profile?.first_name ? `${profile.first_name} ${profile.last_name}` : user?.email}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {userRole}
              </p>
            </div>
          </div>
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 lg:hidden flex h-16 items-center gap-x-4 border-b border-gray-200/50 bg-white/95 backdrop-blur-xl px-4 shadow-sm sm:gap-x-6 sm:px-6">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">
            Dashboard
          </div>
        </div>

        {/* Page content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;