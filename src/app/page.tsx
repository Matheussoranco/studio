
'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import AiStatusPanel from '@/components/Sidebar/AiStatusPanel';
import ReportModal from '@/components/Reports/ReportModal';
import EmergencyContacts from '@/components/Sidebar/EmergencyContacts';
import WeatherWidget from '@/components/Map/WeatherWidget';
import { CommunityReport, AiMarker, AlertLevel, Location } from '@/types';
import { STORAGE_KEYS, getStorageItem, setStorageItem } from '@/lib/storage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, List, Heart, Cpu, MapPin, ExternalLink, Phone, ThumbsUp, Image as ImageIcon, Layers, Map, ChevronDown } from 'lucide-react';
import { DONATION_POINTS } from '@/data/seed-data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAlertNotifications } from '@/hooks/use-alert-notifications';

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
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mapView, setMapView] = useState<'live' | 'official'>('live');

  const handleTabPress = useCallback((tab: string) => {
    if (sheetOpen && activeTab === tab) {
      setSheetOpen(false);
    } else {
      setActiveTab(tab);
      setSheetOpen(true);
    }
  }, [sheetOpen, activeTab]);

  // Browser push notifications on alert escalation
  useAlertNotifications(alertLevel);

  useEffect(() => {
    setReports(getStorageItem<CommunityReport[]>(STORAGE_KEYS.REPORTS, []));
  }, []);

  const handleReportAdded = (report: CommunityReport) => {
    const updated = [report, ...reports];
    setReports(updated);
    setStorageItem(STORAGE_KEYS.REPORTS, updated);
  };

  const handleUpvote = useCallback((id: string) => {
    setReports(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, upvotes: (r.upvotes ?? 0) + 1 } : r);
      setStorageItem(STORAGE_KEYS.REPORTS, updated);
      return updated;
    });
  }, []);

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-950 overflow-hidden relative">
      <Navbar alertLevel={alertLevel} />
      
      <main className="flex-1 mt-14 mb-12 flex flex-col lg:flex-row relative overflow-hidden">
        {/* MAPA - z-0 isolado */}
        <div className="flex-1 lg:flex-[0.65] relative h-full z-0 overflow-hidden">

          {/* Map toggle pill */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[900] flex items-center bg-slate-900/90 backdrop-blur border border-slate-700 rounded-full p-0.5 shadow-xl gap-0.5">
            <button
              onClick={() => setMapView('live')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${
                mapView === 'live'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers size={11} /> Interativo
            </button>
            <button
              onClick={() => setMapView('official')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${
                mapView === 'official'
                  ? 'bg-red-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Map size={11} /> Oficial
            </button>
          </div>

          {/* Leaflet interactive map — always mounted, never hidden, avoids Leaflet re-init errors */}
          <div className="absolute inset-0">
            <EmergencyMap reports={reports} aiMarkers={aiMarkers} />
          </div>

          {/* Official Google My Maps — overlaid on top when active */}
          <div className={`absolute inset-0 transition-opacity duration-300 ${
            mapView === 'official' ? 'opacity-100 pointer-events-auto z-[500]' : 'opacity-0 pointer-events-none z-[-1]'
          }`}>
            <iframe
              src="https://www.google.com/maps/d/embed?mid=1WONsDYluWx8kJKU5kl5G3fLEdS6u6z0&hl=pt-BR&ehbc=2E312F"
              className="w-full h-full border-0"
              title="Mapa Oficial — Prefeitura de Juiz de Fora"
              loading="lazy"
              allowFullScreen
            />
          </div>

          {/* WeatherWidget overlay — only on live map */}
          <div className={`absolute bottom-16 left-2 z-[600] pointer-events-none select-none transition-opacity duration-300 ${
            mapView === 'live' ? 'opacity-100' : 'opacity-0'
          }`}>
            <WeatherWidget />
          </div>
          
          {/* Botão FAB (+) */}
          <Button 
            className={`fixed right-6 lg:absolute lg:bottom-8 lg:right-8 w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 shadow-[0_0_30px_rgba(220,38,38,0.5)] z-[1350] pulse-red p-0 transition-all duration-300 ${
              sheetOpen ? 'bottom-[calc(50dvh+3.5rem)]' : 'bottom-28'
            } ${
              mapView === 'official' ? 'opacity-0 pointer-events-none scale-75' : 'opacity-100 scale-100'
            }`}
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
              <TabsTrigger value="situacao" className="flex-1 gap-1 text-[9px] font-black uppercase data-[state=active]:bg-slate-900"><Cpu size={12}/> Situação</TabsTrigger>
              <TabsTrigger value="relatos" className="flex-1 gap-1 text-[9px] font-black uppercase data-[state=active]:bg-slate-900"><List size={12}/> Relatos</TabsTrigger>
              <TabsTrigger value="doacoes" className="flex-1 gap-1 text-[9px] font-black uppercase data-[state=active]:bg-slate-900"><Heart size={12}/> Doações</TabsTrigger>
              <TabsTrigger value="sos" className="flex-1 gap-1 text-[9px] font-black uppercase data-[state=active]:bg-slate-900 data-[state=active]:text-red-400"><Phone size={12}/> SOS</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-hidden">
              <TabsContent value="situacao" className="h-full m-0"><AiStatusPanel onMarkersUpdate={setAiMarkers} onAlertChange={setAlertLevel} /></TabsContent>
              <TabsContent value="relatos" className="h-full m-0 overflow-y-auto p-4 no-scrollbar"><RelatosList reports={reports} onUpvote={handleUpvote} /></TabsContent>
              <TabsContent value="doacoes" className="h-full m-0 overflow-y-auto p-4 no-scrollbar"><DonationsList centers={DONATION_POINTS} /></TabsContent>
              <TabsContent value="sos" className="h-full m-0 overflow-y-auto no-scrollbar"><EmergencyContacts /></TabsContent>
            </div>
          </Tabs>
        </div>

        {/* MOBILE NAVIGATION BAR */}
        <div className="lg:hidden fixed bottom-12 left-0 right-0 h-10 bg-slate-900 border-t border-slate-800 flex items-center justify-around z-[1100]">
           <button onClick={() => handleTabPress('situacao')} className={`flex flex-col items-center flex-1 py-1 transition-colors ${sheetOpen && activeTab === 'situacao' ? 'text-red-500' : 'text-slate-500'}`} aria-label="Aba Situação"><Cpu size={18}/><span className="text-[7px] font-black uppercase">IA</span></button>
           <button onClick={() => handleTabPress('relatos')}  className={`flex flex-col items-center flex-1 py-1 transition-colors ${sheetOpen && activeTab === 'relatos'  ? 'text-red-500' : 'text-slate-500'}`} aria-label="Aba Relatos"><List size={18}/><span className="text-[7px] font-black uppercase">RELATOS</span></button>
           <button onClick={() => handleTabPress('doacoes')}  className={`flex flex-col items-center flex-1 py-1 transition-colors ${sheetOpen && activeTab === 'doacoes'  ? 'text-red-500' : 'text-slate-500'}`} aria-label="Aba Doações"><Heart size={18}/><span className="text-[7px] font-black uppercase">DOAÇÕES</span></button>
           <button onClick={() => handleTabPress('sos')}      className={`flex flex-col items-center flex-1 py-1 transition-colors ${sheetOpen && activeTab === 'sos'      ? 'text-red-500' : 'text-slate-500'}`} aria-label="Aba SOS"><Phone size={18}/><span className="text-[7px] font-black uppercase">SOS</span></button>
        </div>

        {/* MOBILE BOTTOM SHEET */}
        <div className={`lg:hidden fixed inset-x-0 bottom-12 transition-all duration-500 z-[1200] bg-slate-900 rounded-t-2xl border-t border-slate-800 shadow-2xl overflow-hidden ${
          sheetOpen ? 'h-[50dvh] translate-y-0' : 'h-[50dvh] translate-y-full'
        }`}>
           {/* Drag handle + close button */}
           <div className="flex items-center justify-center relative h-8 flex-shrink-0">
             <div className="w-12 h-1 bg-slate-700 rounded-full" />
             <button
               onClick={() => setSheetOpen(false)}
               className="absolute right-3 text-slate-500 hover:text-white transition-colors"
               aria-label="Fechar painel"
             >
               <ChevronDown size={20} />
             </button>
           </div>
           <div className="h-[calc(100%-2rem)] overflow-hidden">
              {activeTab === 'situacao' && <AiStatusPanel onMarkersUpdate={setAiMarkers} onAlertChange={setAlertLevel} />}
              {activeTab === 'relatos'  && <div className="p-4 h-full overflow-y-auto no-scrollbar pb-6"><RelatosList reports={reports} onUpvote={handleUpvote} /></div>}
              {activeTab === 'doacoes'  && <div className="p-4 h-full overflow-y-auto no-scrollbar pb-6"><DonationsList centers={DONATION_POINTS} /></div>}
              {activeTab === 'sos'      && <EmergencyContacts />}
           </div>
        </div>
      </main>

      <Footer />
      
      <ReportModal open={isReportOpen} onOpenChange={setIsReportOpen} onReportAdded={handleReportAdded} />
    </div>
  );
}

function RelatosList({ reports, onUpvote }: { reports: CommunityReport[]; onUpvote: (id: string) => void }) {
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  if (reports.length === 0) return <div className="p-10 text-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">Nenhum relato confirmado</div>;

  return (
    <div className="space-y-3">
      {expandedPhoto && (
        <div className="fixed inset-0 z-[2000] bg-black/90 flex items-center justify-center" onClick={() => setExpandedPhoto(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={expandedPhoto} alt="relato" className="max-w-[95vw] max-h-[90vh] rounded-lg shadow-2xl" />
        </div>
      )}
      {reports.map((r) => (
        <Card key={r.id} className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-3">
             <div className="flex justify-between items-start mb-2">
                <Badge className={`text-[8px] font-black uppercase px-2 py-0 ${r.severity === 3 ? 'bg-red-600' : r.severity === 2 ? 'bg-orange-600' : 'bg-yellow-600'}`}>{r.type}</Badge>
                <span className="text-[9px] font-bold text-slate-500">{new Date(r.timestamp).toLocaleTimeString('pt-BR')}</span>
             </div>
             <p className="text-xs font-black text-white uppercase tracking-tight mb-1">{r.neighborhood}</p>
             <p className="text-[11px] text-slate-400 italic line-clamp-2">"{r.description}"</p>
             {r.photo && (
               <button
                 className="mt-2 w-full"
                 onClick={() => setExpandedPhoto(r.photo!)}
                 title="Ver foto"
               >
                 {/* eslint-disable-next-line @next/next/no-img-element */}
                 <img src={r.photo} alt="foto do relato" className="w-full h-24 object-cover rounded border border-slate-700 hover:opacity-80 transition-opacity" />
               </button>
             )}
             <div className="mt-2 flex items-center gap-2">
               <button
                 onClick={() => onUpvote(r.id)}
                 className="flex items-center gap-1 text-[9px] font-black text-slate-500 hover:text-blue-400 transition-colors"
                 title="Confirmar relato"
               >
                 <ThumbsUp size={11} /> {r.upvotes ?? 0} confirm.
               </button>
               {r.gpsAccuracy && (
                 <span className="text-[8px] text-emerald-600 font-bold flex items-center gap-0.5">
                   <MapPin size={9} /> GPS ±{r.gpsAccuracy.toFixed(0)}m
                 </span>
               )}
               {r.photo && <ImageIcon size={9} className="text-slate-500" />}
             </div>
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
               <MapPin size={12} className="text-blue-500" /> {c.address ?? 'Endereço não informado'}
            </div>
            <Button className="w-full bg-slate-700 h-8 text-[9px] font-black uppercase" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((c.address ?? c.name) + " Juiz de Fora")}`)}>
               <ExternalLink size={12} className="mr-2" /> Como Chegar
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
