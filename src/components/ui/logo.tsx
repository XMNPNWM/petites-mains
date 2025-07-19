
import React, { useState } from 'react';

interface LogoProps {
  className?: string;
}

const Logo = ({ className = "h-12 w-auto" }: LogoProps) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.log('Logo image failed to load:', e);
    console.log('Attempted src:', e.currentTarget.src);
    console.log('Full URL:', window.location.origin + '/lovable-uploads/fb39a1cc-ffc3-4263-a598-e30e0ab6a56f.jpg');
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log('Logo image loaded successfully from:', '/lovable-uploads/fb39a1cc-ffc3-4263-a598-e30e0ab6a56f.jpg');
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
    <img 
      src="/lovable-uploads/fb39a1cc-ffc3-4263-a598-e30e0ab6a56f.jpg" 
      alt="Petites Mains - Think, Build, Write"
      className={className}
      onError={handleImageError}
      onLoad={handleImageLoad}
    />
  );
};

export default Logo;
