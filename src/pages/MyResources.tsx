import { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Library, MessageSquare, FileText, CheckSquare } from "lucide-react";
import { PersonalFlashcards } from "@/components/resources/PersonalFlashcards";
import { PersonalQuizzes } from "@/components/resources/PersonalQuizzes";
import { PersonalNotes } from "@/components/resources/PersonalNotes";

const MyResources = () => {
  return (
    <DashboardLayout userRole="learner">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-3 md:p-8">
        {/* Hero Header */}
        <div className="mb-8">
          <Card className="border-0 shadow-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Library className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold">My Resources</h1>
                  <p className="text-white/90 text-lg mt-1">
                    Your personal learning toolkit
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Different Resources */}
        <Tabs defaultValue="flashcards" className="space-y-6">
          <TabsList className="bg-white/80 backdrop-blur-xl border-2 border-border/50 p-2 shadow-lg">
            <TabsTrigger value="flashcards" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
              <Sparkles className="h-4 w-4 mr-2" />
              Flashcards
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white">
              <CheckSquare className="h-4 w-4 mr-2" />
              Quizzes
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white">
              <FileText className="h-4 w-4 mr-2" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="exam-advice" disabled className="opacity-50">
              <MessageSquare className="h-4 w-4 mr-2" />
              Exam Advice
              <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded">Coming Soon</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="flashcards">
            <PersonalFlashcards />
          </TabsContent>

          <TabsContent value="quizzes">
            <PersonalQuizzes />
          </TabsContent>

          <TabsContent value="notes">
            <PersonalNotes />
          </TabsContent>

          <TabsContent value="exam-advice">
            <Card className="border-2 border-border/50 shadow-xl bg-white/80 backdrop-blur-xl">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Exam Advice Coming Soon</h3>
                <p className="text-muted-foreground">
                  Get AI-powered guidance on exam answer structure
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default MyResources;
