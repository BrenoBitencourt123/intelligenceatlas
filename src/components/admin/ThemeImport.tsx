import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, CheckCircle, AlertCircle, FileJson } from 'lucide-react';

interface ThemeData {
  date: string;
  title: string;
  motivating_text: string;
  context: string;
  guiding_questions: string[];
}

interface ThemeImportProps {
  onImport: (data: ThemeData) => Promise<boolean>;
  isSubmitting: boolean;
  onCancel: () => void;
}

const ThemeImport = ({ onImport, isSubmitting, onCancel }: ThemeImportProps) => {
  const [jsonInput, setJsonInput] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ThemeData | null>(null);

  const validateTheme = (data: unknown): ThemeData => {
    if (typeof data !== 'object' || data === null) {
      throw new Error('JSON deve ser um objeto');
    }

    const obj = data as Record<string, unknown>;

    // Validate date
    if (typeof obj.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(obj.date)) {
      throw new Error('Campo "date" deve estar no formato YYYY-MM-DD');
    }

    // Validate title
    if (typeof obj.title !== 'string' || obj.title.length < 10) {
      throw new Error('Campo "title" deve ter pelo menos 10 caracteres');
    }

    // Validate motivating_text
    if (typeof obj.motivating_text !== 'string' || obj.motivating_text.length < 100) {
      throw new Error('Campo "motivating_text" deve ter pelo menos 100 caracteres');
    }

    // Validate context
    if (typeof obj.context !== 'string' || obj.context.length < 50) {
      throw new Error('Campo "context" deve ter pelo menos 50 caracteres');
    }

    // Validate guiding_questions
    if (!Array.isArray(obj.guiding_questions)) {
      throw new Error('Campo "guiding_questions" deve ser um array');
    }

    const questions = obj.guiding_questions.filter(
      (q): q is string => typeof q === 'string' && q.trim().length > 0
    );

    if (questions.length < 3) {
      throw new Error('Campo "guiding_questions" deve ter pelo menos 3 perguntas');
    }

    return {
      date: obj.date,
      title: obj.title.trim(),
      motivating_text: obj.motivating_text.trim(),
      context: obj.context.trim(),
      guiding_questions: questions,
    };
  };

  const handleParse = () => {
    setParseError(null);
    setParsedData(null);

    if (!jsonInput.trim()) {
      setParseError('Cole o JSON do tema');
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      const validated = validateTheme(parsed);
      setParsedData(validated);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setParseError('JSON inválido: ' + err.message);
      } else if (err instanceof Error) {
        setParseError(err.message);
      }
    }
  };

  const handleImport = async () => {
    if (!parsedData) return;
    
    const success = await onImport(parsedData);
    if (success) {
      setJsonInput('');
      setParsedData(null);
      onCancel();
    }
  };

  const exampleJson = `{
  "date": "2025-02-03",
  "title": "Os desafios da saúde mental na sociedade contemporânea",
  "motivating_text": "Segundo a OMS, mais de 300 milhões de pessoas sofrem de depressão no mundo. No Brasil, os transtornos mentais são a terceira causa de afastamento do trabalho. A pandemia de COVID-19 intensificou esse cenário, evidenciando a necessidade urgente de políticas públicas eficazes.",
  "context": "A discussão sobre saúde mental ganhou destaque nas últimas décadas, especialmente após estudos revelarem o impacto econômico e social dos transtornos psicológicos não tratados.",
  "guiding_questions": [
    "Quais são os principais fatores que contribuem para o aumento dos casos de transtornos mentais?",
    "Como o estigma social afeta a busca por tratamento?",
    "Qual o papel das políticas públicas na promoção da saúde mental?"
  ]
}`;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Cole o JSON do tema</Label>
        <Textarea
          value={jsonInput}
          onChange={(e) => {
            setJsonInput(e.target.value);
            setParsedData(null);
            setParseError(null);
          }}
          placeholder={exampleJson}
          className="min-h-[300px] font-mono text-sm"
        />
      </div>

      {parseError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{parseError}</AlertDescription>
        </Alert>
      )}

      {parsedData && (
        <Alert className="border-primary/50 bg-primary/10">
          <CheckCircle className="h-4 w-4 text-primary" />
          <AlertDescription>
            <strong>JSON válido!</strong> Pronto para importar:
            <ul className="mt-2 text-sm space-y-1">
              <li>📅 Data: {parsedData.date}</li>
              <li>📝 Título: {parsedData.title.substring(0, 50)}...</li>
              <li>❓ {parsedData.guiding_questions.length} perguntas norteadoras</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => setJsonInput(exampleJson)}
          className="gap-2"
        >
          <FileJson className="h-4 w-4" />
          Exemplo
        </Button>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          
          {!parsedData ? (
            <Button type="button" onClick={handleParse} disabled={!jsonInput.trim()}>
              Validar JSON
            </Button>
          ) : (
            <Button onClick={handleImport} disabled={isSubmitting} className="gap-2">
              <Upload className="h-4 w-4" />
              {isSubmitting ? 'Importando...' : 'Importar Tema'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThemeImport;
