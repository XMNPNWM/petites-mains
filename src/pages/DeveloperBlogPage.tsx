
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, User } from 'lucide-react';

const DeveloperBlogPage = () => {
  const navigate = useNavigate();

  // Real blog post for the launch
  const blogPosts = [
    {
      id: 1,
      title: "Launching Petites Mains - A New Chapter for Writers",
      date: "2025-01-20",
      content: "Today marks a proud moment with the launch of Petites Mains. Our aim has always been to provide writers with a tool that amplifies their creativity and simplifies the path from concept to completion.\n\nWe acknowledge that initial releases may present minor points for optimization, which our team is diligently working to refine. These swift improvements are part of our ongoing commitment to your experience.\n\nWe invite you to engage with Petites Mains and discover firsthand how it can support and transform your writing endeavors.",
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
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {post.content}
                </div>
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
