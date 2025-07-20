
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChapterTitleOptions {
  numberingStyle: 'none' | 'arabic' | 'roman' | 'words';
  prefix: 'chapter' | 'part' | 'section' | 'custom' | 'none';
  customPrefix: string;
  alignment: 'left' | 'center' | 'right';
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  includeUnderline: boolean;
  includeSeparator: boolean;
  separatorStyle: 'line' | 'ornament' | 'dots';
}

interface ContentFormattingOptions {
  enableDropCaps: boolean;
  paragraphIndent: number;
  paragraphSpacing: number;
  textAlignment: 'left' | 'justify' | 'center';
  preserveFormatting: boolean;
  smartQuotes: boolean;
  autoTypography: boolean;
}

interface TOCOptions {
  customTitle: string;
  includePageNumbers: boolean;
  pageNumberAlignment: 'left' | 'right';
  dotLeaders: boolean;
  tocDepth: number;
  tocFontSize: number;
  includeChapterNumbers: boolean;
}

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
    fontWeight: string;
    lineHeight: number;
    margins: { top: number; bottom: number; left: number; right: number };
    chapterSeparator: string;
    includeTOC: boolean;
    includeTitlePage: boolean;
    headerFooter: boolean;
    chapterTitleOptions: ChapterTitleOptions;
    contentFormatting: ContentFormattingOptions;
    tocOptions: TOCOptions;
  };
  templateId: string;
  includeMetadata: boolean;
}

const getChapterNumber = (index: number, style: string): string => {
  switch (style) {
    case 'arabic':
      return (index + 1).toString();
    case 'roman':
      return toRoman(index + 1);
    case 'words':
      return toWords(index + 1);
    default:
      return '';
  }
};

const toRoman = (num: number): string => {
  const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const numerals = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let result = '';
  
  for (let i = 0; i < values.length; i++) {
    while (num >= values[i]) {
      result += numerals[i];
      num -= values[i];
    }
  }
  return result;
};

const toWords = (num: number): string => {
  const words = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty'];
  return words[num] || num.toString();
};

const getChapterPrefix = (options: ChapterTitleOptions): string => {
  switch (options.prefix) {
    case 'chapter': return 'Chapter';
    case 'part': return 'Part';
    case 'section': return 'Section';
    case 'custom': return options.customPrefix;
    default: return '';
  }
};

const applySeparatorStyle = (style: string): string => {
  switch (style) {
    case 'ornament':
      return '<div style="text-align: center; font-size: 1.5em; margin: 20px 0;">❦</div>';
    case 'dots':
      return '<div style="text-align: center; margin: 20px 0;">• • •</div>';
    case 'line':
    default:
      return '<hr style="width: 50%; margin: 20px auto; border: 1px solid #ccc;">';
  }
};

const processContent = (content: string, options: ContentFormattingOptions): string => {
  let processedContent = content;
  
  // Apply smart quotes
  if (options.smartQuotes) {
    processedContent = processedContent
      .replace(/"/g, '"').replace(/"/g, '"')
      .replace(/'/g, ''').replace(/'/g, ''');
  }
  
  // Apply auto typography
  if (options.autoTypography) {
    processedContent = processedContent
      .replace(/--/g, '—')
      .replace(/\.\.\./g, '…');
  }
  
  // Split into paragraphs and format
  const paragraphs = processedContent.split('\n').filter(p => p.trim());
  
  return paragraphs.map((paragraph, index) => {
    let pStyle = `margin-bottom: ${options.paragraphSpacing}em;`;
    
    if (options.paragraphIndent > 0 && index > 0) {
      pStyle += ` text-indent: ${options.paragraphIndent}em;`;
    }
    
    if (options.textAlignment !== 'left') {
      pStyle += ` text-align: ${options.textAlignment};`;
    }
    
    let content = paragraph.trim();
    
    // Apply drop caps to first paragraph
    if (options.enableDropCaps && index === 0 && content.length > 0) {
      const firstLetter = content.charAt(0);
      const restOfContent = content.slice(1);
      content = `<span style="float: left; font-size: 3em; line-height: 0.8; margin: 0.1em 0.1em 0 0; font-weight: bold;">${firstLetter}</span>${restOfContent}`;
    }
    
    return `<p style="${pStyle}">${content}</p>`;
  }).join('');
};

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
          <h2 style="font-size: {{TOC_FONT_SIZE}}pt; margin-bottom: 30px; {{TOC_TITLE_STYLE}}">{{TOC_TITLE}}</h2>
          <div style="line-height: 1.8; font-size: {{TOC_FONT_SIZE}}pt;">{{TOC_ENTRIES}}</div>
        </div>
        <div style="page-break-after: always;"></div>
      `,
      chapterTemplate: `
        <div class="chapter" style="margin-bottom: 40px;">
          {{CHAPTER_TITLE_HTML}}
          <div class="chapter-content">{{CHAPTER_CONTENT}}</div>
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
          <h2 style="font-size: {{TOC_FONT_SIZE}}pt; margin-bottom: 40px; font-weight: normal; letter-spacing: 1px;">{{TOC_TITLE}}</h2>
          <div style="line-height: 2.0; text-align: left; max-width: 400px; margin: 0 auto; font-size: {{TOC_FONT_SIZE}}pt;">{{TOC_ENTRIES}}</div>
        </div>
        <div style="page-break-after: always;"></div>
      `,
      chapterTemplate: `
        <div class="chapter" style="margin-bottom: 60px;">
          {{CHAPTER_TITLE_HTML}}
          <div class="chapter-content">{{CHAPTER_CONTENT}}</div>
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
          <h2 style="font-size: {{TOC_FONT_SIZE}}pt; margin-bottom: 30px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">{{TOC_TITLE}}</h2>
          <div style="line-height: 1.6; font-size: {{TOC_FONT_SIZE}}pt;">{{TOC_ENTRIES}}</div>
        </div>
        <div style="page-break-after: always;"></div>
      `,
      chapterTemplate: `
        <div class="chapter" style="margin-bottom: 50px;">
          {{CHAPTER_TITLE_HTML}}
          <div class="chapter-content">{{CHAPTER_CONTENT}}</div>
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
    
    // Apply document styles with enhanced typography
    const fontWeightValue = {
      'light': '300',
      'normal': '400',
      'medium': '500',
      'semibold': '600',
      'bold': '700'
    }[layoutOptions.fontWeight] || '400';

    const documentStyles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Merriweather:ital,wght@0,300;0,400;0,700;1,400&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Roboto:ital,wght@0,300;0,400;0,500;0,700;1,400&family=Source+Sans+Pro:ital,wght@0,300;0,400;0,600;0,700;1,400&display=swap');
        
        body {
          font-family: ${layoutOptions.fontFamily};
          font-size: ${layoutOptions.fontSize}pt;
          font-weight: ${fontWeightValue};
          line-height: ${layoutOptions.lineHeight};
          margin: ${layoutOptions.margins.top}pt ${layoutOptions.margins.right}pt ${layoutOptions.margins.bottom}pt ${layoutOptions.margins.left}pt;
          color: #333;
        }
        
        .chapter-content p {
          margin-bottom: ${layoutOptions.contentFormatting.paragraphSpacing}em;
          ${layoutOptions.contentFormatting.paragraphIndent > 0 ? `text-indent: ${layoutOptions.contentFormatting.paragraphIndent}em;` : ''}
          text-align: ${layoutOptions.contentFormatting.textAlignment};
        }
        
        .chapter-content p:first-child {
          text-indent: 0;
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
        .map((chapter, index) => {
          const chapterNumber = layoutOptions.tocOptions.includeChapterNumbers 
            ? getChapterNumber(index, layoutOptions.chapterTitleOptions.numberingStyle)
            : '';
          const prefix = layoutOptions.tocOptions.includeChapterNumbers && chapterNumber
            ? `${getChapterPrefix(layoutOptions.chapterTitleOptions)} ${chapterNumber}. `
            : '';
          
          const dotLeader = layoutOptions.tocOptions.dotLeaders && layoutOptions.tocOptions.includePageNumbers
            ? '<span style="flex: 1; border-bottom: 1px dotted #666; margin: 0 8px; height: 1em;"></span>'
            : '<span style="flex: 1;"></span>';
          
          const pageNumber = layoutOptions.tocOptions.includePageNumbers ? (index + 1).toString() : '';
          
          return `<div style="display: flex; align-items: baseline; margin-bottom: 8px;">
            <span>${prefix}${chapter!.title || 'Untitled'}</span>
            ${dotLeader}
            ${pageNumber ? `<span>${pageNumber}</span>` : ''}
           </div>`;
        })
        .join('');
      
      htmlContent += template.tocTemplate
        .replace('{{TOC_TITLE}}', layoutOptions.tocOptions.customTitle)
        .replace('{{TOC_ENTRIES}}', tocEntries)
        .replace(/{{TOC_FONT_SIZE}}/g, layoutOptions.tocOptions.tocFontSize.toString())
        .replace('{{TOC_TITLE_STYLE}}', `text-align: center;`);
    }

    // Add chapters
    for (const [index, chapter] of sortedChapters.entries()) {
      if (!chapter) continue;
      
      // Generate chapter title HTML
      const chapterNumber = getChapterNumber(index, layoutOptions.chapterTitleOptions.numberingStyle);
      const prefix = getChapterPrefix(layoutOptions.chapterTitleOptions);
      
      let titleText = '';
      if (prefix && chapterNumber) {
        titleText = `${prefix} ${chapterNumber}`;
      } else if (prefix) {
        titleText = prefix;
      } else if (chapterNumber) {
        titleText = chapterNumber;
      }
      
      if (titleText && chapter.title) {
        titleText += `: ${chapter.title}`;
      } else if (chapter.title) {
        titleText = chapter.title;
      }

      const titleFontWeight = {
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700'
      }[layoutOptions.chapterTitleOptions.fontWeight] || '700';

      let chapterTitleHtml = `
        <h1 class="chapter-title" style="
          font-family: ${layoutOptions.chapterTitleOptions.fontFamily};
          font-size: ${layoutOptions.chapterTitleOptions.fontSize}pt;
          font-weight: ${titleFontWeight};
          text-align: ${layoutOptions.chapterTitleOptions.alignment};
          margin-bottom: 30px;
          ${layoutOptions.chapterTitleOptions.includeUnderline ? 'border-bottom: 1px solid #ccc; padding-bottom: 10px;' : ''}
        ">${titleText || 'Untitled'}</h1>
      `;

      // Add separator if enabled
      if (layoutOptions.chapterTitleOptions.includeSeparator) {
        chapterTitleHtml += applySeparatorStyle(layoutOptions.chapterTitleOptions.separatorStyle);
      }
      
      // Process chapter content
      const processedContent = processContent(chapter.content || '', layoutOptions.contentFormatting);

      htmlContent += template.chapterTemplate
        .replace('{{CHAPTER_TITLE_HTML}}', chapterTitleHtml)
        .replace('{{CHAPTER_CONTENT}}', processedContent);

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
