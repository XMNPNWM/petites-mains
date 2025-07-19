
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield } from 'lucide-react';

const PrivacyPolicyPage = () => {
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
          <div className="flex items-center justify-center mb-6">
            <Shield className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold">
              Privacy Policy
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Your privacy and creative work are important to us. Here's how we protect them.
          </p>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Effective Date: January 1, 2024</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-4">1. Information We Collect</h2>
                <div className="space-y-4 text-muted-foreground">
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Account Information</h3>
                    <p>When you create an account, we collect your email address, name, and password (encrypted).</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Creative Content</h3>
                    <p>Your stories, characters, world-building elements, and other creative content are stored securely in our database.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Usage Data</h3>
                    <p>We collect information about how you use our service to improve the user experience, including features used and time spent writing.</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">2. How We Use Your Information</h2>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Provide and maintain our writing platform</li>
                  <li>• Process your requests and provide customer support</li>
                  <li>• Improve our AI suggestions and platform features</li>
                  <li>• Send important updates about our service</li>
                  <li>• Ensure platform security and prevent abuse</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">3. Data Protection & Your Creative Work</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p className="font-medium text-foreground">Your Stories Belong to You</p>
                  <p>All creative content you create using Petites Mains remains your intellectual property. We do not claim ownership of your stories, characters, or other creative work.</p>
                  
                  <p className="font-medium text-foreground">We Will Never Sell Your Data</p>
                  <p>Your personal information and creative content will never be sold to third parties. Your privacy is not a product.</p>
                  
                  <p className="font-medium text-foreground">Secure Storage</p>
                  <p>Your data is encrypted and stored securely using industry-standard practices. We regularly backup your work to prevent data loss.</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">4. AI Processing</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>When you use our AI features:</p>
                  <ul className="space-y-2">
                    <li>• Your content may be processed by third-party AI services to provide suggestions</li>
                    <li>• We cannot guarantee that AI providers will not store your content temporarily during processing</li>
                    <li>• You can choose not to use AI features, but there is no separate opt-out setting</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">5. Data Sharing</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>We only share your information in these limited circumstances:</p>
                  <ul className="space-y-2">
                    <li>• With your explicit consent</li>
                    <li>• To comply with legal obligations</li>
                    <li>• To protect our rights or the safety of our users</li>
                    <li>• With service providers who help us operate the platform (under strict confidentiality agreements)</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">6. Your Rights</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>You have the right to:</p>
                  <ul className="space-y-2">
                    <li>• Access and export all your data</li>
                    <li>• Correct inaccurate information</li>
                    <li>• Delete your account and all associated data</li>
                    <li>• Opt out of certain data processing</li>
                    <li>• File a complaint with relevant authorities</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">7. Contact Us</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>If you have questions about this Privacy Policy or want to exercise your rights, please <Link to="/contact" className="text-primary hover:underline">contact us</Link>.</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">8. Changes to This Policy</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>We may update this Privacy Policy from time to time. We'll notify you of significant changes via email or through our platform.</p>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
