
import React from 'react';

const StorylineGrid = () => {
  return (
    <svg 
      className="absolute inset-0 w-full h-full pointer-events-none" 
      style={{ minWidth: '8000px', minHeight: '8000px' }}
    >
      <defs>
        <pattern id="storyline-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
          <path d="M 20 0 L 20 40 M 0 20 L 40 20" fill="none" stroke="#f1f5f9" strokeWidth="0.5"/>
        </pattern>
        <pattern id="storyline-grid-major" width="200" height="200" patternUnits="userSpaceOnUse">
          <rect width="200" height="200" fill="url(#storyline-grid)"/>
          <path d="M 200 0 L 0 0 0 200" fill="none" stroke="#cbd5e1" strokeWidth="1.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#storyline-grid-major)" />
    </svg>
  );
};

export default StorylineGrid;
