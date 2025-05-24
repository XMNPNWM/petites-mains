
import React from 'react';
import { 
  Home, 
  Book, 
  Edit3, 
  GitBranch, 
  BarChart3, 
  Settings,
  ChevronDown,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const Sidebar = ({ activeSection, onSectionChange }: SidebarProps) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'worldbuilding', label: 'Worldbuilding', icon: Book },
    { id: 'editor', label: 'Editor', icon: Edit3 },
    { id: 'mindmap', label: 'Mind Map', icon: GitBranch },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">
          WriteFlow
        </h1>
        <p className="text-slate-400 text-sm mt-1">Creative Writing Suite</p>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-slate-700">
        <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onSectionChange(item.id)}
                className={`w-full flex items-center px-3 py-2 rounded-lg transition-colors ${
                  activeSection === item.id
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-amber-500 rounded-full"></div>
          <div>
            <p className="text-sm font-medium">John Writer</p>
            <p className="text-xs text-slate-400">Premium Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
