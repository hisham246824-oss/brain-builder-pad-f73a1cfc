import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, FileSpreadsheet, Presentation, Image, File, Trash2, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';
import { useFileUpload, UploadedFile } from '@/hooks/useFileUpload';
import { toast } from 'sonner';

interface FileListSupabaseProps {
  files: UploadedFile[];
  materialId: string;
  onFileAdded: () => void;
  onFileDeleted: () => void;
}

const fileIcons: Record<string, { Icon: typeof FileText; color: string }> = {
  pdf: { Icon: FileText, color: '#e74c3c' },
  docx: { Icon: FileText, color: '#2980b9' },
  doc: { Icon: FileText, color: '#2980b9' },
  pptx: { Icon: Presentation, color: '#e67e22' },
  ppt: { Icon: Presentation, color: '#e67e22' },
  xlsx: { Icon: FileSpreadsheet, color: '#27ae60' },
  xls: { Icon: FileSpreadsheet, color: '#27ae60' },
  txt: { Icon: FileText, color: '#95a5a6' },
  image: { Icon: Image, color: '#9b59b6' },
  other: { Icon: File, color: '#7f8c8d' },
};

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileListSupabase({ files, materialId, onFileAdded, onFileDeleted }: FileListSupabaseProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { uploadFile, deleteFile } = useFileUpload();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const result = await uploadFile(materialId, file);
    setIsUploading(false);

    if (result) {
      toast.success('File uploaded successfully');
      onFileAdded();
    } else {
      toast.error('Failed to upload file');
    }

    e.target.value = '';
  };

  const handleDelete = async (file: UploadedFile) => {
    const success = await deleteFile(file.id, file.file_url);
    if (success) {
      toast.success('File deleted');
      onFileDeleted();
    } else {
      toast.error('Failed to delete file');
    }
  };

  const openFile = async (fileData: UploadedFile) => {
    // Try to use Web Share API for native "Open with" on mobile
    if (navigator.share && navigator.canShare) {
      try {
        // Fetch the file to create a shareable blob
        const response = await fetch(fileData.file_url);
        const blob = await response.blob();
        const shareFile = new window.File([blob], fileData.name, { type: blob.type });
        
        if (navigator.canShare({ files: [shareFile] })) {
          await navigator.share({
            files: [shareFile],
            title: fileData.name,
          });
          return;
        }
      } catch (error) {
        // If share fails or user cancels, fall back to opening in new tab
        console.log('Share cancelled or failed, opening in new tab');
      }
    }
    
    // Fallback: Open file directly in new tab
    window.open(fileData.file_url, '_blank');
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp"
        disabled={isUploading}
      />
      
      <Button
        onClick={() => inputRef.current?.click()}
        variant="outline"
        className="w-full rounded-xl border-dashed border-2"
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Upload File
          </>
        )}
      </Button>

      {files.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <File className="mx-auto h-12 w-12 mb-2 opacity-50" />
          <p>No files uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {files.map((file, index) => {
              const iconData = fileIcons[file.file_type || 'other'] || fileIcons.other;
              const { Icon, color } = iconData;
              
              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon className="h-5 w-5" style={{ color }} />
                  </div>
                  
                  <button
                    onClick={() => openFile(file)}
                    className="flex-1 text-left min-w-0"
                  >
                    <p className="font-medium text-card-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file_size)}
                    </p>
                  </button>
                  
                  <button
                    onClick={() => handleDelete(file)}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
