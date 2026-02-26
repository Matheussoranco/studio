'use server';

/**
 * @fileOverview Fluxo de Monitoramento de Crise Factual para Juiz de Fora.
 * Gera boletins baseados estritamente em dados simulados de tempo real.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiGeneratedCrisisReportOutputSchema = z.object({
  summary: z.string().max(400).describe('Resumo estritamente factual da situação atual em Juiz de Fora.'),
  alertLevel: z.enum(['VERDE', 'AMARELO', 'LARANJA', 'VERMELHO']).describe('Nível de alerta baseado em dados técnicos de chuva e rios.'),
  affectedAreas: z.array(z.string()).describe('Lista de bairros ou vias com problemas confirmados.'),
  recommendations: z.array(z.string()).describe('Orientações de segurança para a população.'),
  markers: z.array(z.object({
    lat: z.number(),
    lng: z.number(),
    description: z.string(),
    type: z.enum(['alagamento', 'deslizamento', 'bloqueio', 'atencao']),
    severity: z.number().min(1).max(3)
  })).describe('Pontos geográficos precisos de incidentes confirmados.')
});

export type AiGeneratedCrisisReportOutput = z.infer<typeof AiGeneratedCrisisReportOutputSchema>;

const fetchRealTimeInternetData = ai.defineTool(
  {
    name: 'fetchRealTimeInternetData',
    description: 'Acessa APIs de monitoramento climático e Defesa Civil de Juiz de Fora para obter fatos verídicos.',
    inputSchema: z.object({}),
    outputSchema: z.string(),
  },
  async () => {
    // Simulação de dados factuais que seriam recuperados de uma API governamental
    const now = new Date();
    return `DADOS OFICIAIS JF - ${now.toLocaleString('pt-BR')}
    - RIO PARAIBUNA: 2.85m (Monitoramento normal/atenção).
    - PRECIPITAÇÃO: 35mm nas últimas 2h (São Mateus).
    - OCORRÊNCIAS: 
      1. Pequeno alagamento na Av. Getúlio Vargas.
      2. Queda de árvore no Morro do Imperador.
      3. Deslizamento isolado no Bairro Santa Luzia (Rua Ibitiguaia).
    - PREVISÃO: Chuvas isoladas nas próximas horas.`;
  }
);

const crisisReportPrompt = ai.definePrompt({
  name: 'crisisReportPrompt',
  tools: [fetchRealTimeInternetData],
  input: { schema: z.object({ currentDateTime: z.string() }) },
  output: { schema: AiGeneratedCrisisReportOutputSchema },
  prompt: `Você é o Analista da Defesa Civil de Juiz de Fora.
Gere um boletim estritamente FACTUAL e VERÍDICO. NUNCA INVENTE OU ALUCINE DADOS.
Se a ferramenta de busca não retornar dados sobre um bairro, diga que está sob observação.

Baseie sua análise nos dados retornados pela ferramenta:
{{#with (fetchRealTimeInternetData)}}
{{{this}}}
{{/with}}

Data da Requisição: {{{currentDateTime}}}`,
});

export async function generateCrisisReport(input: { currentDateTime: string }): Promise<AiGeneratedCrisisReportOutput> {
  const { output } = await crisisReportPrompt(input);
  if (!output) {
    throw new Error('Falha ao processar dados factuais da internet.');
  }
  return output;
}
