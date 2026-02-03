import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Theme {
  id: string;
  date: string;
  title: string;
  motivating_text: string;
  context: string;
  guiding_questions: string[];
  structure_guide: { id: string; label: string; description: string }[];
  is_ai_generated: boolean;
  created_at: string;
}

interface ThemeFormData {
  date: string;
  title: string;
  motivating_text: string;
  context: string;
  guiding_questions: string[];
  structure_guide?: { id: string; label: string; description: string }[];
}

const DEFAULT_STRUCTURE_GUIDE = [
  { id: 'intro', label: 'Introdução', description: 'Apresente o tema e sua tese principal' },
  { id: 'dev1', label: 'Desenvolvimento 1', description: 'Desenvolva seu primeiro argumento com evidências' },
  { id: 'dev2', label: 'Desenvolvimento 2', description: 'Apresente seu segundo argumento ou contraponto' },
  { id: 'conclusion', label: 'Conclusão', description: 'Proponha uma intervenção respeitando os direitos humanos' },
];

export const useAdminThemes = () => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchThemes = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('daily_themes')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const formattedThemes: Theme[] = (data || []).map((theme) => ({
        ...theme,
        guiding_questions: Array.isArray(theme.guiding_questions) 
          ? theme.guiding_questions as string[]
          : [],
        structure_guide: Array.isArray(theme.structure_guide)
          ? theme.structure_guide as { id: string; label: string; description: string }[]
          : DEFAULT_STRUCTURE_GUIDE,
      }));

      setThemes(formattedThemes);
    } catch (error) {
      console.error('Error fetching themes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os temas.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  const createTheme = async (formData: ThemeFormData): Promise<boolean> => {
    try {
      const { error } = await supabase.from('daily_themes').insert({
        date: formData.date,
        title: formData.title,
        motivating_text: formData.motivating_text,
        context: formData.context,
        guiding_questions: formData.guiding_questions,
        structure_guide: formData.structure_guide || DEFAULT_STRUCTURE_GUIDE,
        is_ai_generated: false,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Tema criado com sucesso!',
      });
      
      await fetchThemes();
      return true;
    } catch (error: any) {
      console.error('Error creating theme:', error);
      
      if (error.code === '23505') {
        toast({
          title: 'Erro',
          description: 'Já existe um tema cadastrado para esta data.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível criar o tema.',
          variant: 'destructive',
        });
      }
      return false;
    }
  };

  const updateTheme = async (id: string, formData: ThemeFormData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('daily_themes')
        .update({
          date: formData.date,
          title: formData.title,
          motivating_text: formData.motivating_text,
          context: formData.context,
          guiding_questions: formData.guiding_questions,
          structure_guide: formData.structure_guide || DEFAULT_STRUCTURE_GUIDE,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Tema atualizado com sucesso!',
      });
      
      await fetchThemes();
      return true;
    } catch (error: any) {
      console.error('Error updating theme:', error);
      
      if (error.code === '23505') {
        toast({
          title: 'Erro',
          description: 'Já existe um tema cadastrado para esta data.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar o tema.',
          variant: 'destructive',
        });
      }
      return false;
    }
  };

  const deleteTheme = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('daily_themes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Tema excluído com sucesso!',
      });
      
      await fetchThemes();
      return true;
    } catch (error) {
      console.error('Error deleting theme:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o tema.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    themes,
    isLoading,
    createTheme,
    updateTheme,
    deleteTheme,
    refetch: fetchThemes,
  };
};
