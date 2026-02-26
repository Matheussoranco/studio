
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import AiStatusPanel from '@/components/Sidebar/AiStatusPanel';
import ReportModal from '@/components/Reports/ReportModal';
import { CommunityReport, AiMarker, AlertLevel, Location } from '@/types';
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '@/lib/storage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, List, Heart, Cpu, MapPin, ExternalLink } from 'lucide-react';
import { DONATION_POINTS } from '@/data/seed-data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const EmergencyMap = dynamic(() => import('@/components/Map/DynamicMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-950 flex items-center justify-center text-xs text-slate-600 font-black uppercase tracking-widest">Iniciando Geoprocessamento...</div>
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
    <div className="flex flex-col h-[100dvh] bg-slate-950 overflow-hidden relative">
      <Navbar alertLevel={alertLevel} />
      
      <main className="flex-1 mt-14 mb-12 flex flex-col lg:flex-row relative overflow-hidden">
        {/* MAPA - z-0 isolado */}
        <div className="flex-1 lg:flex-[0.65] relative h-full z-0 overflow-hidden">
          <EmergencyMap reports={reports} aiMarkers={aiMarkers} />
          
          {/* Botão FAB (+) - z-index alto para ficar acima do mapa e do rodapé mobile */}
          <Button 
            className="fixed bottom-28 right-6 lg:absolute lg:bottom-8 lg:right-8 w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 shadow-[0_0_30px_rgba(220,38,38,0.5)] z-[1350] pulse-red p-0"
            onClick={() => setIsReportOpen(true)}
            aria-label="Novo Relato"
          >
            <Plus size={36} strokeWidth={3} />
          </Button>
        </div>

        {/* SIDEBAR */}
        <div className="hidden lg:flex lg:flex-[0.35] bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden z-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col h-full">
            <TabsList className="bg-slate-950 rounded-none h-12 border-b border-slate-800 p-0">
              <TabsTrigger value="situacao" className="flex-1 gap-2 text-[10px] font-black uppercase data-[state=active]:bg-slate-900"><Cpu size={14}/> Situação</TabsTrigger>
              <TabsTrigger value="relatos" className="flex-1 gap-2 text-[10px] font-black uppercase data-[state=active]:bg-slate-900"><List size={14}/> Relatos</TabsTrigger>
              <TabsTrigger value="doacoes" className="flex-1 gap-2 text-[10px] font-black uppercase data-[state=active]:bg-slate-900"><Heart size={14}/> Doações</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-hidden">
              <TabsContent value="situacao" className="h-full m-0"><AiStatusPanel onMarkersUpdate={setAiMarkers} onAlertChange={setAlertLevel} /></TabsContent>
              <TabsContent value="relatos" className="h-full m-0 overflow-y-auto p-4 no-scrollbar"><RelatosList reports={reports} /></TabsContent>
              <TabsContent value="doacoes" className="h-full m-0 overflow-y-auto p-4 no-scrollbar"><DonationsList centers={DONATION_POINTS} /></TabsContent>
            </div>
          </Tabs>
        </div>

        {/* MOBILE NAVIGATION BAR */}
        <div className="lg:hidden fixed bottom-12 left-0 right-0 h-10 bg-slate-900 border-t border-slate-800 flex items-center justify-around z-[1100]">
           <button onClick={() => setActiveTab('situacao')} className={`flex flex-col items-center flex-1 py-1 transition-colors ${activeTab === 'situacao' ? 'text-red-500' : 'text-slate-500'}`} aria-label="Aba Situação"><Cpu size={18}/><span className="text-[8px] font-black uppercase tracking-tighter">IA</span></button>
           <button onClick={() => setActiveTab('relatos')} className={`flex flex-col items-center flex-1 py-1 transition-colors ${activeTab === 'relatos' ? 'text-red-500' : 'text-slate-500'}`} aria-label="Aba Relatos"><List size={18}/><span className="text-[8px] font-black uppercase tracking-tighter">RELATOS</span></button>
           <button onClick={() => setActiveTab('doacoes')} className={`flex flex-col items-center flex-1 py-1 transition-colors ${activeTab === 'doacoes' ? 'text-red-500' : 'text-slate-500'}`} aria-label="Aba Doações"><Heart size={18}/><span className="text-[8px] font-black uppercase tracking-tighter">DOAÇÕES</span></button>
        </div>

        {/* MOBILE BOTTOM SHEET */}
        <div className={`lg:hidden fixed inset-x-0 bottom-12 transition-all duration-500 z-[1200] bg-slate-900 rounded-t-2xl border-t border-slate-800 shadow-2xl ${activeTab ? 'h-[45dvh]' : 'h-0 translate-y-full'}`}>
           <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto my-3" />
           <div className="h-full overflow-hidden">
              {activeTab === 'situacao' && <AiStatusPanel onMarkersUpdate={setAiMarkers} onAlertChange={setAlertLevel} />}
              {activeTab === 'relatos' && <div className="p-4 h-full overflow-y-auto no-scrollbar pb-24"><RelatosList reports={reports} /></div>}
              {activeTab === 'doacoes' && <div className="p-4 h-full overflow-y-auto no-scrollbar pb-24"><DonationsList centers={DONATION_POINTS} /></div>}
           </div>
        </div>
      </main>

      <Footer />
      
      <ReportModal open={isReportOpen} onOpenChange={setIsReportOpen} onReportAdded={handleReportAdded} />
    </div>
  );
}

function RelatosList({ reports }: { reports: CommunityReport[] }) {
  if (reports.length === 0) return <div className="p-10 text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">Nenhum relato confirmado</div>;

  return (
    <div className="space-y-3">
      {reports.map((r) => (
        <Card key={r.id} className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-3">
             <div className="flex justify-between items-start mb-2">
                <Badge className={`text-[8px] font-black uppercase px-2 py-0 ${r.severity === 3 ? 'bg-red-600' : r.severity === 2 ? 'bg-orange-600' : 'bg-yellow-600'}`}>{r.type}</Badge>
                <span className="text-[9px] font-bold text-slate-500">{new Date(r.timestamp).toLocaleTimeString('pt-BR')}</span>
             </div>
             <p className="text-xs font-black text-white uppercase tracking-tight mb-1">{r.neighborhood}</p>
             <p className="text-[11px] text-slate-400 italic line-clamp-2">"{r.description}"</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DonationsList({ centers }: { centers: Location[] }) {
  return (
    <div className="space-y-3">
      {centers.map((c) => (
        <Card key={c.id} className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-3 space-y-2">
            <h4 className="text-xs font-black text-white uppercase">{c.name}</h4>
            <div className="flex items-center gap-2 text-[9px] text-slate-400 font-bold">
               <MapPin size={12} className="text-blue-500" /> {c.address}
            </div>
            <Button className="w-full bg-slate-700 h-8 text-[9px] font-black uppercase" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address + " Juiz de Fora")}`)}>
               <ExternalLink size={12} className="mr-2" /> Como Chegar
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
