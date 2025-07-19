
import React, { useState } from 'react';

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
    <img 
      src="/lovable-uploads/e2abb4f3-f724-4125-bd0c-00a3f6a12763.png" 
      alt="Petites Mains - Think, Build, Write"
      className={className}
      onError={handleImageError}
      onLoad={handleImageLoad}
    />
  );
};

export default Logo;
