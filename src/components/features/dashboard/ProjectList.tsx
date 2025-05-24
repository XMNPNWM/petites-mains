
import React from 'react';
import { MoreHorizontal, Edit3, Trash2, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ProjectList = () => {
  const projects = [
    {
      id: 1,
      title: "The Dragon's Quest",
      genre: "Fantasy",
      wordCount: 45230,
      targetWords: 80000,
      lastModified: "2 hours ago",
      status: "In Progress",
      favorite: true
    },
    {
      id: 2,
      title: "Cyberpunk Chronicles",
      genre: "Sci-Fi",
      wordCount: 12450,
      targetWords: 60000,
      lastModified: "1 day ago",
      status: "In Progress",
      favorite: false
    },
    {
      id: 3,
      title: "Mystery of the Old Manor",
      genre: "Mystery",
      wordCount: 78900,
      targetWords: 75000,
      lastModified: "3 days ago",
      status: "Complete",
      favorite: true
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Projects</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map((project) => (
            <div key={project.id} className="border rounded-lg p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <h3 className="font-medium text-slate-900">{project.title}</h3>
                  {project.favorite && <Star className="w-4 h-4 text-amber-500 fill-current" />}
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon">
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-slate-600 mb-3">
                <span>{project.genre}</span>
                <span>Last modified: {project.lastModified}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{project.wordCount.toLocaleString()} words</span>
                    <span>{Math.round((project.wordCount / project.targetWords) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.min((project.wordCount / project.targetWords) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  project.status === 'Complete' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {project.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectList;
