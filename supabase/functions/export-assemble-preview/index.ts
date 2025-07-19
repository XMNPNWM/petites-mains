import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssembleRequest {
  projectId: string;
  selectedChapters: Array<{
    chapterId: string;
    contentSource: 'original' | 'enhanced';
    order: number;
  }>;
  layoutOptions: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    margins: { top: number; bottom: number; left: number; right: number };
    chapterSeparator: string;
    includeTOC: boolean;
    includeTitlePage: boolean;
    headerFooter: boolean;
  };
  templateId: string;
  includeMetadata: boolean;
}

const getTemplate = (templateId: string) => {
  const templates = {
    default: {
      titlePageTemplate: `
        <div class="title-page" style="text-align: center; padding: 200px 0;">
          <h1 style="font-size: 2.5em; margin-bottom: 20px; font-weight: bold;">{{PROJECT_TITLE}}</h1>
          <p style="font-size: 1.2em; margin-bottom: 10px;">{{AUTHOR_NAME}}</p>
          <p style="font-size: 1em; color: #666;">{{DATE}}</p>
        </div>
        <div style="page-break-after: always;"></div>
      `,
      tocTemplate: `
        <div class="table-of-contents" style="margin-bottom: 40px;">
          <h2 style="font-size: 1.8em; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px;">Table of Contents</h2>
          <div style="line-height: 1.8;">{{TOC_ENTRIES}}</div>
        </div>
        <div style="page-break-after: always;"></div>
      `,
      chapterTemplate: `
        <div class="chapter" style="margin-bottom: 40px;">
          <h1 class="chapter-title" style="font-size: 1.8em; margin-bottom: 30px; padding-bottom: 10px; border-bottom: 1px solid #ccc;">{{CHAPTER_TITLE}}</h1>
          <div class="chapter-content" style="line-height: {{LINE_HEIGHT}};">{{CHAPTER_CONTENT}}</div>
        </div>
      `
    },
    fiction: {
      titlePageTemplate: `
        <div class="title-page" style="text-align: center; padding: 150px 0; font-family: serif;">
          <h1 style="font-size: 3em; margin-bottom: 40px; font-weight: normal; letter-spacing: 2px;">{{PROJECT_TITLE}}</h1>
          <hr style="width: 200px; margin: 40px auto; border: 1px solid #333;">
          <p style="font-size: 1.4em; margin-bottom: 20px; font-style: italic;">{{AUTHOR_NAME}}</p>
          <p style="font-size: 0.9em; color: #666; margin-top: 40px;">{{DATE}}</p>
        </div>
        <div style="page-break-after: always;"></div>
      `,
      tocTemplate: `
        <div class="table-of-contents" style="margin-bottom: 40px; text-align: center;">
          <h2 style="font-size: 2em; margin-bottom: 40px; font-weight: normal; letter-spacing: 1px;">Contents</h2>
          <div style="line-height: 2.0; text-align: left; max-width: 400px; margin: 0 auto;">{{TOC_ENTRIES}}</div>
        </div>
        <div style="page-break-after: always;"></div>
      `,
      chapterTemplate: `
        <div class="chapter" style="margin-bottom: 60px;">
          <h1 class="chapter-title" style="font-size: 2em; margin-bottom: 40px; text-align: center; font-weight: normal; letter-spacing: 1px;">{{CHAPTER_TITLE}}</h1>
          <div class="chapter-content" style="line-height: {{LINE_HEIGHT}}; text-align: justify; text-indent: 2em;">{{CHAPTER_CONTENT}}</div>
        </div>
      `
    },
    academic: {
      titlePageTemplate: `
        <div class="title-page" style="text-align: center; padding: 100px 40px;">
          <h1 style="font-size: 2.2em; margin-bottom: 40px; font-weight: bold; line-height: 1.3;">{{PROJECT_TITLE}}</h1>
          <p style="font-size: 1.1em; margin-bottom: 30px;">by</p>
          <p style="font-size: 1.3em; margin-bottom: 60px; font-weight: 500;">{{AUTHOR_NAME}}</p>
          <div style="margin-top: 80px;">
            <p style="font-size: 1em; margin-bottom: 10px;">Submitted on</p>
            <p style="font-size: 1.1em; font-weight: 500;">{{DATE}}</p>
          </div>
        </div>
        <div style="page-break-after: always;"></div>
      `,
      tocTemplate: `
        <div class="table-of-contents" style="margin-bottom: 40px;">
          <h2 style="font-size: 1.5em; margin-bottom: 30px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Table of Contents</h2>
          <div style="line-height: 1.6;">{{TOC_ENTRIES}}</div>
        </div>
        <div style="page-break-after: always;"></div>
      `,
      chapterTemplate: `
        <div class="chapter" style="margin-bottom: 50px;">
          <h1 class="chapter-title" style="font-size: 1.6em; margin-bottom: 25px; font-weight: bold; color: #2c3e50;">{{CHAPTER_TITLE}}</h1>
          <div class="chapter-content" style="line-height: {{LINE_HEIGHT}}; text-align: justify;">{{CHAPTER_CONTENT}}</div>
        </div>
      `
    }
  };
  
  return templates[templateId as keyof typeof templates] || templates.default;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData: AssembleRequest = await req.json();
    const { projectId, selectedChapters, layoutOptions, templateId, includeMetadata } = requestData;

    console.log('Assembling document for project:', projectId, 'with', selectedChapters.length, 'chapters');

    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('title, created_at')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: 'Project not found' }), 
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get chapters content
    const chapterIds = selectedChapters.map(sc => sc.chapterId);
    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .select('id, title, content')
      .in('id', chapterIds);

    if (chaptersError) {
      return new Response(JSON.stringify({ error: 'Failed to fetch chapters' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get enhanced content if needed
    const enhancedContentMap = new Map();
    const enhancedChapters = selectedChapters.filter(sc => sc.contentSource === 'enhanced');
    
    if (enhancedChapters.length > 0) {
      const { data: refinements } = await supabase
        .from('chapter_refinements')
        .select('chapter_id, enhanced_content')
        .in('chapter_id', enhancedChapters.map(ec => ec.chapterId));

      refinements?.forEach(r => {
        if (r.enhanced_content) {
          enhancedContentMap.set(r.chapter_id, r.enhanced_content);
        }
      });
    }

    // Sort chapters according to selection order
    const sortedChapters = selectedChapters
      .map(selection => {
        const chapter = chapters?.find(c => c.id === selection.chapterId);
        if (!chapter) return null;
        
        const content = selection.contentSource === 'enhanced' 
          ? enhancedContentMap.get(chapter.id) || chapter.content
          : chapter.content;
          
        return { ...chapter, content, order: selection.order };
      })
      .filter(Boolean)
      .sort((a, b) => a!.order - b!.order);

    // Get template
    const template = getTemplate(templateId);
    
    // Assemble document
    let htmlContent = '';
    
    // Apply document styles
    const documentStyles = `
      <style>
        body {
          font-family: ${layoutOptions.fontFamily};
          font-size: ${layoutOptions.fontSize}pt;
          line-height: ${layoutOptions.lineHeight};
          margin: ${layoutOptions.margins.top}pt ${layoutOptions.margins.right}pt ${layoutOptions.margins.bottom}pt ${layoutOptions.margins.left}pt;
          color: #333;
        }
        .chapter-content p {
          margin-bottom: 1em;
        }
        .chapter-content {
          text-align: justify;
        }
        @media print {
          .page-break { page-break-after: always; }
        }
      </style>
    `;
    
    htmlContent += documentStyles;

    // Add title page
    if (includeMetadata && layoutOptions.includeTitlePage) {
      htmlContent += template.titlePageTemplate
        .replace('{{PROJECT_TITLE}}', project.title)
        .replace('{{AUTHOR_NAME}}', 'Author Name') // TODO: Get from user profile
        .replace('{{DATE}}', new Date().toLocaleDateString());
    }

    // Add table of contents
    if (includeMetadata && layoutOptions.includeTOC && sortedChapters.length > 1) {
      const tocEntries = sortedChapters
        .map((chapter, index) => 
          `<div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>${index + 1}. ${chapter!.title || 'Untitled'}</span>
            <span>${index + 1}</span>
           </div>`
        )
        .join('');
      
      htmlContent += template.tocTemplate.replace('{{TOC_ENTRIES}}', tocEntries);
    }

    // Add chapters
    for (const chapter of sortedChapters) {
      if (!chapter) continue;
      
      const chapterContent = chapter.content || '';
      const formattedContent = chapterContent
        .split('\n')
        .filter(p => p.trim())
        .map(p => `<p>${p.trim()}</p>`)
        .join('');

      htmlContent += template.chapterTemplate
        .replace('{{CHAPTER_TITLE}}', chapter.title || 'Untitled')
        .replace('{{CHAPTER_CONTENT}}', formattedContent)
        .replace('{{LINE_HEIGHT}}', layoutOptions.lineHeight.toString());

      // Add chapter separator
      if (layoutOptions.chapterSeparator === 'page-break') {
        htmlContent += '<div style="page-break-after: always;"></div>';
      } else if (layoutOptions.chapterSeparator === 'section-break') {
        htmlContent += '<hr style="margin: 60px 0; border: none; border-top: 2px solid #ccc;">';
      } else {
        htmlContent += '<div style="margin: 60px 0;"></div>';
      }
    }

    console.log('Document assembly completed, content length:', htmlContent.length);

    return new Response(JSON.stringify({ 
      content: htmlContent,
      metadata: {
        projectTitle: project.title,
        chapterCount: sortedChapters.length,
        wordCount: sortedChapters.reduce((acc, ch) => acc + (ch?.content?.split(' ').length || 0), 0)
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in export-assemble-preview:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);