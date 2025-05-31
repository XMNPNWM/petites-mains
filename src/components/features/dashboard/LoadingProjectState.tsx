
import React from 'react';

const LoadingProjectState = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Loading project...</p>
      </div>
    </div>
  );
};

export default LoadingProjectState;
