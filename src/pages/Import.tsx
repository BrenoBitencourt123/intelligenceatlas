import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Upload } from 'lucide-react';

const Import = () => {
  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-foreground">Importar Questões</h1>

          <Card className="bg-card">
            <CardContent className="p-8 text-center space-y-4">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
              <h2 className="text-lg font-semibold">Importar Provas do ENEM</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Faça upload de PDFs de provas do ENEM. A IA irá extrair as questões, alternativas e gabaritos automaticamente.
              </p>
              <p className="text-xs text-muted-foreground">
                A funcionalidade de importação será implementada na Sub-fase 1B.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Import;
