
import React, { useState } from 'react';
import { Plus, FileText, MoreHorizontal, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ChapterSidebar = () => {
  const [chapters] = useState([
    { id: 1, title: 'Chapter 1: The Beginning', wordCount: 2450, isActive: true },
    { id: 2, title: 'Chapter 2: The Discovery', wordCount: 1890, isActive: false },
    { id: 3, title: 'Chapter 3: First Blood', wordCount: 2100, isActive: false },
    { id: 4, title: 'Chapter 4: Allies and Enemies', wordCount: 0, isActive: false },
    { id: 5, title: 'Chapter 5: The Truth Revealed', wordCount: 0, isActive: false },
  ]);

  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-slate-900">Chapters</h3>
          <Button size="icon" variant="ghost">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input placeholder="Search chapters..." className="pl-10" />
        </div>
      </div>

      {/* Chapter List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {chapters.map((chapter) => (
            <div
              key={chapter.id}
              className={`p-3 rounded-lg mb-2 cursor-pointer transition-colors ${
                chapter.isActive
                  ? 'bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className={`font-medium text-sm ${
                      chapter.isActive ? 'text-purple-700' : 'text-slate-700'
                    }`}>
                      {chapter.title}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {chapter.wordCount > 0 ? `${chapter.wordCount} words` : 'Not started'}
                  </p>
                  {chapter.wordCount > 0 && (
                    <div className="mt-2">
                      <div className="w-full bg-slate-200 rounded-full h-1">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-blue-500 h-1 rounded-full"
                          style={{ width: `${Math.min((chapter.wordCount / 3000) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chapter Stats */}
      <div className="p-4 border-t border-slate-200">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Project Stats</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Total Words:</span>
                <span className="font-medium">6,440</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Chapters:</span>
                <span className="font-medium">3 / 5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Progress:</span>
                <span className="font-medium">60%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChapterSidebar;
