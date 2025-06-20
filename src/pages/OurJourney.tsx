
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Lightbulb, Users, Rocket, Target, Instagram, Linkedin } from "lucide-react";

const OurJourney = () => {
  const navigate = useNavigate();

  const milestones = [
    {
      icon: Lightbulb,
      title: "The Idea",
      date: "Early 2024",
      description: "We realized that traditional learning management systems weren't designed for the AI era. Teachers needed something better.",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Users,
      title: "Building the Team",
      date: "Mid 2024",
      description: "We assembled a team of educators, engineers, and AI specialists who shared our vision for transforming education.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Rocket,
      title: "First Launch",
      date: "Late 2024",
      description: "We launched our beta with 50 teachers and 200 students. The feedback was incredible and shaped our product direction.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Target,
      title: "The Future",
      date: "2025 & Beyond",
      description: "Our mission continues: democratizing personalized education through AI-powered collaborative learning spaces.",
      color: "from-green-500 to-emerald-500"
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

      <main className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-main bg-clip-text text-transparent mb-6">
            Our Journey
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            From a simple idea to revolutionizing education. Here's how we're building the future of learning, 
            one AI Pod at a time.
          </p>
        </div>

        {/* Mission Statement */}
        <div className="bg-gradient-main rounded-3xl p-12 text-white text-center mb-20">
          <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-xl opacity-90 max-w-3xl mx-auto leading-relaxed">
            To democratize personalized education by creating AI-powered collaborative spaces where 
            every teacher can provide world-class, adaptive learning experiences.
          </p>
        </div>

        {/* Timeline */}
        <div className="space-y-12 mb-20">
          {milestones.map((milestone, index) => {
            const IconComponent = milestone.icon;
            const isEven = index % 2 === 0;
            
            return (
              <div key={index} className={`flex flex-col lg:flex-row items-center gap-8 ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                <div className="flex-1">
                  <Card className="border-none shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
                    <CardContent className="p-8">
                      <div className="flex items-center mb-6">
                        <div className={`w-16 h-16 bg-gradient-to-r ${milestone.color} rounded-2xl flex items-center justify-center mr-4 shadow-lg`}>
                          <IconComponent className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">{milestone.title}</h3>
                          <p className="text-purple-600 font-semibold">{milestone.date}</p>
                        </div>
                      </div>
                      <p className="text-gray-700 text-lg leading-relaxed">{milestone.description}</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="hidden lg:block w-4 h-4 bg-gradient-main rounded-full shadow-lg"></div>
                
                <div className="flex-1 lg:invisible">
                  {/* Spacer for layout balance */}
                </div>
              </div>
            );
          })}
        </div>

        {/* Values Section */}
        <div className="bg-white rounded-3xl shadow-2xl p-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            What Drives Us
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Teacher-First</h3>
              <p className="text-gray-600 leading-relaxed">
                Every feature we build starts with understanding real teacher needs and challenges.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Innovation</h3>
              <p className="text-gray-600 leading-relaxed">
                We push the boundaries of what's possible with AI to create magical learning experiences.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Impact</h3>
              <p className="text-gray-600 leading-relaxed">
                We measure success by the learning outcomes and joy we bring to classrooms worldwide.
              </p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Be Part of Our Story
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of educators who are already transforming their classrooms with Classpace.
          </p>
          <Button 
            size="lg"
            onClick={() => navigate("/login")}
            className="bg-gradient-main hover:opacity-90 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg"
          >
            Start Your Journey
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white mt-20">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <img 
                  src="/lovable-uploads/11e9e2ba-b257-4f0e-99d6-b342c5021347.png" 
                  alt="Classpace Logo" 
                  className="w-10 h-10"
                />
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Classpace
                </span>
              </div>
              <p className="text-gray-300 leading-relaxed mb-6">
                Empowering educators and learners with AI-powered shared workspaces. 
                Learn and teach anything, together.
              </p>
              <div className="flex space-x-4">
                <a 
                  href="https://www.instagram.com/classpace.co/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-500 transition-colors cursor-pointer"
                >
                  <Instagram className="w-5 h-5 text-white" />
                </a>
                <a 
                  href="https://www.linkedin.com/company/105928104/admin/dashboard/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-500 transition-colors cursor-pointer"
                >
                  <Linkedin className="w-5 h-5 text-white" />
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-purple-300">Product</h3>
              <ul className="space-y-4">
                <li>
                  <button 
                    onClick={() => navigate("/pricing")}
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/our-journey")}
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Our Journey
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/login")}
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Sign In
                  </button>
                </li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-purple-300">Support</h3>
              <ul className="space-y-4">
                <li>
                  <button 
                    onClick={() => navigate("/support")}
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Help Center
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/refunds")}
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Refunds
                  </button>
                </li>
                <li>
                  <a 
                    href="mailto:social@classpace.co"
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-purple-300">Legal</h3>
              <ul className="space-y-4">
                <li>
                  <button 
                    onClick={() => navigate("/terms")}
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Terms & Conditions
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/privacy")}
                    className="font-bold text-gray-300 hover:text-white transition-colors hover:translate-x-1 transform duration-200"
                  >
                    Privacy Policy
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-700 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0">
                © 2025 Classpace. All rights reserved.
              </p>
              <p className="text-gray-400 text-sm">
                Built for educators and learners everywhere.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default OurJourney;
