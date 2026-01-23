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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useState, useCallback } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
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

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const [activeColor, setActiveColor] = useState<string>('inherit');
  const [activeFontSize, setActiveFontSize] = useState<string>('1rem');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({ multicolor: true }),
      FontSize,
      Color,
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[120px] focus:outline-none text-foreground leading-relaxed',
        dir: 'auto',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update editor content when external content changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '');
    }
  }, [content, editor]);

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
    setActiveFontSize(size);
  }, [editor]);

  const removeHighlight = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().unsetHighlight().run();
    setActiveHighlight(null);
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Advanced Toolbar */}
      <div className="flex items-center gap-1.5 flex-wrap bg-muted/30 rounded-xl p-2 border border-border/30">
        {/* Text Formatting Group */}
        <div className="flex items-center gap-0.5 bg-background rounded-lg p-0.5 shadow-sm">
          <Button
            type="button"
            variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8 rounded-md transition-all"
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8 rounded-md transition-all"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
        </div>

        {/* Lists Group */}
        <div className="flex items-center gap-0.5 bg-background rounded-lg p-0.5 shadow-sm">
          <Button
            type="button"
            variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8 rounded-md transition-all"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8 rounded-md transition-all"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        {/* Color & Highlight Group */}
        <div className="flex items-center gap-0.5 bg-background rounded-lg p-0.5 shadow-sm">
          {/* Highlight Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 rounded-md gap-1 transition-all"
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
                className="h-8 px-2 rounded-md gap-1 transition-all"
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
        <div className="flex items-center gap-0.5 bg-background rounded-lg p-0.5 shadow-sm">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 rounded-md gap-1 transition-all"
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
        <div className="flex items-center gap-0.5 bg-background rounded-lg p-0.5 shadow-sm ml-auto">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md transition-all"
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
            className="h-8 w-8 rounded-md transition-all"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor Container */}
      <div className="relative rounded-xl border border-border/50 bg-background/80 backdrop-blur-sm overflow-hidden shadow-inner">
        <EditorContent 
          editor={editor} 
          className="px-4 py-3 [&_.ProseMirror]:min-h-[120px] [&_.ProseMirror]:max-w-full [&_.ProseMirror]:overflow-x-hidden [&_.ProseMirror]:break-words [&_.ProseMirror]:focus:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground/50 [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6 [&_.ProseMirror_ul]:my-2 [&_.ProseMirror_ul]:max-w-full [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_ol]:my-2 [&_.ProseMirror_ol]:max-w-full [&_.ProseMirror_li]:my-1 [&_.ProseMirror_li]:leading-relaxed [&_.ProseMirror_li]:break-words [&_.ProseMirror_li]:overflow-wrap-anywhere [&_.ProseMirror_li_p]:inline [&_.ProseMirror_li_p]:break-words [&_.ProseMirror_strong]:font-bold [&_.ProseMirror_em]:italic [&_.ProseMirror_p]:my-1.5 [&_.ProseMirror_p]:leading-relaxed [&_.ProseMirror_p]:break-words [&_.ProseMirror_mark]:px-0.5 [&_.ProseMirror_mark]:rounded"
        />
      </div>
    </div>
  );
}
