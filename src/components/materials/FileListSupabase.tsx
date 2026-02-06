import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, FileSpreadsheet, Presentation, Image, File, Trash2, Upload, Loader2, Eye, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  
  // File naming state
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [showNameDialog, setShowNameDialog] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    setFileName(nameWithoutExt);
    setPendingFile(file);
    setShowNameDialog(true);
    e.target.value = '';
  };

  const handleUploadConfirm = async () => {
    if (!pendingFile || !fileName.trim()) return;

    setShowNameDialog(false);
    setIsUploading(true);

    // Create a new File with the custom name
    const ext = pendingFile.name.split('.').pop() || '';
    const customName = `${fileName.trim()}.${ext}`;
    const renamedFile = new window.File([pendingFile], customName, { type: pendingFile.type });

    const result = await uploadFile(materialId, renamedFile);
    setIsUploading(false);

    if (result) {
      toast.success('File uploaded successfully');
      onFileAdded();
    } else {
      toast.error('Failed to upload file');
    }

    setPendingFile(null);
    setFileName('');
  };

  const handleCancelUpload = () => {
    setShowNameDialog(false);
    setPendingFile(null);
    setFileName('');
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

  const handleFileClick = (fileData: UploadedFile) => {
    const fileType = fileData.file_type?.toLowerCase() || '';
    if (PREVIEWABLE_TYPES.includes(fileType)) {
      setPreviewFile(fileData);
    } else {
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
          await navigator.share({ files: [shareFile], title: fileData.name });
          return;
        }
      } catch { /* Share cancelled */ }
    }
    window.open(fileData.file_url, '_blank');
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        onChange={handleFileSelect}
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

      {/* File naming dialog */}
      <AnimatePresence>
        {showNameDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
              onClick={handleCancelUpload}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-sm mx-4"
            >
              <div className="rounded-2xl bg-card p-5 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-card-foreground">Name Your File</h3>
                  <button onClick={handleCancelUpload} className="p-1 rounded-lg text-muted-foreground hover:bg-secondary">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <Input
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Enter file name..."
                  className="rounded-xl mb-4"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleUploadConfirm(); }}
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCancelUpload} className="flex-1 rounded-xl">Cancel</Button>
                  <Button onClick={handleUploadConfirm} disabled={!fileName.trim()} className="flex-1 rounded-xl">Upload</Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {files.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <File className="mx-auto h-12 w-12 mb-2 opacity-50" />
          <p>No files uploaded</p>
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
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}20` }}>
                    <Icon className="h-5 w-5" style={{ color }} />
                  </div>
                  <button onClick={() => handleFileClick(file)} className="flex-1 text-left min-w-0">
                    <p className="font-medium text-card-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{formatFileSize(file.file_size)}</p>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    {canPreview && (
                      <button onClick={() => setPreviewFile(file)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" title="Preview">
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    <button onClick={() => shareOrOpenFile(file)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" title="Share/Open">
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(file)} className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <FilePreviewDialog isOpen={!!previewFile} onClose={() => setPreviewFile(null)} file={previewFile} />
    </div>
  );
}
