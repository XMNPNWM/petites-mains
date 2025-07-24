
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Edit3, Settings, Upload, Users, Brain, Map, MousePointer, MessageSquare, FileText, BarChart3 } from 'lucide-react';

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
                <CardTitle>Creative Space</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <Map className="h-4 w-4 mr-2" />
                  Storyline Mindmap
                </h4>
                <p className="text-muted-foreground">Right-click to create nodes, connect story elements, and visualize your narrative flow with an interactive mindmap interface.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Chapter Editor
                </h4>
                <p className="text-muted-foreground">Distraction-free writing environment with AI assistance, where you can focus on your creativity chapter by chapter.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <MousePointer className="h-4 w-4 mr-2" />
                  Right-click Interactions
                </h4>
                <p className="text-muted-foreground">AI chat popups for instant help and comment popups for notes and feedback - all accessible with simple right-click interactions.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Real-time Organization</h4>
                <p className="text-muted-foreground">Character and world-building panels work alongside your writing space for seamless organization.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Brain className="h-6 w-6 text-primary" />
                <CardTitle>AI Brain Analysis</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Data Extraction (User-Triggered)
                </h4>
                <p className="text-muted-foreground">When you trigger the analysis, AI extracts characters, relationships, themes, and plot elements from your writing to build a comprehensive understanding.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Knowledge Management</h4>
                <p className="text-muted-foreground">Review and adjust AI-gathered data for accuracy. Edit character details, relationships, and story elements to ensure AI has the best understanding of your work.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Story Understanding</h4>
                <p className="text-muted-foreground">AI builds comprehensive understanding of your narrative, enabling context-aware recommendations based on deep story analysis.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Intelligent Suggestions</h4>
                <p className="text-muted-foreground">Context-aware recommendations that enhance your unique voice without overwhelming your creative process.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Settings className="h-6 w-6 text-primary" />
                <CardTitle>Refinement Space</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Enhancement Process</h4>
                <p className="text-muted-foreground">AI-powered text improvement with multiple intensity levels to refine your writing while preserving your unique style.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Version History</h4>
                <p className="text-muted-foreground">Track all changes and revert to previous versions. Complete history of your writing evolution with easy restoration options.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Change Tracking</h4>
                <p className="text-muted-foreground">Granular view of all modifications with accept/reject options for each suggested change, giving you complete control.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Precision Editing</h4>
                <p className="text-muted-foreground">Fine-tune AI suggestions to match your style perfectly with detailed editing controls and customizable parameters.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-3">
                <Upload className="h-6 w-6 text-primary" />
                <CardTitle>Export Space</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Professional Formatting</h4>
                <p className="text-muted-foreground">Export your manuscript in PDF, DOCX, or EPUB formats with professional layouts ready for submission or self-publishing.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Layout Customization</h4>
                <p className="text-muted-foreground">Control margins, fonts, spacing, chapter breaks, and formatting details to meet specific publishing requirements.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Final Edition Details</h4>
                <p className="text-muted-foreground">Add metadata, configure table of contents, and apply final formatting touches for publishing-ready output.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Quality Assurance</h4>
                <p className="text-muted-foreground">Pre-export validation and formatting checks ensure your manuscript meets professional publishing standards.</p>
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
                <h4 className="font-semibold mb-2">Run AI Analysis Regularly</h4>
                <p className="text-muted-foreground">Perform periodic AI brain analysis to maintain story consistency and discover plot opportunities across your chapters.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Be Careful When Deleting Chats</h4>
                <p className="text-muted-foreground">Chat conversations contain valuable feedback and ideas. Review and export important discussions before deleting them permanently.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Version Control Your Writing</h4>
                <p className="text-muted-foreground">Save different versions before major revisions. The app tracks changes automatically, but manual versioning helps with major rewrites.</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Use AI Suggestions Selectively</h4>
                <p className="text-muted-foreground">AI assistance is powerful but shouldn't replace your creative voice. Use suggestions as inspiration while maintaining your unique writing style.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserGuidePage;
