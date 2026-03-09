import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-5 py-12">
        <Link to="/fundadores" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground/80">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Dados Coletados</h2>
            <p>Coletamos os seguintes dados pessoais:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Dados de cadastro:</strong> nome, email e telefone (opcional)</li>
              <li><strong>Dados de uso:</strong> respostas a questões, redações enviadas, progresso de estudo e desempenho</li>
              <li><strong>Dados de pagamento:</strong> processados diretamente pelo Stripe, não armazenamos dados de cartão</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Finalidade do Tratamento</h2>
            <p>Seus dados são utilizados para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Personalizar sua experiência de estudo e gerar recomendações inteligentes</li>
              <li>Processar pagamentos e gerenciar sua assinatura</li>
              <li>Comunicar atualizações, novidades e suporte</li>
              <li>Melhorar nossos algoritmos e a qualidade do serviço</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Compartilhamento de Dados</h2>
            <p>Não vendemos seus dados pessoais. Compartilhamos dados apenas com:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Processadores de pagamento:</strong> Stripe, para cobranças</li>
              <li><strong>Serviços de IA:</strong> para análise de redações e geração de conteúdo (dados anonimizados)</li>
              <li><strong>Obrigações legais:</strong> quando exigido por lei</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Armazenamento e Segurança</h2>
            <p>Seus dados são armazenados em servidores seguros com criptografia em trânsito e em repouso. Utilizamos autenticação segura e políticas de acesso restrito para proteger suas informações.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Seus Direitos (LGPD)</h2>
            <p>Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar a exclusão de seus dados</li>
              <li>Revogar o consentimento a qualquer momento</li>
              <li>Solicitar a portabilidade dos dados</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Cookies</h2>
            <p>Utilizamos cookies essenciais para manter sua sessão ativa e preferências salvas. Não utilizamos cookies de rastreamento de terceiros para publicidade.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Retenção de Dados</h2>
            <p>Seus dados são mantidos enquanto sua conta estiver ativa. Após a exclusão da conta, seus dados pessoais são removidos em até 30 dias, exceto quando houver obrigação legal de retenção.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Contato</h2>
            <p>Para exercer seus direitos ou tirar dúvidas sobre esta Política, entre em contato pelo email disponível na Plataforma.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
