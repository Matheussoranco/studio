
"use client";

import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JF_BAIRROS, BAIRRO_COORDS, JF_CENTER } from '@/data/seed-data';
import { CommunityReport } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, MapPin, Camera, Loader2, CheckCircle2, X } from 'lucide-react';

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReportAdded: (report: CommunityReport) => void;
}

type GpsState = 'idle' | 'loading' | 'ok' | 'denied' | 'error';

export default function ReportModal({ open, onOpenChange, onReportAdded }: ReportModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    type: 'alagamento' as CommunityReport['type'],
    neighborhood: '',
    severity: '2' as '1' | '2' | '3',
    description: '',
  });
  const [gpsState, setGpsState]   = useState<GpsState>('idle');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [photo, setPhoto]         = useState<string | null>(null);

  const requestGps = useCallback(() => {
    if (!navigator.geolocation) {
      toast({ variant: 'destructive', title: 'GPS indisponível', description: 'Seu dispositivo não suporta geolocalização.' });
      return;
    }
    setGpsState('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setGpsState('ok');
        toast({ title: 'Localização capturada', description: `Precisão: ±${pos.coords.accuracy.toFixed(0)}m` });
      },
      (err) => {
        setGpsState(err.code === err.PERMISSION_DENIED ? 'denied' : 'error');
        toast({ variant: 'destructive', title: 'GPS falhou', description: err.message });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [toast]);

  const handlePhoto = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Foto muito grande', description: 'Máximo 3 MB por foto.' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }, [toast]);

  // Derive final coordinates: GPS > neighbourhood centre > random JF offset
  const getCoords = (): { lat: number; lng: number } => {
    if (gpsCoords) return { lat: gpsCoords.lat, lng: gpsCoords.lng };
    if (formData.neighborhood && BAIRRO_COORDS[formData.neighborhood]) return BAIRRO_COORDS[formData.neighborhood];
    return {
      lat: JF_CENTER.lat + (Math.random() - 0.5) * 0.04,
      lng: JF_CENTER.lng + (Math.random() - 0.5) * 0.04,
    };
  };

  const reset = () => {
    setFormData({ type: 'alagamento', neighborhood: '', severity: '2', description: '' });
    setGpsState('idle');
    setGpsCoords(null);
    setPhoto(null);
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.neighborhood || !formData.description.trim()) {
      toast({ variant: 'destructive', title: 'Campos Obrigatórios', description: 'Informe o bairro e a descrição.' });
      return;
    }

    setLoading(true);
    const coords = getCoords();

    const newReport: CommunityReport = {
      id: Math.random().toString(36).substring(2, 11),
      type: formData.type,
      description: formData.description.trim(),
      neighborhood: formData.neighborhood,
      severity: parseInt(formData.severity) as 1 | 2 | 3,
      lat: coords.lat,
      lng: coords.lng,
      timestamp: new Date().toISOString(),
      upvotes: 0,
      ...(photo        ? { photo }                          : {}),
      ...(gpsCoords    ? { gpsAccuracy: gpsCoords.accuracy } : {}),
    };

    setTimeout(() => {
      onReportAdded(newReport);
      setLoading(false);
      onOpenChange(false);
      reset();
      toast({ title: 'Relato Publicado ✓', description: 'Seu alerta foi adicionado ao mapa.' });
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-lg p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2">
            <AlertCircle className="text-red-600" />
            NOVO RELATO
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label>Tipo de Ocorrência</Label>
            <Select value={formData.type} onValueChange={(v: any) => setFormData({...formData, type: v})}>
              <SelectTrigger className="bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 text-white">
                <SelectItem value="alagamento">Alagamento</SelectItem>
                <SelectItem value="deslizamento">Deslizamento</SelectItem>
                <SelectItem value="via_bloqueada">Via Bloqueada</SelectItem>
                <SelectItem value="falta_energia">Falta de Energia</SelectItem>
                <SelectItem value="pessoa_ilhada">Pessoa Ilhada</SelectItem>
                <SelectItem value="area_segura">Área Segura</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Select value={formData.neighborhood} onValueChange={(v) => setFormData({...formData, neighborhood: v})}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 text-white h-64">
                  {JF_BAIRROS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Severidade</Label>
              <div className="flex gap-2">
                {[
                  { val: '1', label: '🟡 Baixa',  color: 'hover:bg-yellow-500/20' },
                  { val: '2', label: '🟠 Média',   color: 'hover:bg-orange-500/20' },
                  { val: '3', label: '🔴 Alta',    color: 'hover:bg-red-500/20' },
                ].map(s => (
                  <Button
                    key={s.val}
                    type="button"
                    variant={formData.severity === s.val ? 'default' : 'outline'}
                    className={`flex-1 border-slate-700 text-[10px] font-black ${formData.severity === s.val ? 'bg-slate-700 border-white' : s.color}`}
                    onClick={() => setFormData({...formData, severity: s.val as '1' | '2' | '3'})}
                    style={{ height: '44px' }}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* ── GPS localização ── */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin size={13} className="text-slate-400" /> Localização
            </Label>
            <Button
              type="button"
              variant="outline"
              className={`w-full border-slate-700 gap-2 text-xs font-bold ${
                gpsState === 'ok'
                  ? 'border-emerald-600 text-emerald-400 bg-emerald-950/20'
                  : gpsState === 'denied' || gpsState === 'error'
                  ? 'border-red-800 text-red-400'
                  : 'text-slate-300'
              }`}
              onClick={requestGps}
              disabled={gpsState === 'loading'}
            >
              {gpsState === 'loading' && <Loader2 size={14} className="animate-spin" />}
              {gpsState === 'ok'      && <CheckCircle2 size={14} />}
              {gpsState === 'idle'    && <MapPin size={14} />}
              {gpsState === 'loading' ? 'Obtendo GPS...' : gpsState === 'ok' ? `GPS capturado ±${gpsCoords?.accuracy.toFixed(0)}m` : gpsState === 'denied' ? 'Permissão negada — usando bairro' : gpsState === 'error' ? 'Falhou — usando bairro' : 'Usar minha localização GPS'}
            </Button>
            {gpsState === 'idle' && (
              <p className="text-[10px] text-slate-600">Sem GPS: usaremos o centro do bairro selecionado.</p>
            )}
          </div>

          {/* ── Foto opcional ── */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Camera size={13} className="text-slate-400" /> Foto (opcional, máx 3 MB)
            </Label>
            {photo ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="preview" className="w-full h-32 object-cover rounded-lg border border-slate-700" />
                <button
                  type="button"
                  onClick={() => { setPhoto(null); if (photoInputRef.current) photoInputRef.current.value = ''; }}
                  className="absolute top-1 right-1 bg-slate-900/80 hover:bg-red-700 text-white rounded-full p-0.5 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="w-full border border-dashed border-slate-700 rounded-lg h-20 flex flex-col items-center justify-center gap-1 text-slate-500 hover:border-slate-500 hover:text-slate-400 transition-colors text-xs font-bold"
              >
                <Camera size={22} />
                Toque para adicionar foto
              </button>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhoto}
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição (máx. 200 caracteres)</Label>
            <Textarea
              placeholder="Descreva brevemente a situação..."
              maxLength={200}
              required
              className="bg-slate-800 border-slate-700 h-24"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
            <p className="text-right text-[9px] text-slate-600">{formData.description.length}/200</p>
          </div>

          <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 font-black h-12 text-base" disabled={loading}>
            {loading ? <><Loader2 size={18} className="animate-spin mr-2" /> PUBLICANDO...</> : 'ENVIAR RELATO'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
