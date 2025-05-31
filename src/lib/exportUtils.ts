
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

export interface ExportOptions {
  format: 'pdf' | 'docx' | 'txt';
  includeMetadata: boolean;
  projectTitle?: string;
  authorName?: string;
}

export interface ChapterData {
  title: string;
  content: string;
  word_count: number;
  status: string;
  order_index: number;
}

export const exportSingleChapter = async (chapter: ChapterData, options: ExportOptions) => {
  const filename = `${sanitizeFilename(chapter.title)}.${options.format}`;
  
  switch (options.format) {
    case 'pdf':
      return exportChapterToPDF(chapter, filename, options);
    case 'docx':
      return exportChapterToDOCX(chapter, filename, options);
    case 'txt':
      return exportChapterToTXT(chapter, filename, options);
    default:
      throw new Error('Unsupported export format');
  }
};

export const exportMultipleChapters = async (chapters: ChapterData[], options: ExportOptions & { projectTitle: string }) => {
  const filename = `${sanitizeFilename(options.projectTitle)}.${options.format}`;
  
  switch (options.format) {
    case 'pdf':
      return exportChaptersToPDF(chapters, filename, options);
    case 'docx':
      return exportChaptersToDOCX(chapters, filename, options);
    case 'txt':
      return exportChaptersToTXT(chapters, filename, options);
    default:
      throw new Error('Unsupported export format');
  }
};

const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
};

const exportChapterToPDF = async (chapter: ChapterData, filename: string, options: ExportOptions) => {
  const pdf = new jsPDF();
  
  // Add metadata if requested
  if (options.includeMetadata) {
    pdf.setFontSize(12);
    pdf.text(`Title: ${chapter.title}`, 20, 20);
    pdf.text(`Status: ${chapter.status}`, 20, 30);
    pdf.text(`Word Count: ${chapter.word_count}`, 20, 40);
    pdf.text('---', 20, 50);
  }
  
  // Add content
  const startY = options.includeMetadata ? 60 : 20;
  pdf.setFontSize(16);
  pdf.text(chapter.title, 20, startY);
  
  pdf.setFontSize(12);
  const splitContent = pdf.splitTextToSize(chapter.content, 170);
  pdf.text(splitContent, 20, startY + 10);
  
  pdf.save(filename);
};

const exportChapterToDOCX = async (chapter: ChapterData, filename: string, options: ExportOptions) => {
  const children = [];
  
  // Add metadata if requested
  if (options.includeMetadata) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Title: ${chapter.title}`, bold: true })],
      }),
      new Paragraph({
        children: [new TextRun(`Status: ${chapter.status}`)],
      }),
      new Paragraph({
        children: [new TextRun(`Word Count: ${chapter.word_count}`)],
      }),
      new Paragraph({
        children: [new TextRun('---')],
      })
    );
  }
  
  // Add title and content
  children.push(
    new Paragraph({
      text: chapter.title,
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({
      children: [new TextRun(chapter.content)],
    })
  );
  
  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  });
  
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, filename);
};

const exportChapterToTXT = (chapter: ChapterData, filename: string, options: ExportOptions) => {
  let content = '';
  
  // Add metadata if requested
  if (options.includeMetadata) {
    content += `Title: ${chapter.title}\n`;
    content += `Status: ${chapter.status}\n`;
    content += `Word Count: ${chapter.word_count}\n`;
    content += '---\n\n';
  }
  
  content += `${chapter.title}\n\n${chapter.content}`;
  
  const blob = new Blob([content], { type: 'text/plain' });
  downloadBlob(blob, filename);
};

const exportChaptersToPDF = async (chapters: ChapterData[], filename: string, options: ExportOptions & { projectTitle: string }) => {
  const pdf = new jsPDF();
  
  // Add project title page
  pdf.setFontSize(20);
  pdf.text(options.projectTitle, 20, 30);
  
  if (options.includeMetadata) {
    pdf.setFontSize(12);
    pdf.text(`Total Chapters: ${chapters.length}`, 20, 50);
    pdf.text(`Total Words: ${chapters.reduce((sum, ch) => sum + ch.word_count, 0)}`, 20, 60);
  }
  
  // Add each chapter
  chapters.forEach((chapter, index) => {
    if (index > 0) pdf.addPage();
    
    pdf.setFontSize(16);
    pdf.text(`Chapter ${chapter.order_index}: ${chapter.title}`, 20, 20);
    
    pdf.setFontSize(12);
    const splitContent = pdf.splitTextToSize(chapter.content, 170);
    pdf.text(splitContent, 20, 30);
  });
  
  pdf.save(filename);
};

const exportChaptersToDOCX = async (chapters: ChapterData[], filename: string, options: ExportOptions & { projectTitle: string }) => {
  const children = [];
  
  // Add project title
  children.push(
    new Paragraph({
      text: options.projectTitle,
      heading: HeadingLevel.TITLE,
    })
  );
  
  // Add metadata if requested
  if (options.includeMetadata) {
    children.push(
      new Paragraph({
        children: [new TextRun(`Total Chapters: ${chapters.length}`)],
      }),
      new Paragraph({
        children: [new TextRun(`Total Words: ${chapters.reduce((sum, ch) => sum + ch.word_count, 0)}`)],
      })
    );
  }
  
  // Add each chapter
  chapters.forEach((chapter) => {
    children.push(
      new Paragraph({
        text: `Chapter ${chapter.order_index}: ${chapter.title}`,
        heading: HeadingLevel.HEADING_1,
      }),
      new Paragraph({
        children: [new TextRun(chapter.content)],
      })
    );
  });
  
  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  });
  
  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, filename);
};

const exportChaptersToTXT = (chapters: ChapterData[], filename: string, options: ExportOptions & { projectTitle: string }) => {
  let content = `${options.projectTitle}\n\n`;
  
  // Add metadata if requested
  if (options.includeMetadata) {
    content += `Total Chapters: ${chapters.length}\n`;
    content += `Total Words: ${chapters.reduce((sum, ch) => sum + ch.word_count, 0)}\n\n`;
  }
  
  // Add each chapter
  chapters.forEach((chapter) => {
    content += `Chapter ${chapter.order_index}: ${chapter.title}\n\n`;
    content += `${chapter.content}\n\n---\n\n`;
  });
  
  const blob = new Blob([content], { type: 'text/plain' });
  downloadBlob(blob, filename);
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
