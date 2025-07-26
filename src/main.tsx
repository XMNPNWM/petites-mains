
import React from 'react';
import './services/EnhancementMonitoringService'; // Auto-start background monitoring
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Import debugging tools for development
import ComprehensiveEnhancementDebugger from '@/utils/comprehensiveEnhancementDebugger';

// Make debugging tools available globally in development
if (import.meta.env.DEV) {
  (window as any).ComprehensiveEnhancementDebugger = ComprehensiveEnhancementDebugger;
  console.log('🛠️ Debugging tools loaded! Use ComprehensiveEnhancementDebugger.debugEnhancementProcess(projectId, chapterId) in console');
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
