
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, HelpCircle, MessageCircle, Mail, Book } from 'lucide-react';

const HelpCenterPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center mb-8">
          <Button variant="ghost" onClick={() => navigate('/')} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Help Center
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Find answers to common questions and get the support you need
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <HelpCircle className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Quick answers to common questions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                  View FAQ Section
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Book className="h-8 w-8 text-primary mb-2" />
                <CardTitle>User Guide</CardTitle>
                <CardDescription>Complete guide to using Petites Mains</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => navigate('/user-guide')}>
                  Read User Guide
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Common Issues & Solutions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">My work isn't saving</h4>
                  <p className="text-muted-foreground mb-2">Your work is automatically saved every few seconds. If you're experiencing issues:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Check your internet connection</li>
                    <li>Refresh the page and check if your latest changes are there</li>
                    <li>Try logging out and back in</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">AI suggestions aren't working</h4>
                  <p className="text-muted-foreground mb-2">If AI features aren't responding:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Check if you have remaining AI credits (Free: 5/month, Pro: unlimited)</li>
                    <li>Ensure you're connected to the internet</li>
                    <li>Try refreshing the page</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Export isn't working</h4>
                  <p className="text-muted-foreground mb-2">If you can't export your manuscript:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1">
                    <li>Make sure your project has content to export</li>
                    <li>Try a different format (PDF, DOCX, EPUB)</li>
                    <li>Check your browser's download settings</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Need More Help?</CardTitle>
                <CardDescription>We're here to support your creative journey</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Button variant="outline" className="flex items-center justify-center" onClick={() => navigate('/contact')}>
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                  <Button variant="outline" className="flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Join Community
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterPage;
