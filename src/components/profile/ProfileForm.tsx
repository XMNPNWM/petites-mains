
import React from 'react';
import { Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

interface ProfileFormProps {
  fullName: string;
  bio: string;
  loading: boolean;
  onFullNameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  fullName,
  bio,
  loading,
  onFullNameChange,
  onBioChange,
  onSubmit
}) => {
  const { user } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Edit3 className="w-5 h-5 mr-2" />
          Edit Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => onFullNameChange(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-slate-50"
            />
            <p className="text-xs text-slate-500">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => onBioChange(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>

          <Button
            type="submit"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProfileForm;
