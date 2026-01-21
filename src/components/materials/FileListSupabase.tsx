import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, FileSpreadsheet, Presentation, Image, File, Trash2, Upload, Loader2, Eye, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFileUpload, UploadedFile } from '@/hooks/useFileUpload';
import { toast } from 'sonner';
import { FilePreviewDialog } from './FilePreviewDialog';

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
  jpg: { Icon: Image, color: '#9b59b6' },
  jpeg: { Icon: Image, color: '#9b59b6' },
  png: { Icon: Image, color: '#9b59b6' },
  gif: { Icon: Image, color: '#9b59b6' },
  webp: { Icon: Image, color: '#9b59b6' },
  image: { Icon: Image, color: '#9b59b6' },
  other: { Icon: File, color: '#7f8c8d' },
};

const PREVIEWABLE_TYPES = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'txt'];

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileListSupabase({ files, materialId, onFileAdded, onFileDeleted }: FileListSupabaseProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const { uploadFile, deleteFile } = useFileUpload();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const result = await uploadFile(materialId, file);
    setIsUploading(false);

    if (result) {
      toast.success('تم رفع الملف بنجاح');
      onFileAdded();
    } else {
      toast.error('فشل رفع الملف');
    }

    e.target.value = '';
  };

  const handleDelete = async (file: UploadedFile) => {
    const success = await deleteFile(file.id, file.file_url);
    if (success) {
      toast.success('تم حذف الملف');
      onFileDeleted();
    } else {
      toast.error('فشل حذف الملف');
    }
  };

  const handleFileClick = (fileData: UploadedFile) => {
    const fileType = fileData.file_type?.toLowerCase() || '';
    if (PREVIEWABLE_TYPES.includes(fileType)) {
      setPreviewFile(fileData);
    } else {
      // For non-previewable files, try share or open externally
      shareOrOpenFile(fileData);
    }
  };

  const shareOrOpenFile = async (fileData: UploadedFile) => {
    if (navigator.share && navigator.canShare) {
      try {
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
        console.log('Share cancelled or failed');
      }
    }
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
            جاري الرفع...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            رفع ملف
          </>
        )}
      </Button>

      {files.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <File className="mx-auto h-12 w-12 mb-2 opacity-50" />
          <p>لا توجد ملفات مرفوعة</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {files.map((file, index) => {
              const fileType = file.file_type?.toLowerCase() || 'other';
              const iconData = fileIcons[fileType] || fileIcons.other;
              const { Icon, color } = iconData;
              const canPreview = PREVIEWABLE_TYPES.includes(fileType);
              
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
                    onClick={() => handleFileClick(file)}
                    className="flex-1 text-left min-w-0"
                  >
                    <p className="font-medium text-card-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file_size)}
                    </p>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    {canPreview && (
                      <button
                        onClick={() => setPreviewFile(file)}
                        className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                        title="معاينة"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => shareOrOpenFile(file)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                      title="مشاركة/فتح"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(file)}
                      className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                      title="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <FilePreviewDialog
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </div>
  );
}
