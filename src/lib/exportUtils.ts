
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

interface Chapter {
  id: string;
  title: string;
  content: string;
  word_count: number;
  order_index: number;
  status: string;
}

interface Project {
  id: string;
  title: string;
}

export const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  const textarea = document.createElement('textarea');
  textarea.innerHTML = html.replace(/<[^>]*>/g, '');
  return textarea.value;
};

export const exportToPDF = async (
  project: Project,
  chapters: Chapter[],
  includeMetadata: boolean = true
): Promise<void> => {
  const pdf = new jsPDF();
  let yPosition = 20;

  // Add title
  pdf.setFontSize(20);
  pdf.text(project.title, 20, yPosition);
  yPosition += 20;

  if (includeMetadata) {
    pdf.setFontSize(12);
    pdf.text(`Total Chapters: ${chapters.length}`, 20, yPosition);
    yPosition += 10;
    const totalWords = chapters.reduce((sum, ch) => sum + ch.word_count, 0);
    pdf.text(`Total Words: ${totalWords}`, 20, yPosition);
    yPosition += 20;
  }

  for (const chapter of chapters) {
    // Check if we need a new page
    if (yPosition > 250) {
      pdf.addPage();
      yPosition = 20;
    }

    // Chapter title
    pdf.setFontSize(16);
    pdf.text(chapter.title, 20, yPosition);
    yPosition += 15;

    // Chapter content
    pdf.setFontSize(11);
    const content = stripHtmlTags(chapter.content);
    const lines = pdf.splitTextToSize(content, 170);
    
    for (const line of lines) {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(line, 20, yPosition);
      yPosition += 5;
    }
    
    yPosition += 10;
  }

  pdf.save(`${project.title}.pdf`);
};

export const exportToDOCX = async (
  project: Project,
  chapters: Chapter[],
  includeMetadata: boolean = true
): Promise<void> => {
  const children = [];

  // Add title
  children.push(
    new Paragraph({
      text: project.title,
      heading: HeadingLevel.TITLE,
    })
  );

  if (includeMetadata) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Total Chapters: ${chapters.length}`,
          }),
        ],
      })
    );
    
    const totalWords = chapters.reduce((sum, ch) => sum + ch.word_count, 0);
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Total Words: ${totalWords}`,
          }),
        ],
      })
    );

    children.push(new Paragraph({ text: '' })); // Empty line
  }

  for (const chapter of chapters) {
    // Chapter title
    children.push(
      new Paragraph({
        text: chapter.title,
        heading: HeadingLevel.HEADING_1,
      })
    );

    // Chapter content
    const content = stripHtmlTags(chapter.content);
    const paragraphs = content.split('\n').filter(p => p.trim());
    
    for (const paragraph of paragraphs) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: paragraph,
            }),
          ],
        })
      );
    }

    children.push(new Paragraph({ text: '' })); // Empty line between chapters
  }

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.title}.docx`;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportToTXT = (
  project: Project,
  chapters: Chapter[],
  includeMetadata: boolean = true
): void => {
  let content = `${project.title}\n`;
  content += '='.repeat(project.title.length) + '\n\n';

  if (includeMetadata) {
    content += `Total Chapters: ${chapters.length}\n`;
    const totalWords = chapters.reduce((sum, ch) => sum + ch.word_count, 0);
    content += `Total Words: ${totalWords}\n\n`;
  }

  for (const chapter of chapters) {
    content += `${chapter.title}\n`;
    content += '-'.repeat(chapter.title.length) + '\n\n';
    content += stripHtmlTags(chapter.content) + '\n\n';
  }

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.title}.txt`;
  link.click();
  URL.revokeObjectURL(url);
};
