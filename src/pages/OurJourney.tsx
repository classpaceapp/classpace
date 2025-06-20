
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Lightbulb, Users, Rocket, Heart } from "lucide-react";

const OurJourney = () => {
  const navigate = useNavigate();

  const milestones = [
    {
      year: "2024",
      title: "The Spark",
      description: "Founded by educators who saw the potential of AI to transform learning relationships",
      icon: Lightbulb,
      color: "from-yellow-400 to-orange-500"
    },
    {
      year: "Early 2024",
      title: "First Prototype",
      description: "Built the first AI Pod with basic conversation memory and summarization",
      icon: Rocket,
      color: "from-blue-400 to-purple-500"
    },
    {
      year: "Mid 2024",
      title: "Beta Testing",
      description: "50+ educators tested Classpace with over 200 students across diverse subjects",
      icon: Users,
      color: "from-green-400 to-blue-500"
    },
    {
      year: "2025",
      title: "Public Launch",
      description: "Officially launching to empower educators and learners worldwide",
      icon: Heart,
      color: "from-pink-400 to-purple-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png" 
              alt="Classpace Logo" 
              className="w-10 h-10"
            />
            <span className="text-2xl font-bold bg-gradient-main bg-clip-text text-transparent">
              Classpace
            </span>
          </div>
          <Button 
            onClick={() => navigate("/")}
            variant="outline"
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="w-24 h-24 bg-gradient-main rounded-full flex items-center justify-center mx-auto mb-8">
            <Heart className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-main bg-clip-text text-transparent mb-6">
            Our Journey
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Born from a simple belief: that technology should strengthen, not replace, 
            the human connections at the heart of great teaching and learning.
          </p>
        </div>

        {/* Story Section */}
        <div className="bg-white rounded-3xl shadow-2xl p-12 mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Why We Built Classpace</h2>
          <div className="prose prose-lg text-gray-700 leading-relaxed space-y-6">
            <p>
              As educators ourselves, we witnessed firsthand how AI tools were either too generic 
              or too complex for real classroom use. Teachers were spending more time managing 
              technology than connecting with their students.
            </p>
            <p>
              We envisioned something different: AI that remembers every conversation, 
              understands the unique journey of each learner, and amplifies the teacher's 
              wisdom rather than replacing it.
            </p>
            <p>
              Classpace was born from late-night conversations between a former high school 
              teacher, a university professor, and a learning scientist who all shared the 
              same frustration: why wasn't AI helping create deeper learning relationships?
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Our <span className="bg-gradient-main bg-clip-text text-transparent">Timeline</span>
          </h2>
          
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-main"></div>
            
            <div className="space-y-12">
              {milestones.map((milestone, index) => {
                const IconComponent = milestone.icon;
                return (
                  <div key={index} className="relative flex items-start">
                    <div className={`w-16 h-16 bg-gradient-to-r ${milestone.color} rounded-full flex items-center justify-center relative z-10 shadow-lg`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <div className="ml-8 flex-1">
                      <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
                        <CardContent className="p-8">
                          <div className="flex items-center mb-3">
                            <span className="text-sm font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                              {milestone.year}
                            </span>
                          </div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-3">{milestone.title}</h3>
                          <p className="text-gray-700 leading-relaxed">{milestone.description}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Vision Section */}
        <div className="bg-gradient-main rounded-3xl p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-6">Our Vision</h2>
          <p className="text-xl leading-relaxed mb-8 opacity-90">
            We're building toward a future where every learning interaction is personalized, 
            every insight is preserved, and every teacher can focus on what they do best: 
            inspiring minds and changing lives.
          </p>
          <Button 
            size="lg"
            onClick={() => navigate("/login")}
            className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
          >
            Join Our Journey
          </Button>
        </div>

        {/* Team Values */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Human-Centered</h3>
            <p className="text-gray-600 leading-relaxed">
              Technology should enhance human connections, not replace them.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Innovation</h3>
            <p className="text-gray-600 leading-relaxed">
              We push boundaries while keeping simplicity and usability at our core.
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">Purpose</h3>
            <p className="text-gray-600 leading-relaxed">
              Every feature we build serves the greater goal of better education.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OurJourney;
