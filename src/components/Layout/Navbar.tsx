
'use client';

import { ShieldAlert, Settings, Clock, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import SettingsModal from '@/components/Settings/SettingsModal';
import { AlertLevel } from '@/types';
import { useOnlineStatus } from '@/hooks/use-online-status';

interface NavbarProps {
  alertLevel?: AlertLevel;
}

export default function Navbar({ alertLevel = 'VERDE' }: NavbarProps) {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const online = useOnlineStatus();

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  const getAlertStyles = (currentLevel: AlertLevel) => {
    switch (currentLevel) {
      case 'VERDE': return 'bg-emerald-500 text-white border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.5)]';
      case 'AMARELO': return 'bg-amber-500 text-black border-amber-400';
      case 'LARANJA': return 'bg-orange-600 text-white border-orange-400';
      case 'VERMELHO': return 'bg-red-600 text-white border-red-400 pulse-red';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const getIconColor = (currentLevel: AlertLevel) => {
    switch (currentLevel) {
      case 'VERDE': return 'text-emerald-400';
      case 'AMARELO': return 'text-amber-400';
      case 'LARANJA': return 'text-orange-500';
      case 'VERMELHO': return 'text-red-600';
      default: return 'text-slate-400';
    }
  };

  return (
    <>
      <nav className="h-14 border-b bg-slate-900 flex items-center justify-between px-4 fixed top-0 w-full z-[1400] shadow-xl">
        <div className="flex items-center gap-2">
          <ShieldAlert className={`${getIconColor(alertLevel)} w-6 h-6 transition-colors duration-500`} />
          <h1 className="text-lg font-black text-white tracking-tighter uppercase">JF Alerta</h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 font-black uppercase">
            <Clock size={12} /> {date} {time}
          </span>
          <span title={online ? 'Online' : 'Offline'} className={`text-lg leading-none ${online ? 'text-emerald-400' : 'text-red-500 animate-pulse'}`}>
            {online ? <Wifi size={14} /> : <WifiOff size={14} />}
          </span>
          <Badge className={`text-[10px] font-black uppercase px-3 py-1 border-2 ${getAlertStyles(alertLevel)} transition-all duration-500`}>
            ALERTA {alertLevel}
          </Badge>
          <Button variant="ghost" size="icon" className="text-slate-400 h-9 w-9 hover:bg-slate-800" onClick={() => setIsSettingsOpen(true)}>
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </nav>
      <SettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  );
}
