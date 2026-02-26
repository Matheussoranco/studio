
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Info } from 'lucide-react';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            ⚙️ Configurações do Sistema
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Status dos serviços integrados ao JF Alerta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-green-950/30 border border-green-900/50 p-4 rounded-lg flex gap-3">
            <ShieldCheck className="text-green-500 shrink-0" size={20} />
            <div>
              <p className="text-sm font-bold text-green-400">Google Gemini AI Ativo</p>
              <p className="text-[11px] text-green-600/80">O sistema utiliza Gemini 1.5 Flash via Genkit com dados meteorológicos reais (Open-Meteo) e busca de notícias (Google Search Grounding) para boletins em tempo real.</p>
            </div>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-lg flex gap-3">
            <Info className="text-blue-500 shrink-0" size={20} />
            <div>
              <p className="text-sm font-bold text-slate-300">Sobre os dados</p>
              <p className="text-[11px] text-slate-500">Os dados de monitoramento são atualizados a cada 10 minutos via IA, cruzando informações oficiais da Defesa Civil e radares meteorológicos.</p>
            </div>
          </div>

          <Button className="w-full bg-slate-700 hover:bg-slate-600 font-bold" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
