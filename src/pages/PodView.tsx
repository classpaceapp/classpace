
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Send, 
  Paperclip, 
  Mic, 
  Brain, 
  FileText, 
  Clock,
  Users,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PodView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("chat");

  // Mock data
  const podData = {
    name: "Advanced Mathematics",
    members: 12,
    description: "Exploring calculus and advanced mathematical concepts",
  };

  const messages = [
    {
      id: 1,
      sender: "Dr. Smith",
      role: "teacher",
      content: "Today we'll be covering integration by parts. Please review the materials I've uploaded.",
      timestamp: "10:30 AM",
      type: "message"
    },
    {
      id: 2,
      sender: "AI Assistant",
      role: "ai",
      content: "I've generated a summary of today's lesson on integration by parts. Would you like me to create practice problems?",
      timestamp: "10:35 AM",
      type: "ai"
    },
    {
      id: 3,
      sender: "Alex",
      role: "student",
      content: "Could you explain the difference between integration by parts and substitution?",
      timestamp: "10:40 AM",
      type: "message"
    }
  ];

  const materials = [
    {
      id: 1,
      name: "Integration by Parts - Lecture Notes",
      type: "PDF",
      uploadedBy: "Dr. Smith",
      uploadedAt: "2 hours ago"
    },
    {
      id: 2,
      name: "Practice Problems Set 1",
      type: "PDF", 
      uploadedBy: "Dr. Smith",
      uploadedAt: "1 hour ago"
    },
    {
      id: 3,
      name: "Lecture Recording",
      type: "Audio",
      uploadedBy: "Dr. Smith", 
      uploadedAt: "30 minutes ago"
    }
  ];

  const timeline = [
    {
      date: "Today",
      events: [
        { time: "10:30 AM", title: "Integration by Parts Lesson", type: "lesson" },
        { time: "10:35 AM", title: "AI Summary Generated", type: "ai" },
        { time: "10:40 AM", title: "Student Questions", type: "discussion" }
      ]
    },
    {
      date: "Yesterday", 
      events: [
        { time: "2:00 PM", title: "Quiz: Derivatives", type: "quiz" },
        { time: "3:30 PM", title: "Study Group Session", type: "group" }
      ]
    }
  ];

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    toast({
      title: "Message sent!",
      description: "Your message has been posted to the pod.",
    });
    
    setMessage("");
  };

  const handleAIAssistant = () => {
    toast({
      title: "AI Assistant",
      description: "AI features coming soon!",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{podData.name}</h1>
                <p className="text-sm text-gray-600 flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {podData.members} members
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleAIAssistant}
              className="bg-gradient-main hover:opacity-90 text-white"
            >
              <Brain className="w-4 h-4 mr-2" />
              AI Assistant
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/80 border border-purple-100">
            <TabsTrigger value="chat" className="data-[state=active]:bg-gradient-main data-[state=active]:text-white">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="materials" className="data-[state=active]:bg-gradient-main data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              Materials
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-gradient-main data-[state=active]:text-white">
              <Clock className="w-4 h-4 mr-2" />
              Timeline
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <Card className="border-none shadow-md">
              <CardContent className="p-0">
                <div className="h-96 overflow-y-auto p-6 space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className="flex items-start space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className={
                          msg.role === 'ai' ? "bg-gradient-main text-white" :
                          msg.role === 'teacher' ? "bg-blue-500 text-white" :
                          "bg-gray-500 text-white"
                        }>
                          {msg.role === 'ai' ? 'AI' : msg.sender[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm">{msg.sender}</span>
                          {msg.role === 'teacher' && (
                            <Badge variant="secondary" className="text-xs">Teacher</Badge>
                          )}
                          {msg.role === 'ai' && (
                            <Badge className="text-xs bg-gradient-main text-white">AI</Badge>
                          )}
                          <span className="text-xs text-gray-500">{msg.timestamp}</span>
                        </div>
                        <p className="text-gray-800 text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Separator />
                
                <div className="p-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Type your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon">
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Mic className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={handleSendMessage}
                      className="bg-gradient-main hover:opacity-90 text-white"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-4">
            <div className="grid gap-4">
              {materials.map((material) => (
                <Card key={material.id} className="border-none shadow-md hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-main rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-medium">{material.name}</h3>
                          <p className="text-sm text-gray-600">
                            {material.type} • Uploaded by {material.uploadedBy} • {material.uploadedAt}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            {timeline.map((section, index) => (
              <Card key={index} className="border-none shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">{section.date}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {section.events.map((event, eventIndex) => (
                      <div key={eventIndex} className="flex items-center space-x-4">
                        <div className="w-2 h-2 bg-gradient-main rounded-full"></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{event.title}</span>
                            <span className="text-sm text-gray-500">{event.time}</span>
                          </div>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {event.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating AI Assistant */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={handleAIAssistant}
          className="w-14 h-14 rounded-full bg-gradient-main hover:opacity-90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Brain className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

export default PodView;
