
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AvatarSelector from '@/components/AvatarSelector';

interface AvatarSectionProps {
  avatarUrl: string | null;
  onAvatarChange: (avatarUrl: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

const AvatarSection: React.FC<AvatarSectionProps> = ({
  avatarUrl,
  onAvatarChange,
  onCancel,
  onSave
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Avatar</CardTitle>
      </CardHeader>
      <CardContent>
        <AvatarSelector
          currentAvatarUrl={avatarUrl}
          onAvatarChange={onAvatarChange}
        />
        <div className="flex gap-2 mt-6">
          <Button
            onClick={onCancel}
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            Save Selection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AvatarSection;
