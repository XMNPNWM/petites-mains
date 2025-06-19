
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const ProfileHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-6 py-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
            <p className="text-slate-600">Manage your account information</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
