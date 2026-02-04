import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Download, 
  Save,
  FileText,
  Check,
  X
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
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
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

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
];

const TEXT_COLORS = [
  { name: 'Default', color: 'inherit' },
  { name: 'Red', color: '#ef4444' },
  { name: 'Orange', color: '#f97316' },
  { name: 'Green', color: '#22c55e' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Purple', color: '#a855f7' },
];

const FONT_SIZES = [
  { name: 'Small', size: '0.875rem' },
  { name: 'Normal', size: '1rem' },
  { name: 'Large', size: '1.25rem' },
  { name: 'X-Large', size: '1.5rem' },
  { name: 'XX-Large', size: '2rem' },
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

export function ExpandedLessonEditor({
  lesson,
  materialColor,
  materialTitle,
  onSave,
  onClose,
}: ExpandedLessonEditorProps) {
  const [notes, setNotes] = useState(lesson.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFileName, setExportFileName] = useState(lesson.title);
  const [isExporting, setIsExporting] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const [activeColor, setActiveColor] = useState<string>('inherit');
  const contentRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({ multicolor: true }),
      FontSize,
      Color,
    ],
    content: notes,
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none min-h-[60vh] focus:outline-none text-foreground leading-relaxed p-6',
        dir: 'auto',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setNotes(html);
      
      // Auto-save with debounce
      setIsSaving(true);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        onSave(html);
        setIsSaving(false);
      }, 1000);
    },
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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

  const handleExportPDF = async () => {
    if (!contentRef.current) return;
    
    setIsExporting(true);
    
    try {
      // Dynamically import html2pdf
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Create a styled container for PDF export
      const exportContent = document.createElement('div');
      exportContent.innerHTML = `
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 40px; background: white; color: #1a1a1a;">
          <div style="border-bottom: 3px solid ${materialColor}; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="margin: 0 0 8px 0; font-size: 28px; color: #1a1a1a;">${lesson.title}</h1>
            <p style="margin: 0; color: #666; font-size: 14px;">${materialTitle}</p>
          </div>
          <div style="line-height: 1.8; font-size: 14px;">
            ${editor?.getHTML() || notes}
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
      
      toast.success('PDF exported successfully!');
      setShowExportDialog(false);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    // Save before closing
    if (editor) {
      onSave(editor.getHTML());
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
      className="fixed inset-0 z-50 bg-background"
    >
      {/* Header */}
      <header 
        className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-lg"
        style={{ borderColor: `${materialColor}20` }}
      >
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground line-clamp-1">
                {lesson.title}
              </h1>
              <p className="text-xs text-muted-foreground">{materialTitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isSaving ? (
              <span className="text-xs text-muted-foreground animate-pulse">
                Saving...
              </span>
            ) : (
              <span className="text-xs text-success flex items-center gap-1">
                <Check className="h-3 w-3" />
                Saved
              </span>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportDialog(true)}
              className="gap-2 rounded-xl"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export PDF</span>
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1.5 flex-wrap px-4 pb-3 overflow-x-auto">
          {/* Text Formatting Group */}
          <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-0.5">
            <Button
              type="button"
              variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </Button>
          </div>

          {/* Lists Group */}
          <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-0.5">
            <Button
              type="button"
              variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>

          {/* Color & Highlight Group */}
          <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-0.5">
            {/* Highlight Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 rounded-md gap-1"
                  title="Highlight"
                >
                  <Highlighter className="h-4 w-4" />
                  <div 
                    className="w-3 h-3 rounded-sm border border-border/50" 
                    style={{ backgroundColor: activeHighlight || 'transparent' }}
                  />
                  <ChevronDown className="h-3 w-3 opacity-50" />
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

            {/* Text Color Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 rounded-md gap-1"
                  title="Text Color"
                >
                  <Palette className="h-4 w-4" />
                  <div 
                    className="w-3 h-3 rounded-full border border-border/50" 
                    style={{ backgroundColor: activeColor === 'inherit' ? 'currentColor' : activeColor }}
                  />
                  <ChevronDown className="h-3 w-3 opacity-50" />
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

          {/* Font Size Group */}
          <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 rounded-md gap-1"
                  title="Font Size"
                >
                  <Type className="h-4 w-4" />
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[120px]">
                {FONT_SIZES.map((item) => (
                  <DropdownMenuItem
                    key={item.size}
                    onClick={() => setFontSize(item.size)}
                    className="gap-2"
                  >
                    <span style={{ fontSize: item.size }}>{item.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Undo/Redo Group */}
          <div className="flex items-center gap-0.5 bg-secondary rounded-lg p-0.5 ml-auto">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Editor Content */}
      <div 
        ref={contentRef}
        className="mx-auto max-w-4xl"
      >
        <div 
          className="min-h-[calc(100vh-140px)] bg-card shadow-sm mx-4 my-4 rounded-2xl border"
          style={{ borderColor: `${materialColor}20` }}
        >
          <EditorContent 
            editor={editor} 
            className="[&_.ProseMirror]:min-h-[60vh] [&_.ProseMirror]:max-w-full [&_.ProseMirror]:overflow-x-hidden [&_.ProseMirror]:break-words [&_.ProseMirror]:focus:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground/50 [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:my-3 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol]:my-3 [&_.ProseMirror_li]:my-1.5 [&_.ProseMirror_li]:leading-relaxed [&_.ProseMirror_li_p]:inline [&_.ProseMirror_strong]:font-bold [&_.ProseMirror_em]:italic [&_.ProseMirror_p]:my-2 [&_.ProseMirror_p]:leading-relaxed [&_.ProseMirror_mark]:px-0.5 [&_.ProseMirror_mark]:rounded"
          />
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
              The file will be saved as "{exportFileName || lesson.title}.pdf"
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
