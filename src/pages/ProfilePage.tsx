
import React, { useState } from 'react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import ProfileForm from '@/components/profile/ProfileForm';
import AvatarSection from '@/components/profile/AvatarSection';
import PasswordChangeSection from '@/components/profile/PasswordChangeSection';
import { useProfile } from '@/hooks/useProfile';

const ProfilePage = () => {
  const {
    profile,
    fullName,
    bio,
    avatarUrl,
    loading,
    setFullName,
    setBio,
    setAvatarUrl,
    updateProfile
  } = useProfile();
  
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile();
  };

  const handleAvatarChange = (newAvatarUrl: string) => {
    setAvatarUrl(newAvatarUrl);
  };

  const handleAvatarSave = () => {
    setShowAvatarSelector(false);
  };

  const handleAvatarCancel = () => {
    setShowAvatarSelector(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <ProfileHeader />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <ProfileSidebar
            profile={profile}
            avatarUrl={avatarUrl}
            onChangeAvatar={() => setShowAvatarSelector(!showAvatarSelector)}
          />

          <div className="lg:col-span-2 space-y-6">
            {showAvatarSelector ? (
              <AvatarSection
                avatarUrl={avatarUrl}
                onAvatarChange={handleAvatarChange}
                onCancel={handleAvatarCancel}
                onSave={handleAvatarSave}
              />
            ) : (
              <>
                <ProfileForm
                  fullName={fullName}
                  bio={bio}
                  loading={loading}
                  onFullNameChange={setFullName}
                  onBioChange={setBio}
                  onSubmit={handleUpdateProfile}
                />
                <PasswordChangeSection />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
