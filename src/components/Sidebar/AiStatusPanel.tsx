
"use client";

import { useState, useEffect, useCallback } from 'react';
import { generateCrisisReport, AiGeneratedCrisisReportOutput } from '@/ai/flows/ai-generated-crisis-report-flow';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Clock, AlertTriangle, ShieldCheck, MapPin, Cpu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '@/lib/storage';

const REFRESH_INTERVAL = 10 * 60;

interface AiStatusPanelProps {
  onMarkersUpdate?: (markers: AiGeneratedCrisisReportOutput['markers']) => void;
  onAlertChange?: (level: any) => void;
}

export default function AiStatusPanel({ onMarkersUpdate, onAlertChange }: AiStatusPanelProps) {
  const [report, setReport] = useState<AiGeneratedCrisisReportOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const { toast } = useToast();

  const fetchReport = useCallback(async () => {
    const apiKey = getStorageItem(STORAGE_KEYS.API_KEY, '');
    if (!apiKey) {
      return;
    }

    setLoading(true);
    try {
      const data = await generateCrisisReport({ currentDateTime: new Date().toLocaleString('pt-BR') });
      setReport(data);
      if (onMarkersUpdate) onMarkersUpdate(data.markers);
      if (onAlertChange) onAlertChange(data.alertLevel);
      setStorageItem(STORAGE_KEYS.LAST_AI_REPORT, { ...data, lastUpdated: new Date().toISOString() });
      setCountdown(REFRESH_INTERVAL);
    } catch (error) {
      toast({ variant: "destructive", title: "Erro de IA", description: "Falha ao atualizar boletim inteligente." });
    } finally {
      setLoading(false);
    }
  }, [toast, onMarkersUpdate, onAlertChange]);

  useEffect(() => {
    const cached = getStorageItem<any>(STORAGE_KEYS.LAST_AI_REPORT, null);
    if (cached) {
      setReport(cached);
      if (onMarkersUpdate) onMarkersUpdate(cached.markers);
      if (onAlertChange) onAlertChange(cached.alertLevel);
      const diff = Math.floor((Date.now() - new Date(cached.lastUpdated).getTime()) / 1000);
      setCountdown(Math.max(0, REFRESH_INTERVAL - diff));
    } else {
      fetchReport();
    }
  }, [fetchReport]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchReport();
          return REFRESH_INTERVAL;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [fetchReport]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (!getStorageItem(STORAGE_KEYS.API_KEY, '')) {
    return (
      <div className="p-6 h-full flex items-center justify-center bg-yellow-950/20">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto" />
          <h3 className="font-black text-yellow-500">BOLETIM DESATIVADO</h3>
          <p className="text-xs text-slate-400">Configure sua chave API nas ⚙️ Configurações para ativar os boletins de IA.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 space-y-6 overflow-y-auto no-scrollbar">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black flex items-center gap-2 uppercase tracking-tighter">
          <Cpu className="text-red-600" /> Situação Atual
        </h2>
        <Button variant="ghost" size="icon" onClick={fetchReport} disabled={loading} className="h-8 w-8 text-slate-500">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {loading && !report ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full bg-slate-800" />
          <Skeleton className="h-40 w-full bg-slate-800" />
        </div>
      ) : report ? (
        <div className="space-y-6" role="alert">
          <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700">
            <Badge className="bg-red-600 text-white font-black text-xs uppercase px-2 py-1">ALERTA {report.alertLevel}</Badge>
            <span className="text-[10px] font-mono text-slate-500">PRÓXIMA: {formatTime(countdown)}</span>
          </div>

          <div className="space-y-2">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Boletim Factual</h3>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">{report.summary}</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <MapPin size={12} className="text-red-600" /> Áreas Críticas
            </h3>
            <div className="flex flex-wrap gap-2">
              {report.affectedAreas.map((area, i) => (
                <Badge key={i} variant="outline" className="text-[10px] bg-slate-900 border-slate-700 text-slate-400 px-2 py-0.5">
                  {area}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={12} className="text-green-600" /> Recomendações
            </h3>
            <ul className="space-y-2">
              {report.recommendations.map((rec, i) => (
                <li key={i} className="text-xs text-slate-300 flex gap-2">
                  <span className="text-red-600 font-bold">•</span> {rec}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
