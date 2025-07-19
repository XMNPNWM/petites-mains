
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Download, Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useProjectData } from '@/hooks/useProjectData';
import { ExportChapterSelection } from '@/stores/useExportStore';

const ProjectExportPage = () => {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { project, chapters, isLoading } = useProjectData(projectId);
  
  const [selectedChapters, setSelectedChapters] = useState<ExportChapterSelection[]>([]);
  const [exportFormat, setExportFormat] = useState('pdf');
  const [templateId, setTemplateId] = useState('default');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [assembledContent, setAssembledContent] = useState('');
  const [isAssembling, setIsAssembling] = useState(false);

  // Parse URL parameters
  useEffect(() => {
    const chaptersParam = searchParams.get('chapters');
    const formatParam = searchParams.get('format');
    const templateParam = searchParams.get('template');
    const metadataParam = searchParams.get('metadata');

    if (chaptersParam) {
      try {
        setSelectedChapters(JSON.parse(chaptersParam));
      } catch (error) {
        console.error('Error parsing chapters parameter:', error);
      }
    }

    if (formatParam) setExportFormat(formatParam);
    if (templateParam) setTemplateId(templateParam);
    if (metadataParam) setIncludeMetadata(metadataParam === 'true');
  }, [searchParams]);

  // Assemble document preview
  useEffect(() => {
    if (selectedChapters.length > 0 && chapters.length > 0) {
      assembleDocumentPreview();
    }
  }, [selectedChapters, chapters]);

  const assembleDocumentPreview = async () => {
    setIsAssembling(true);
    try {
      // For now, we'll create a simple HTML assembly
      // This will be replaced with the server-side assembly endpoint
      let htmlContent = '';
      
      // Add title page if metadata is included
      if (includeMetadata && project) {
        htmlContent += `
          <div class="title-page">
            <h1 class="main-title">${project.title}</h1>
            <p class="author">Author Name</p>
            <p class="date">${new Date().toLocaleDateString()}</p>
          </div>
          <div class="page-break"></div>
        `;
      }

      // Add table of contents if requested
      if (includeMetadata && selectedChapters.length > 1) {
        htmlContent += `
          <div class="table-of-contents">
            <h2>Table of Contents</h2>
            <ul>
              ${selectedChapters.map((selection, index) => {
                const chapter = chapters.find(c => c.id === selection.chapterId);
                return `<li>${index + 1}. ${chapter?.title || 'Untitled'}</li>`;
              }).join('')}
            </ul>
          </div>
          <div class="page-break"></div>
        `;
      }

      // Add chapters in order
      for (const selection of selectedChapters) {
        const chapter = chapters.find(c => c.id === selection.chapterId);
        if (chapter) {
          // For now, use original content - enhanced content fetching will be added
          const content = chapter.content || '';
          
          htmlContent += `
            <div class="chapter">
              <h1 class="chapter-title">${chapter.title}</h1>
              <div class="chapter-content">
                ${content.replace(/\n/g, '</p><p>').replace(/^<p>/, '<p>').replace(/<\/p>$/, '</p>')}
              </div>
            </div>
            <div class="chapter-separator"></div>
          `;
        }
      }

      setAssembledContent(htmlContent);
    } catch (error) {
      console.error('Error assembling document:', error);
      toast({
        title: "Assembly Error",
        description: "Failed to assemble document preview",
        variant: "destructive",
      });
    } finally {
      setIsAssembling(false);
    }
  };

  const handleBackClick = () => {
    navigate(`/project/${projectId}`);
  };

  const handleExport = async () => {
    toast({
      title: "Export Started",
      description: "Your document is being prepared for download...",
    });
    
    // TODO: Implement actual export functionality
    // This will call the export-final-document edge function
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading export space...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Project not found</p>
          <Button onClick={handleBackClick} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Export Space: {project.title}
              </h1>
              <p className="text-sm text-gray-500">
                {selectedChapters.length} chapters selected • {exportFormat.toUpperCase()} format
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </Button>
            <Button onClick={handleExport} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export {exportFormat.toUpperCase()}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-81px)]">
        {/* Document Editor - Main Panel */}
        <div className="flex-1 p-6">
          {isAssembling ? (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Assembling Document...
                </h3>
                <p className="text-gray-500">
                  Compiling {selectedChapters.length} chapters into a single document
                </p>
              </div>
            </Card>
          ) : (
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Document Preview</CardTitle>
              </CardHeader>
              <CardContent className="h-full overflow-auto">
                {/* This will be replaced with the TipTap editor */}
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: assembledContent }}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Settings Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Export Settings
            </h3>
            
            {/* Selected Chapters Summary */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Selected Chapters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedChapters.map((selection, index) => {
                  const chapter = chapters.find(c => c.id === selection.chapterId);
                  return (
                    <div key={selection.chapterId} className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {index + 1}. {chapter?.title || 'Untitled'}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {selection.contentSource}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Format and Template Info */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Format</label>
                <p className="text-sm text-gray-500">{exportFormat.toUpperCase()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Template</label>
                <p className="text-sm text-gray-500">{templateId}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Include Metadata</label>
                <p className="text-sm text-gray-500">{includeMetadata ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectExportPage;
