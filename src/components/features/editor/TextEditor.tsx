
import React, { useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Save,
  Download,
  MoreHorizontal,
  FileText,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ChapterSidebar from './ChapterSidebar';
import { stripHtmlTags, getWordCount } from '@/lib/contentUtils';

const TextEditor = () => {
  const initialContent = `Chapter 1: The Beginning

The morning mist clung to the cobblestones like a shroud, and Aria Shadowmere moved through it like a ghost. Her footsteps were silent, her breathing controlled, every muscle in her body coiled and ready for action. This was what she had trained for her entire life – the perfect assassination.

But as she crept closer to her target, something felt wrong. The shadows that had always been her allies seemed to whisper warnings, and the darkness that usually embraced her felt cold and distant.

She paused at the corner of the alley, her hand instinctively moving to the blade at her hip. Lord Blackthorne's manor loomed before her, its towers piercing the gray dawn sky like accusatory fingers. Somewhere within those walls lay her target, sleeping peacefully, unaware that death was approaching on silent feet.

Aria took a deep breath and stepped forward, not knowing that this single step would change the course of her life forever...`;

  const [content, setContent] = useState(initialContent);
  const wordCount = getWordCount(content);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  return (
    <div className="flex h-full">
      {/* Chapter Sidebar */}
      <ChapterSidebar />
      
      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {/* Editor Header */}
        <div className="bg-white border-b border-slate-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <Input 
                value="Chapter 1: The Beginning" 
                className="text-lg font-medium border-none p-0 h-auto focus-visible:ring-0"
              />
              <p className="text-sm text-slate-600 mt-1">Last saved: 2 minutes ago</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600">{wordCount} words</span>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center space-x-1 pb-2 border-b">
            <Button variant="ghost" size="sm">
              <Bold className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Italic className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Underline className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-slate-300 mx-2"></div>
            <Button variant="ghost" size="sm">
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <AlignRight className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-slate-300 mx-2"></div>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 p-6 bg-slate-50">
          <Card className="h-full">
            <CardContent className="p-8 h-full">
              <Textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full h-full border-none resize-none focus-visible:ring-0 text-base leading-relaxed"
                placeholder="Start writing your story..."
              />
            </CardContent>
          </Card>
        </div>

        {/* Status Bar */}
        <div className="bg-white border-t border-slate-200 px-6 py-2">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <div className="flex items-center space-x-4">
              <span>Chapter 1 of 12</span>
              <span>Page 1</span>
              <span>Line 15</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Auto-save enabled
              </span>
              <span>Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextEditor;
