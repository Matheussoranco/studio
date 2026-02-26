
'use server';
/**
 * @fileOverview A Genkit flow for generating an AI-powered crisis report for Juiz de Fora, MG.
 *
 * - generateCrisisReport - A function that handles the generation of the crisis report.
 * - AiGeneratedCrisisReportInput - The input type for the generateCrisisReport function.
 * - AiGeneratedCrisisReportOutput - The return type for the generateCrisisReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema
const AiGeneratedCrisisReportInputSchema = z.object({
  currentDateTime: z.string().describe('The current date and time in a human-readable format.'),
});
export type AiGeneratedCrisisReportInput = z.infer<typeof AiGeneratedCrisisReportInputSchema>;

// Output Schema
const AiGeneratedCrisisReportOutputSchema = z.object({
  summary: z.string().max(150).describe('Um boletim de situação resumido (máx 150 palavras) sobre chuvas e alagamentos na cidade.'),
  alertLevel: z.enum(['VERDE', 'AMARELO', 'LARANJA', 'VERMELHO']).describe('O nível de alerta atual para a situação de emergência (VERDE, AMARELO, LARANJA, VERMELHO).'),
  affectedAreas: z.array(z.string()).describe('Uma lista das principais áreas afetadas por chuvas e alagamentos.'),
  recommendations: z.array(z.string()).describe('Uma lista de recomendações para a população.'),
});
export type AiGeneratedCrisisReportOutput = z.infer<typeof AiGeneratedCrisisReportOutputSchema>;

// Prompt definition
const crisisReportPrompt = ai.definePrompt({
  name: 'crisisReportPrompt',
  // Removed explicit model to use the default configured in src/ai/genkit.ts
  input: { schema: AiGeneratedCrisisReportInputSchema },
  output: { schema: AiGeneratedCrisisReportOutputSchema },
  prompt: `Você é um assistente de emergência para Juiz de Fora, MG. Gere um boletim de situação resumido (máx 150 palavras) sobre chuvas e alagamentos na cidade, com nível de alerta atual (VERDE/AMARELO/LARANJA/VERMELHO), principais áreas afetadas, e recomendações para a população. Use linguagem clara e direta. Data/hora atual: {{{currentDateTime}}}`,
});

// Flow definition
const aiGeneratedCrisisReportFlow = ai.defineFlow(
  {
    name: 'aiGeneratedCrisisReportFlow',
    inputSchema: AiGeneratedCrisisReportInputSchema,
    outputSchema: AiGeneratedCrisisReportOutputSchema,
  },
  async (input) => {
    const { output } = await crisisReportPrompt(input);
    if (!output) {
        throw new Error('Failed to generate crisis report output.');
    }
    return output;
  }
);

// Wrapper function for external calls
export async function generateCrisisReport(input: AiGeneratedCrisisReportInput): Promise<AiGeneratedCrisisReportOutput> {
  return aiGeneratedCrisisReportFlow(input);
}
