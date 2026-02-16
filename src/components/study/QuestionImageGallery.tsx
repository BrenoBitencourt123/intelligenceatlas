import { useMemo, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { QuestionImage } from '@/lib/questionImages';

interface QuestionImageGalleryProps {
  images: QuestionImage[];
  questionNumber: number;
}

export function QuestionImageGallery({ images, questionNumber }: QuestionImageGalleryProps) {
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const [loadedMap, setLoadedMap] = useState<Record<string, boolean>>({});
  const sortedImages = useMemo(
    () => [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [images]
  );

  if (sortedImages.length === 0) return null;

  return (
    <>
      <div className="space-y-2">
        {sortedImages.map((image, index) => {
          const imageKey = `${image.url}-${index}`;
          const loaded = Boolean(loadedMap[imageKey]);

          return (
            <div key={imageKey} className="relative rounded-lg overflow-hidden border bg-muted/20">
              {!loaded && <Skeleton className="absolute inset-0 h-full w-full" />}
              <img
                src={image.url}
                alt={image.caption || `Imagem da questao ${questionNumber} (${index + 1})`}
                className="w-full h-auto max-w-full object-contain cursor-zoom-in"
                loading="lazy"
                onLoad={() => {
                  setLoadedMap((prev) => ({ ...prev, [imageKey]: true }));
                }}
                onClick={() => setZoomUrl(image.url)}
              />
              {image.caption && (
                <p className="text-xs text-muted-foreground px-3 py-2 border-t bg-background/70">
                  {image.caption}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={Boolean(zoomUrl)} onOpenChange={(open) => !open && setZoomUrl(null)}>
        <DialogContent className="max-w-4xl p-2">
          {zoomUrl && (
            <img
              src={zoomUrl}
              alt={`Zoom imagem da questao ${questionNumber}`}
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
