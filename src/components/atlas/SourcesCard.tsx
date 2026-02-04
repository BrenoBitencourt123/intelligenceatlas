import { ExternalLink, BookOpen, BarChart2, Scale, Newspaper } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Source } from '@/types/atlas';

interface SourcesCardProps {
  sources: Source[];
}

const getSourceIcon = (type: Source['type']) => {
  switch (type) {
    case 'artigo':
      return <BookOpen className="h-3 w-3" />;
    case 'estatistica':
      return <BarChart2 className="h-3 w-3" />;
    case 'legislacao':
      return <Scale className="h-3 w-3" />;
    case 'noticia':
      return <Newspaper className="h-3 w-3" />;
    default:
      return <BookOpen className="h-3 w-3" />;
  }
};

const getSourceTypeLabel = (type: Source['type']) => {
  switch (type) {
    case 'artigo':
      return 'Artigo';
    case 'estatistica':
      return 'Estatística';
    case 'legislacao':
      return 'Legislação';
    case 'noticia':
      return 'Notícia';
    default:
      return type;
  }
};

export const SourcesCard = ({ sources }: SourcesCardProps) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold uppercase tracking-wide text-foreground">
            Fontes para sua Redação
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sources.map((source, index) => (
          <div key={index} className="space-y-2 p-3 rounded-lg bg-muted/50">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1 text-xs">
                    {getSourceIcon(source.type)}
                    {getSourceTypeLabel(source.type)}
                  </Badge>
                </div>
                <a 
                  href={source.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1 group"
                >
                  {source.title}
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            </div>
            <p className="text-sm text-muted-foreground italic">
              "{source.excerpt}"
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
