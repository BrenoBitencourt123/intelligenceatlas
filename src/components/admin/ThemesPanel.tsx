import { useState } from 'react';
import { useAdminThemes } from '@/hooks/useAdminThemes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Calendar, Bot, User } from 'lucide-react';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ThemeForm from './ThemeForm';

interface ThemeFormData {
  date: string;
  title: string;
  motivating_text: string;
  context: string;
  guiding_questions: string[];
}

const ThemesPanel = () => {
  const { themes, isLoading, createTheme, updateTheme, deleteTheme } = useAdminThemes();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTheme, setEditingTheme] = useState<(ThemeFormData & { id: string }) | null>(null);
  const [deletingThemeId, setDeletingThemeId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (data: ThemeFormData) => {
    setIsSubmitting(true);
    const success = await createTheme(data);
    setIsSubmitting(false);
    return success;
  };

  const handleUpdate = async (data: ThemeFormData) => {
    if (!editingTheme) return false;
    setIsSubmitting(true);
    const success = await updateTheme(editingTheme.id, data);
    setIsSubmitting(false);
    return success;
  };

  const handleDelete = async () => {
    if (!deletingThemeId) return;
    await deleteTheme(deletingThemeId);
    setDeletingThemeId(null);
  };

  const openEditForm = (theme: typeof themes[0]) => {
    setEditingTheme({
      id: theme.id,
      date: theme.date,
      title: theme.title,
      motivating_text: theme.motivating_text,
      context: theme.context,
      guiding_questions: theme.guiding_questions,
    });
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTheme(null);
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = parse(dateStr, 'yyyy-MM-dd', new Date());
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Temas Cadastrados
          </CardTitle>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Tema
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : themes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum tema cadastrado.</p>
              <Button className="mt-4" onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Tema
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Data</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead className="w-[100px]">Origem</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {themes.map((theme) => (
                    <TableRow key={theme.id}>
                      <TableCell className="font-medium">
                        {formatDate(theme.date)}
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {theme.title}
                      </TableCell>
                      <TableCell>
                        {theme.is_ai_generated ? (
                          <Badge variant="secondary" className="gap-1">
                            <Bot className="h-3 w-3" />
                            IA
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 bg-primary/10 text-primary border-primary/20">
                            <User className="h-3 w-3" />
                            Manual
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditForm(theme)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingThemeId(theme.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Tema</DialogTitle>
          </DialogHeader>
          <ThemeForm
            onSubmit={handleCreate}
            onCancel={closeForm}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingTheme} onOpenChange={(open) => !open && setEditingTheme(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Tema</DialogTitle>
          </DialogHeader>
          {editingTheme && (
            <ThemeForm
              initialData={editingTheme}
              onSubmit={handleUpdate}
              onCancel={closeForm}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingThemeId} onOpenChange={(open) => !open && setDeletingThemeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tema?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O tema será permanentemente removido do banco de dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ThemesPanel;
