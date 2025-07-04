import React, { useState } from 'react';
import { Upload, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AvatarSelectorProps {
  currentAvatarUrl?: string | null;
  onAvatarChange: (avatarUrl: string) => void;
}

// Use the uploaded avatar images
const PRESET_AVATARS = [
  '/lovable-uploads/60ed14a9-3582-40db-8f8a-20371f69c1c7.png',
  '/lovable-uploads/66babe0b-5e00-44b6-99ea-20b5468249ae.png',
  '/lovable-uploads/1feef14f-74fc-4afa-bbd0-823963038275.png',
  '/lovable-uploads/a8b1fa26-68b6-4cac-8bcd-75358539efb8.png',
  '/lovable-uploads/b0152cd2-35dc-4e50-9dcf-90178ef7d6ac.png',
  '/lovable-uploads/443afe62-dff1-4fac-a1ab-729b10cf83b2.png',
  '/lovable-uploads/64e0079d-5b27-4e53-a89e-5277e0631461.png',
  '/lovable-uploads/cf3e8cf1-5290-4a49-a0fc-5775a1af53ba.png',
  '/lovable-uploads/df3b7f6f-af9e-4443-9437-0431eb6c8914.png'
];

const AvatarSelector: React.FC<AvatarSelectorProps> = ({ currentAvatarUrl, onAvatarChange }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatarUrl);

  const handlePresetSelect = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
    onAvatarChange(avatarUrl);
  };

  const handleCustomUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 2MB.",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setSelectedAvatar(publicUrl);
      onAvatarChange(publicUrl);

      toast({
        title: "Avatar uploaded",
        description: "Your custom avatar has been uploaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Choose Your Avatar</h3>
        
        {/* Preset Avatars Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {PRESET_AVATARS.map((avatarUrl, index) => (
            <div key={index} className="relative">
              <button
                onClick={() => handlePresetSelect(avatarUrl)}
                className={`relative w-20 h-20 rounded-full overflow-hidden border-2 transition-all ${
                  selectedAvatar === avatarUrl 
                    ? 'border-purple-500 ring-2 ring-purple-200' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Avatar className="w-full h-full">
                  <AvatarImage 
                    src={avatarUrl} 
                    alt={`Avatar ${index + 1}`}
                    className="object-cover"
                  />
                  <AvatarFallback>{index + 1}</AvatarFallback>
                </Avatar>
                {selectedAvatar === avatarUrl && (
                  <div className="absolute inset-0 bg-purple-500 bg-opacity-20 flex items-center justify-center">
                    <Check className="w-6 h-6 text-purple-600" />
                  </div>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Custom Upload Option */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-3">
            Or upload your own avatar
          </p>
          <Button
            variant="outline"
            disabled={uploading}
            className="relative"
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleCustomUpload}
              disabled={uploading}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            {uploading ? 'Uploading...' : 'Choose File'}
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            Max file size: 2MB
          </p>
        </div>
      </div>
    </div>
  );
};

export default AvatarSelector;
