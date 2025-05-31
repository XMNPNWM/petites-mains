
import React from 'react';

const EmptyStorylineState = () => {
  return (
    <div className="h-screen bg-white flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
        <h3 className="font-semibold text-slate-900 text-sm">Storyline Map</h3>
      </div>
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 text-center py-8">No storyline nodes created yet</p>
      </div>
    </div>
  );
};

export default EmptyStorylineState;
