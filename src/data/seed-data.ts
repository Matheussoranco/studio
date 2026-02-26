
import { Location, RiskZone } from '@/types';

export const JF_CENTER = { lat: -21.7642, lng: -43.3503 };

export const RISK_ZONES: RiskZone[] = [
  { id: 'rz-1', name: 'Centro (Rio Paraibuna)', severity: 3, lat: -21.760, lng: -43.350, radius: 500 },
  { id: 'rz-2', name: 'Santa Luzia (Encostas)', severity: 3, lat: -21.785, lng: -43.340, radius: 400 },
  { id: 'rz-3', name: 'Igrejinha (Rio Peixe)', severity: 2, lat: -21.712, lng: -43.400, radius: 600 },
  { id: 'rz-4', name: 'Bairro São Mateus', severity: 2, lat: -21.772, lng: -43.355, radius: 300 }
];

export const SAFE_ZONES: Location[] = [
  {
    id: 'sz-1',
    name: 'Ginásio Municipal Jornalista Antônio Marcos',
    lat: -21.7831,
    lng: -43.3615,
    type: 'SAFE_ZONE',
    status: 'Aberto',
    capacity: '500 pessoas',
    address: 'Rua José Calil Ahouagi, 332 - Centro'
  },
  {
    id: 'sz-2',
    name: 'Escola Municipal Halfeld',
    lat: -21.7615,
    lng: -43.3482,
    type: 'SAFE_ZONE',
    status: 'Aberto',
    capacity: '200 pessoas',
    address: 'Rua Halfeld, 1179 - Centro'
  }
];

export const DONATION_POINTS: Location[] = [
  {
    id: 'dp-1',
    name: 'Defesa Civil - Ponto Central',
    lat: -21.7628,
    lng: -43.3445,
    type: 'DONATION_POINT',
    address: 'Avenida Brasil, 560 - Centro',
    phone: '(32) 3690-7294',
    openHours: '08:00 - 18:00'
  }
];

export const JF_BAIRROS = [
  'Centro', 'São Mateus', 'Santa Luzia', 'Igrejinha', 'Borboleta', 'Progresso', 'Ipiranga', 'Grajaú', 
  'Cascatinha', 'Benfica', 'Mariano Procópio', 'Nova Era', 'Fátima', 'Jardim Glória', 'Manoel Honório',
  'Santa Helena', 'Bandeirantes', 'Vitorino Braga', 'São Pedro', 'Linhares', 'Outros'
];
