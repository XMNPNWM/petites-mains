
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, User } from 'lucide-react';

const DeveloperBlogPage = () => {
  const navigate = useNavigate();

  // Placeholder blog posts - you can update these as needed
  const blogPosts = [
    {
      id: 1,
      title: "Welcome to Petites Mains Development Blog",
      date: "2024-01-15",
      content: "Hello everyone! I'm excited to share the journey of building Petites Mains with you. This blog will be where I post updates about new features, improvements, and the overall progress of the platform. Stay tuned for regular updates!",
      author: "S."
    },
    {
      id: 2,
      title: "Recent Platform Updates",
      date: "2024-01-10",
      content: "We've been working hard on improving the user experience. Recent updates include better subscription management, improved writing tools, and enhanced AI assistance features. More exciting features are coming soon!",
      author: "S."
    }
  ];

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
            Developer Updates
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Follow the journey of building Petites Mains - updates, progress, and insights from the creator
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {blogPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{post.author}</span>
                  </div>
                </div>
                <CardTitle className="text-2xl">{post.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {post.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Stay Updated</CardTitle>
              <CardDescription>
                Check back regularly for new updates and insights into the development of Petites Mains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Have questions or suggestions? Feel free to reach out through our contact page.
              </p>
              <Button 
                className="mt-4" 
                onClick={() => navigate('/contact')}
              >
                Contact Us
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DeveloperBlogPage;
