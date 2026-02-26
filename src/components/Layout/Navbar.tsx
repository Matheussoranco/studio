
'use client';

import { ShieldAlert, Settings, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import SettingsModal from '@/components/Settings/SettingsModal';
import { AlertLevel } from '@/types';

interface NavbarProps {
  alertLevel?: AlertLevel;
}

export default function Navbar({ alertLevel = 'VERDE' }: NavbarProps) {
  const [time, setTime] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => setTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const getAlertStyles = (level: AlertLevel) => {
    switch (level) {
      case 'VERDE': return 'bg-[#14532d] text-[#4ade80] border-[#16a34a]';
      case 'AMARELO': return 'bg-[#713f12] text-[#fbbf24] border-[#d97706]';
      case 'LARANJA': return 'bg-[#7c2d12] text-[#fb923c] border-[#ea580c]';
      case 'VERMELHO': return 'bg-[#450a0a] text-[#f87171] border-[#dc2626] pulse-red';
      default: return '';
    }
  };

  return (
    <>
      <nav className="h-14 border-b bg-slate-900 flex items-center justify-between px-4 fixed top-0 w-full z-50">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-red-600 w-6 h-6" />
          <h1 className="text-lg font-black text-white tracking-tighter uppercase">JF Alerta</h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 font-black uppercase">
            <Clock size={12} /> {time}
          </span>
          <Badge className={`text-[10px] font-black uppercase px-2 py-0.5 border ${getAlertStyles(alertLevel)}`}>
            {alertLevel}
          </Badge>
          <Button variant="ghost" size="icon" className="text-slate-400 h-9 w-9" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </nav>
      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  );
}
