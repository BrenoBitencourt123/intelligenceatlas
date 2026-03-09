import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-5 py-12">
        <Link to="/fundadores" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
        <p className="text-sm text-muted-foreground mb-8">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <div className="prose prose-sm max-w-none space-y-6 text-foreground/80">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Aceitação dos Termos</h2>
            <p>Ao acessar e utilizar a plataforma Inteligência Atlas ("Plataforma"), você concorda com estes Termos de Uso. Se você não concorda com qualquer parte destes termos, não utilize a Plataforma.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Descrição do Serviço</h2>
            <p>O Atlas é uma plataforma de estudos para o ENEM que oferece questões objetivas com correção inteligente, análise de redação por inteligência artificial e flashcards com repetição espaçada. Os recursos disponíveis variam conforme o plano contratado.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Cadastro e Conta</h2>
            <p>Para utilizar a Plataforma, você deve criar uma conta fornecendo informações verdadeiras e atualizadas. Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Planos e Pagamento</h2>
            <p>A Plataforma oferece planos gratuitos e pagos. Os planos pagos são cobrados mensalmente ou conforme condições especiais (como o programa de membros fundadores). O processamento de pagamentos é realizado por meio de plataformas seguras de terceiros. O cancelamento pode ser feito a qualquer momento, sem multa.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Uso Aceitável</h2>
            <p>Você concorda em utilizar a Plataforma apenas para fins educacionais legítimos. É proibido: compartilhar sua conta com terceiros, utilizar bots ou scripts automatizados, tentar acessar áreas restritas do sistema, ou reproduzir/distribuir o conteúdo da Plataforma sem autorização.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Propriedade Intelectual</h2>
            <p>Todo o conteúdo da Plataforma, incluindo textos, análises, algoritmos e interface, é protegido por direitos autorais. As questões do ENEM são de domínio público e são utilizadas para fins educacionais.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Limitação de Responsabilidade</h2>
            <p>O Atlas fornece análises e correções como ferramenta auxiliar de estudo. Os resultados gerados por IA são orientativos e não substituem a orientação de professores. Não garantimos aprovação em exames.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Modificações</h2>
            <p>Reservamo-nos o direito de modificar estes Termos a qualquer momento. Alterações significativas serão comunicadas por email. O uso continuado da Plataforma após modificações constitui aceitação dos novos termos.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Contato</h2>
            <p>Para dúvidas sobre estes Termos, entre em contato pelo email disponível na Plataforma.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
