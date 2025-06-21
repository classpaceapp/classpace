
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Users, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"teacher" | "learner">("teacher");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mock authentication - replace with Supabase auth
    toast({
      title: `Welcome ${isSignUp ? 'to' : 'back to'} Classpace!`,
      description: `Signing ${isSignUp ? 'up' : 'in'} as ${role}...`,
    });
    
    // Simulate auth delay
    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);
  };

  const handleGoogleAuth = () => {
    toast({
      title: "Google Sign In",
      description: "Redirecting to Google authentication...",
    });
    
    setTimeout(() => {
      navigate("/dashboard");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Back Button */}
      <Button 
        onClick={() => navigate("/")}
        variant="ghost"
        className="fixed top-4 left-4 z-50 text-white hover:bg-white/10"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Home
      </Button>

      <Card className="w-full max-w-md shadow-2xl border-gray-700 bg-gray-800/90 backdrop-blur-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <img 
              src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png" 
              alt="Classpace Logo" 
              className="w-8 h-8"
            />
            <span className="text-2xl font-bold text-white">
              Classpace
            </span>
          </div>
          <CardTitle className="text-2xl text-white">
            {isSignUp ? "Join" : "Welcome back to"} Classpace
          </CardTitle>
          <CardDescription className="text-gray-300">
            {isSignUp ? "Create your account and start collaborating" : "Sign in to continue your learning journey"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Role Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-200">I am a:</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={role === "teacher" ? "default" : "outline"}
                onClick={() => setRole("teacher")}
                className={`flex items-center space-x-2 h-12 ${
                  role === "teacher" 
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700" 
                    : "border-gray-600 text-gray-300 hover:bg-gray-700"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Teacher</span>
              </Button>
              <Button
                type="button"
                variant={role === "learner" ? "default" : "outline"}
                onClick={() => setRole("learner")}
                className={`flex items-center space-x-2 h-12 ${
                  role === "learner" 
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700" 
                    : "border-gray-600 text-gray-300 hover:bg-gray-700"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Learner</span>
              </Button>
            </div>
          </div>

          <Separator className="bg-gray-600" />

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleAuth}
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
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
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-200">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-200">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              {isSignUp ? "Create Account" : "Sign In"}
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
    </div>
  );
};

export default Login;
