
import React from 'react';
import { Button } from '@/components/ui/button';

const ContactSalesCard = () => {
  return (
    <div className="mt-16 text-center">
      <div className="bg-white rounded-lg p-8 max-w-2xl mx-auto">
        <h3 className="text-xl font-semibold mb-4">Need a custom solution?</h3>
        <p className="text-slate-600 mb-6">
          We offer custom plans for publishers, writing schools, and large organizations. 
          Contact us to discuss your specific needs.
        </p>
        <Button variant="outline" onClick={() => window.location.href = 'mailto:contact@example.com'}>
          Contact Sales
        </Button>
      </div>
    </div>
  );
};

export default ContactSalesCard;
