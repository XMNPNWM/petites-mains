
import React, { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface LogoProps {
  className?: string;
}

const Logo = ({ className = "h-12 w-auto" }: LogoProps) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    console.log('Logo image failed to load, showing fallback');
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log('Logo image loaded successfully');
  };

  if (imageError) {
    return (
      <div className="flex flex-col">
        <h1 className="text-3xl font-bold text-slate-900">Petites Mains</h1>
        <p className="text-slate-600">Think, Build, Write</p>
      </div>
    );
  }

  return (
    <Avatar className={`${className} rounded-none`}>
      <AvatarImage 
        src="/lovable-uploads/33391798-eb9b-4ae0-af64-6be0a0b9d3e1.png" 
        alt="Petites Mains - Think, Build, Write"
        className="object-contain rounded-none"
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
      <AvatarFallback className="rounded-none bg-transparent">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold text-slate-900">Petites Mains</h1>
          <p className="text-slate-600">Think, Build, Write</p>
        </div>
      </AvatarFallback>
    </Avatar>
  );
};

export default Logo;
