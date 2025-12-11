import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, FileSpreadsheet, Presentation, Image, File, Trash2, Upload } from 'lucide-react';
import { StudyFile } from '@/types/study';
import { Button } from '@/components/ui/button';
import { FileNameDialog } from './FileNameDialog';

interface FileListProps {
  files: StudyFile[];
  onAddFile: (file: File, customName: string) => void;
  onDeleteFile: (fileId: string) => void;
}

const fileIcons: Record<StudyFile['type'], { Icon: typeof FileText; color: string }> = {
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileList({ files, onAddFile, onDeleteFile }: FileListProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showNameDialog, setShowNameDialog] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setShowNameDialog(true);
      e.target.value = '';
    }
  };

  const handleConfirmName = (fileName: string) => {
    if (pendingFile) {
      onAddFile(pendingFile, fileName);
      setPendingFile(null);
    }
  };

  const openFile = (file: StudyFile) => {
    // Open file in new tab for viewing
    window.open(file.url, '_blank');
  };

  return (
    <div className="space-y-4">
      <input
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp"
      />
      
      <Button
        onClick={() => inputRef.current?.click()}
        variant="outline"
        className="w-full rounded-xl border-dashed border-2"
      >
        <Upload className="mr-2 h-4 w-4" />
        Upload File
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
              const { Icon, color } = fileIcons[file.type] || fileIcons.other;
              
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
                      {formatFileSize(file.size)}
                    </p>
                  </button>
                  
                  <button
                    onClick={() => onDeleteFile(file.id)}
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

      <FileNameDialog
        isOpen={showNameDialog}
        onClose={() => {
          setShowNameDialog(false);
          setPendingFile(null);
        }}
        onConfirm={handleConfirmName}
        defaultName={pendingFile?.name.replace(/\.[^/.]+$/, '') || ''}
      />
    </div>
  );
}
