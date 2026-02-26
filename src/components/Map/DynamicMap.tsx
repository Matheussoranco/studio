
"use client";

import { useEffect, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, LayersControl } from 'react-leaflet';
import { JF_CENTER, RISK_ZONES, SAFE_ZONES, DONATION_POINTS } from '@/data/seed-data';
import { CommunityReport, AiMarker } from '@/types';
import { Home, Heart, AlertTriangle, Cpu, Droplets, Mountain, Ban, Power, UserRound, CheckCircle2 } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

const createIcon = (color: string, IconComponent: any) => {
  const iconHtml = renderToStaticMarkup(
    <div className="relative flex items-center justify-center">
      <div style={{ backgroundColor: color }} className="w-9 h-9 rounded-full flex items-center justify-center border-2 border-white shadow-xl text-white">
        <IconComponent size={18} strokeWidth={3} />
      </div>
      <div style={{ borderTopColor: color }} className="absolute -bottom-1.5 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px]" />
    </div>
  );
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-div-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
  });
};

const SafeIcon = createIcon('#16a34a', Home);
const DonationIcon = createIcon('#2563eb', Heart);
const AiIcon = createIcon('#dc2626', Cpu);

const getReportIcon = (type: CommunityReport['type'], severity: number) => {
  const colors = severity === 3 ? '#dc2626' : severity === 2 ? '#ea580c' : '#d97706';
  let Icon = AlertTriangle;
  if (type === 'alagamento') Icon = Droplets;
  if (type === 'deslizamento') Icon = Mountain;
  if (type === 'via_bloqueada') Icon = Ban;
  if (type === 'falta_energia') Icon = Power;
  if (type === 'pessoa_ilhada') Icon = UserRound;
  if (type === 'area_segura') Icon = CheckCircle2;
  
  return createIcon(type === 'area_segura' ? '#16a34a' : colors, Icon);
};

interface MapProps {
  reports: CommunityReport[];
  aiMarkers: AiMarker[];
}

export default function EmergencyMap({ reports, aiMarkers }: MapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const memoRiskZones = useMemo(() => RISK_ZONES, []);
  const memoSafeZones = useMemo(() => SAFE_ZONES, []);
  const memoDonations = useMemo(() => DONATION_POINTS, []);

  if (!isMounted) return <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-500 font-bold">CARREGANDO MAPA...</div>;

  return (
    <MapContainer 
      center={[JF_CENTER.lat, JF_CENTER.lng]} 
      zoom={13} 
      className="w-full h-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <LayersControl position="topright">
        <LayersControl.Overlay name="⚠️ Zonas de Risco" checked>
          <L.LayerGroup>
            {memoRiskZones.map((zone) => (
              <CircleMarker
                key={zone.id}
                center={[zone.lat, zone.lng]}
                radius={zone.radius / 10}
                pathOptions={{
                  color: zone.severity === 3 ? '#dc2626' : '#ea580c',
                  fillColor: zone.severity === 3 ? '#dc2626' : '#ea580c',
                  fillOpacity: 0.3,
                  weight: 2
                }}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-black text-red-600 uppercase text-xs">{zone.name}</h3>
                    <p className="text-[10px] text-slate-300 mt-1 leading-tight">ZONA DE ALTO RISCO GEOLÓGICO</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </L.LayerGroup>
        </LayersControl.Overlay>

        <LayersControl.Overlay name="🏠 Abrigos" checked>
          <L.LayerGroup>
            {memoSafeZones.map((zone) => (
              <Marker key={zone.id} position={[zone.lat, zone.lng]} icon={SafeIcon}>
                <Popup>
                  <div className="p-1">
                    <h3 className="font-bold text-green-500 text-sm">{zone.name}</h3>
                    <p className="text-xs text-slate-300 mt-1">{zone.address}</p>
                    <p className="text-xs font-black text-white mt-1">CAPACIDADE: {zone.capacity}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </L.LayerGroup>
        </LayersControl.Overlay>

        <LayersControl.Overlay name="🎁 Doações" checked>
          <L.LayerGroup>
            {memoDonations.map((point) => (
              <Marker key={point.id} position={[point.lat, point.lng]} icon={DonationIcon}>
                <Popup>
                  <div className="p-2 min-w-[180px]">
                    <h3 className="font-bold text-blue-500 text-sm">{point.name}</h3>
                    <p className="text-[10px] text-slate-300 mt-1">{point.address}</p>
                    <p className="text-[10px] font-bold text-white mt-1">📞 {point.phone}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </L.LayerGroup>
        </LayersControl.Overlay>

        <LayersControl.Overlay name="👥 Alertas Comunidade" checked>
          <L.LayerGroup>
            {reports.map((report) => (
              <Marker key={report.id} position={[report.lat, report.lng]} icon={getReportIcon(report.type, report.severity)}>
                <Popup>
                  <div className="p-1 max-w-[200px]">
                    <h3 className="font-black text-red-500 uppercase text-xs mb-1">{report.type.replace('_', ' ')}</h3>
                    <p className="text-xs font-bold text-white italic">{report.neighborhood}</p>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">{report.description}</p>
                    <p className="text-[9px] text-slate-500 mt-2">{new Date(report.timestamp).toLocaleString('pt-BR')}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </L.LayerGroup>
        </LayersControl.Overlay>

        <LayersControl.Overlay name="🤖 Monitoramento IA" checked>
          <L.LayerGroup>
            {aiMarkers.map((marker, idx) => (
              <Marker key={`ai-${idx}`} position={[marker.lat, marker.lng]} icon={AiIcon}>
                <Popup>
                  <div className="p-2 max-w-[220px]">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu size={14} className="text-red-600" />
                      <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">INFO IA</span>
                    </div>
                    <h4 className="font-black text-white uppercase text-xs">{marker.type}</h4>
                    <p className="text-xs text-slate-300 mt-1">{marker.description}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </L.LayerGroup>
        </LayersControl.Overlay>
      </LayersControl>
    </MapContainer>
  );
}
