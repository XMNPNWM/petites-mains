
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText } from 'lucide-react';

const TermsOfServicePage = () => {
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
            <FileText className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-4xl md:text-5xl font-bold">
              Terms of Service
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            The terms and conditions for using Petites Mains
          </p>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Effective Date: January 1, 2024</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing and using Petites Mains, you accept and agree to be bound by the terms and provision of this agreement.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">2. Use License</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>Permission is granted to temporarily use Petites Mains for personal, non-commercial creative writing purposes. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
                  <ul className="space-y-2 ml-4">
                    <li>• Modify or copy the materials</li>
                    <li>• Use the materials for any commercial purpose or for any public display</li>
                    <li>• Attempt to reverse engineer any software contained on the website</li>
                    <li>• Remove any copyright or other proprietary notations from the materials</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">3. Your Creative Content</h2>
                <div className="space-y-4 text-muted-foreground">
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Ownership</h3>
                    <p>You retain full ownership and intellectual property rights to all creative content you create using Petites Mains.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-2">License to Operate</h3>
                    <p>You grant us a limited license to store, process, and display your content solely for the purpose of providing our services to you.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Responsibility</h3>
                    <p>You are responsible for your content and must ensure it doesn't violate any laws or third-party rights.</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">4. Account Responsibilities</h2>
                <div className="space-y-4 text-muted-foreground">
                  <ul className="space-y-2">
                    <li>• You are responsible for maintaining the confidentiality of your account</li>
                    <li>• You must provide accurate and complete information when creating your account</li>
                    <li>• You are responsible for all activities under your account</li>
                    <li>• You must notify us immediately of any unauthorized use of your account</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">5. Prohibited Uses</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>You may not use our service:</p>
                  <ul className="space-y-2">
                    <li>• For any unlawful purpose or to solicit others to perform unlawful acts</li>
                    <li>• To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                    <li>• To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                    <li>• To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                    <li>• To submit false or misleading information</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">6. Service Availability</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>We strive to provide continuous service, but we do not guarantee that our service will be available at all times. We reserve the right to:</p>
                  <ul className="space-y-2">
                    <li>• Modify or discontinue the service with reasonable notice</li>
                    <li>• Perform maintenance that may temporarily interrupt service</li>
                    <li>• Suspend access for violations of these terms</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">7. Payment Terms</h2>
                <div className="space-y-4 text-muted-foreground">
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Free Tier</h3>
                    <p>Our free tier provides basic functionality with limitations on AI usage.</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Paid Subscriptions</h3>
                    <p>Paid subscriptions are billed monthly or annually. You may cancel at any time, but no refunds are provided for partial periods.</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">8. Limitation of Liability</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>Petites Mains shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">9. Governing Law</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>These terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Petites Mains operates.</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-4">10. Contact Information</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>If you have any questions about these Terms of Service, please contact us at:</p>
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

export default TermsOfServicePage;
