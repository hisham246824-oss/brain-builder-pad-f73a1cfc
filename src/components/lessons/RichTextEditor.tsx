import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, ListOrdered, Undo, Redo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[100px] focus:outline-none text-sm text-foreground',
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

  if (!editor) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center gap-1 flex-wrap border-b border-border/50 pb-2">
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          size="icon"
          className="h-7 w-7"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="عريض"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
          size="icon"
          className="h-7 w-7"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="مائل"
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
          size="icon"
          className="h-7 w-7"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="قائمة نقطية"
        >
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
          size="icon"
          className="h-7 w-7"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="قائمة مرقمة"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="تراجع"
        >
          <Undo className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="إعادة"
        >
          <Redo className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Editor */}
      <EditorContent 
        editor={editor} 
        className="[&_.ProseMirror]:min-h-[100px] [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:ml-4 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:ml-4 [&_.ProseMirror_li]:my-1 [&_.ProseMirror_strong]:font-bold [&_.ProseMirror_em]:italic"
      />
    </div>
  );
}
