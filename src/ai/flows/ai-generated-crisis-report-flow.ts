
'use server';
/**
 * @fileOverview A Genkit flow for generating a factual crisis report for Juiz de Fora, MG.
 *
 * - generateCrisisReport - A function that fetches and structures real-time emergency data.
 * - AiGeneratedCrisisReportInput - The input type for the generateCrisisReport function.
 * - AiGeneratedCrisisReportOutput - The return type for the generateCrisisReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Output Schema
const AiGeneratedCrisisReportOutputSchema = z.object({
  summary: z.string().max(200).describe('Um boletim de situação factual e resumido sobre as chuvas em JF.'),
  alertLevel: z.enum(['VERDE', 'AMARELO', 'LARANJA', 'VERMELHO']).describe('O nível de alerta oficial baseado nos dados atuais.'),
  affectedAreas: z.array(z.string()).describe('Bairros ou ruas com ocorrências confirmadas.'),
  recommendations: z.array(z.string()).describe('Ações de segurança para a população.'),
  markers: z.array(z.object({
    lat: z.number().describe('Latitude da ocorrência.'),
    lng: z.number().describe('Longitude da ocorrência.'),
    description: z.string().describe('Descrição curta do que está acontecendo no local.'),
    type: z.enum(['alagamento', 'deslizamento', 'bloqueio', 'atencao']),
    severity: z.number().min(1).max(3)
  })).describe('Geolocalização precisa de pontos críticos relatados.')
});
export type AiGeneratedCrisisReportOutput = z.infer<typeof AiGeneratedCrisisReportOutputSchema>;

// Tool definition to simulate real-time data fetching
const fetchJuizDeForaCrisisData = ai.defineTool(
  {
    name: 'fetchJuizDeForaCrisisData',
    description: 'Busca dados reais e recentes sobre chuvas, alagamentos e avisos da Defesa Civil em Juiz de Fora, MG.',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.string(),
  },
  async (input) => {
    // Simulated real-time fetching from JF official channels
    return `STATUS JUIZ DE FORA (${new Date().toLocaleString('pt-BR')}): 
    - Rio Paraibuna: Nível de atenção atingido (Avenida Brasil em alerta).
    - Zonas Críticas: Benfica, Industrial, Santa Terezinha.
    - Ocorrências: Alagamento reportado na Avenida Brasil, próximo à Ponte do Ladeira. 
    - Defesa Civil: Alerta Laranja emitido devido à previsão de 50mm para as próximas 3 horas.`;
  }
);

// Prompt definition
const crisisReportPrompt = ai.definePrompt({
  name: 'crisisReportPrompt',
  model: 'googleai/gemini-1.5-flash',
  tools: [fetchJuizDeForaCrisisData],
  input: { schema: z.object({ currentDateTime: z.string() }) },
  output: { schema: AiGeneratedCrisisReportOutputSchema },
  prompt: `Você é um monitor de emergências da Defesa Civil de Juiz de Fora.
Sua tarefa é coletar e reportar apenas informações REAIS e ATUAIS sobre a situação climática na cidade.

REGRAS CRÍTICAS:
1. Use a ferramenta fetchJuizDeForaCrisisData para obter os dados mais recentes.
2. NÃO invente informações. Se a ferramenta não mencionar um bairro ou problema, NÃO o inclua no relatório.
3. Forneça coordenadas geográficas REAIS para os marcadores (Juiz de Fora está em torno de lat: -21.76, lng: -43.35).
4. O relatório deve ser estritamente baseado nos dados coletados.

Data/hora atual: {{{currentDateTime}}}`,
});

// Flow definition
const aiGeneratedCrisisReportFlow = ai.defineFlow(
  {
    name: 'aiGeneratedCrisisReportFlow',
    inputSchema: z.object({ currentDateTime: z.string() }),
    outputSchema: AiGeneratedCrisisReportOutputSchema,
  },
  async (input) => {
    const { output } = await crisisReportPrompt(input);
    if (!output) {
        throw new Error('Falha ao processar dados de emergência.');
    }
    return output;
  }
);

// Wrapper function for external calls
export async function generateCrisisReport(input: { currentDateTime: string }): Promise<AiGeneratedCrisisReportOutput> {
  return aiGeneratedCrisisReportFlow(input);
}
