
import React from 'react';
import { User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface Profile {
  id: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
}

interface ProfileSidebarProps {
  profile: Profile | null;
  avatarUrl: string | null;
  onChangeAvatar: () => void;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ 
  profile, 
  avatarUrl, 
  onChangeAvatar 
}) => {
  return (
    <div className="lg:col-span-1">
      <Card>
        <CardHeader className="text-center">
          <div className="relative mx-auto">
            <Avatar className="w-20 h-20 mx-auto">
              <AvatarImage src={avatarUrl || undefined} alt="Profile picture" />
              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                <User className="w-10 h-10" />
              </AvatarFallback>
            </Avatar>
            <Button
              variant="outline"
              size="sm"
              onClick={onChangeAvatar}
              className="mt-2"
            >
              Change Avatar
            </Button>
          </div>
          <CardTitle>{profile?.full_name || 'Anonymous User'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 text-center">
            {profile?.bio || 'No bio provided'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSidebar;
