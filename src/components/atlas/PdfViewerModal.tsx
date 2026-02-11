import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface PdfViewerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pdfUrl: string;
  title?: string;
}

export function PdfViewerModal({ open, onOpenChange, pdfUrl, title }: PdfViewerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <DialogTitle className="text-sm">{title || 'PDF da Prova'}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0">
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=0`}
            className="w-full h-full border-0 rounded-b-lg"
            title="Visualizador de PDF"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
