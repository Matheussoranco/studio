'use server';

/**
 * @fileOverview Fluxo de Monitoramento de Crise — Juiz de Fora, MG
 *
 * Fontes de dados coletadas em PARALELO antes de gerar o relatório:
 *   1. Open-Meteo      — Clima atual + acumulados (gratuito, sem key)
 *   2. INMET Alertas   — Alertas oficiais para MG/JF (gratuito, sem key)
 *   3. INMET Previsão  — Previsão 7 dias para JF IBGE 3136702 (gratuito)
 *   4. CEMADEN         — Acumulado de chuva estações pluviométricas JF (gratuito)
 *   5. Climatempo      — Previsão + atual (opcional — CLIMATEMPO_API_TOKEN env var)
 *   6. ANA Telemetria  — Nível e cota do Rio Paraibuna (gratuito, sem key)
 *   7. Google Search   — Notícias e alertas em tempo real via Gemini Grounding
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// ── Constantes geográficas ───────────────────────────────────────────────────
const JF_LAT = '-21.76';
const JF_LON = '-43.35';
const JF_IBGE = '3136702';          // Código IBGE Juiz de Fora
const CLIMATEMPO_LOCALE_ID = 3140;  // ID Climatempo para Juiz de Fora

// ── Schema do relatório ──────────────────────────────────────────────────────
const AiGeneratedCrisisReportOutputSchema = z.object({
  summary: z.string().describe(
    'Resumo estritamente factual (max 600 chars) citando dados numéricos REAIS de temperatura, precipitação e alertas oficiais ativos.'
  ),
  alertLevel: z.enum(['VERDE', 'AMARELO', 'LARANJA', 'VERMELHO']).describe(
    'Nível de alerta: VERDE=sem risco; AMARELO=atenção; LARANJA=risco alto; VERMELHO=emergência ativa.'
  ),
  affectedAreas: z.array(z.string()).describe(
    'Lista de bairros/vias com problemas CONFIRMADOS por fontes oficiais. Array vazio se sem incidentes.'
  ),
  recommendations: z.array(z.string()).describe(
    'Orientações práticas de segurança proporcionais ao nível de alerta real.'
  ),
  markers: z.array(z.object({
    lat: z.number().describe('Latitude real do incidente (entre -21.65 e -21.85)'),
    lng: z.number().describe('Longitude real do incidente (entre -43.25 e -43.50)'),
    description: z.string().describe('Descrição factual e concisa do incidente'),
    type: z.enum(['alagamento', 'deslizamento', 'bloqueio', 'atencao']),
    severity: z.number().int().min(1).max(3).describe('1=baixo 2=médio 3=alto'),
  })).describe('Pontos geográficos de incidentes CONFIRMADOS. Array vazio se não há incidentes.'),
});

export type AiGeneratedCrisisReportOutput = z.infer<typeof AiGeneratedCrisisReportOutputSchema>;

const FALLBACK_REPORT: AiGeneratedCrisisReportOutput = {
  summary:
    'O sistema de IA está temporariamente indisponível. Consulte os canais oficiais: Defesa Civil (199), Bombeiros (193) e o site da Prefeitura de Juiz de Fora.',
  alertLevel: 'AMARELO',
  affectedAreas: [],
  recommendations: [
    'Acompanhe os alertas da Defesa Civil por SMS (40199).',
    'Evite transitar por áreas de risco em caso de chuva forte.',
    'Em emergência, ligue 199 (Defesa Civil) ou 193 (Bombeiros).',
  ],
  markers: [],
};

// ── 1. Open-Meteo ────────────────────────────────────────────────────────────
async function fetchOpenMeteo(): Promise<string> {
  try {
    const params = new URLSearchParams({
      latitude: JF_LAT,
      longitude: JF_LON,
      current:
        'temperature_2m,relative_humidity_2m,precipitation,rain,showers,weather_code,wind_speed_10m,surface_pressure',
      hourly: 'precipitation_probability,precipitation',
      daily: 'precipitation_sum,rain_sum,weather_code,temperature_2m_max,temperature_2m_min',
      forecast_days: '3',
      past_days: '3',
      timezone: 'America/Sao_Paulo',
    });

    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();

    const hp: number[] = d.hourly?.precipitation ?? [];
    const acc24 = hp.slice(-24).reduce((s: number, v: number) => s + (v || 0), 0);
    const acc72 = hp.slice(-72).reduce((s: number, v: number) => s + (v || 0), 0);

    const dailyRows = (d.daily?.time ?? [])
      .map((dt: string, i: number) =>
        `  ${dt}: ${(d.daily?.precipitation_sum?.[i] ?? 0).toFixed(1)}mm | ${d.daily?.temperature_2m_min?.[i] ?? '?'}–${d.daily?.temperature_2m_max?.[i] ?? '?'}°C`
      )
      .join('\n');

    const next12precip = (d.hourly?.precipitation ?? []).slice(0, 12).map((v: number) => (v ?? 0).toFixed(1)).join(', ');
    const next12prob   = (d.hourly?.precipitation_probability ?? []).slice(0, 12).join(', ');
    const wmoText = WMO_DESCRIPTIONS[d.current?.weather_code as number] ?? `WMO ${d.current?.weather_code}`;

    return `=== OPEN-METEO (Juiz de Fora, MG) ===
Temperatura: ${d.current?.temperature_2m ?? '?'}°C | Umidade: ${d.current?.relative_humidity_2m ?? '?'}%
Precipitação atual: ${d.current?.precipitation ?? 0}mm (chuva ${d.current?.rain ?? 0}mm + pancadas ${d.current?.showers ?? 0}mm)
Condição: ${wmoText}
Vento: ${d.current?.wind_speed_10m ?? '?'} km/h | Pressão: ${d.current?.surface_pressure ?? '?'} hPa
Acumulado 24h: ${acc24.toFixed(1)}mm | 72h: ${acc72.toFixed(1)}mm

Histórico diário:
${dailyRows}

Próximas 12h — Precipitação (mm): ${next12precip}
Próximas 12h — Probabilidade (%): ${next12prob}`;
  } catch (e: any) {
    console.error('[fetchOpenMeteo]', e?.message);
    return `=== OPEN-METEO ===\nFalha: ${e?.message}. Sem dados meteorológicos numéricos.`;
  }
}

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: 'Céu limpo', 1: 'Predominantemente limpo', 2: 'Parcialmente nublado', 3: 'Nublado',
  45: 'Nevoeiro', 48: 'Nevoeiro com geada',
  51: 'Garoa leve', 53: 'Garoa moderada', 55: 'Garoa intensa',
  61: 'Chuva leve', 63: 'Chuva moderada', 65: 'Chuva forte',
  80: 'Pancadas leves', 81: 'Pancadas moderadas', 82: 'Pancadas violentas',
  95: 'Tempestade', 96: 'Tempestade com granizo leve', 99: 'Tempestade com granizo forte',
};

// ── 2. INMET — Alertas ativos para MG ───────────────────────────────────────
async function fetchInmetAlerts(): Promise<string> {
  try {
    const res = await fetch('https://apitempo.inmet.gov.br/alertas/por-estado/MG', {
      cache: 'no-store',
      signal: AbortSignal.timeout(9000),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const alerts: any[] = await res.json();

    if (!Array.isArray(alerts) || alerts.length === 0) {
      return '=== ALERTAS INMET (MG) ===\nNenhum alerta meteorológico ativo para Minas Gerais.';
    }

    const jf = alerts.filter((a) => {
      const m = String(a.municipios ?? a.municipio ?? '').toLowerCase();
      const g = String(a.geocodigo ?? '');
      return m.includes('juiz de fora') || g.startsWith('3136') || g === JF_IBGE;
    });

    const subset = jf.length > 0 ? jf : alerts.slice(0, 6);
    const tag = jf.length > 0
      ? 'ALERTAS INMET — JUIZ DE FORA'
      : 'ALERTAS INMET — MG (sem alerta específico p/ JF)';

    const rows = subset.map((a) =>
      [
        `[${(a.tipo_severidade ?? a.nivel ?? 'N/A').toUpperCase()}] ${a.titulo ?? a.descricao_alerta ?? 'sem título'}`,
        `Municípios: ${a.municipios ?? a.municipio ?? 'N/A'}`,
        `Período: ${a.data_inicio ?? '?'} → ${a.data_fim ?? '?'}`,
        `Descrição: ${a.descricao ?? a.descricao_alerta ?? 'N/A'}`,
      ].join('\n')
    ).join('\n---\n');

    return `=== ${tag} ===\n${rows}`;
  } catch (e: any) {
    console.warn('[fetchInmetAlerts]', e?.message);
    return `=== ALERTAS INMET ===\nFalha: ${e?.message}.`;
  }
}

// ── 3. INMET — Previsão 7 dias para JF (IBGE 3136702) ───────────────────────
async function fetchInmetForecast(): Promise<string> {
  try {
    const res = await fetch(
      `https://apiprevmet3.inmet.gov.br/previsao/municipio/${JF_IBGE}`,
      { cache: 'no-store', signal: AbortSignal.timeout(9000), headers: { Accept: 'application/json' } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();

    const entries: [string, any][] = Array.isArray(raw)
      ? raw.map((item: any, i: number) => [item.data ?? String(i), item])
      : Object.entries(raw).filter(([k]) => /^\d{4}-\d{2}-\d{2}$/.test(k));

    if (entries.length === 0) throw new Error('Nenhum dado no retorno da previsão');

    let out = `=== PREVISÃO INMET — Juiz de Fora, MG (IBGE ${JF_IBGE}) ===\n`;
    for (const [date, day] of entries.slice(0, 7)) {
      const tarde = day.tarde  ?? day.afternoon ?? {};
      const manha = day.manha  ?? day.morning   ?? {};
      const noite = day.noite  ?? day.night     ?? {};
      const tmax  = day.temp_max ?? tarde.temp_max ?? manha.temp_max ?? '?';
      const tmin  = day.temp_min ?? noite.temp_min ?? manha.temp_min ?? '?';
      const cond  = tarde.descricao ?? manha.descricao ?? day.descricao ?? day.description ?? '?';
      const rain  = day.chuva ?? tarde.chuva ?? manha.chuva ?? '?';
      const umid  = day.umid_max ?? tarde.umid_max ?? '?';
      out += `${date}: ${cond} | T: ${tmin}–${tmax}°C | Chuva: ${rain}mm | Umid. máx: ${umid}%\n`;
    }
    return out;
  } catch (e: any) {
    console.warn('[fetchInmetForecast]', e?.message);
    return `=== PREVISÃO INMET ===\nFalha: ${e?.message}.`;
  }
}

// ── 4. CEMADEN — Pluviometria estações JF ────────────────────────────────────
async function fetchCemadenData(): Promise<string> {
  try {
    const res = await fetch(
      `http://sjc.salvar.cemaden.gov.br/resources/graficos/pluviometro/getPcds.json?uf=MG&cidade=Juiz%20de%20Fora`,
      { cache: 'no-store', signal: AbortSignal.timeout(9000) }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    const stations: any[] = data?.objeto ?? data ?? [];
    if (!Array.isArray(stations) || stations.length === 0) {
      return '=== CEMADEN (Pluviometria JF) ===\nNenhuma estação retornada.';
    }

    const sorted = [...stations].sort(
      (a, b) => parseFloat(b.acumulado ?? b.valorRecente ?? 0) - parseFloat(a.acumulado ?? a.valorRecente ?? 0)
    );

    let out = `=== CEMADEN — Estações Pluviométricas Juiz de Fora (${stations.length} estações) ===\n`;
    for (const st of sorted.slice(0, 10)) {
      const nome   = st.nomePcd ?? st.nome ?? 'N/A';
      const acum   = st.acumulado ?? st.valorRecente ?? st.valor ?? '?';
      const hora   = st.dataHora ?? st.ultimaLeitura ?? '?';
      const bairro = st.bairro ? ` (${st.bairro})` : '';
      out += `• ${nome}${bairro}: ${acum}mm — última leitura: ${hora}\n`;
    }
    if (sorted[0]) {
      out += `\nMAIOR ACUMULADO: ${sorted[0].nomePcd ?? sorted[0].nome ?? 'N/A'} com ${sorted[0].acumulado ?? sorted[0].valorRecente ?? '?'}mm`;
    }
    return out;
  } catch (e: any) {
    console.warn('[fetchCemadenData]', e?.message);
    return `=== CEMADEN ===\nFalha: ${e?.message}.`;
  }
}

// ── 5. Climatempo (opcional — requer CLIMATEMPO_API_TOKEN no .env) ───────────
async function fetchClimatempoData(): Promise<string> {
  const token = process.env.CLIMATEMPO_API_TOKEN;
  if (!token) {
    return `=== CLIMATEMPO ===\nToken não configurado. Adicione CLIMATEMPO_API_TOKEN ao .env.local para habilitar.`;
  }
  try {
    await fetch(
      `http://apiadvisor.climatempo.com.br/api/v1/locale/register/${CLIMATEMPO_LOCALE_ID}?token=${token}`,
      { method: 'PUT', signal: AbortSignal.timeout(6000) }
    );

    const [currentRes, forecastRes] = await Promise.all([
      fetch(`http://apiadvisor.climatempo.com.br/api/v1/weather/locale/${CLIMATEMPO_LOCALE_ID}/current?token=${token}`, {
        cache: 'no-store', signal: AbortSignal.timeout(9000),
      }),
      fetch(`http://apiadvisor.climatempo.com.br/api/v1/forecast/locale/${CLIMATEMPO_LOCALE_ID}/days/15?token=${token}`, {
        cache: 'no-store', signal: AbortSignal.timeout(9000),
      }),
    ]);

    let out = `=== CLIMATEMPO — Juiz de Fora, MG ===\n`;

    if (currentRes.ok) {
      const c = (await currentRes.json())?.data ?? {};
      out += `Condição: ${c.condition ?? '?'} | Temp: ${c.temperature ?? '?'}°C | Sensação: ${c.sensation ?? '?'}°C\n`;
      out += `Umidade: ${c.humidity ?? '?'}% | Vento: ${c.wind_velocity ?? '?'} km/h (${c.wind_direction ?? '?'})\n`;
      out += `Chuva 1h: ${c.rain?.precipitation ?? 0}mm | Prob: ${c.rain?.probability ?? '?'}%\n`;
    }

    if (forecastRes.ok) {
      const days: any[] = (await forecastRes.json())?.data ?? [];
      out += `\nPrevisão Climatempo (até 15 dias):\n`;
      for (const day of days.slice(0, 10)) {
        const t   = day.temperature ?? {};
        const r   = day.rain ?? {};
        const txt = day.text_icon?.text?.pt ?? day.condition ?? '?';
        out += `  ${day.date_br ?? day.date}: ${txt} | ${t.min ?? '?'}–${t.max ?? '?'}°C | Chuva: ${r.precipitation ?? 0}mm (prob. ${r.probability ?? '?'}%)\n`;
      }
    }
    return out;
  } catch (e: any) {
    console.warn('[fetchClimatempoData]', e?.message);
    return `=== CLIMATEMPO ===\nFalha: ${e?.message}.`;
  }
}

// ── 6. ANA Telemetria — Rio Paraibuna (Estação 58082000) ───────────────────
async function fetchAnaRiverLevel(): Promise<string> {
  try {
    const fmt = (d: Date) => `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    const end   = fmt(new Date());
    const start = fmt(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    const url = `https://telemetriaws1.ana.gov.br/ServiceANA.asmx/DadosHidrometeorologicos?codEstacao=58082000&dataInicio=${start}&dataFim=${end}`;
    const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!res.ok) return `=== ANA TELEMETRIA ===\nHTTP ${res.status}.`;
    const xml = await res.text();
    // Extract last few readings (Nivel and DataHora tags)
    const nivelMatches  = [...xml.matchAll(/<Nivel>(.*?)<\/Nivel>/g)].slice(-5).map(m => m[1]);
    const dateMatches   = [...xml.matchAll(/<DataHora>(.*?)<\/DataHora>/g)].slice(-5).map(m => m[1]);
    const chuvaMatches  = [...xml.matchAll(/<Chuva>(.*?)<\/Chuva>/g)].slice(-5).map(m => m[1]);
    if (nivelMatches.length === 0) return `=== ANA TELEMETRIA ===\nSem leituras recentes para a estação 58082000 (Rio Paraibuna).`;
    let out = `=== ANA TELEMETRIA — Rio Paraibuna (Estação 58082000) ===\n`;
    out += `Últimas leituras:\n`;
    for (let i = 0; i < nivelMatches.length; i++) {
      out += `  ${dateMatches[i] ?? '-'} | Nível: ${nivelMatches[i]}m | Chuva: ${chuvaMatches[i] ?? '-'}mm\n`;
    }
    return out;
  } catch (e: any) {
    console.warn('[fetchAnaRiverLevel]', e?.message);
    return `=== ANA TELEMETRIA ===\nFalha: ${e?.message}.`;
  }
}

// ── 7. Google Search Grounding — Notícias em tempo real ─────────────────────
async function fetchLiveNews(currentDateTime: string): Promise<string> {
  try {
    const res = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: `Pesquise AGORA as notícias MAIS RECENTES sobre Juiz de Fora, MG, Brasil. Para cada informação, cite a fonte e data/hora da publicação.

TÓPICOS:
1. Alertas meteorológicos ativos — INMET, CEMADEN, Defesa Civil JF/MG
2. Alagamentos e enchentes — Rio Paraibuna, córregos urbanos
3. Deslizamentos de terra ou encostas em risco
4. Vias interditadas — Av. Brasil, Av. Independência, Av. Rio Branco, BR-267, BR-040
5. Bairros afetados — Santa Cândida, Santa Cruz, Floresta, São Mateus, Igrejinha, Progresso, Benfica
6. Vítimas, desabrigados ou desalojados
7. Operações da Defesa Civil, Bombeiros, SAMU
8. Comunicados — Prefeitura de Juiz de Fora (pjf.mg.gov.br)
9. Nível do Rio Paraibuna
10. Previsão de chuvas intensas para as próximas 24–48h em JF

INSTRUÇÕES:
- Se NÃO encontrar registros de crise ativa: escreva "SEM INCIDENTES CONFIRMADOS NO MOMENTO"
- Priorize eventos de fevereiro de 2026
- Fontes preferidas: Tribuna de Minas, GZM (G1 Zona da Mata), pjf.mg.gov.br, Defesa Civil MG, cemaden.gov.br, inmet.gov.br

Data/hora da consulta: ${currentDateTime}`,
      config: { googleSearchRetrieval: true },
    });

    return `=== NOTÍCIAS E ALERTAS EM TEMPO REAL (Google Search) ===\n${res.text ?? 'Sem resultados.'}`;
  } catch (e: any) {
    console.warn('[fetchLiveNews] Search grounding falhou:', e?.message);
    try {
      const fallback = await ai.generate({
        model: 'googleai/gemini-2.5-flash',
        prompt: `Sem acesso à internet neste momento. Liste as áreas historicamente vulneráveis a enchentes e deslizamentos em Juiz de Fora, MG, e riscos esperados no verão. Deixe claro que são dados históricos/contextuais.\nData: ${currentDateTime}`,
      });
      return `=== CONTEXTO CLIMÁTICO HISTÓRICO (sem busca em tempo real) ===\n${fallback.text ?? 'Sem dados.'}`;
    } catch {
      return `=== NOTÍCIAS ===\nBusca web indisponível: ${e?.message}.`;
    }
  }
}

// ── Geração do relatório estruturado ────────────────────────────────────────
export async function generateCrisisReport(
  input: { currentDateTime: string }
): Promise<AiGeneratedCrisisReportOutput> {
  try {
    const [openMeteo, inmetAlerts, inmetForecast, cemaden, climatempo, anaRiver, liveNews] =
      await Promise.all([
        fetchOpenMeteo(),
        fetchInmetAlerts(),
        fetchInmetForecast(),
        fetchCemadenData(),
        fetchClimatempoData(),
        fetchAnaRiverLevel(),
        fetchLiveNews(input.currentDateTime),
      ]);

    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      output: { schema: AiGeneratedCrisisReportOutputSchema },
      prompt: `Você é o Sistema de Monitoramento Inteligente da Defesa Civil de Juiz de Fora, MG.
Analise TODOS os dados reais abaixo e gere um boletim ESTRITAMENTE FACTUAL.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${openMeteo}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${inmetAlerts}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${inmetForecast}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${cemaden}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${climatempo}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${anaRiver}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${liveNews}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REGRAS INVIOLÁVEIS:

1. NUNCA INVENTE ocorrências. Tempo seco + sem alertas INMET + sem notícias confirmadas → VERDE.

2. CRITÉRIOS DE ALERTA:
   VERDE:    < 10mm/h, acumulado 72h < 50mm, sem alertas oficiais, sem notícias de incidentes
   AMARELO:  10–25mm/h OU 72h 50–100mm OU alertas preventivos INMET/CEMADEN
   LARANJA:  > 25mm/h OU 72h > 100mm OU incidentes confirmados por fontes oficiais
   VERMELHO: múltiplos incidentes graves, vítimas confirmadas, emergência declarada

3. FONTE PRIORITÁRIA para o nível de alerta:
   Alertas INMET oficiais > Notícias verificadas > Dados CEMADEN/Climatempo > Open-Meteo

4. MARKERS — coordenadas reais de Juiz de Fora:
   Centro: -21.760, -43.350  |  Santa Luzia: -21.785, -43.340  |  São Mateus: -21.772, -43.355
   Igrejinha: -21.712, -43.400  |  Borboleta: -21.775, -43.370  |  Benfica: -21.740, -43.355
   Cascatinha: -21.730, -43.380  |  Progresso: -21.768, -43.362  |  Santa Cândida: -21.795, -43.342
   Se NÃO há incidentes confirmados → markers = []

5. SUMMARY: cite números reais — temperatura, precipitação medida, acumulados, alertas INMET ativos.

6. AFFECTED AREAS: apenas bairros com problemas CONFIRMADOS. Se nenhum → array vazio [].

7. Se notícias trouxerem incidentes em bairros específicos, crie markers com coordenadas do bairro.

8. Nunca use "simulação" ou "dados simulados". Estes são DADOS REAIS e NOTÍCIAS VERIFICADAS.

Data/hora da consulta: ${input.currentDateTime}`,
    });

    if (!output) {
      console.error('[generateCrisisReport] output vazio');
      return FALLBACK_REPORT;
    }

    output.markers = (output.markers ?? []).filter(
      (m) =>
        m.lat >= -21.85 && m.lat <= -21.65 &&
        m.lng >= -43.50 && m.lng <= -43.25 &&
        m.severity >= 1 && m.severity <= 3
    );

    return output;
  } catch (error: any) {
    const status = error?.status ?? error?.code ?? 'unknown';
    console.error(`[generateCrisisReport] Erro fatal status=${status}:`, error?.message ?? error);
    return { ...FALLBACK_REPORT, summary: `${FALLBACK_REPORT.summary} Código do erro: ${status}.` };
  }
}