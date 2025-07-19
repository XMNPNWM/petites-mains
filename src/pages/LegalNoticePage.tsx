
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Scale } from 'lucide-react';

const LegalNoticePage = () => {
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
            <Scale className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold">
              Legal Notice
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Legal information and disclaimers for Petites Mains
          </p>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Legal Disclaimers and Information</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-4">Company Information</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p><strong className="text-foreground">Service Name:</strong> Petites Mains</p>
                  <p><strong className="text-foreground">Type:</strong> Creative Writing Platform</p>
                  <p><strong className="text-foreground">Contact:</strong> legal@petitesmains.com</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Intellectual Property</h2>
                <div className="space-y-4 text-muted-foreground">
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Platform Rights</h3>
                    <p>The Petites Mains platform, including its design, features, and underlying technology, is protected by copyright and other intellectual property laws.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-2">User Content Rights</h3>
                    <p>Users retain full ownership and copyright of all creative content they produce using our platform. We do not claim any rights to user-generated stories, characters, or other creative works.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Third-Party Content</h3>
                    <p>Some features may utilize third-party services (such as AI providers). Users are responsible for ensuring their content complies with all applicable terms and policies.</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Disclaimers</h2>
                <div className="space-y-4 text-muted-foreground">
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Service Availability</h3>
                    <p>While we strive for 99.9% uptime, we cannot guarantee continuous, uninterrupted access to our services. Maintenance, updates, and unforeseen technical issues may occasionally affect service availability.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-2">AI Suggestions</h3>
                    <p>Our AI features provide suggestions and assistance, but are not infallible. Users should review and verify all AI-generated content before use. We are not responsible for the accuracy or appropriateness of AI suggestions.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Data Security</h3>
                    <p>While we implement industry-standard security measures, no online service can guarantee 100% security. Users are encouraged to maintain their own backups of important work.</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Limitation of Liability</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>To the maximum extent permitted by law, Petites Mains and its operators shall not be liable for:</p>
                  <ul className="space-y-2">
                    <li>• Loss of data or content due to technical failures</li>
                    <li>• Indirect, incidental, or consequential damages</li>
                    <li>• Business interruption or loss of profits</li>
                    <li>• Any damages arising from user-generated content</li>
                    <li>• Issues related to third-party integrations or services</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">User Responsibilities</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>Users are responsible for:</p>
                  <ul className="space-y-2">
                    <li>• Ensuring their content does not infringe on third-party rights</li>
                    <li>• Maintaining the security of their account credentials</li>
                    <li>• Backing up important creative work</li>
                    <li>• Complying with all applicable laws and regulations</li>
                    <li>• Respecting the intellectual property rights of others</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Compliance</h2>
                <div className="space-y-4 text-muted-foreground">
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Data Protection</h3>
                    <p>We comply with applicable data protection regulations including GDPR. See our Privacy Policy for detailed information about data handling.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Accessibility</h3>
                    <p>We strive to make our platform accessible to users with disabilities and continuously work to improve accessibility features.</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Dispute Resolution</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>Any disputes arising from the use of our service should first be addressed through our support channels. We encourage good-faith resolution of any conflicts.</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Updates to Legal Notice</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>This legal notice may be updated from time to time. Significant changes will be communicated to users through our platform or via email.</p>
                  <p><strong className="text-foreground">Last Updated:</strong> January 1, 2024</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">Contact</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>For legal inquiries or concerns, please contact:</p>
                  <p className="font-medium text-foreground">legal@petitesmains.com</p>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LegalNoticePage;
