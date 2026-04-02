import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Download, 
  Check,
  FileText,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import {
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Undo, 
  Redo,
  Highlighter,
  Palette,
  Type,
  ChevronDown,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  Code,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Minus,
  RotateCcw,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Lesson {
  id: string;
  title: string;
  completed: boolean;
  position: number | null;
  notes: string | null;
}

interface ExpandedLessonEditorProps {
  lesson: Lesson;
  materialColor: string;
  materialTitle: string;
  onSave: (notes: string) => void;
  onClose: () => void;
}

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', color: '#fef08a' },
  { name: 'Green', color: '#bbf7d0' },
  { name: 'Blue', color: '#bfdbfe' },
  { name: 'Pink', color: '#fbcfe8' },
  { name: 'Orange', color: '#fed7aa' },
  { name: 'Purple', color: '#e9d5ff' },
  { name: 'Red', color: '#fecaca' },
  { name: 'Cyan', color: '#a5f3fc' },
];

const TEXT_COLORS = [
  { name: 'Default', color: 'inherit' },
  { name: 'Red', color: '#ef4444' },
  { name: 'Orange', color: '#f97316' },
  { name: 'Yellow', color: '#eab308' },
  { name: 'Green', color: '#22c55e' },
  { name: 'Teal', color: '#14b8a6' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Purple', color: '#a855f7' },
  { name: 'Pink', color: '#ec4899' },
  { name: 'Gray', color: '#6b7280' },
];

const FONT_SIZES = [
  { name: 'XS', size: '0.75rem' },
  { name: 'Small', size: '0.875rem' },
  { name: 'Normal', size: '1rem' },
  { name: 'Large', size: '1.125rem' },
  { name: 'XL', size: '1.25rem' },
  { name: '2XL', size: '1.5rem' },
  { name: '3XL', size: '1.875rem' },
  { name: '4XL', size: '2.25rem' },
];

// Custom extension to handle font size
const FontSize = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: element => element.style.fontSize || null,
        renderHTML: attributes => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize}` };
        },
      },
    };
  },
});

interface Page {
  id: string;
  content: string;
}

export function ExpandedLessonEditor({
  lesson,
  materialColor,
  materialTitle,
  onSave,
  onClose,
}: ExpandedLessonEditorProps) {
  // Parse pages from notes or create default
  const parsePages = (notes: string | null): Page[] => {
    if (!notes) return [{ id: '1', content: '' }];
    try {
      const parsed = JSON.parse(notes);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // Not JSON, treat as single page
      return [{ id: '1', content: notes }];
    }
    return [{ id: '1', content: '' }];
  };

  const [pages, setPages] = useState<Page[]>(() => parsePages(lesson.notes));
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFileName, setExportFileName] = useState(lesson.title);
  const [isExporting, setIsExporting] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const [activeColor, setActiveColor] = useState<string>('inherit');
  const contentRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentPage = pages[currentPageIndex] || { id: '1', content: '' };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Highlight.configure({ multicolor: true }),
      FontSize,
      Color,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Subscript,
      Superscript,
    ],
    content: currentPage.content,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none min-h-[70vh] focus:outline-none text-foreground leading-relaxed p-8',
        dir: 'auto',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      
      // Update current page
      setPages(prev => prev.map((p, i) => 
        i === currentPageIndex ? { ...p, content: html } : p
      ));
      
      // Auto-save with debounce
      setIsSaving(true);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        const updatedPages = pages.map((p, i) => 
          i === currentPageIndex ? { ...p, content: html } : p
        );
        onSave(JSON.stringify(updatedPages));
        setIsSaving(false);
      }, 1000);
    },
  });

  // Update editor content when page changes
  useEffect(() => {
    if (editor && currentPage.content !== editor.getHTML()) {
      editor.commands.setContent(currentPage.content);
    }
  }, [currentPageIndex]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const addPage = () => {
    const newPage = { id: Date.now().toString(), content: '' };
    setPages(prev => [...prev, newPage]);
    setCurrentPageIndex(pages.length);
  };

  const deletePage = (index: number) => {
    if (pages.length <= 1) return;
    setPages(prev => prev.filter((_, i) => i !== index));
    if (currentPageIndex >= pages.length - 1) {
      setCurrentPageIndex(Math.max(0, pages.length - 2));
    }
  };

  const goToPage = (index: number) => {
    // Save current page content first
    if (editor) {
      const updatedPages = pages.map((p, i) => 
        i === currentPageIndex ? { ...p, content: editor.getHTML() } : p
      );
      setPages(updatedPages);
    }
    setCurrentPageIndex(index);
  };

  const setHighlight = useCallback((color: string) => {
    if (!editor) return;
    editor.chain().focus().toggleHighlight({ color }).run();
    setActiveHighlight(color);
  }, [editor]);

  const setTextColor = useCallback((color: string) => {
    if (!editor) return;
    if (color === 'inherit') {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(color).run();
    }
    setActiveColor(color);
  }, [editor]);

  const setFontSize = useCallback((size: string) => {
    if (!editor) return;
    editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
  }, [editor]);

  const removeHighlight = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetHighlight().run();
    setActiveHighlight(null);
  }, [editor]);

  const clearFormatting = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().clearNodes().unsetAllMarks().run();
  }, [editor]);

  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    
    setIsExporting(true);
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Combine all pages for export
      const allContent = pages.map((p, i) => `
        <div style="page-break-after: ${i < pages.length - 1 ? 'always' : 'auto'}; margin-bottom: 40px;">
          <div style="color: #999; font-size: 12px; margin-bottom: 20px;">Page ${i + 1} of ${pages.length}</div>
          ${p.content}
        </div>
      `).join('');
      
      const exportContent = document.createElement('div');
      exportContent.innerHTML = `
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 40px; background: white; color: #1a1a1a;">
          <div style="border-bottom: 3px solid ${materialColor}; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="margin: 0 0 8px 0; font-size: 28px; color: #1a1a1a;">${lesson.title}</h1>
            <p style="margin: 0; color: #666; font-size: 14px;">${materialTitle}</p>
          </div>
          <div style="line-height: 1.8; font-size: 14px;">
            ${allContent}
          </div>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
            Generated from StudyHub • ${new Date().toLocaleDateString()}
          </div>
        </div>
      `;
      
      const opt = {
        margin: 0,
        filename: `${exportFileName || lesson.title}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
      };
      
      await html2pdf().set(opt).from(exportContent).save();
      setShowExportDialog(false);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    if (editor) {
      const updatedPages = pages.map((p, i) => 
        i === currentPageIndex ? { ...p, content: editor.getHTML() } : p
      );
      onSave(JSON.stringify(updatedPages));
    }
    onClose();
  };

  if (!editor) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-background"
    >
      {/* Header */}
      <header 
        className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-lg"
        style={{ borderColor: `${materialColor}30` }}
      >
        <div className="flex h-14 items-center justify-between px-3 md:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-xl h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground line-clamp-1 text-sm md:text-base">
                {lesson.title}
              </h1>
              <p className="text-xs text-muted-foreground hidden md:block">{materialTitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs transition-opacity",
              isSaving ? "text-muted-foreground" : "text-success"
            )}>
              {isSaving ? "..." : <Check className="h-4 w-4 inline" />}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportDialog(true)}
              className="gap-1.5 rounded-xl h-8 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          </div>
        </div>

        {/* Toolbar - Compact and organized */}
        <div className="flex items-center gap-1 px-3 pb-2 overflow-x-auto scrollbar-hide">
          {/* Headings */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5 shrink-0">
            <Button
              type="button"
              variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              title="Heading 1"
            >
              <Heading1 className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              title="Heading 2"
            >
              <Heading2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              title="Heading 3"
            >
              <Heading3 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Text Formatting */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5 shrink-0">
            <Button
              type="button"
              variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Bold"
            >
              <Bold className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Italic"
            >
              <Italic className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              title="Underline"
            >
              <UnderlineIcon className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              title="Strikethrough"
            >
              <Strikethrough className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Lists & Blocks */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5 shrink-0">
            <Button
              type="button"
              variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Bullet List"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Numbered List"
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              title="Quote"
            >
              <Quote className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('codeBlock') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              title="Code Block"
            >
              <Code className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Alignment */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5 shrink-0">
            <Button
              type="button"
              variant={editor.isActive({ textAlign: 'left' }) ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              title="Align Left"
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive({ textAlign: 'center' }) ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              title="Align Center"
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive({ textAlign: 'right' }) ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              title="Align Right"
            >
              <AlignRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive({ textAlign: 'justify' }) ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              title="Justify"
            >
              <AlignJustify className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Script */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5 shrink-0">
            <Button
              type="button"
              variant={editor.isActive('subscript') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().toggleSubscript().run()}
              title="Subscript"
            >
              <SubscriptIcon className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('superscript') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().toggleSuperscript().run()}
              title="Superscript"
            >
              <SuperscriptIcon className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Colors */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-1.5 rounded-md gap-0.5"
                  title="Highlight"
                >
                  <Highlighter className="h-3.5 w-3.5" />
                  <div 
                    className="w-2.5 h-2.5 rounded-sm border border-border/50" 
                    style={{ backgroundColor: activeHighlight || 'transparent' }}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[140px]">
                <DropdownMenuItem onClick={removeHighlight} className="gap-2">
                  <div className="w-4 h-4 rounded border border-dashed border-border" />
                  <span>None</span>
                </DropdownMenuItem>
                {HIGHLIGHT_COLORS.map((item) => (
                  <DropdownMenuItem
                    key={item.color}
                    onClick={() => setHighlight(item.color)}
                    className="gap-2"
                  >
                    <div 
                      className="w-4 h-4 rounded border border-border/50"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-1.5 rounded-md gap-0.5"
                  title="Text Color"
                >
                  <Palette className="h-3.5 w-3.5" />
                  <div 
                    className="w-2.5 h-2.5 rounded-full border border-border/50" 
                    style={{ backgroundColor: activeColor === 'inherit' ? 'currentColor' : activeColor }}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[140px]">
                {TEXT_COLORS.map((item) => (
                  <DropdownMenuItem
                    key={item.color}
                    onClick={() => setTextColor(item.color)}
                    className="gap-2"
                  >
                    <div 
                      className="w-4 h-4 rounded-full border border-border/50"
                      style={{ backgroundColor: item.color === 'inherit' ? 'currentColor' : item.color }}
                    />
                    <span>{item.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Font Size */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5 shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-1.5 rounded-md gap-0.5"
                  title="Font Size"
                >
                  <Type className="h-3.5 w-3.5" />
                  <ChevronDown className="h-2.5 w-2.5 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[100px]">
                {FONT_SIZES.map((item) => (
                  <DropdownMenuItem
                    key={item.size}
                    onClick={() => setFontSize(item.size)}
                  >
                    <span style={{ fontSize: item.size }}>{item.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Utilities */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Horizontal Line"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={clearFormatting}
              title="Clear Formatting"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Undo/Redo */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5 ml-auto shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
            >
              <Undo className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
            >
              <Redo className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Editor Content */}
      <div 
        ref={contentRef}
        className="mx-auto max-w-5xl h-[calc(100vh-180px)] overflow-y-auto"
      >
        <div 
          className="min-h-full bg-card shadow-soft mx-2 md:mx-4 my-4 rounded-2xl border"
          style={{ borderColor: `${materialColor}25` }}
        >
          <EditorContent 
            editor={editor} 
            className="[&_.ProseMirror]:min-h-[70vh] [&_.ProseMirror]:max-w-full [&_.ProseMirror]:overflow-x-hidden [&_.ProseMirror]:break-words [&_.ProseMirror]:focus:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground/50 [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:my-3 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol]:my-3 [&_.ProseMirror_li]:my-1.5 [&_.ProseMirror_li]:leading-relaxed [&_.ProseMirror_li_p]:inline [&_.ProseMirror_strong]:font-bold [&_.ProseMirror_em]:italic [&_.ProseMirror_p]:my-2 [&_.ProseMirror_p]:leading-relaxed [&_.ProseMirror_mark]:px-0.5 [&_.ProseMirror_mark]:rounded [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:my-4 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-semibold [&_.ProseMirror_h2]:my-3 [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-medium [&_.ProseMirror_h3]:my-2 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-primary/30 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:my-4 [&_.ProseMirror_pre]:bg-secondary [&_.ProseMirror_pre]:rounded-lg [&_.ProseMirror_pre]:p-4 [&_.ProseMirror_pre]:my-4 [&_.ProseMirror_code]:bg-secondary [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:text-sm [&_.ProseMirror_hr]:my-6 [&_.ProseMirror_hr]:border-border"
          />
        </div>
      </div>

      {/* Page Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t py-2 px-4">
        <div className="flex items-center justify-center gap-2 max-w-5xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToPage(Math.max(0, currentPageIndex - 1))}
            disabled={currentPageIndex === 0}
            className="h-8 w-8 rounded-lg"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1.5 overflow-x-auto px-2 max-w-[60vw]">
            {pages.map((page, index) => (
              <Button
                key={page.id}
                variant={currentPageIndex === index ? 'default' : 'outline'}
                size="sm"
                onClick={() => goToPage(index)}
                className="h-8 min-w-[32px] rounded-lg text-xs shrink-0"
              >
                {index + 1}
              </Button>
            ))}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={addPage}
              className="h-8 w-8 rounded-lg shrink-0"
              title="Add Page"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => goToPage(Math.min(pages.length - 1, currentPageIndex + 1))}
            disabled={currentPageIndex === pages.length - 1}
            className="h-8 w-8 rounded-lg"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {pages.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deletePage(currentPageIndex)}
              className="h-8 w-8 rounded-lg text-destructive hover:text-destructive ml-2"
              title="Delete Current Page"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Export as PDF
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                File Name
              </label>
              <Input
                value={exportFileName}
                onChange={(e) => setExportFileName(e.target.value)}
                placeholder="Enter file name..."
                className="rounded-xl"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              The file will be saved as "{exportFileName || lesson.title}.pdf" with {pages.length} page(s)
            </p>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="gap-2 rounded-xl"
            >
              {isExporting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Export PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
