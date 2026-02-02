import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Scissors, FileText, ArrowRight } from 'lucide-react';

interface PasteDivideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (paragraphs: string[]) => void;
}

export const PasteDivideModal = ({ open, onOpenChange, onApply }: PasteDivideModalProps) => {
  const [text, setText] = useState('');
  
  const paragraphs = useMemo(() => {
    if (!text.trim()) return [];
    return text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }, [text]);
  
  const preview = useMemo(() => {
    if (paragraphs.length === 0) return null;
    
    const intro = paragraphs[0];
    const conclusion = paragraphs.length > 1 ? paragraphs[paragraphs.length - 1] : null;
    const developments = paragraphs.length > 2 ? paragraphs.slice(1, -1) : [];
    
    return { intro, developments, conclusion };
  }, [paragraphs]);
  
  const handleApply = () => {
    if (paragraphs.length > 0) {
      onApply(paragraphs);
      setText('');
      onOpenChange(false);
    }
  };
  
  const handleClose = () => {
    setText('');
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" />
            Colar e dividir redação
          </DialogTitle>
          <DialogDescription>
            Cole sua redação completa e o Atlas irá dividir automaticamente em blocos.
            Separe os parágrafos com uma linha em branco.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Textarea */}
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Cole sua redação aqui...

Cada parágrafo deve ser separado por uma linha em branco.

O primeiro parágrafo será a introdução.
Os parágrafos do meio serão os desenvolvimentos.
O último parágrafo será a conclusão."
            className="min-h-[200px] resize-none"
          />
          
          {/* Preview */}
          {preview && (
            <div className="space-y-3 animate-fade-in">
              <h4 className="font-medium text-sm text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Prévia da divisão ({paragraphs.length} {paragraphs.length === 1 ? 'parágrafo' : 'parágrafos'})
              </h4>
              
              <div className="space-y-2 bg-muted/30 rounded-lg p-4">
                {/* Intro */}
                <PreviewBlock 
                  label="Introdução" 
                  text={preview.intro} 
                  color="emerald"
                />
                
                {/* Developments */}
                {preview.developments.map((dev, i) => (
                  <PreviewBlock 
                    key={i}
                    label={`Desenvolvimento ${i + 1}`} 
                    text={dev}
                    color="amber"
                  />
                ))}
                
                {/* Conclusion */}
                {preview.conclusion && (
                  <PreviewBlock 
                    label="Conclusão" 
                    text={preview.conclusion}
                    color="blue"
                  />
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleApply} 
            disabled={paragraphs.length === 0}
          >
            <ArrowRight className="h-4 w-4 mr-1.5" />
            Dividir e aplicar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PreviewBlock = ({ 
  label, 
  text, 
  color 
}: { 
  label: string; 
  text: string; 
  color: 'emerald' | 'amber' | 'blue';
}) => {
  const colorClasses = {
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
  };
  
  return (
    <div className="flex items-start gap-3">
      <span className={`text-xs font-medium px-2 py-1 rounded border ${colorClasses[color]} flex-shrink-0`}>
        {label}
      </span>
      <p className="text-sm text-muted-foreground line-clamp-2">
        {text}
      </p>
    </div>
  );
};
