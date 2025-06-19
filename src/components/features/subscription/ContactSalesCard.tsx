
import React from 'react';
import { Button } from '@/components/ui/button';

const ContactSalesCard = () => {
  const handleContactSales = () => {
    // Create a hidden mailto link to avoid exposing email in UI
    const email = 'xmnp306@tutanota.com';
    const subject = 'Custom Plan Inquiry';
    const body = 'Hello,\n\nI am interested in discussing a custom plan for my organization.\n\nPlease let me know the best time to connect.\n\nThank you!';
    
    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  return (
    <div className="mt-16 text-center">
      <div className="bg-white rounded-lg p-8 max-w-2xl mx-auto">
        <h3 className="text-xl font-semibold mb-4">Need a custom solution?</h3>
        <p className="text-slate-600 mb-6">
          We offer custom plans for publishers, writing schools, and large organizations. 
          Contact us to discuss your specific needs.
        </p>
        <Button variant="outline" onClick={handleContactSales}>
          Contact Sales
        </Button>
      </div>
    </div>
  );
};

export default ContactSalesCard;
