
import React from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

interface Project {
  id: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  content: string;
}

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  const navigate = useNavigate();

  const getLastContent = (content: string) => {
    if (!content) return 'No content written yet...';
    const lines = content.split('\n').filter(line => line.trim());
    return lines[lines.length - 1] || 'No content written yet...';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer" 
      onClick={() => navigate(`/project/${project.id}`)}
    >
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900 line-clamp-1">
          {project.title}
        </CardTitle>
        <div className="flex items-center space-x-4 text-sm text-slate-500">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {formatDate(project.created_at)}
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {formatDate(project.updated_at)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-xs text-slate-500 mb-1">Last written:</p>
          <p className="text-sm text-slate-700 italic line-clamp-2">
            "{getLastContent(project.content)}"
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
