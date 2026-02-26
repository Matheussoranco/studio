
import { Location, RiskZone } from '@/types';

export const JF_CENTER = { lat: -21.7642, lng: -43.3503 };

export const RISK_ZONES: RiskZone[] = [
  { id: 'rz-1', name: 'Centro (Rio Paraibuna)',       severity: 3, lat: -21.7600, lng: -43.3500, radius: 600 },
  { id: 'rz-2', name: 'Santa Luzia (Encostas)',        severity: 3, lat: -21.7850, lng: -43.3400, radius: 450 },
  { id: 'rz-3', name: 'Igrejinha (Rio Peixe)',         severity: 2, lat: -21.7120, lng: -43.4000, radius: 550 },
  { id: 'rz-4', name: 'São Mateus (Encosta)',          severity: 2, lat: -21.7720, lng: -43.3550, radius: 350 },
  { id: 'rz-5', name: 'Progresso (Baixada)',           severity: 2, lat: -21.7530, lng: -43.3800, radius: 400 },
  { id: 'rz-6', name: 'Vitorino Braga (Córrego)',     severity: 2, lat: -21.7550, lng: -43.3450, radius: 300 },
  { id: 'rz-7', name: 'Borboleta (Drenagem Crítica)', severity: 2, lat: -21.7750, lng: -43.3700, radius: 400 },
  { id: 'rz-8', name: 'Cascatinha (Encosta Norte)',   severity: 3, lat: -21.7300, lng: -43.3800, radius: 500 },
];

export const SAFE_ZONES: Location[] = [
  {
    id: 'sz-1',
    name: 'Ginásio Municipal Jornalista Antônio Marcos',
    lat: -21.7831, lng: -43.3615,
    type: 'SAFE_ZONE',
    status: 'Aberto',
    capacity: '500 pessoas',
    address: 'Rua José Calil Ahouagi, 332 - Centro'
  },
  {
    id: 'sz-2',
    name: 'Escola Municipal Halfeld',
    lat: -21.7615, lng: -43.3482,
    type: 'SAFE_ZONE',
    status: 'Aberto',
    capacity: '200 pessoas',
    address: 'Rua Halfeld, 1179 - Centro'
  },
  {
    id: 'sz-3',
    name: 'Granbery — Complexo Educacional',
    lat: -21.7698, lng: -43.3540,
    type: 'SAFE_ZONE',
    status: 'Aberto',
    capacity: '800 pessoas',
    address: 'Rua Arnaldo de Senna, 2 - Santa Helena'
  },
  {
    id: 'sz-4',
    name: 'UFJF — Ginásio de Esportes',
    lat: -21.7800, lng: -43.3690,
    type: 'SAFE_ZONE',
    status: 'Aberto',
    capacity: '1000 pessoas',
    address: 'R. José Lourenço Kelmer, s/n - São Pedro'
  },
  {
    id: 'sz-5',
    name: 'Escola Est. Professora Ivonete Raymundo',
    lat: -21.7510, lng: -43.3920,
    type: 'SAFE_ZONE',
    status: 'Verificar',
    capacity: '150 pessoas',
    address: 'Bairro Cascatinha'
  },
];

export const DONATION_POINTS: Location[] = [
  {
    id: 'dp-1',
    name: 'Defesa Civil — Ponto Central',
    lat: -21.7628, lng: -43.3445,
    type: 'DONATION_POINT',
    address: 'Avenida Brasil, 560 - Centro',
    phone: '(32) 3690-7294',
    openHours: '24h',
    acceptedItems: ['Água', 'Alimentos', 'Roupas', 'Colchões', 'Higiene']
  },
  {
    id: 'dp-2',
    name: 'Bombeiros — 5º Batalhão',
    lat: -21.7620, lng: -43.3601,
    type: 'DONATION_POINT',
    address: 'Rua Marechal Castelo Branco, 731 - Bom Pastor',
    phone: '193',
    openHours: '24h',
    acceptedItems: ['Água', 'Alimentos não-perecíveis', 'Cobertores']
  },
  {
    id: 'dp-3',
    name: 'Paróquia Nossa Sra. Aparecida — Cascatinha',
    lat: -21.7308, lng: -43.3795,
    type: 'DONATION_POINT',
    address: 'Rua João Severiano da Fonseca, s/n - Cascatinha',
    phone: '(32) 3231-3000',
    openHours: '07:00 - 20:00',
    acceptedItems: ['Roupas', 'Alimentos', 'Calçados', 'Higiene']
  },
  {
    id: 'dp-4',
    name: 'Centro Comunitário São Mateus',
    lat: -21.7720, lng: -43.3540,
    type: 'DONATION_POINT',
    address: 'Bairro São Mateus',
    phone: '(32) 3234-0000',
    openHours: '08:00 - 18:00',
    acceptedItems: ['Água', 'Alimentos', 'Roupas']
  },
];

export const JF_BAIRROS = [
  'Centro', 'São Mateus', 'Santa Luzia', 'Igrejinha', 'Borboleta', 'Progresso', 'Ipiranga', 'Grajaú', 
  'Cascatinha', 'Benfica', 'Mariano Procópio', 'Nova Era', 'Fátima', 'Jardim Glória', 'Manoel Honório',
  'Santa Helena', 'Bandeirantes', 'Vitorino Braga', 'São Pedro', 'Linhares', 'Bom Pastor', 'Teixeiras',
  'Cruzeiro do Sul', 'Retiro', 'Cerâmica', 'São Benedito', 'Nossa Sra. de Fátima', 'Outros'
];

/** Approximate centre coordinates for each neighbourhood, used as fallback
 *  when GPS geolocation is unavailable in ReportModal. */
export const BAIRRO_COORDS: Record<string, { lat: number; lng: number }> = {
  'Centro':             { lat: -21.7600, lng: -43.3500 },
  'São Mateus':         { lat: -21.7720, lng: -43.3550 },
  'Santa Luzia':        { lat: -21.7850, lng: -43.3400 },
  'Igrejinha':          { lat: -21.7120, lng: -43.4000 },
  'Borboleta':          { lat: -21.7750, lng: -43.3700 },
  'Progresso':          { lat: -21.7530, lng: -43.3800 },
  'Ipiranga':           { lat: -21.7580, lng: -43.3320 },
  'Grajaú':             { lat: -21.7650, lng: -43.3280 },
  'Cascatinha':         { lat: -21.7300, lng: -43.3800 },
  'Benfica':            { lat: -21.7400, lng: -43.3550 },
  'Mariano Procópio':   { lat: -21.7820, lng: -43.3460 },
  'Nova Era':           { lat: -21.7670, lng: -43.3440 },
  'Fátima':             { lat: -21.7500, lng: -43.3600 },
  'Jardim Glória':      { lat: -21.7440, lng: -43.3420 },
  'Manoel Honório':     { lat: -21.7690, lng: -43.3600 },
  'Santa Helena':       { lat: -21.7700, lng: -43.3540 },
  'Bandeirantes':       { lat: -21.7560, lng: -43.3680 },
  'Vitorino Braga':     { lat: -21.7550, lng: -43.3450 },
  'São Pedro':          { lat: -21.7800, lng: -43.3690 },
  'Linhares':           { lat: -21.7510, lng: -43.3600 },
  'Bom Pastor':         { lat: -21.7620, lng: -43.3601 },
  'Teixeiras':          { lat: -21.6500, lng: -43.3200 },
  'Cruzeiro do Sul':    { lat: -21.7620, lng: -43.3350 },
  'Retiro':             { lat: -21.7480, lng: -43.3720 },
  'Cerâmica':           { lat: -21.7700, lng: -43.3380 },
  'São Benedito':       { lat: -21.7660, lng: -43.3520 },
  'Nossa Sra. de Fátima': { lat: -21.7500, lng: -43.3600 },
  'Outros':             { lat: -21.7642, lng: -43.3503 },
};

