
import React, { useRef, useEffect, useState } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Type, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RichTextEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  onScrollSync?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  scrollPosition?: number;
  placeholder?: string;
}

const RichTextEditor = ({ 
  content, 
  onContentChange, 
  onScrollSync,
  scrollPosition,
  placeholder = "Start writing..."
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-full p-4 text-sm leading-relaxed',
        spellcheck: 'true',
      },
    },
  });

  // Handle scroll synchronization
  useEffect(() => {
    const editorElement = editorRef.current?.querySelector('.ProseMirror');
    if (!editorElement || !onScrollSync) return;

    const handleScroll = (e: Event) => {
      const element = e.target as HTMLElement;
      const { scrollTop, scrollHeight, clientHeight } = element;
      onScrollSync(scrollTop, scrollHeight, clientHeight);
    };

    editorElement.addEventListener('scroll', handleScroll);
    return () => editorElement.removeEventListener('scroll', handleScroll);
  }, [onScrollSync]);

  // Sync scroll position when it changes externally
  useEffect(() => {
    if (scrollPosition !== undefined && editorRef.current) {
      const editorElement = editorRef.current.querySelector('.ProseMirror');
      if (editorElement) {
        editorElement.scrollTop = scrollPosition;
      }
    }
  }, [scrollPosition]);

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleFind = () => {
    if (editor && findText) {
      const { state } = editor;
      const { doc } = state;
      let found = false;
      
      doc.descendants((node, pos) => {
        if (node.isText && node.text?.includes(findText)) {
          editor.commands.setTextSelection({ from: pos, to: pos + findText.length });
          found = true;
          return false;
        }
      });
      
      if (!found) {
        console.log('Text not found');
      }
    }
  };

  const handleReplace = () => {
    if (editor && findText && replaceText) {
      const content = editor.getHTML();
      const newContent = content.replace(new RegExp(findText, 'g'), replaceText);
      editor.commands.setContent(newContent);
      onContentChange(newContent);
    }
  };

  if (!editor) {
    return <div className="flex-1 p-4">Loading editor...</div>;
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Rich Text Toolbar */}
      <div className="border-b border-slate-200 p-2 flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-slate-200' : ''}`}
        >
          <Bold className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-slate-200' : ''}`}
        >
          <Italic className="w-4 h-4" />
        </Button>
        
        <Select onValueChange={(value) => {
          if (value === '0') {
            editor.chain().focus().setParagraph().run();
          } else {
            editor.chain().focus().toggleHeading({ level: parseInt(value) as any }).run();
          }
        }}>
          <SelectTrigger className="h-8 w-24">
            <Type className="w-4 h-4" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Normal</SelectItem>
            <SelectItem value="1">H1</SelectItem>
            <SelectItem value="2">H2</SelectItem>
            <SelectItem value="3">H3</SelectItem>
          </SelectContent>
        </Select>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFindReplace(!showFindReplace)}
          className="h-8 w-8 p-0"
        >
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {/* Find & Replace Bar */}
      {showFindReplace && (
        <div className="border-b border-slate-200 p-2 flex items-center space-x-2 bg-slate-50">
          <input
            type="text"
            placeholder="Find..."
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            className="px-2 py-1 border border-slate-300 rounded text-sm"
          />
          <input
            type="text"
            placeholder="Replace..."
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            className="px-2 py-1 border border-slate-300 rounded text-sm"
          />
          <Button size="sm" onClick={handleFind}>Find</Button>
          <Button size="sm" onClick={handleReplace}>Replace All</Button>
        </div>
      )}

      {/* Bubble Menu for selection-based formatting */}
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-1 flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-slate-200' : ''}`}
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-slate-200' : ''}`}
          >
            <Italic className="w-4 h-4" />
          </Button>
        </div>
      </BubbleMenu>

      {/* Editor Content */}
      <div ref={editorRef} className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
};

export default RichTextEditor;
