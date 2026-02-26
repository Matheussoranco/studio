
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JF_BAIRROS, JF_CENTER } from '@/data/seed-data';
import { CommunityReport } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, MapPin } from 'lucide-react';

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReportAdded: (report: CommunityReport) => void;
}

export default function ReportModal({ open, onOpenChange, onReportAdded }: ReportModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    type: 'alagamento' as CommunityReport['type'],
    neighborhood: '',
    severity: '2' as '1' | '2' | '3',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.neighborhood || !formData.description) {
      toast({ variant: 'destructive', title: 'Campos Obrigatórios', description: 'Por favor, informe o bairro e a descrição.' });
      return;
    }

    setLoading(true);
    
    const newReport: CommunityReport = {
      id: Math.random().toString(36).substr(2, 9),
      type: formData.type,
      description: formData.description,
      neighborhood: formData.neighborhood,
      severity: parseInt(formData.severity) as 1 | 2 | 3,
      lat: JF_CENTER.lat + (Math.random() - 0.5) * 0.04,
      lng: JF_CENTER.lng + (Math.random() - 0.5) * 0.04,
      timestamp: new Date().toISOString()
    };

    setTimeout(() => {
      onReportAdded(newReport);
      setLoading(false);
      onOpenChange(false);
      setFormData({ type: 'alagamento', neighborhood: '', severity: '2', description: '' });
      toast({ title: 'Relato Publicado', description: 'Seu alerta foi adicionado ao mapa com sucesso.' });
    }, 600);
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
                  { val: '1', label: '🟡', color: 'hover:bg-yellow-500/20' },
                  { val: '2', label: '🟠', color: 'hover:bg-orange-500/20' },
                  { val: '3', label: '🔴', color: 'hover:bg-red-500/20' }
                ].map(s => (
                  <Button
                    key={s.val}
                    type="button"
                    variant={formData.severity === s.val ? 'default' : 'outline'}
                    className={`flex-1 border-slate-700 ${formData.severity === s.val ? 'bg-slate-700 border-white' : s.color}`}
                    onClick={() => setFormData({...formData, severity: s.val as any})}
                    style={{ height: '44px' }}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição (Max 200 caracteres)</Label>
            <Textarea
              placeholder="Descreva brevemente a situação..."
              maxLength={200}
              required
              className="bg-slate-800 border-slate-700 h-24"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 font-black h-12 text-lg" disabled={loading}>
            {loading ? 'PUBLICANDO...' : 'ENVIAR RELATO'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
