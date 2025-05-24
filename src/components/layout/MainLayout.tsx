
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import DashboardOverview from '../features/dashboard/DashboardOverview';
import WorldElementLibrary from '../features/worldbuilding/WorldElementLibrary';
import TextEditor from '../features/editor/TextEditor';
import MindmapCanvas from '../features/mindmap/MindmapCanvas';
import WritingStats from '../features/analytics/WritingStats';

const MainLayout = () => {
  const [activeSection, setActiveSection] = useState('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'worldbuilding':
        return <WorldElementLibrary />;
      case 'editor':
        return <TextEditor />;
      case 'mindmap':
        return <MindmapCanvas />;
      case 'analytics':
        return <WritingStats />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="h-screen flex bg-slate-50">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header activeSection={activeSection} />
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
