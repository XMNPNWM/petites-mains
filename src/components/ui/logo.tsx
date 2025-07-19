
import React, { useState } from 'react';

interface LogoProps {
  className?: string;
}

const Logo = ({ className = "h-12 w-auto" }: LogoProps) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
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
      src="/lovable-uploads/119e288d-e30b-464c-b04d-cfb0c1e5a0e8.png"
      alt="Petites Mains - Think, Build, Write"
      className={className}
      onError={handleImageError}
    />
  );
};

export default Logo;
