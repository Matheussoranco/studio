
"use client";

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import AiStatusPanel from '@/components/Sidebar/AiStatusPanel';
import ReportModal from '@/components/Reports/ReportModal';
import { CommunityReport, AiMarker, AlertLevel, Location } from '@/types';
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '@/lib/storage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, List, Heart, Cpu, MapPin, ExternalLink, Clock, Phone } from 'lucide-react';
import { DONATION_POINTS } from '@/data/seed-data';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const EmergencyMap = dynamic(() => import('@/components/Map/DynamicMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-950 flex items-center justify-center font-bold text-slate-800">CARREGANDO...</div>
});

export default function Home() {
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [aiMarkers, setAiMarkers] = useState<AiMarker[]>([]);
  const [alertLevel, setAlertLevel] = useState<AlertLevel>('VERDE');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('situacao');

  useEffect(() => {
    setReports(getStorageItem<CommunityReport[]>(STORAGE_KEYS.REPORTS, []));
  }, []);

  const handleReportAdded = (report: CommunityReport) => {
    const updated = [report, ...reports];
    setReports(updated);
    setStorageItem(STORAGE_KEYS.REPORTS, updated);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-950 overflow-hidden">
      <Navbar alertLevel={alertLevel} />
      
      <main className="flex-1 mt-14 mb-12 flex flex-col lg:flex-row relative overflow-hidden">
        
        {/* MAPA - 65% Desktop, 100% Mobile */}
        <div className="flex-1 lg:flex-[0.65] relative h-full">
          <EmergencyMap reports={reports} aiMarkers={aiMarkers} />
          
          {/* FAB - Botão de Relato */}
          <Button 
            className="fixed bottom-28 right-6 lg:absolute lg:bottom-6 lg:right-6 w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 shadow-2xl z-[400] pulse-red p-0"
            onClick={() => setIsReportOpen(true)}
            aria-label="Adicionar Relato"
          >
            <Plus size={32} strokeWidth={3} />
          </Button>
        </div>

        {/* SIDEBAR - 35% Desktop, Bottom Sheet Mobile */}
        <div className="hidden lg:flex lg:flex-[0.35] bg-slate-900 border-l border-slate-800 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col h-full">
            <TabsList className="bg-slate-950 rounded-none h-12 border-b border-slate-800">
              <TabsTrigger value="situacao" className="flex-1 gap-2 text-[10px] font-black uppercase"><Cpu size={14}/> Situação</TabsTrigger>
              <TabsTrigger value="relatos" className="flex-1 gap-2 text-[10px] font-black uppercase"><List size={14}/> Relatos</TabsTrigger>
              <TabsTrigger value="doacoes" className="flex-1 gap-2 text-[10px] font-black uppercase"><Heart size={14}/> Doações</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-hidden">
              <TabsContent value="situacao" className="h-full m-0"><AiStatusPanel onMarkersUpdate={setAiMarkers} onAlertChange={setAlertLevel} /></TabsContent>
              <TabsContent value="relatos" className="h-full m-0 overflow-y-auto p-4 no-scrollbar"><RelatosList reports={reports} /></TabsContent>
              <TabsContent value="doacoes" className="h-full m-0 overflow-y-auto p-4 no-scrollbar"><DonationsList centers={DONATION_POINTS} /></TabsContent>
            </div>
          </Tabs>
        </div>

        {/* MOBILE BOTTOM SHEET TRIGGER (Simulado via botões de navegação se necessário, ou apenas toggle de exibição) */}
        <div className="lg:hidden fixed bottom-12 left-0 right-0 h-10 bg-slate-900 border-t border-slate-800 flex items-center justify-around z-40">
           <button onClick={() => setActiveTab('situacao')} className={`flex flex-col items-center flex-1 py-1 ${activeTab === 'situacao' ? 'text-red-500' : 'text-slate-500'}`}><Cpu size={18}/><span className="text-[8px] font-black uppercase">IA</span></button>
           <button onClick={() => setActiveTab('relatos')} className={`flex flex-col items-center flex-1 py-1 ${activeTab === 'relatos' ? 'text-red-500' : 'text-slate-500'}`}><List size={18}/><span className="text-[8px] font-black uppercase">Relatos</span></button>
           <button onClick={() => setActiveTab('doacoes')} className={`flex flex-col items-center flex-1 py-1 ${activeTab === 'doacoes' ? 'text-red-500' : 'text-slate-500'}`}><Heart size={18}/><span className="text-[8px] font-black uppercase">Doações</span></button>
        </div>

        {/* MOBILE SIDEBAR PANEL (Bottom Sheet effect) */}
        <div className={`lg:hidden fixed inset-x-0 bottom-12 transition-transform duration-300 z-[450] bg-slate-900 rounded-t-2xl border-t border-slate-800 ${activeTab ? 'h-[40dvh]' : 'h-0 translate-y-full'}`}>
           <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto my-3" />
           <div className="h-full overflow-hidden">
              {activeTab === 'situacao' && <AiStatusPanel onMarkersUpdate={setAiMarkers} onAlertChange={setAlertLevel} />}
              {activeTab === 'relatos' && <div className="p-4 h-full overflow-y-auto no-scrollbar pb-20"><RelatosList reports={reports} /></div>}
              {activeTab === 'doacoes' && <div className="p-4 h-full overflow-y-auto no-scrollbar pb-20"><DonationsList centers={DONATION_POINTS} /></div>}
           </div>
        </div>
      </main>

      <Footer />
      <ReportModal open={isReportOpen} onOpenChange={setIsReportOpen} onReportAdded={handleReportAdded} />
    </div>
  );
}

function RelatosList({ reports }: { reports: CommunityReport[] }) {
  if (reports.length === 0) return <p className="text-center text-slate-500 text-xs py-10 italic">Nenhum relato enviado.</p>;
  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <Card key={r.id} className="bg-slate-800 border-slate-700">
          <CardContent className="p-3">
             <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-black uppercase text-red-500">{r.type.replace('_', ' ')}</span>
                <span className="text-[9px] text-slate-500">{new Date(r.timestamp).toLocaleTimeString('pt-BR')}</span>
             </div>
             <p className="text-xs font-bold text-white mb-1">{r.neighborhood}</p>
             <p className="text-[11px] text-slate-400 line-clamp-2">{r.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DonationsList({ centers }: { centers: Location[] }) {
  return (
    <div className="space-y-4">
      {centers.map((c) => (
        <Card key={c.id} className="bg-slate-800 border-slate-700 overflow-hidden">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="text-sm font-black text-white">{c.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2">
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
               <MapPin size={12} className="text-blue-500" /> {c.address}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
               <Phone size={12} className="text-blue-500" /> {c.phone}
            </div>
          </CardContent>
          <CardFooter className="p-2 bg-slate-900/50">
            <Button className="w-full bg-slate-700 hover:bg-slate-600 h-8 text-[10px] font-bold uppercase" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address + " Juiz de Fora, MG")}`)}>
               <ExternalLink size={12} className="mr-2" /> Como Chegar
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
