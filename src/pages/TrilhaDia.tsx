// Orquestrador da sessão diária. Roteador puro — não renderiza player.
// Fluxo:
//  1) Se não há plano na sessão → compõe, salva, vai pro segmento 0.
//  2) Se `?advance=1` → cursor++, salva, vai pro próximo segmento.
//  3) Se cursor >= len → limpa plano, volta pra /hoje (a celebração pós-nó
//     já acontece dentro do próprio nó; aqui é só a costura).
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  comporPlanoDia,
  lerPlanoDia,
  salvarPlanoDia,
  limparPlanoDia,
} from '@/lib/ufu/composerDia';

export default function TrilhaDia() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [params] = useSearchParams();

  useEffect(() => {
    if (!user) return;
    const diaRedacao = ((profile as { dia_redacao?: number } | null | undefined)?.dia_redacao ?? 6) as number;
    let cancelled = false;

    (async () => {
      const advance = params.get('advance') === '1';
      let plano = lerPlanoDia();

      if (advance && plano) {
        plano = { ...plano, cursor: plano.cursor + 1 };
        salvarPlanoDia(plano);
      }

      if (!plano) {
        plano = await comporPlanoDia({ userId: user.id, diaRedacao });
        if (cancelled) return;
        salvarPlanoDia(plano);
      }

      if (plano.cursor >= plano.segmentos.length) {
        // Dia completo — limpa e volta pra /hoje.
        limparPlanoDia();
        navigate('/hoje', { replace: true });
        return;
      }

      // Segue pro próximo segmento.
      navigate(plano.segmentos[plano.cursor].url, { replace: true });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
