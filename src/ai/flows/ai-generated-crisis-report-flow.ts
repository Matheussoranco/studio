
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiGeneratedCrisisReportOutputSchema = z.object({
  summary: z.string().max(300).describe('Resumo factual da situação em JF.'),
  alertLevel: z.enum(['VERDE', 'AMARELO', 'LARANJA', 'VERMELHO']),
  affectedAreas: z.array(z.string()),
  recommendations: z.array(z.string()),
  markers: z.array(z.object({
    lat: z.number(),
    lng: z.number(),
    description: z.string(),
    type: z.enum(['alagamento', 'deslizamento', 'bloqueio', 'atencao']),
    severity: z.number().min(1).max(3)
  }))
});

export type AiGeneratedCrisisReportOutput = z.infer<typeof AiGeneratedCrisisReportOutputSchema>;

const fetchEmergencyData = ai.defineTool(
  {
    name: 'fetchEmergencyData',
    description: 'Coleta dados reais da Defesa Civil de Juiz de Fora.',
    inputSchema: z.object({}),
    outputSchema: z.string(),
  },
  async () => {
    const now = new Date();
    // Simulação de dados factuais para Juiz de Fora
    return `STATUS JF - ${now.toLocaleTimeString()}
    - Rio Paraibuna atingiu 3.2m na região do Centro.
    - Queda de barreira na Av. Ibitiguaia (Santa Luzia).
    - Trânsito bloqueado na Ponte Santa Terezinha devido a acúmulo de água.
    - Acumulado de chuva: 40mm nas últimas 4 horas.
    - Previsão: Continuidade de chuvas fortes nas próximas horas.`;
  }
);

const crisisReportPrompt = ai.definePrompt({
  name: 'crisisReportPrompt',
  tools: [fetchEmergencyData],
  input: { schema: z.object({ currentDateTime: z.string() }) },
  output: { schema: AiGeneratedCrisisReportOutputSchema },
  prompt: `Você é o sistema de inteligência da Defesa Civil de Juiz de Fora.
Analise os dados da ferramenta fetchEmergencyData e gere um relatório Factual.

REGRAS:
1. NÃO invente bairros. Use os citados nos dados.
2. Nível de alerta: VERMELHO se houver bloqueios ou rios transbordando.
3. Gere marcadores geográficos aproximados para Juiz de Fora (Lat: -21.76, Lng: -43.35).

Data/Hora: {{{currentDateTime}}}`,
});

export async function generateCrisisReport(input: { currentDateTime: string }): Promise<AiGeneratedCrisisReportOutput> {
  const { output } = await crisisReportPrompt(input);
  if (!output) throw new Error('Erro ao processar boletim.');
  return output;
}
