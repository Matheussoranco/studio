'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { generateCrisisReport, AiGeneratedCrisisReportOutput } from '@/ai/flows/ai-generated-crisis-report-flow';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, MapPin, Cpu, Radio, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '@/lib/storage';

const REFRESH_INTERVAL = 300; // 5 minutos

interface AiStatusPanelProps {
  onMarkersUpdate?: (markers: AiGeneratedCrisisReportOutput['markers']) => void;
  onAlertChange?: (level: any) => void;
}

export default function AiStatusPanel({ onMarkersUpdate, onAlertChange }: AiStatusPanelProps) {
  const [report, setReport] = useState<(AiGeneratedCrisisReportOutput & { lastUpdated?: string }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const fetchReport = useCallback(async () => {
    if (loading || isPending) return;
    setLoading(true);
    setError(null);
    try {
      const data = await generateCrisisReport({ 
        currentDateTime: new Date().toLocaleString('pt-BR') 
      });
      
      const timestamp = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const enrichedReport = { ...data, lastUpdated: timestamp };

      startTransition(() => {
        setReport(enrichedReport);
        if (onMarkersUpdate) onMarkersUpdate(data.markers);
        if (onAlertChange) onAlertChange(data.alertLevel);
        setStorageItem(STORAGE_KEYS.LAST_AI_REPORT, { ...enrichedReport, storageTimestamp: new Date().toISOString() });
        setCountdown(REFRESH_INTERVAL);
      });
    } catch (error) {
      console.error('Fetch Error:', error);
      setError("Falha ao atualizar dados. Tente novamente.");
      toast({ 
        variant: "destructive", 
        title: "Erro de Sincronismo", 
        description: "Servidor sobrecarregado ou chave de API inválida." 
      });
    } finally {
      setLoading(false);
    }
  }, [toast, onMarkersUpdate, onAlertChange, loading, isPending]);

  useEffect(() => {
    const cached = getStorageItem<any>(STORAGE_KEYS.LAST_AI_REPORT, null);
    if (cached) {
      setReport(cached);
      if (onMarkersUpdate) onMarkersUpdate(cached.markers);
      if (onAlertChange) onAlertChange(cached.alertLevel);
      const diff = Math.floor((Date.now() - new Date(cached.storageTimestamp).getTime()) / 1000);
      setCountdown(Math.max(0, REFRESH_INTERVAL - diff));
    } else {
      fetchReport();
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (!loading && !isPending && !error) fetchReport();
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [fetchReport, loading, isPending, error]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const getAlertBadgeColor = (level: string) => {
    switch (level) {
      case 'VERDE': return 'bg-emerald-500 hover:bg-emerald-600';
      case 'AMARELO': return 'bg-amber-500 hover:bg-amber-600';
      case 'LARANJA': return 'bg-orange-500 hover:bg-orange-600';
      case 'VERMELHO': return 'bg-red-600 pulse-red';
      default: return 'bg-slate-600';
    }
  };

  return (
    <div className="h-full flex flex-col p-4 space-y-5 overflow-y-auto no-scrollbar">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black flex items-center gap-2 uppercase tracking-tighter">
          <Cpu className="text-red-600" /> MONITORAMENTO IA
        </h2>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={fetchReport} 
          disabled={loading || isPending} 
          className="h-8 w-8 text-slate-500"
        >
          <RefreshCw className={`w-4 h-4 ${(loading || isPending) ? 'animate-spin text-red-500' : ''}`} />
        </Button>
      </div>

      {(loading || isPending) && !report ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full bg-slate-800/50" />
          <Skeleton className="h-40 w-full bg-slate-800/50" />
        </div>
      ) : error ? (
        <div className="p-10 text-center text-slate-500 text-[10px] font-black uppercase flex flex-col items-center gap-4">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
          <span className="text-amber-500">{error}</span>
          <Button variant="outline" size="sm" onClick={fetchReport}>Tentar Novamente</Button>
        </div>
      ) : report ? (
        <div className="space-y-5">
          <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800 shadow-inner">
            <Badge className={`${getAlertBadgeColor(report.alertLevel)} text-white font-black text-[10px] uppercase px-2 py-1`}>
              {report.alertLevel}
            </Badge>
            <div className="flex flex-col items-end">
               <span className="text-[9px] font-mono text-slate-500 uppercase">Sinc: {formatTime(countdown)}</span>
               <span className="text-[8px] font-black text-emerald-500/70 uppercase">Fatos das {report.lastUpdated}</span>
            </div>
          </div>

          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardContent className="p-4 space-y-2">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Radio size={12} className="text-red-600" /> Boletim em Tempo Real
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed font-semibold">
                {report.summary}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <MapPin size={12} className="text-red-600" /> Áreas Afetadas
            </h3>
            <div className="flex flex-wrap gap-2">
              {report.affectedAreas.map((area, i) => (
                <Badge key={i} variant="outline" className="text-[9px] bg-slate-900 border-slate-800 text-slate-400 font-bold uppercase">
                  {area}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={12} className="text-emerald-500" /> Recomendações
            </h3>
            <ul className="space-y-2">
              {report.recommendations.map((rec, i) => (
                <li key={i} className="text-[11px] text-slate-300 flex gap-2 leading-tight font-medium">
                  <span className="text-red-600 font-black">•</span> {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="p-10 text-center text-slate-500 text-[10px] font-black uppercase flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 opacity-20" />
          Carregando fatos...
        </div>
      )}
    </div>
  );
}
