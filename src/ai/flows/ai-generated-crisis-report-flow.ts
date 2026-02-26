
'use server';

/**
 * @fileOverview Fluxo de Monitoramento de Crise Factual para Juiz de Fora.
 * Fase 1: Coleta dados meteorológicos REAIS via Open-Meteo (gratuito).
 * Fase 2: Pesquisa notícias reais via Google Search Grounding (Gemini 1.5).
 * Fase 3: Gera relatório estruturado e factual combinando todas as fontes.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// ── Schema do relatório ──────────────────────────────────────────────
const AiGeneratedCrisisReportOutputSchema = z.object({
  summary: z.string().describe('Resumo estritamente factual (max 500 chars) da situação atual em Juiz de Fora, citando dados numéricos reais.'),
  alertLevel: z.enum(['VERDE', 'AMARELO', 'LARANJA', 'VERMELHO']).describe(
    'Nível de alerta baseado em dados técnicos: VERDE=sem risco; AMARELO=atenção; LARANJA=risco alto; VERMELHO=emergência.'
  ),
  affectedAreas: z.array(z.string()).describe('Lista de bairros ou vias com problemas confirmados. Vazio se não há incidentes.'),
  recommendations: z.array(z.string()).describe('Orientações práticas de segurança baseadas na situação real.'),
  markers: z.array(z.object({
    lat: z.number().describe('Latitude real do incidente em Juiz de Fora (entre -21.7 e -21.82)'),
    lng: z.number().describe('Longitude real do incidente em Juiz de Fora (entre -43.3 e -43.42)'),
    description: z.string().describe('Descrição factual do incidente neste ponto'),
    type: z.enum(['alagamento', 'deslizamento', 'bloqueio', 'atencao']),
    severity: z.number().min(1).max(3).describe('1=baixo, 2=médio, 3=alto')
  })).describe('Pontos geográficos precisos de incidentes CONFIRMADOS. Array vazio se sem incidentes.')
});

export type AiGeneratedCrisisReportOutput = z.infer<typeof AiGeneratedCrisisReportOutputSchema>;

const FALLBACK_REPORT: AiGeneratedCrisisReportOutput = {
  summary: "O sistema de IA está temporariamente indisponível para análise detalhada. Baseie-se nos dados meteorológicos brutos e canais oficiais. Possível causa: chave de API inválida ou sobrecarga do serviço.",
  alertLevel: "AMARELO",
  affectedAreas: [],
  recommendations: [
    "Acompanhe os alertas da Defesa Civil por SMS (40199).",
    "Evite transitar por áreas de risco em caso de chuva forte.",
    "Em emergência, ligue 199 ou 193."
  ],
  markers: []
};

// ── Fase 1: Dados meteorológicos reais (Open-Meteo – gratuito, sem API key) ─
async function fetchWeatherData(): Promise<string> {
  try {
    const params = new URLSearchParams({
      latitude: '-21.76',
      longitude: '-43.35',
      current: 'temperature_2m,relative_humidity_2m,precipitation,rain,showers,weather_code,wind_speed_10m,surface_pressure',
      hourly: 'precipitation_probability,precipitation',
      daily: 'precipitation_sum,rain_sum,weather_code',
      forecast_days: '2',
      past_days: '3',
      timezone: 'America/Sao_Paulo',
    });

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`,
      { cache: 'no-store', signal: AbortSignal.timeout(8000) }
    );

    if (!response.ok) throw new Error(`Open-Meteo HTTP ${response.status}`);
    const data = await response.json();

    // Acumulado de chuva nas últimas 72h
    const hourlyPrecip: number[] = data.hourly?.precipitation ?? [];
    const hoursAvailable = Math.min(hourlyPrecip.length, 72);
    const last72h = hourlyPrecip.slice(Math.max(0, hourlyPrecip.length - 72));
    const accumulated72h = last72h.reduce((sum: number, v: number) => sum + (v || 0), 0);

    // Acumulado 24h
    const last24h = hourlyPrecip.slice(Math.max(0, hourlyPrecip.length - 24));
    const accumulated24h = last24h.reduce((sum: number, v: number) => sum + (v || 0), 0);

    // Chuvas diárias (passado + previsão)
    const dailyDates: string[] = data.daily?.time ?? [];
    const dailyPrecip: number[] = data.daily?.precipitation_sum ?? [];
    const dailyRain = dailyDates.map((d: string, i: number) =>
      `${d}: ${dailyPrecip[i]?.toFixed(1) ?? '?'}mm`
    ).join(' | ');

    // Próximas 12 horas
    const next12h: number[] = data.hourly?.precipitation?.slice(0, 12) ?? [];
    const next12hProb: number[] = data.hourly?.precipitation_probability?.slice(0, 12) ?? [];

    // Código WMO para texto
    const wmoCode: number = data.current?.weather_code ?? -1;
    const wmoText = getWmoDescription(wmoCode);

    return `=== DADOS METEOROLOGICOS REAIS — Open-Meteo API ===
Local: Juiz de Fora, MG (-21.76, -43.35)
Temperatura: ${data.current?.temperature_2m ?? '?'}°C
Umidade relativa: ${data.current?.relative_humidity_2m ?? '?'}%
Precipitacao AGORA: ${data.current?.precipitation ?? 0}mm
  Chuva: ${data.current?.rain ?? 0}mm | Pancadas: ${data.current?.showers ?? 0}mm
Condicao (WMO ${wmoCode}): ${wmoText}
Vento: ${data.current?.wind_speed_10m ?? '?'} km/h
Pressao: ${data.current?.surface_pressure ?? '?'} hPa

ACUMULADOS:
  Ultimas 24h: ${accumulated24h.toFixed(1)}mm
  Ultimas 72h: ${accumulated72h.toFixed(1)}mm (${hoursAvailable}h de dados)

CHUVA DIARIA (passado -> previsao):
  ${dailyRain}

PREVISAO PROXIMAS 12H (mm):
  ${next12h.map((v: number) => v?.toFixed(1) ?? '0').join(', ')}
  Probabilidade (%): ${next12hProb.join(', ')}`;
  } catch (e: any) {
    console.error('[fetchWeatherData] Erro:', e?.message);
    return `=== DADOS METEOROLOGICOS ===
FALHA ao acessar Open-Meteo API: ${e?.message ?? 'erro desconhecido'}.
Baseie a analise nas noticias encontradas via busca web.`;
  }
}

function getWmoDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Ceu limpo',
    1: 'Predominantemente limpo', 2: 'Parcialmente nublado', 3: 'Nublado',
    45: 'Nevoeiro', 48: 'Nevoeiro com geada',
    51: 'Garoa leve', 53: 'Garoa moderada', 55: 'Garoa intensa',
    61: 'Chuva leve', 63: 'Chuva moderada', 65: 'Chuva forte',
    71: 'Neve leve', 73: 'Neve moderada', 75: 'Neve forte',
    80: 'Pancadas leves', 81: 'Pancadas moderadas', 82: 'Pancadas violentas',
    85: 'Neve em pancadas leve', 86: 'Neve em pancadas forte',
    95: 'Tempestade', 96: 'Tempestade com granizo leve', 99: 'Tempestade com granizo forte',
  };
  return descriptions[code] ?? `Codigo WMO ${code}`;
}

// ── Fase 2: Busca de notícias reais via Google Search Grounding ─────
async function fetchCrisisNews(currentDateTime: string): Promise<string> {
  try {
    const searchResponse = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: `Pesquise e resuma as informacoes MAIS RECENTES e VERIFICAVEIS sobre a situacao em Juiz de Fora, MG, Brasil, especificamente:

1. Chuvas e enchentes: Chuvas intensas, alagamentos, transbordamento de rios (Paraibuna, corregos)
2. Deslizamentos de terra: Ocorrencias em encostas e morros da cidade
3. Alertas oficiais: Defesa Civil de Juiz de Fora, CEMADEN, INMET, Prefeitura de Juiz de Fora
4. Vias interditadas: Ruas e avenidas bloqueadas (especialmente Av. Brasil, Independencia, Rio Branco)
5. Bairros afetados: Quais bairros tem problemas confirmados
6. Vitimas e desabrigados: Se ha registro de mortes, feridos ou desabrigados
7. Nivel dos rios: Monitoramento do Rio Paraibuna e afluentes
8. Acoes da prefeitura: Abrigos abertos, interdicoes, operacoes de resgate

IMPORTANTE:
- Cite as FONTES de cada informacao (nome do portal, orgao oficial)
- Se NAO encontrar noticias recentes de crise, diga EXPLICITAMENTE: "Sem registros de incidentes ativos"
- Foque em fevereiro de 2026
- Priorize fontes: Tribuna de Minas, G1 Zona da Mata, Prefeitura JF, Defesa Civil MG, CEMADEN

Data/hora da consulta: ${currentDateTime}`,
      config: {
        googleSearchRetrieval: {
          dynamicRetrievalConfig: {
            mode: 'MODE_DYNAMIC',
            dynamicThreshold: 0.3,
          },
        },
      },
    });

    return `=== NOTICIAS E ALERTAS REAIS (Google Search) ===\n${searchResponse.text ?? 'Sem resultados de busca.'}`;
  } catch (e: any) {
    console.warn('[fetchCrisisNews] Google Search grounding falhou:', e?.message);

    // Fallback: tenta gerar sem grounding se o Search falhou
    try {
      const fallbackResponse = await ai.generate({
        model: 'googleai/gemini-2.0-flash',
        prompt: `Com base no seu conhecimento, resuma a situação mais provavel de chuvas e enchentes em Juiz de Fora, MG em fevereiro de 2026. Se não tem informações específicas, diga "Sem dados de noticias disponiveis. Baseie-se nos dados meteorologicos."\n\nData/hora: ${currentDateTime}`,
      });
      return `=== NOTICIAS E ALERTAS (fallback sem grounding) ===\n${fallbackResponse.text ?? 'Sem resultados.'}`;
    } catch {
      return `=== NOTICIAS E ALERTAS ===
Busca web indisponivel: ${e?.message ?? 'erro desconhecido'}.
Analise sera baseada apenas nos dados meteorologicos medidos.`;
    }
  }
}

// ── Fase 3: Geração do relatório estruturado factual ────────────────
export async function generateCrisisReport(input: { currentDateTime: string }): Promise<AiGeneratedCrisisReportOutput> {
  try {
    // Coleta dados em paralelo: weather (gratuito) + news (via Gemini Search)
    const [weatherData, crisisNews] = await Promise.all([
      fetchWeatherData(),
      fetchCrisisNews(input.currentDateTime),
    ]);

    const { output } = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      output: { schema: AiGeneratedCrisisReportOutputSchema },
      prompt: `Voce e o Sistema de Monitoramento Inteligente da Defesa Civil de Juiz de Fora, MG.
Analise os DADOS REAIS abaixo e gere um boletim ESTRITAMENTE FACTUAL.

${weatherData}

${crisisNews}

===================================================
REGRAS INVIOLAVEIS PARA O RELATORIO:
===================================================

1. NUNCA INVENTE ocorrencias. Se os dados mostram tempo seco e sem noticias de incidentes, o alerta e VERDE.

2. CRITERIOS DE ALERTA baseados em dados tecnicos:
   VERDE: precipitacao < 10mm/h, acumulado 72h < 50mm, sem incidentes
   AMARELO: precipitacao 10-25mm/h OU acumulado 72h 50-100mm OU alertas preventivos
   LARANJA: precipitacao > 25mm/h OU acumulado 72h > 100mm OU incidentes confirmados
   VERMELHO: multiplos incidentes graves, vitimas, emergencia declarada

3. MARKERS devem ter coordenadas REAIS de Juiz de Fora:
   Centro: lat -21.760, lng -43.350
   Santa Luzia: lat -21.785, lng -43.340
   Sao Mateus: lat -21.772, lng -43.355
   Igrejinha: lat -21.712, lng -43.400
   Borboleta: lat -21.775, lng -43.370
   Benfica: lat -21.740, lng -43.355
   Cascatinha: lat -21.730, lng -43.380
   Linhares: lat -21.750, lng -43.360
   Vitorino Braga: lat -21.755, lng -43.345
   Se NAO ha incidentes confirmados, retorne markers como array VAZIO [].

4. SUMMARY deve citar dados numericos reais: temperatura, precipitacao medida, acumulados.

5. AFFECTED AREAS: Liste APENAS bairros com problemas CONFIRMADOS por dados ou noticias. Se nao ha, retorne array vazio [].

6. RECOMMENDATIONS devem ser praticas e proporcionais ao nivel de alerta real.

7. Se a busca web retornou noticias de incidentes, inclua eles nos markers com coordenadas do bairro mencionado.

8. Nunca diga "de acordo com a simulacao" ou "dados simulados". Estes sao DADOS REAIS MEDIDOS.

Data/hora: ${input.currentDateTime}`,
    });

    if (!output) {
      console.error('[generateCrisisReport] Falha: IA retornou output vazio.');
      return FALLBACK_REPORT;
    }

    // Validacao de seguranca dos markers (coordenadas dentro de JF)
    output.markers = (output.markers ?? []).filter(m =>
      m.lat >= -21.85 && m.lat <= -21.65 &&
      m.lng >= -43.50 && m.lng <= -43.25 &&
      m.severity >= 1 && m.severity <= 3
    );

    return output;

  } catch (error: any) {
    console.error('[generateCrisisReport] Erro fatal:', error);
    // Em caso de erro na geração (ex: API key invalida, erro de rede, quota), retorna fallback
    return FALLBACK_REPORT;
  }
}
