
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Download, Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useProjectData } from '@/hooks/useProjectData';
import { useExportStore, ExportChapterSelection } from '@/stores/useExportStore';
import { supabase } from '@/integrations/supabase/client';
import ExportDocumentEditor from '@/components/features/export/ExportDocumentEditor';
import ExportFormattingControls from '@/components/features/export/ExportFormattingControls';

const ProjectExportPage = () => {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { project, chapters, isLoading } = useProjectData(projectId);
  
  const {
    selectedChapters,
    exportFormat,
    templateId,
    includeMetadata,
    assembledContent,
    layoutOptions,
    isAssembling,
    updateAssembledContent,
    setLayoutOptions,
    setIsAssembling,
    setExportFormat,
    setTemplateId,
    setIncludeMetadata,
  } = useExportStore();

  // Parse URL parameters and update store
  useEffect(() => {
    const chaptersParam = searchParams.get('chapters');
    const formatParam = searchParams.get('format');
    const templateParam = searchParams.get('template');
    const metadataParam = searchParams.get('metadata');

    if (chaptersParam) {
      try {
        const parsedChapters = JSON.parse(chaptersParam);
        // Direct mutation for initialization from URL
        useExportStore.setState({ selectedChapters: parsedChapters });
      } catch (error) {
        console.error('Error parsing chapters parameter:', error);
      }
    }

    if (formatParam) setExportFormat(formatParam as any);
    if (templateParam) setTemplateId(templateParam);
    if (metadataParam) setIncludeMetadata(metadataParam === 'true');
  }, [searchParams, setExportFormat, setTemplateId, setIncludeMetadata]);

  // Assemble document preview
  useEffect(() => {
    if (selectedChapters.length > 0 && chapters.length > 0) {
      assembleDocumentPreview();
    }
  }, [selectedChapters, chapters, layoutOptions, templateId, includeMetadata]);

  const assembleDocumentPreview = async () => {
    if (!projectId) return;
    
    setIsAssembling(true);
    try {
      const { data, error } = await supabase.functions.invoke('export-assemble-preview', {
        body: {
          projectId,
          selectedChapters,
          layoutOptions,
          templateId,
          includeMetadata
        }
      });

      if (error) throw error;

      if (data?.content) {
        updateAssembledContent(data.content);
      }
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
    if (!assembledContent || !projectId) return;
    
    toast({
      title: "Export Started",
      description: "Your document is being prepared for download...",
    });
    
    try {
      const response = await supabase.functions.invoke('export-final-document', {
        body: {
          projectId,
          htmlContent: assembledContent,
          exportFormat,
          layoutOptions,
          metadata: {
            projectTitle: project?.title || 'Untitled',
            chapterCount: selectedChapters.length,
            wordCount: selectedChapters.reduce((acc, selection) => {
              const chapter = chapters.find(c => c.id === selection.chapterId);
              return acc + (chapter?.content?.split(' ').length || 0);
            }, 0)
          }
        }
      });

      if (response.error) throw response.error;

      // The response should be a blob for download
      const blob = new Blob([response.data], { 
        type: exportFormat === 'pdf' ? 'application/pdf' : 
              exportFormat === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
              exportFormat === 'epub' ? 'application/epub+zip' : 'text/plain'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.title || 'document'}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Your ${exportFormat.toUpperCase()} has been downloaded successfully.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "There was an error generating your document. Please try again.",
        variant: "destructive",
      });
    }
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
          <ExportDocumentEditor
            content={assembledContent}
            onContentChange={updateAssembledContent}
            isLoading={isAssembling}
          />
        </div>

        {/* Settings Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-6 space-y-6 overflow-y-auto">
          {/* Selected Chapters Summary */}
          <Card>
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
                    <span className="text-muted-foreground text-xs">
                      {selection.contentSource}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Export Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Export Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium">Format</label>
                <p className="text-sm text-muted-foreground">{exportFormat.toUpperCase()}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Template</label>
                <p className="text-sm text-muted-foreground capitalize">{templateId}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Include Metadata</label>
                <p className="text-sm text-muted-foreground">{includeMetadata ? 'Yes' : 'No'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Formatting Controls */}
          <ExportFormattingControls
            layoutOptions={layoutOptions}
            onLayoutChange={setLayoutOptions}
            onReassemble={assembleDocumentPreview}
            isAssembling={isAssembling}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectExportPage;
