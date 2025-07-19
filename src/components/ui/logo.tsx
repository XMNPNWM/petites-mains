
import React, { useState } from 'react';

interface LogoProps {
  className?: string;
}

const Logo = ({ className = "h-12 w-auto" }: LogoProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageError = () => {
    console.log('Logo image failed to load, showing fallback');
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log('Logo image loaded successfully');
    setImageLoaded(true);
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
    <div className="relative">
      {!imageLoaded && (
        <div className="flex flex-col animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-32"></div>
        </div>
      )}
      <img 
        src="/lovable-uploads/33391798-eb9b-4ae0-af64-6be0a0b9d3e1.png" 
        alt="Petites Mains - Think, Build, Write" 
        className={`${className} ${imageLoaded ? 'block' : 'hidden'}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
      />
    </div>
  );
};

export default Logo;
