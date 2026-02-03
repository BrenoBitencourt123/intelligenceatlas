import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';

interface ThemeFormData {
  date: string;
  title: string;
  motivating_text: string;
  context: string;
  guiding_questions: string[];
}

interface ThemeFormProps {
  initialData?: ThemeFormData & { id?: string };
  onSubmit: (data: ThemeFormData) => Promise<boolean>;
  onCancel: () => void;
  isSubmitting: boolean;
}

const ThemeForm = ({ initialData, onSubmit, onCancel, isSubmitting }: ThemeFormProps) => {
  const [date, setDate] = useState<Date | undefined>(
    initialData?.date ? parse(initialData.date, 'yyyy-MM-dd', new Date()) : undefined
  );
  const [title, setTitle] = useState(initialData?.title || '');
  const [motivatingText, setMotivatingText] = useState(initialData?.motivating_text || '');
  const [context, setContext] = useState(initialData?.context || '');
  const [questions, setQuestions] = useState<string[]>(
    initialData?.guiding_questions?.length ? initialData.guiding_questions : ['', '', '']
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addQuestion = () => {
    if (questions.length < 7) {
      setQuestions([...questions, '']);
    }
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 3) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!date) {
      newErrors.date = 'Data é obrigatória';
    }

    if (!title || title.length < 10) {
      newErrors.title = 'Título deve ter pelo menos 10 caracteres';
    }

    if (!motivatingText || motivatingText.length < 100) {
      newErrors.motivating_text = 'Texto motivador deve ter pelo menos 100 caracteres';
    }

    if (!context || context.length < 50) {
      newErrors.context = 'Contexto deve ter pelo menos 50 caracteres';
    }

    const filledQuestions = questions.filter((q) => q.trim().length > 0);
    if (filledQuestions.length < 3) {
      newErrors.questions = 'Preencha pelo menos 3 perguntas norteadoras';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    const formData: ThemeFormData = {
      date: format(date!, 'yyyy-MM-dd'),
      title: title.trim(),
      motivating_text: motivatingText.trim(),
      context: context.trim(),
      guiding_questions: questions.filter((q) => q.trim().length > 0),
    };

    const success = await onSubmit(formData);
    if (success) {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Data */}
      <div className="space-y-2">
        <Label htmlFor="date">Data do Tema</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !date && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Selecione a data'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={ptBR}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
      </div>

      {/* Título */}
      <div className="space-y-2">
        <Label htmlFor="title">Título do Tema</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Os desafios da saúde mental na sociedade contemporânea"
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
        <p className="text-xs text-muted-foreground">{title.length} caracteres</p>
      </div>

      {/* Texto Motivador */}
      <div className="space-y-2">
        <Label htmlFor="motivating_text">Texto Motivador</Label>
        <Textarea
          id="motivating_text"
          value={motivatingText}
          onChange={(e) => setMotivatingText(e.target.value)}
          placeholder="Inclua citações, dados estatísticos e informações relevantes sobre o tema..."
          className="min-h-[150px]"
        />
        {errors.motivating_text && <p className="text-sm text-destructive">{errors.motivating_text}</p>}
        <p className="text-xs text-muted-foreground">{motivatingText.length} caracteres</p>
      </div>

      {/* Contexto */}
      <div className="space-y-2">
        <Label htmlFor="context">Contexto Histórico-Social</Label>
        <Textarea
          id="context"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Descreva o contexto histórico e social que envolve a discussão deste tema..."
          className="min-h-[100px]"
        />
        {errors.context && <p className="text-sm text-destructive">{errors.context}</p>}
        <p className="text-xs text-muted-foreground">{context.length} caracteres</p>
      </div>

      {/* Perguntas Norteadoras */}
      <div className="space-y-2">
        <Label>Perguntas Norteadoras</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Mínimo 3, máximo 7 perguntas
        </p>
        <div className="space-y-3">
          {questions.map((question, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={question}
                onChange={(e) => updateQuestion(index, e.target.value)}
                placeholder={`Pergunta ${index + 1}`}
              />
              {questions.length > 3 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeQuestion(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        {errors.questions && <p className="text-sm text-destructive">{errors.questions}</p>}
        
        {questions.length < 7 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addQuestion}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Pergunta
          </Button>
        )}
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : initialData?.id ? 'Atualizar Tema' : 'Criar Tema'}
        </Button>
      </div>
    </form>
  );
};

export default ThemeForm;
