
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PenTool, BookOpen, Brain, Users, Zap, FileText, Sparkles, ArrowRight, CheckCircle, Globe, Edit3, BarChart3 } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
          backgroundImage: `url('/lovable-uploads/9cfdbadc-5ac7-468c-a9f6-0ad111619cd6.png')`
        }}>
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-6 text-center text-white">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Unleash Your
            <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Chef-d'Oeuvre</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto leading-relaxed text-gray-200">
            A specialized workspace for creative writers with smooth AI assistance. From first draft to published masterpiece.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button onClick={handleGetStarted} size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200">
              {user ? 'Go to Dashboard' : 'Start Writing for Free'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button onClick={handleLearnMore} variant="outline" size="lg" className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-gray-900 transition-all duration-200">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Problem & Solution */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Why Creative Writers Choose Petites Mains
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We understand the unique challenges you face in your creative writing journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
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
                  Export your manuscripts in professional formats ready for publishers or self-publishing
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Personal Message from Creator */}
      <section className="py-20 bg-muted/30">
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
                  I've always loved writing stories for my family and friends. It's a gift I truly enjoy offering, and I guess they always like it too! After years of doing it the 'old way', I found myself looking for a smarter approach. But I quickly realized that many AI tools didn't truly help writers express their personal style and unique vision.
                </p>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  That's why I built Petites Mains. My goal was to create a tool that doesn't silence a writer's talent and inspiration, but instead helps them concretize it. I hope you'll enjoy using it as much as I do.
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
          <Button onClick={handleGetStarted} size="lg" variant="secondary" className="text-lg px-8 py-4 hover:scale-105 transition-transform">
            {user ? 'Go to Dashboard' : 'Start Writing Now - It\'s Free'}
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
                  Yes! You can start using Petites Mains for free with all core writing features. Premium plans are available for advanced collaboration and publishing tools.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-left">How is my writing data handled?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your writing is stored securely in our database. We take data privacy seriously and follow industry best practices. No data from our users will ever be sold.
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
                <p className="text-muted-foreground cursor-pointer hover:text-foreground">Features</p>
                <p className="text-muted-foreground cursor-pointer hover:text-foreground">Pricing</p>
                <p className="text-muted-foreground cursor-pointer hover:text-foreground">User Guide</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Support</h4>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground cursor-pointer hover:text-foreground">Help Center</p>
                <p className="text-muted-foreground cursor-pointer hover:text-foreground">Contact</p>
                <p className="text-muted-foreground cursor-pointer hover:text-foreground">Community</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Legal</h4>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground cursor-pointer hover:text-foreground">Privacy</p>
                <p className="text-muted-foreground cursor-pointer hover:text-foreground">Terms of Service</p>
                <p className="text-muted-foreground cursor-pointer hover:text-foreground">Legal Notice</p>
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
    </div>
  );
};

export default LandingPage;
