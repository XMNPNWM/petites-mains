
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Edit3, Settings, Upload, Users, Brain } from 'lucide-react';

const UserGuidePage = () => {
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
            User Guide
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Everything you need to know to master Petites Mains and unleash your creativity
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <BookOpen className="h-6 w-6 text-primary" />
                <CardTitle>Getting Started</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. Create Your Account</h4>
                <p className="text-muted-foreground">Sign up for free and access your personal writing workspace immediately.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. Create Your First Project</h4>
                <p className="text-muted-foreground">Start with a new project and give it a compelling title and description.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">3. Explore the Interface</h4>
                <p className="text-muted-foreground">Familiarize yourself with the dashboard, writing space, and organization tools.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Edit3 className="h-6 w-6 text-primary" />
                <CardTitle>Writing & Organization</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Character Development</h4>
                <p className="text-muted-foreground">Use our character builder to create detailed profiles, backstories, and track character arcs throughout your story.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">World Building</h4>
                <p className="text-muted-foreground">Organize locations, cultures, and world rules to maintain consistency across your narrative.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Chapter Management</h4>
                <p className="text-muted-foreground">Structure your story with chapters, track progress, and maintain narrative flow.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Brain className="h-6 w-6 text-primary" />
                <CardTitle>AI Assistance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Gentle Suggestions</h4>
                <p className="text-muted-foreground">Our AI provides subtle writing suggestions that enhance your voice without overwhelming it.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Style Enhancement</h4>
                <p className="text-muted-foreground">Get recommendations for improving clarity, flow, and engagement while maintaining your unique style.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Consistency Checking</h4>
                <p className="text-muted-foreground">AI analyzes your story for character and plot consistency across chapters.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Upload className="h-6 w-6 text-primary" />
                <CardTitle>Export & Publishing</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Professional Formats</h4>
                <p className="text-muted-foreground">Export your manuscript in PDF, DOCX, or EPUB formats ready for submission or self-publishing.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Formatting Options</h4>
                <p className="text-muted-foreground">Choose from various professional formatting templates suitable for different publishing platforms.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Settings className="h-6 w-6 text-primary" />
                <CardTitle>Tips & Best Practices</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Regular Backups</h4>
                <p className="text-muted-foreground">Your work is automatically saved, but consider regular exports as additional backup.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Organizing Your Work</h4>
                <p className="text-muted-foreground">Use tags and categories to keep your projects organized and easily searchable.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Collaborative Features</h4>
                <p className="text-muted-foreground">Share your work with trusted readers for feedback while maintaining version control.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserGuidePage;
