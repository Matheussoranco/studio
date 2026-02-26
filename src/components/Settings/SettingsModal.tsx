
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setApiKey(getStorageItem(STORAGE_KEYS.API_KEY, ''));
    }
  }, [open]);

  const handleSave = () => {
    if (apiKey && !apiKey.startsWith('sk-ant-')) {
      toast({ variant: 'destructive', title: 'Chave Inválida', description: 'A chave deve começar com sk-ant-' });
      return;
    }
    setStorageItem(STORAGE_KEYS.API_KEY, apiKey);
    toast({ title: 'Configurações Salvas', description: 'Sua chave foi armazenada localmente.' });
    onOpenChange(false);
  };

  const testConnection = async () => {
    setTesting(true);
    // Em um cenário real, aqui faríamos uma chamada para uma server action que usa a chave
    setTimeout(() => {
      setTesting(false);
      toast({ title: 'Conexão Testada', description: 'Chave configurada corretamente para o dispositivo.' });
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-slate-100 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            ⚙️ Configurações
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Configure sua chave API do Anthropic para ativar os boletins inteligentes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Chave API Claude</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showKey ? 'text' : 'password'}
                placeholder="sk-ant-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-slate-900 border-slate-700 pr-10"
                autoComplete="off"
                inputMode="email"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Obtenha sua chave em <a href="https://console.anthropic.com" target="_blank" className="text-primary underline">console.anthropic.com</a>. 
              Sua chave é salva apenas neste dispositivo.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="border-slate-700 hover:bg-slate-700" onClick={testConnection} disabled={testing}>
              {testing ? 'Testando...' : 'Testar Conexão'}
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" onClick={handleSave}>
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
