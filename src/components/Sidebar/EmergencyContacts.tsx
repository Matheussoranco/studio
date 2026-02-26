'use client';

import {
  Phone,
  MessageSquare,
  ShieldAlert,
  Flame,
  ExternalLink,
  Radio,
  HeartPulse,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const HOTLINES = [
  {
    name: 'Defesa Civil JF',
    number: '199',
    icon: ShieldAlert,
    color: 'bg-orange-600',
    desc: 'Emergências, abrigos e evacuação',
  },
  {
    name: 'Bombeiros',
    number: '193',
    icon: Flame,
    color: 'bg-red-600',
    desc: 'Resgate, incêndios, salvamento',
  },
  {
    name: 'SAMU',
    number: '192',
    icon: HeartPulse,
    color: 'bg-blue-600',
    desc: 'Urgências e emergências médicas',
  },
  {
    name: 'Polícia Militar',
    number: '190',
    icon: ShieldAlert,
    color: 'bg-slate-600',
    desc: 'Segurança pública — ordem civil',
  },
  {
    name: 'Prefeitura — Serviços',
    number: '156',
    icon: Radio,
    color: 'bg-emerald-600',
    desc: 'Solicitações e serviços municipais',
  },
  {
    name: 'CEMIG — Emergência',
    number: '116',
    icon: AlertTriangle,
    color: 'bg-yellow-600',
    desc: 'Falta de energia e rede elétrica',
  },
];

const SMS_TIPS = [
  {
    number: '40199',
    label: 'SMS Defesa Civil',
    desc: 'Envie seu CEP para receber alertas de chuva e risco por SMS',
  },
];

const OFFICIAL_LINKS = [
  { label: 'Prefeitura JF', url: 'https://pjf.mg.gov.br', icon: '🏛️' },
  { label: 'Defesa Civil MG', url: 'https://defesacivil.mg.gov.br', icon: '🛡️' },
  { label: 'CEMADEN', url: 'https://cemaden.gov.br', icon: '🌧️' },
  { label: 'INMET', url: 'https://inmet.gov.br', icon: '🌡️' },
  { label: 'SNIRH / ANA', url: 'https://snirh.gov.br', icon: '💧' },
  { label: 'Alerta RIO JF', url: 'https://alertario.rio.rj.gov.br', icon: '📡' },
];

export default function EmergencyContacts() {
  return (
    <div className="h-full flex flex-col p-4 space-y-5 overflow-y-auto no-scrollbar">
      <h2 className="text-lg font-black uppercase tracking-tighter text-white flex items-center gap-2">
        <Phone size={16} className="text-red-600" /> Contatos de Emergência
      </h2>

      {/* ── Hotlines ── */}
      <div className="space-y-2">
        {HOTLINES.map((c) => (
          <a key={c.number} href={`tel:${c.number}`}>
            <Card className="bg-slate-800/50 border-slate-700/50 hover:border-slate-500 hover:bg-slate-800 active:scale-[0.98] transition-all">
              <CardContent className="p-3 flex items-center gap-3">
                <div
                  className={`${c.color} w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}
                >
                  <c.icon size={20} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black uppercase tracking-tight text-white">{c.name}</p>
                  <p className="text-[10px] text-slate-500">{c.desc}</p>
                </div>
                <Badge className="bg-slate-900 border border-slate-600 text-white text-lg font-black font-mono px-3 py-1 flex-shrink-0 hover:bg-slate-800">
                  {c.number}
                </Badge>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      {/* ── SMS alert ── */}
      <div>
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <MessageSquare size={12} className="text-emerald-500" /> Alertas por SMS
        </h3>
        {SMS_TIPS.map((s) => (
          <Card key={s.number} className="bg-slate-800/30 border-slate-700/50">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white uppercase">{s.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{s.desc}</p>
              </div>
              <Badge className="bg-emerald-700 border-0 text-white font-mono text-base font-black px-3 py-1 flex-shrink-0">
                {s.number}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Useful links ── */}
      <div>
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <ExternalLink size={12} className="text-blue-400" /> Links Oficiais
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {OFFICIAL_LINKS.map((l) => (
            <a key={l.url} href={l.url} target="_blank" rel="noreferrer">
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-2.5 flex items-center gap-2 hover:border-slate-600 hover:bg-slate-800/70 active:scale-[0.97] transition-all text-[11px] font-bold text-slate-300">
                <span className="text-base leading-none">{l.icon}</span>
                <span className="leading-tight">{l.label}</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ── Safety tips ── */}
      <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4">
        <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">
          <AlertTriangle size={12} /> Dicas de Segurança
        </h3>
        <ul className="space-y-1.5 text-[11px] text-slate-400">
          {[
            'Nunca atravesse enchentes a pé ou de carro',
            'Desligue a energia se houver infiltração de água',
            'Evite encostas durante e após chuvas fortes',
            'Guarde documentos em local alto e seguro',
            'Sinalize sua casa se precisar de resgate',
            'Em dúvida, evacue — sua vida vale mais',
          ].map((tip, i) => (
            <li key={i} className="flex gap-2 leading-tight">
              <span className="text-amber-500 font-black">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
