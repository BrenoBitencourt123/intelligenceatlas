import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, DollarSign, Cpu, TrendingUp, Coins, Calendar, Upload, ListChecks } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import ThemesPanel from '@/components/admin/ThemesPanel';
import ImportPanel from '@/pages/Import';
import QuestionsPanel from '@/components/admin/QuestionsPanel';

interface TokenUsageRecord {
  id: string;
  created_at: string;
  operation_type: string;
  block_type: string | null;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
}

interface AggregatedStats {
  totalOperations: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalCostUsd: number;
  avgCostPerAnalysis: number;
  avgCostPerImprove: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const [records, setRecords] = useState<TokenUsageRecord[]>([]);
  const [stats, setStats] = useState<AggregatedStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect non-admins
  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      toast({
        title: 'Acesso negado',
        description: 'Você não tem permissão para acessar esta página.',
        variant: 'destructive',
      });
      navigate('/');
    }
  }, [isAdmin, isAdminLoading, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('token_usage')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching token usage:', error);
        setLoading(false);
        return;
      }

      const typedData = data as TokenUsageRecord[];
      setRecords(typedData);

      // Calculate aggregated stats
      if (typedData.length > 0) {
        const analyzeOps = typedData.filter(r => r.operation_type === 'analyze-block');
        const improveOps = typedData.filter(r => r.operation_type === 'improve-essay');

        const totalCost = typedData.reduce((sum, r) => sum + Number(r.estimated_cost_usd), 0);
        const analyzeCost = analyzeOps.reduce((sum, r) => sum + Number(r.estimated_cost_usd), 0);
        const improveCost = improveOps.reduce((sum, r) => sum + Number(r.estimated_cost_usd), 0);

        setStats({
          totalOperations: typedData.length,
          totalPromptTokens: typedData.reduce((sum, r) => sum + r.prompt_tokens, 0),
          totalCompletionTokens: typedData.reduce((sum, r) => sum + r.completion_tokens, 0),
          totalTokens: typedData.reduce((sum, r) => sum + r.total_tokens, 0),
          totalCostUsd: totalCost,
          avgCostPerAnalysis: analyzeOps.length > 0 ? analyzeCost / analyzeOps.length : 0,
          avgCostPerImprove: improveOps.length > 0 ? improveCost / improveOps.length : 0,
        });
      }

      setLoading(false);
    };

    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const formatCost = (cost: number) => `$${cost.toFixed(6)}`;
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getOperationLabel = (type: string) => {
    switch (type) {
      case 'analyze-block': return 'Análise';
      case 'improve-essay': return 'Melhoria';
      default: return type;
    }
  };

  const getBlockLabel = (type: string | null) => {
    switch (type) {
      case 'introduction': return 'Introdução';
      case 'development': return 'Desenvolvimento';
      case 'conclusion': return 'Conclusão';
      default: return '-';
    }
  };

  // Show loading while checking admin status
  if (isAdminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  // Don't render if not admin (will redirect)
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Painel Administrativo</h1>
            <p className="text-muted-foreground">Gerenciamento do sistema</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tokens" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="tokens" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Tokens
            </TabsTrigger>
            <TabsTrigger value="themes" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Temas
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Importar
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />
              Questões
            </TabsTrigger>
          </TabsList>

          {/* Tokens Tab */}
          <TabsContent value="tokens" className="space-y-6">
            {/* Stats Cards */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-8 w-20" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      Total de Operações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalOperations}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Total de Tokens
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalTokens.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      In: {stats.totalPromptTokens.toLocaleString()} | Out: {stats.totalCompletionTokens.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Custo Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">{formatCost(stats.totalCostUsd)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Custo Médio por Operação
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Análise:</span> {formatCost(stats.avgCostPerAnalysis)}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Melhoria:</span> {formatCost(stats.avgCostPerImprove)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {/* Table */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Operações</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : records.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma operação registrada ainda. Faça uma análise ou gere uma versão melhorada para ver os dados aqui.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data/Hora</TableHead>
                          <TableHead>Operação</TableHead>
                          <TableHead>Bloco</TableHead>
                          <TableHead className="text-right">Tokens In</TableHead>
                          <TableHead className="text-right">Tokens Out</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="text-right">Custo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {records.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(record.created_at)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={record.operation_type === 'analyze-block' ? 'secondary' : 'default'}>
                                {getOperationLabel(record.operation_type)}
                              </Badge>
                            </TableCell>
                            <TableCell>{getBlockLabel(record.block_type)}</TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {record.prompt_tokens.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {record.completion_tokens.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm font-medium">
                              {record.total_tokens.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm text-primary">
                              {formatCost(Number(record.estimated_cost_usd))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing Reference */}
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">
                  <strong>Referência de preços (GPT-4.1-mini):</strong> Input: $0.40/1M tokens | Output: $1.60/1M tokens
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Themes Tab */}
          <TabsContent value="themes">
            <ThemesPanel />
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import">
            <ImportPanel embedded />
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions">
            <QuestionsPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
