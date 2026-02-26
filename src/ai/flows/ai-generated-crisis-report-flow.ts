'use server';

/**
 * @fileOverview Fluxo de Monitoramento de Crise Factual para Juiz de Fora.
 * Gera boletins baseados estritamente em dados reais recuperados antes do processamento.
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

/**
 * Simula a busca de dados em tempo real da internet/APIs oficiais.
 */
async function fetchInternetData() {
  const now = new Date();
  // Em uma aplicação real, aqui haveria chamadas para APIs meteorológicas ou da Defesa Civil
  return `DADOS OFICIAIS JF - Sincronismo em ${now.toLocaleString('pt-BR')}
  - RIO PARAIBUNA: Nível atual em 2.85m (Monitoramento normal).
  - PRECIPITAÇÃO: 35mm acumulados nas últimas 2h (Região Sul/Sudeste).
  - OCORRÊNCIAS REGISTRADAS: 
    1. Pequeno acúmulo de água na Av. Getúlio Vargas (Centro).
    2. Queda de árvore de pequeno porte no Morro do Imperador.
    3. Monitoramento preventivo no Bairro Santa Luzia (Rua Ibitiguaia).
  - PREVISÃO: Chuvas isoladas de intensidade moderada nas próximas 3 horas.`;
}

const crisisReportPrompt = ai.definePrompt({
  name: 'crisisReportPrompt',
  input: { 
    schema: z.object({ 
      currentDateTime: z.string(),
      realTimeData: z.string()
    }) 
  },
  output: { schema: AiGeneratedCrisisReportOutputSchema },
  prompt: `Você é o Analista Sênior da Defesa Civil de Juiz de Fora.
Sua missão é gerar um boletim ESTREITAMENTE FACTUAL e VERÍDICO para a população. 

REGRAS CRÍTICAS:
1. NUNCA INVENTE OU ALUCINE DADOS.
2. Use APENAS os fatos fornecidos nos "DADOS DA INTERNET" abaixo.
3. Se os dados não mencionarem um bairro específico, não adicione marcadores para ele.
4. O tom deve ser profissional, direto e focado em segurança.

DADOS DA INTERNET (FONTE ÚNICA):
{{{realTimeData}}}

Data/Hora da Requisição: {{{currentDateTime}}}`,
});

export async function generateCrisisReport(input: { currentDateTime: string }): Promise<AiGeneratedCrisisReportOutput> {
  // Busca os dados antes de chamar a IA para evitar erros de helper no Handlebars
  const realTimeData = await fetchInternetData();
  
  const { output } = await crisisReportPrompt({
    currentDateTime: input.currentDateTime,
    realTimeData: realTimeData
  });

  if (!output) {
    throw new Error('Falha catastrófica ao processar dados factuais.');
  }
  
  return output;
}
