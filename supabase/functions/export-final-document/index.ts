import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExportRequest {
  projectId: string;
  htmlContent: string;
  exportFormat: 'pdf' | 'docx' | 'txt' | 'epub';
  layoutOptions: any;
  metadata: {
    projectTitle: string;
    chapterCount: number;
    wordCount: number;
  };
}

const generatePDF = async (htmlContent: string, layoutOptions: any): Promise<Uint8Array> => {
  // For production, this would use Puppeteer or similar
  // For now, return a mock PDF structure
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
72 720 Td
(${layoutOptions.metadata?.projectTitle || 'Document'}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000215 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
308
%%EOF`;
  
  return new TextEncoder().encode(pdfContent);
};

const generateDOCX = async (htmlContent: string, metadata: any): Promise<Uint8Array> => {
  // For production, this would use the docx package
  // For now, return a simple RTF format that Word can read
  const rtfContent = `{\\rtf1\\ansi\\deff0 
{\\fonttbl{\\f0 Times New Roman;}}
\\f0\\fs24 
${metadata.projectTitle}\\par\\par
${htmlContent.replace(/<[^>]*>/g, '').replace(/\n/g, '\\par ')}
}`;
  
  return new TextEncoder().encode(rtfContent);
};

const generateTXT = async (htmlContent: string, metadata: any): Promise<Uint8Array> => {
  const textContent = `${metadata.projectTitle}\n\n${htmlContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()}`;
  return new TextEncoder().encode(textContent);
};

const generateEPUB = async (htmlContent: string, metadata: any): Promise<Uint8Array> => {
  // For production, this would use epub-gen or similar
  // For now, return a mock EPUB structure
  const epubContent = `PK\x03\x04\x14\x00\x08\x00\x08\x00
${metadata.projectTitle}
${htmlContent}`;
  
  return new TextEncoder().encode(epubContent);
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

    const requestData: ExportRequest = await req.json();
    const { projectId, htmlContent, exportFormat, layoutOptions, metadata } = requestData;

    console.log('Generating document:', exportFormat, 'for project:', projectId);

    // Get user info for tracking
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Generate the document based on format
    let documentBuffer: Uint8Array;
    let contentType: string;
    let filename: string;

    switch (exportFormat) {
      case 'pdf':
        documentBuffer = await generatePDF(htmlContent, { metadata, ...layoutOptions });
        contentType = 'application/pdf';
        filename = `${metadata.projectTitle}.pdf`;
        break;
      case 'docx':
        documentBuffer = await generateDOCX(htmlContent, metadata);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = `${metadata.projectTitle}.docx`;
        break;
      case 'txt':
        documentBuffer = await generateTXT(htmlContent, metadata);
        contentType = 'text/plain';
        filename = `${metadata.projectTitle}.txt`;
        break;
      case 'epub':
        documentBuffer = await generateEPUB(htmlContent, metadata);
        contentType = 'application/epub+zip';
        filename = `${metadata.projectTitle}.epub`;
        break;
      default:
        throw new Error('Unsupported export format');
    }

    // Track export in history
    const { error: historyError } = await supabase
      .from('export_history')
      .insert({
        user_id: user.id,
        project_id: projectId,
        export_format: exportFormat,
        template_id: layoutOptions.templateId || 'default',
        selected_chapters: [],
        file_size_bytes: documentBuffer.length,
        export_status: 'completed',
        completed_at: new Date().toISOString()
      });

    if (historyError) {
      console.warn('Failed to track export history:', historyError);
    }

    console.log('Document generated successfully, size:', documentBuffer.length, 'bytes');

    return new Response(documentBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': documentBuffer.length.toString(),
      },
    });

  } catch (error: any) {
    console.error('Error in export-final-document:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);