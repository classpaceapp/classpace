import { Card, CardContent } from "@/components/ui/card";
import { GraduationCap, BookOpen } from "lucide-react";

interface RoleSelectorProps {
  onSelectRole: (role: 'student' | 'teacher') => void;
}

export const RoleSelector = ({ onSelectRole }: RoleSelectorProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-5xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            Welcome to Classpace
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your comprehensive guide to mastering the platform. Select your role to get started.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card 
            className="cursor-pointer hover:scale-[1.02] transition-all duration-300 border border-border/60 bg-card/70 dark:bg-card/40 backdrop-blur-sm shadow-2xl hover:shadow-xl"
            onClick={() => onSelectRole('student')}
          >
            <CardContent className="p-12 text-center space-y-6">
              <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/30">
                <GraduationCap className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                I'm a Student
              </h2>
              <p className="text-muted-foreground text-lg">
                Learn how to join classes, use Phoenix AI tutor, and maximize your learning experience
              </p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:scale-[1.02] transition-all duration-300 border border-border/60 bg-card/70 dark:bg-card/40 backdrop-blur-sm shadow-2xl hover:shadow-xl"
            onClick={() => onSelectRole('teacher')}
          >
            <CardContent className="p-12 text-center space-y-6">
              <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-blue-500/30">
                <BookOpen className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                I'm a Teacher
              </h2>
              <p className="text-muted-foreground text-lg">
                Discover how to create pods, manage students, and leverage AI teaching assistant
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
