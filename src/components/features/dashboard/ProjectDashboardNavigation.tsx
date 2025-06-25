
import React from 'react';
import { BookOpen, Globe, Edit3, BarChart3, Brain } from 'lucide-react';

interface Panel {
  id: string;
  title: string;
  icon: string;
}

interface ProjectDashboardNavigationProps {
  panels: Panel[];
  currentPanel: number;
  onPanelChange: (index: number) => void;
}

const iconComponents = {
  BookOpen,
  Globe,
  Edit3,
  BarChart3,
  Brain
};

const ProjectDashboardNavigation = ({
  panels,
  currentPanel,
  onPanelChange
}: ProjectDashboardNavigationProps) => {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex space-x-8">
          {panels.map((panel, index) => {
            const IconComponent = iconComponents[panel.icon as keyof typeof iconComponents];
            return (
              <button
                key={panel.id}
                onClick={() => onPanelChange(index)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  currentPanel === index
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{panel.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProjectDashboardNavigation;
