import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ChecklistItem {
  label: string;
  checked: boolean;
}

interface TextEvidence {
  quote: string;
  issue: string;
  suggestion: string;
}

interface BlockAnalysis {
  checklist?: ChecklistItem[];
  howToImprove?: string[];
  textEvidence?: TextEvidence[];
}

interface Block {
  type: string;
  text: string;
  analysis?: BlockAnalysis;
}

// Build the problems section for the prompt
const buildProblemsSection = (blocks: Block[]): string => {
  const sections: string[] = [];
  
  for (const block of blocks) {
    const typeLabel = block.type === 'introduction' ? 'INTRODUÇÃO' : 
                     block.type === 'conclusion' ? 'CONCLUSÃO' : 
                     'DESENVOLVIMENTO';
    
    const problems: string[] = [];
    
    // Add unchecked items from checklist
    if (block.analysis?.checklist) {
      const unchecked = block.analysis.checklist
        .filter(item => !item.checked)
        .map(item => `- ${item.label}: NÃO ATENDIDO`);
      problems.push(...unchecked);
    }
    
    // Add howToImprove suggestions
    if (block.analysis?.howToImprove && block.analysis.howToImprove.length > 0) {
      problems.push(...block.analysis.howToImprove.map(tip => `- ${tip}`));
    }
    
    // Add text evidence issues
    if (block.analysis?.textEvidence && block.analysis.textEvidence.length > 0) {
      for (const evidence of block.analysis.textEvidence) {
        problems.push(`- Trecho "${evidence.quote}": ${evidence.issue}. Sugestão: ${evidence.suggestion}`);
      }
    }
    
    if (problems.length > 0) {
      sections.push(`[${typeLabel}]\n${problems.join('\n')}`);
    }
  }
  
  return sections.length > 0 ? sections.join('\n\n') : 'Nenhum problema específico identificado. Melhore a clareza e coesão geral.';
};

const SYSTEM_PROMPT = `Você é um professor especialista em redação ENEM. Sua tarefa é reescrever a redação do aluno corrigindo ESPECIFICAMENTE os problemas listados.

REGRAS CRÍTICAS:
1. CORRIJA cada problema listado na seção "PROBLEMAS A CORRIGIR"
2. MANTENHA as ideias e argumentos originais do aluno
3. NÃO adicione informações que o aluno não mencionou
4. MANTENHA o mesmo número de parágrafos
5. Melhore conectivos, coesão e clareza

PARA A CONCLUSÃO (Competência 5):
A proposta de intervenção DEVE conter os 5 elementos:
- AGENTE: quem vai executar (ex: "O governo federal", "O MEC", "As escolas")
- AÇÃO: o que será feito (verbo no infinitivo ou forma verbal clara)
- MEIO: como será feito (instrumentos, métodos, recursos)
- FINALIDADE: para que será feito (objetivo final)
- DETALHAMENTO: especificação de pelo menos um dos elementos acima

Se algum desses 5 elementos estiver faltando ou implícito, torne-o EXPLÍCITO na reescrita.

FORMATO DE SAÍDA:
Retorne APENAS o texto melhorado, separando cada parágrafo com uma linha em branco.
NÃO inclua explicações, comentários ou marcadores como [INTRODUÇÃO].`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { blocks, theme } = await req.json() as { blocks: Block[]; theme?: string };
    
    if (!blocks || blocks.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum bloco para melhorar" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    // Build problems section from analysis
    const problemsSection = buildProblemsSection(blocks);
    
    // Format original text
    const originalText = blocks.map((block, index) => {
      const typeLabel = block.type === 'introduction' ? 'INTRODUÇÃO' : 
                       block.type === 'conclusion' ? 'CONCLUSÃO' : 
                       `DESENVOLVIMENTO ${index}`;
      return `[${typeLabel}]\n${block.text}`;
    }).join('\n\n');

    const userPrompt = `${theme ? `TEMA: ${theme}\n\n` : ''}PROBLEMAS A CORRIGIR:

${problemsSection}

---

REDAÇÃO ORIGINAL:

${originalText}

---

Reescreva a redação completa, corrigindo TODOS os problemas listados acima. Mantenha as ideias do aluno, mas garanta que a versão melhorada atenda aos critérios do ENEM.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "Chave da API OpenAI inválida." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Erro ao gerar versão melhorada");
    }

    const data = await response.json();
    const improvedText = data.choices?.[0]?.message?.content;
    
    if (!improvedText) {
      throw new Error("Resposta vazia da IA");
    }

    return new Response(
      JSON.stringify({ improvedText: improvedText.trim() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("improve-essay error:", error);
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
