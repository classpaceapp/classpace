import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Users, ArrowLeft, Check, ChevronLeft, KeyRound, Mail, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";

type AuthView = 'login' | 'signup' | 'forgot_email' | 'forgot_otp' | 'forgot_success';

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithGoogle, completeGoogleSignUp, user, profile, loading } = useAuth();

  // Auth Form State
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"teacher" | "learner">("teacher");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password State
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Google OAuth State
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"teacher" | "learner">("teacher");
  const [googleFirstName, setGoogleFirstName] = useState("");
  const [googleLastName, setGoogleLastName] = useState("");

  // Timer for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Handle Google Auth Logic
  useEffect(() => {
    if (user && !loading) {
      const isProfileComplete = profile && profile.first_name && profile.first_name.trim() !== '';

      if (isProfileComplete) {
        const dashboardPath = profile.role === 'learner' ? '/student-dashboard' : '/dashboard';
        navigate(dashboardPath);
      } else {
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

  // Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      if (!error) {
        // Navigation will be handled by useEffect when profile loads
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      toast.error("First name is required");
      return;
    }
    if (!lastName.trim()) {
      toast.error("Last name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await signUp(email, password, role, firstName.trim(), lastName.trim());
      if (!error) {
        // Clear form
        setEmail(""); setPassword(""); setFirstName(""); setLastName("");
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

  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();

    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("send-reset-otp", {
        body: { email: normalizedEmail },
      });
      if (error) throw error;

      toast.success("Verification code sent!");
      // Update state to lowercase to ensure consistency for next step
      setEmail(normalizedEmail);
      setView('forgot_otp');
      setResendTimer(60);
    } catch (error: any) {
      toast.error(error.message || "Failed to send code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error("Password too short");

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase();

    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("verify-reset-password", {
        body: { email: normalizedEmail, otp: resetOtp, newPassword },
      });
      if (error) throw error;

      setView('forgot_success');
      toast.success("Password updated!");
    } catch (error: any) {
      toast.error(error.message || "Reset failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleSelection = async () => {
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
      if (!error) setShowRoleDialog(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Views
  const renderLoginView = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleAuth}
        disabled={isSubmitting}
        className="w-full border-gray-600 bg-white hover:bg-gray-100 text-gray-900 font-semibold transition-transform hover:scale-[1.02]"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-600" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-gray-800 px-2 text-gray-400">Or with email</span>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-200">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password" className="text-gray-200">Password</Label>
            <button
              type="button"
              onClick={() => setView('forgot_email')}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              Forgot Password?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-9 bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500"
              required
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium shadow-lg shadow-purple-900/20"
        >
          {isSubmitting ? "Signing In..." : "Sign In"}
        </Button>
      </form>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => setView('signup')}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          New here? <span className="text-purple-400 font-medium">Create an account</span>
        </button>
      </div>
    </div>
  );

  const renderSignupView = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-3 pb-2">
        <Label className="text-sm font-medium text-gray-200">I am a:</Label>
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant={role === "teacher" ? "default" : "outline"}
            onClick={() => setRole("teacher")}
            className={`h-10 transition-all ${role === "teacher"
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent"
              : "border-gray-600 text-gray-300 hover:bg-gray-700"
              }`}
          >
            <BookOpen className="w-4 h-4 mr-2" /> Teacher
          </Button>
          <Button
            type="button"
            variant={role === "learner" ? "default" : "outline"}
            onClick={() => setRole("learner")}
            className={`h-10 transition-all ${role === "learner"
              ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent"
              : "border-gray-600 text-gray-300 hover:bg-gray-700"
              }`}
          >
            <Users className="w-4 h-4 mr-2" /> Learner
          </Button>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleAuth}
        disabled={isSubmitting}
        className="w-full border-gray-600 bg-white hover:bg-gray-100 text-gray-900 font-semibold"
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-600" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-gray-800 px-2 text-gray-400">Or sign up with email</span>
        </div>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-200">First Name</Label>
            <Input
              value={firstName} onChange={(e) => setFirstName(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white" required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-200">Last Name</Label>
            <Input
              value={lastName} onChange={(e) => setLastName(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white" required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-200">Email</Label>
          <Input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white" required
          />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-200">Password</Label>
          <Input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white" required minLength={6}
          />
        </div>

        <Button
          type="submit" disabled={isSubmitting}
          className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium"
        >
          {isSubmitting ? "Creating..." : "Create Account"}
        </Button>
      </form>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={() => setView('login')}
          className="text-sm text-purple-400 hover:text-purple-300"
        >
          Already have an account? Sign in
        </button>
      </div>
    </div>
  );

  const renderForgotEmailView = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto">
          <KeyRound className="w-6 h-6 text-purple-400" />
        </div>
        <p className="text-gray-300 text-sm">
          Enter your email address and we'll send you a verification code to reset your password.
        </p>
      </div>

      <form onSubmit={handleSendResetOtp} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-gray-200">Email Address</Label>
          <Input
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white h-11"
            required
          />
        </div>
        <Button
          type="submit" disabled={isSubmitting}
          className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-medium"
        >
          {isSubmitting ? "Sending..." : "Send Reset Code"}
        </Button>
      </form>

      <Button
        variant="ghost"
        onClick={() => setView('login')}
        className="w-full text-gray-400 hover:text-white"
      >
        <ChevronLeft className="w-4 h-4 mr-2" /> Back to Login
      </Button>
    </div>
  );

  const renderForgotOtpView = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center space-y-2">
        <p className="text-gray-300 text-sm">
          We sent a code to <span className="text-white font-medium">{email}</span>.
          Enter it below to set a new password.
        </p>
      </div>

      <form onSubmit={handleVerifyReset} className="space-y-4">
        <div className="space-y-2">
          <Label className="text-gray-200">Verification Code</Label>
          <Input
            type="text"
            placeholder="123456"
            value={resetOtp}
            onChange={(e) => setResetOtp(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white text-center text-2xl tracking-[0.5em] h-14 uppercase"
            maxLength={6}
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-200">New Password</Label>
          <Input
            type="password"
            placeholder="Min. 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white h-11"
            minLength={6}
            required
          />
        </div>

        <Button
          type="submit" disabled={isSubmitting}
          className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-white font-medium"
        >
          {isSubmitting ? "Updating..." : "Reset Password"}
        </Button>

        <div className="text-center">
          <button
            type="button"
            onClick={handleSendResetOtp}
            disabled={resendTimer > 0 || isSubmitting}
            className="text-sm text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors"
          >
            {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend code"}
          </button>
        </div>
      </form>

      <Button
        variant="ghost"
        onClick={() => { setView('login'); setResetOtp(""); setNewPassword(""); }}
        className="w-full text-gray-400 hover:text-white"
      >
        Cancel
      </Button>
    </div>
  );

  const renderSuccessView = () => (
    <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-300 py-4">
      <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
        <Check className="w-8 h-8 text-green-500" />
      </div>
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-white">Password Reset!</h3>
        <p className="text-gray-400">
          Your password has been updated successfully. You can now log in with your new credentials.
        </p>
      </div>
      <Button
        onClick={() => { setView('login'); setEmail(""); setPassword(""); }}
        className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-medium"
      >
        Back to Login
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white animate-pulse">Loading Classpace...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-3 md:p-4 perspective-1000">
      <SEO
        title={view === 'login' ? "Sign In" : view === 'signup' ? "Create Account" : "Reset Password"}
        description="Access your Classpace account."
        canonical="/login"
      />

      {/* Back Button */}
      <Button
        onClick={() => navigate("/")}
        variant="ghost"
        className="fixed top-2 left-2 md:top-4 md:left-4 z-50 text-white hover:bg-white/10 h-8 md:h-10"
      >
        <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
        <span className="text-xs md:text-sm">Back to Home</span>
      </Button>

      <Card className="w-full max-w-md shadow-2xl border-gray-700 bg-gray-800/90 backdrop-blur-md overflow-hidden relative transition-all duration-300">
        <CardHeader className="text-center space-y-3 p-6 pb-2">
          <div className="flex justify-center mb-2">
            <img
              src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png"
              alt="Classpace Logo"
              className="w-10 h-10"
            />
          </div>
          <CardTitle className="text-2xl text-white font-bold">
            {view === 'login' && "Welcome Back"}
            {view === 'signup' && "Create Account"}
            {(view === 'forgot_email' || view === 'forgot_otp') && "Reset Password"}
            {view === 'forgot_success' && "Success"}
          </CardTitle>
          {view !== 'forgot_success' && (
            <CardDescription className="text-gray-400">
              {view === 'login' && "Sign in to continue to your dashboard"}
              {view === 'signup' && "Join the future of education today"}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="p-6 pt-4">
          {view === 'login' && renderLoginView()}
          {view === 'signup' && renderSignupView()}
          {view === 'forgot_email' && renderForgotEmailView()}
          {view === 'forgot_otp' && renderForgotOtpView()}
          {view === 'forgot_success' && renderSuccessView()}
        </CardContent>
      </Card>

      {/* Role Selection Dialog for Google OAuth */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">Complete Profile</DialogTitle>
            <DialogDescription className="text-gray-300">
              Finish setting up your account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-200">First Name</Label>
                <Input
                  value={googleFirstName}
                  onChange={(e) => setGoogleFirstName(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-200">Last Name</Label>
                <Input
                  value={googleLastName}
                  onChange={(e) => setGoogleLastName(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            <Separator className="bg-gray-600" />
            <div className="space-y-2">
              <Label className="text-gray-200">I am a:</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={selectedRole === "teacher" ? "default" : "outline"}
                  onClick={() => setSelectedRole("teacher")}
                  className={`h-12 ${selectedRole === "teacher" ? "bg-purple-600 hover:bg-purple-700 border-transparent text-white" : "border-gray-600 text-gray-300"}`}
                >
                  <BookOpen className="w-5 h-5 mr-2" /> Teacher
                </Button>
                <Button
                  variant={selectedRole === "learner" ? "default" : "outline"}
                  onClick={() => setSelectedRole("learner")}
                  className={`h-12 ${selectedRole === "learner" ? "bg-purple-600 hover:bg-purple-700 border-transparent text-white" : "border-gray-600 text-gray-300"}`}
                >
                  <Users className="w-5 h-5 mr-2" /> Learner
                </Button>
              </div>
            </div>
            <Button
              onClick={handleRoleSelection}
              disabled={isSubmitting || !googleFirstName.trim() || !googleLastName.trim()}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isSubmitting ? "Saving..." : "Continue"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
