import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PenTool, BookOpen, Brain, Users, Zap, FileText, Sparkles, ArrowRight, CheckCircle, Globe, Edit3, BarChart3, Map, Settings, Upload, Lightbulb, ChevronDown } from 'lucide-react';
const LandingPage = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };
  const handleLearnMore = () => {
    document.getElementById('features')?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({
      behavior: 'smooth'
    });
  };
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
        backgroundImage: `url('/lovable-uploads/4d8525af-0ad1-416c-ad3d-4b87573fd372.png')`
      }}>
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        {/* Logo */}
        <div className="absolute top-6 left-6 z-20">
          <div className="text-white font-bold text-2xl">
            Petites Mains
          </div>
        </div>
        
        {/* Top Right Navigation Buttons */}
        <div className="absolute top-6 right-6 z-20 flex space-x-4">
          <Button variant="ghost" onClick={() => navigate('/pricing')} className="text-white border-white/20 hover:bg-white/10">
            Pricing
          </Button>
          <Button variant="ghost" onClick={() => navigate('/user-guide')} className="text-white border-white/20 hover:bg-white/10">
            User Guide
          </Button>
        </div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 text-center text-white">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Unleash Your
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Novels</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed text-gray-200">
            A specialized workspace for creative writers with smooth AI assistance. From first draft to published masterpiece.
          </p>
          <div className="flex justify-center items-center">
            <Button onClick={handleGetStarted} size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200">
              Let's Write
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Scroll Down Arrow */}
        <div className="absolute bottom-8 left-[calc(50%-40px)] -translate-x-1/2 z-20 animate-bounce">
          <button 
            onClick={scrollToFeatures}
            className="flex flex-col items-center text-white hover:text-blue-200 transition-colors duration-200"
          >
            <ChevronDown className="h-8 w-8" />
            <span className="text-sm mt-1">Scroll down</span>
          </button>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Your Creative Edge: The Petites Mains Advantage
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We understand the unique challenges you face in your creative writing journey.
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-start justify-center max-w-5xl mx-auto">
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-destructive mb-6">Common Writing Challenges:</h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-3 min-h-[3rem]">
                    <div className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-muted-foreground">Writer's block that stifles your creativity</p>
                  </div>
                  <div className="flex items-start space-x-3 min-h-[3rem]">
                    <div className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-muted-foreground">Tedious editing that consumes precious writing time</p>
                  </div>
                  <div className="flex items-start space-x-3 min-h-[3rem]">
                    <div className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-muted-foreground">Disorganized characters, plots, and world-building</p>
                  </div>
                  <div className="flex items-start space-x-3 min-h-[3rem]">
                    <div className="w-2 h-2 bg-destructive rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-muted-foreground">Complex formatting for publication</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-primary mb-6">Our Writing Workspace Solution:</h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-3 min-h-[3rem]">
                    <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                    <p className="text-foreground">Distraction-free writing environment with smooth AI assistance</p>
                  </div>
                  <div className="flex items-start space-x-3 min-h-[3rem]">
                    <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                    <p className="text-foreground">Intelligent organization for characters, plots, and world-building</p>
                  </div>
                  <div className="flex items-start space-x-3 min-h-[3rem]">
                    <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                    <p className="text-foreground">Gentle AI suggestions that enhance your unique voice</p>
                  </div>
                  <div className="flex items-start space-x-3 min-h-[3rem]">
                    <CheckCircle className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
                    <p className="text-foreground">Professional export ready for publication in one click</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Your Complete Creative Writing Workspace
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Powerful tools designed specifically for creative writers who want seamless organization and gentle AI assistance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader>
                <Edit3 className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle className="text-xl">Focused Writing Space</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  A distraction-free environment designed to unleash your creativity and organize your thoughts
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader>
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle className="text-xl">Gentle AI Assistance</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Subtle suggestions and style enhancements that support your voice without overwhelming it
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader>
                <Globe className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle className="text-xl">World & Character Builder</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Build rich, consistent worlds and complex characters with an advanced organization system
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader>
                <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
                <CardTitle className="text-xl">Publication Ready</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Export your manuscripts in professional formats ready for submission to publishers or self-publishing
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Studio Section - Full Width */}
          <div className="mt-12">
            <Card className="w-full text-center hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="text-2xl">Studio</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Pending !
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Two parallel systems working together: your creative workflow and continuous AI support
            </p>
          </div>

          <div className="max-w-7xl mx-auto space-y-16">
            {/* Main Creative Process Flow */}
            <div className="relative">
              <div className="text-center mb-8">
                <div className="inline-flex items-center bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium mb-2">
                  <Edit3 className="w-4 h-4 mr-2" />
                  Your Creative Process
                </div>
                <p className="text-muted-foreground">From initial idea to published masterpiece</p>
              </div>

              <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative">
                {/* Flow Line - Hidden on mobile, visible on lg+ */}
                <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary to-primary transform -translate-y-1/2 z-0 rounded-full opacity-20"></div>
                
                {/* Creation Space */}
                <div className="flex-1 relative z-10">
                  <Card className="text-center hover:shadow-lg transition-all duration-200 hover:-translate-y-1 bg-background border-2 border-primary/20">
                    <CardHeader>
                      <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                        <Map className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="text-xl text-primary">1. Creation Space</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
                        Start with our mindmap tool and comprehensive library to organize your ideas, characters, and world-building elements
                      </CardDescription>
                    </CardContent>
                  </Card>
                </div>

                {/* Arrow - Visible on lg+ */}
                <div className="hidden lg:block relative z-10">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg">
                    <ArrowRight className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>

                {/* Enhancement Space */}
                <div className="flex-1 relative z-10">
                  <Card className="text-center hover:shadow-lg transition-all duration-200 hover:-translate-y-1 bg-background border-2 border-primary/20">
                    <CardHeader>
                      <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                        <Settings className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="text-xl text-primary">2. Enhancement Space</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
                        Refine your work with our enhancement process and granular management tools for precision editing
                      </CardDescription>
                    </CardContent>
                  </Card>
                </div>

                {/* Arrow - Visible on lg+ */}
                <div className="hidden lg:block relative z-10">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg">
                    <ArrowRight className="h-6 w-6 text-primary-foreground" />
                  </div>
                </div>

                {/* Export Space */}
                <div className="flex-1 relative z-10">
                  <Card className="text-center hover:shadow-lg transition-all duration-200 hover:-translate-y-1 bg-background border-2 border-primary/20">
                    <CardHeader>
                      <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                        <Upload className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="text-xl text-primary">3. Export Space</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
                        Final refinement and professional formatting ready for export and publication to your chosen platform
                      </CardDescription>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Parallel Process Separator */}
            <div className="flex items-center justify-center">
              <div className="flex-1 h-px bg-border"></div>
              <div className="px-4 text-sm text-muted-foreground font-medium">PARALLEL PROCESS</div>
              <div className="flex-1 h-px bg-border"></div>
            </div>

            {/* AI Brain Analysis - Parallel Process */}
            <div className="relative">
              <div className="text-center mb-8">
                <div className="inline-flex items-center bg-secondary text-secondary-foreground px-4 py-2 rounded-full text-sm font-medium mb-2">
                  <Brain className="w-4 h-4 mr-2" />
                  Continuous AI Support
                </div>
                <p className="text-muted-foreground">Intelligent assistance throughout your entire creative journey</p>
              </div>

              <div className="max-w-4xl mx-auto">
                <Card className="text-center hover:shadow-lg transition-all duration-200 hover:-translate-y-1 bg-gradient-to-br from-background to-muted/20 border-2 border-primary/20">
                  <CardHeader>
                    <div className="w-20 h-20 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                      <Brain className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle className="text-2xl text-foreground">AI Brain Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-lg mb-6 text-foreground">
                      Our AI continuously analyzes your story, keeping detailed records of your narrative, characters, and themes. 
                      This deep understanding enables personalized advice and support that evolves with your writing, 
                      ensuring every suggestion enhances your unique creative vision.
                    </CardDescription>
                    <div className="flex justify-center items-center space-x-8 flex-wrap gap-4">
                      <div className="flex items-center space-x-2 bg-primary/10 px-3 py-2 rounded-full">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">Smart Suggestions</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-primary/10 px-3 py-2 rounded-full">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">Progress Tracking</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-primary/10 px-3 py-2 rounded-full">
                        <BookOpen className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">Story Consistency</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Personal Message from Creator */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              From My Desk to Yours
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-8">
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  There's a unique satisfaction I've always discovered in bringing stories to life through writing. After years of doing it the 'old way', I found myself looking for a smarter approach. But I quickly realized that many AI tools didn't truly help writers express their personal style and unique vision.
                </p>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  That's why I built Petites Mains. My goal was to create a tool that doesn't silence a writer's talent and inspiration, but instead helps them concretize it. I hope you'll enjoy using it as much as I do.
                </p>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  As the creator, I'm neither a professional writer nor a seasoned developer. Your insights and suggestions are greatly appreciated as we work to enhance this app for our community.
                </p>
                <div className="text-right">
                  <p className="text-xl font-semibold text-foreground">S.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Secondary CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Write Your Best Story?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join creative writers who are already transforming their craft with Petites Mains
          </p>
          <Button onClick={handleGetStarted} size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-105 transition-transform">
            Let's Write
            <Zap className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-left">Is Petites Mains free to use?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! Petites Mains offers a free tier with core writing features. Please note that due to infrastructure expenses, this tier has certain usage limits and a limited monthly allocation of AI credits. For more details about our pricing and features, visit our{' '}
                  <Link to="/pricing" className="text-primary hover:underline font-medium">
                    pricing page
                  </Link>
                  .
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-left">How is my writing data handled?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your writing is stored securely in our database. We take data privacy seriously and no data from our users will ever be sold.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-left">Will AI write my story for me?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  No, the AI is designed to assist, not replace your creativity. It offers gentle suggestions and helps with organization, but you maintain complete control over your story and voice.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-left">Can I export my manuscripts?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, you can export your work in multiple professional formats (PDF, DOCX, EPUB) ready for submission to publishers or self-publishing platforms.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Petites Mains</h3>
              <p className="text-sm text-muted-foreground">
                The creative writing workspace that grows with your imagination.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Product</h4>
              <div className="space-y-2 text-sm">
                <button onClick={scrollToFeatures} className="text-muted-foreground cursor-pointer hover:text-foreground block text-left">
                  Features
                </button>
                <Link to="/pricing" className="text-muted-foreground cursor-pointer hover:text-foreground block">
                  Pricing
                </Link>
                <Link to="/user-guide" className="text-muted-foreground cursor-pointer hover:text-foreground block">
                  User Guide
                </Link>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Support</h4>
              <div className="space-y-2 text-sm">
                <Link to="/help-center" className="text-muted-foreground cursor-pointer hover:text-foreground block">
                  Help Center
                </Link>
                <Link to="/contact" className="text-muted-foreground cursor-pointer hover:text-foreground block">
                  Contact
                </Link>
                <Link to="/developer-blog" className="text-muted-foreground cursor-pointer hover:text-foreground block">
                  Developer Updates
                </Link>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <div className="space-y-2 text-sm">
                <Link to="/privacy" className="text-muted-foreground cursor-pointer hover:text-foreground block">
                  Privacy
                </Link>
                <Link to="/terms" className="text-muted-foreground cursor-pointer hover:text-foreground block">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-muted-foreground/20 mt-8 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 Petites Mains. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>;
};
export default LandingPage;