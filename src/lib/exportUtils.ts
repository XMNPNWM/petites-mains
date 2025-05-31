
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
  description?: string;
}

export const exportToPDF = async (project: Project, chapters: Chapter[]) => {
  const pdf = new jsPDF();
  let yPosition = 20;

  // Add project title
  pdf.setFontSize(20);
  pdf.text(project.title, 20, yPosition);
  yPosition += 20;

  if (project.description) {
    pdf.setFontSize(12);
    const splitDescription = pdf.splitTextToSize(project.description, 170);
    pdf.text(splitDescription, 20, yPosition);
    yPosition += splitDescription.length * 7 + 10;
  }

  // Add chapters
  for (const chapter of chapters.sort((a, b) => a.order_index - b.order_index)) {
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
    const content = chapter.content || 'No content yet.';
    const splitContent = pdf.splitTextToSize(content, 170);
    
    for (let i = 0; i < splitContent.length; i++) {
      if (yPosition > 280) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(splitContent[i], 20, yPosition);
      yPosition += 6;
    }
    
    yPosition += 15;
  }

  return pdf;
};

export const exportToDocx = async (project: Project, chapters: Chapter[]) => {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: project.title,
            heading: HeadingLevel.TITLE,
          }),
          ...(project.description ? [
            new Paragraph({
              text: project.description,
              spacing: { after: 400 },
            }),
          ] : []),
          ...chapters
            .sort((a, b) => a.order_index - b.order_index)
            .flatMap((chapter) => [
              new Paragraph({
                text: chapter.title,
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400, after: 200 },
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: chapter.content || 'No content yet.',
                  }),
                ],
                spacing: { after: 400 },
              }),
            ]),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
};

export const exportToTxt = (project: Project, chapters: Chapter[]) => {
  let content = `${project.title}\n`;
  content += '='.repeat(project.title.length) + '\n\n';
  
  if (project.description) {
    content += `${project.description}\n\n`;
  }

  chapters
    .sort((a, b) => a.order_index - b.order_index)
    .forEach((chapter) => {
      content += `${chapter.title}\n`;
      content += '-'.repeat(chapter.title.length) + '\n\n';
      content += `${chapter.content || 'No content yet.'}\n\n\n`;
    });

  return content;
};

export const downloadFile = (content: string | Blob, filename: string, type?: string) => {
  const blob = typeof content === 'string' 
    ? new Blob([content], { type: type || 'text/plain' })
    : content;
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
