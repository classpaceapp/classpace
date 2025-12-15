
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Users, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, completeGoogleSignUp, user, profile, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"teacher" | "learner">("teacher");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"teacher" | "learner">("teacher");
  
  // Google OAuth name fields
  const [googleFirstName, setGoogleFirstName] = useState("");
  const [googleLastName, setGoogleLastName] = useState("");

  // Handle authentication state and role selection for Google OAuth
  useEffect(() => {
    if (user && !loading) {
      // Check if profile exists AND is complete (has first_name set)
      // The database trigger creates profiles immediately with empty names for Google OAuth users
      const isProfileComplete = profile && profile.first_name && profile.first_name.trim() !== '';
      
      if (isProfileComplete) {
        // Profile is complete, redirect to appropriate dashboard
        const dashboardPath = profile.role === 'learner' ? '/student-dashboard' : '/dashboard';
        navigate(dashboardPath);
      } else {
        // Either no profile yet, or profile exists but is incomplete (Google OAuth user)
        // Pre-fill names from Google metadata if available
        const gFirstName = user.user_metadata?.given_name || 
                          user.user_metadata?.full_name?.split(' ')[0] || 
                          user.user_metadata?.name?.split(' ')[0] || '';
        const gLastName = user.user_metadata?.family_name || 
                         user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 
                         user.user_metadata?.name?.split(' ').slice(1).join(' ') || '';
        setGoogleFirstName(gFirstName);
        setGoogleLastName(gLastName);
        setShowRoleDialog(true);
      }
    }
  }, [user, profile, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate names for signup
    if (isSignUp) {
      if (!firstName.trim()) {
        toast.error("First name is required");
        return;
      }
      if (!lastName.trim()) {
        toast.error("Last name is required");
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, role, firstName.trim(), lastName.trim());
        if (!error) {
          setEmail("");
          setPassword("");
          setFirstName("");
          setLastName("");
        }
      } else {
        const { error } = await signIn(email, password);
        if (!error) {
          // Navigation will be handled by useEffect when profile loads
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleSelection = async () => {
    // Validate names
    if (!googleFirstName.trim()) {
      toast.error("First name is required");
      return;
    }
    if (!googleLastName.trim()) {
      toast.error("Last name is required");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { error } = await completeGoogleSignUp(selectedRole, googleFirstName.trim(), googleLastName.trim());
      if (!error) {
        setShowRoleDialog(false);
        // Navigation will be handled by useEffect when profile loads
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-3 md:p-4">
      {/* Back Button */}
      <Button 
        onClick={() => navigate("/")}
        variant="ghost"
        className="fixed top-2 left-2 md:top-4 md:left-4 z-50 text-white hover:bg-white/10 h-8 md:h-10"
      >
        <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
        <span className="text-xs md:text-sm">Back to Home</span>
      </Button>

      <Card className="w-full max-w-md shadow-2xl border-gray-700 bg-gray-800/90 backdrop-blur-md">
        <CardHeader className="text-center space-y-3 md:space-y-4 p-4 md:p-6">
          <button 
            onClick={() => navigate("/")}
            className="flex items-center justify-center space-x-2 md:space-x-3 hover:opacity-80 transition-opacity mx-auto"
          >
            <img 
              src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png" 
              alt="Classpace Logo" 
              className="w-6 h-6 md:w-8 md:h-8"
            />
            <span className="text-lg md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Classpace
            </span>
          </button>
          <CardTitle className="text-xl md:text-2xl text-white font-bold">
            {isSignUp ? "Create your account" : "Sign in to continue"}
          </CardTitle>
          <CardDescription className="text-gray-300 text-sm md:text-base">
            {isSignUp ? "Join thousands of educators and learners" : "Welcome back to your learning journey"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6">
          {/* Role Selection - Only show for sign up */}
          {isSignUp && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-200">I am a:</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={role === "teacher" ? "default" : "outline"}
                  onClick={() => setRole("teacher")}
                  className={`flex items-center space-x-2 h-12 transition-all ${
                    role === "teacher" 
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 border-transparent" 
                      : "border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500"
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Teacher</span>
                </Button>
                <Button
                  type="button"
                  variant={role === "learner" ? "default" : "outline"}
                  onClick={() => setRole("learner")}
                  className={`flex items-center space-x-2 h-12 transition-all ${
                    role === "learner" 
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 border-transparent" 
                      : "border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Learner</span>
                </Button>
              </div>
            </div>
          )}

          {isSignUp && <Separator className="bg-gray-600" />}

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleAuth}
            disabled={isSubmitting}
            className="w-full border-gray-600 bg-white hover:bg-gray-100 text-gray-900 font-semibold"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-800 px-2 text-gray-400">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name fields for sign up */}
            {isSignUp && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-200">
                    First Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-200">
                    Last Name <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-200">
                Email <span className="text-red-400">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-200">
                Password <span className="text-red-400">*</span>
                {isSignUp && <span className="text-xs text-gray-400 ml-2">(min. 6 characters)</span>}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white disabled:opacity-50"
            >
              {isSubmitting 
                ? (isSignUp ? "Creating Account..." : "Signing In...") 
                : (isSignUp ? "Create Account" : "Sign In")
              }
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-purple-400 hover:text-purple-300 underline"
            >
              {isSignUp 
                ? "Already have an account? Sign in" 
                : "Don't have an account? Sign up"
              }
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Role Selection Dialog for Google OAuth - Now with mandatory name fields */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">Welcome to Classpace!</DialogTitle>
            <DialogDescription className="text-gray-300">
              Complete your profile to get started
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            {/* Name fields - mandatory */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="googleFirstName" className="text-gray-200">
                  First Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="googleFirstName"
                  type="text"
                  placeholder="John"
                  value={googleFirstName}
                  onChange={(e) => setGoogleFirstName(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="googleLastName" className="text-gray-200">
                  Last Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="googleLastName"
                  type="text"
                  placeholder="Doe"
                  value={googleLastName}
                  onChange={(e) => setGoogleLastName(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>

            <Separator className="bg-gray-600" />

            {/* Role selection */}
            <div className="space-y-2">
              <Label className="text-gray-200">I am a:</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={selectedRole === "teacher" ? "default" : "outline"}
                  onClick={() => setSelectedRole("teacher")}
                  className={`flex items-center space-x-2 h-14 transition-all ${
                    selectedRole === "teacher" 
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 border-transparent" 
                      : "border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500"
                  }`}
                >
                  <BookOpen className="w-5 h-5" />
                  <span>Teacher</span>
                </Button>
                <Button
                  type="button"
                  variant={selectedRole === "learner" ? "default" : "outline"}
                  onClick={() => setSelectedRole("learner")}
                  className={`flex items-center space-x-2 h-14 transition-all ${
                    selectedRole === "learner" 
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 border-transparent" 
                      : "border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500"
                  }`}
                >
                  <Users className="w-5 h-5" />
                  <span>Learner</span>
                </Button>
              </div>
            </div>

            <Button 
              onClick={handleRoleSelection}
              disabled={isSubmitting || !googleFirstName.trim() || !googleLastName.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white disabled:opacity-50"
            >
              {isSubmitting ? "Setting up..." : "Continue"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
