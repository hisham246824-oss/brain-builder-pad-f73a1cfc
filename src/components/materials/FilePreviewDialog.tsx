import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface FilePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    name: string;
    file_url: string;
    file_type: string | null;
  } | null;
}

const SUPPORTED_PREVIEW_TYPES = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'txt', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'];

export function FilePreviewDialog({ isOpen, onClose, file }: FilePreviewDialogProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imageError, setImageError] = useState(false);

  if (!file) return null;

  const fileType = file.file_type?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileType);
  const isPdf = fileType === 'pdf';
  const isTxt = fileType === 'txt';
  const isOfficeDoc = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(fileType);
  const canPreview = SUPPORTED_PREVIEW_TYPES.includes(fileType);
  
  // Google Docs Viewer URL for Office documents
  const googleViewerUrl = isOfficeDoc 
    ? `https://docs.google.com/gview?url=${encodeURIComponent(file.file_url)}&embedded=true`
    : null;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleOpenExternal = () => {
    window.open(file.file_url, '_blank');
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(file.file_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(file.file_url, '_blank');
    }
  };

  const resetView = () => {
    setZoom(1);
    setRotation(0);
    setImageError(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); resetView(); } }}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b shrink-0">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="truncate text-base">{file.name}</DialogTitle>
            <div className="flex items-center gap-2 shrink-0">
              {isImage && (
                <>
                  <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-8 w-8">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground w-12 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-8 w-8">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleRotate} className="h-8 w-8">
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-6 bg-border mx-1" />
                </>
              )}
              <Button variant="ghost" size="icon" onClick={handleDownload} className="h-8 w-8">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleOpenExternal} className="h-8 w-8">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/30 flex items-center justify-center p-4">
          {!canPreview ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                لا يمكن معاينة هذا النوع من الملفات
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleDownload} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  تحميل
                </Button>
                <Button onClick={handleOpenExternal}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  فتح خارجياً
                </Button>
              </div>
            </div>
          ) : isPdf ? (
            <iframe
              src={`${file.file_url}#toolbar=1&navpanes=0`}
              className="w-full h-full rounded-lg border bg-white"
              title={file.name}
            />
          ) : isImage ? (
            <motion.div
              className="flex items-center justify-center w-full h-full overflow-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {imageError ? (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">فشل تحميل الصورة</p>
                  <Button onClick={handleOpenExternal} variant="outline">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    فتح خارجياً
                  </Button>
                </div>
              ) : (
                <img
                  src={file.file_url}
                  alt={file.name}
                  className="max-w-full max-h-full object-contain transition-transform duration-200"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  }}
                  onError={() => setImageError(true)}
                />
              )}
            </motion.div>
          ) : isTxt ? (
            <iframe
              src={file.file_url}
              className="w-full h-full rounded-lg border bg-white font-mono text-sm"
              title={file.name}
            />
          ) : isOfficeDoc && googleViewerUrl ? (
            <iframe
              src={googleViewerUrl}
              className="w-full h-full rounded-lg border bg-white"
              title={file.name}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
