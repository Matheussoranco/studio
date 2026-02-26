
export type AlertLevel = 'VERDE' | 'AMARELO' | 'LARANJA' | 'VERMELHO';

export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  type: 'SAFE_ZONE' | 'DONATION_POINT' | 'RISK_ZONE' | 'AI_REPORT';
  status?: string;
  capacity?: string;
  acceptedItems?: string[];
  address?: string;
  phone?: string;
  openHours?: string;
  lastUpdated?: string;
  description?: string;
  severity?: number;
}

export interface RiskZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  severity: number;
  radius: number;
}

export interface CommunityReport {
  id: string;
  type: 'alagamento' | 'deslizamento' | 'via_bloqueada' | 'area_segura' | 'falta_energia' | 'pessoa_ilhada';
  description: string;
  neighborhood: string;
  severity: 1 | 2 | 3;
  lat: number;
  lng: number;
  timestamp: string;
  /** Optional base-64 encoded photo attached by the reporter */
  photo?: string;
  /** GPS accuracy in metres when the location was captured automatically */
  gpsAccuracy?: number;
  /** Community upvote count — used to signal report credibility */
  upvotes?: number;
}

export interface AiMarker {
  lat: number;
  lng: number;
  description: string;
  type: 'alagamento' | 'deslizamento' | 'bloqueio' | 'atencao';
  severity: number;
}

export interface CrisisReport {
  summary: string;
  alertLevel: AlertLevel;
  affectedAreas: string[];
  recommendations: string[];
  markers: AiMarker[];
  lastUpdated: string;
}


export interface AiMarker {
  lat: number;
  lng: number;
  description: string;
  type: 'alagamento' | 'deslizamento' | 'bloqueio' | 'atencao';
  severity: number;
}

export interface CrisisReport {
  summary: string;
  alertLevel: AlertLevel;
  affectedAreas: string[];
  recommendations: string[];
  markers: AiMarker[];
  lastUpdated: string;
}
