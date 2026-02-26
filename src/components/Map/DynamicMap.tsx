
'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Circle, LayersControl, LayerGroup, Tooltip, useMap } from 'react-leaflet';
import { JF_CENTER, RISK_ZONES, SAFE_ZONES, DONATION_POINTS } from '@/data/seed-data';
import { CommunityReport, AiMarker } from '@/types';
import { Home, Heart, AlertTriangle, Cpu, Droplets, Mountain, Ban, Power, UserRound, CheckCircle2 } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

const createIcon = (color: string, IconComponent: any) => {
  const iconHtml = renderToStaticMarkup(
    <div className="relative flex items-center justify-center">
      <div style={{ backgroundColor: color }} className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-white shadow-xl text-white">
        <IconComponent size={20} strokeWidth={3} />
      </div>
      <div style={{ borderTopColor: color }} className="absolute -bottom-1.5 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px]" />
    </div>
  );
  
  return L.divIcon({
    html: iconHtml,
    className: 'custom-div-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
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

// Severity-based risk zone visual config
const riskStyle = (severity: number) => ({
  color:       severity === 3 ? '#dc2626' : severity === 2 ? '#ea580c' : '#f59e0b',
  fillColor:   severity === 3 ? '#dc2626' : severity === 2 ? '#ea580c' : '#f59e0b',
  fillOpacity: severity === 3 ? 0.30 : 0.22,
  weight:      severity === 3 ? 2.5 : 2,
  dashArray:   severity === 3 ? undefined : '6 4',
});

// Locate-me control
function LocateControl() {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  const locate = useCallback(() => {
    setLocating(true);
    map.locate({ setView: true, maxZoom: 16 });
    const done = () => { setLocating(false); map.off('locationfound locationerror', done); };
    map.once('locationfound', done);
    map.once('locationerror', done);
  }, [map]);

  return (
    <div
      role="button"
      title="Minha localização"
      onClick={locate}
      style={{
        position: 'absolute',
        bottom: 100,
        right: 10,
        zIndex: 1000,
        width: 36,
        height: 36,
        background: '#1e293b',
        border: '2px solid #475569',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: locating ? 16 : 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
        transition: 'opacity .2s',
        opacity: locating ? 0.6 : 1,
      }}
    >
      {locating ? '⏳' : '📍'}
    </div>
  );
}

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

  if (!isMounted) return <div className="w-full h-full bg-slate-900" />;

  return (
    <MapContainer 
      center={[JF_CENTER.lat, JF_CENTER.lng]} 
      zoom={13} 
      className="w-full h-full"
      zoomControl={false}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer name="🗺️ Padrão (OSM)" checked>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="🌑 Escuro (CartoDB)">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="🗺️ Satélite (Esri)">
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        </LayersControl.BaseLayer>
        {/* ── Zonas de Risco (Circle em metros, escala com o zoom) ── */}
        <LayersControl.Overlay name="⚠️ Zonas de Risco" checked>
          <LayerGroup>
            {memoRiskZones.map((zone) => (
              <Circle
                key={zone.id}
                center={[zone.lat, zone.lng]}
                radius={zone.radius}          /* meters — scales with zoom */
                pathOptions={riskStyle(zone.severity)}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={0.95} permanent={false}>
                  <span className="font-bold text-red-700 text-xs">⚠️ {zone.name}</span>
                </Tooltip>
                <Popup>
                  <div className="p-2 min-w-[160px]">
                    <h3 className="font-bold text-red-600 uppercase text-xs mb-1">{zone.name}</h3>
                    <p className="text-[10px] text-slate-500">
                      Severidade: {zone.severity === 3 ? '🔴 Alto' : zone.severity === 2 ? '🟠 Médio' : '🟡 Baixo'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Raio de risco: {zone.radius}m</p>
                  </div>
                </Popup>
              </Circle>
            ))}
          </LayerGroup>
        </LayersControl.Overlay>

        {/* ── Áreas Seguras ── */}
        <LayersControl.Overlay name="🏠 Áreas Seguras" checked>
          <LayerGroup>
            {memoSafeZones.map((zone) => (
              <Marker key={zone.id} position={[zone.lat, zone.lng]} icon={SafeIcon}>
                <Popup>
                  <div className="p-1 min-w-[170px]">
                    <h3 className="font-bold text-green-600 text-sm uppercase">{zone.name}</h3>
                    {zone.status && <p className="text-[10px] text-emerald-600 font-bold mt-0.5">● {zone.status}</p>}
                    {zone.capacity && <p className="text-xs text-slate-600 mt-0.5">Capacidade: {zone.capacity}</p>}
                    {zone.address && <p className="text-xs text-slate-600 mt-0.5">{zone.address}</p>}
                  </div>
                </Popup>
              </Marker>
            ))}
          </LayerGroup>
        </LayersControl.Overlay>

        {/* ── Pontos de Doação ── */}
        <LayersControl.Overlay name="🎁 Doações" checked>
          <LayerGroup>
            {memoDonations.map((point) => (
              <Marker key={point.id} position={[point.lat, point.lng]} icon={DonationIcon}>
                <Popup>
                  <div className="p-1 min-w-[170px]">
                    <h3 className="font-bold text-blue-600 text-sm uppercase">{point.name}</h3>
                    {point.address && <p className="text-xs text-slate-600 mt-0.5">{point.address}</p>}
                    {point.phone && <p className="text-xs text-slate-600 mt-0.5">📞 {point.phone}</p>}
                    {point.openHours && <p className="text-xs text-slate-600 mt-0.5">🕐 {point.openHours}</p>}
                    {point.acceptedItems && point.acceptedItems.length > 0 && (
                      <p className="text-[10px] text-slate-500 mt-0.5">Aceita: {point.acceptedItems.join(', ')}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </LayerGroup>
        </LayersControl.Overlay>

        {/* ── Relatos da Comunidade ── */}
        <LayersControl.Overlay name="👥 Relatos Comunidade" checked>
          <LayerGroup>
            {reports.map((report) => (
              <Marker key={report.id} position={[report.lat, report.lng]} icon={getReportIcon(report.type, report.severity)}>
                <Popup>
                  <div className="p-1 min-w-[180px]">
                    <h3 className="font-bold text-red-600 uppercase text-xs mb-1">{report.type.replace(/_/g, ' ')}</h3>
                    <p className="text-[10px] font-bold text-slate-700 mb-1">{report.neighborhood}</p>
                    <p className="text-xs text-slate-900 leading-tight">"{report.description}"</p>
                    <div className="mt-2 text-[9px] text-slate-400 font-bold border-t pt-1">
                      Severidade: {report.severity === 3 ? '🔴 Alto' : report.severity === 2 ? '🟠 Médio' : '🟡 Baixo'}<br/>
                      Postado às {new Date(report.timestamp).toLocaleTimeString('pt-BR')}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </LayerGroup>
        </LayersControl.Overlay>

        {/* ── Monitoramento IA ── */}
        <LayersControl.Overlay name="🤖 Monitoramento IA" checked>
          <LayerGroup>
            {aiMarkers.map((marker, idx) => (
              <Marker key={`ai-${idx}`} position={[marker.lat, marker.lng]} icon={AiIcon}>
                <Popup>
                  <div className="p-2 max-w-[220px]">
                    <div className="flex items-center gap-2 mb-2">
                      <Cpu size={14} className="text-red-600" />
                      <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">ANÁLISE IA</span>
                      <span className="text-[9px] text-slate-500">{marker.type}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{marker.description}</p>
                    <p className="text-[9px] text-slate-400 mt-1 border-t pt-1">
                      Severidade: {marker.severity === 3 ? '🔴 Alto' : marker.severity === 2 ? '🟠 Médio' : '🟡 Baixo'}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </LayerGroup>
        </LayersControl.Overlay>
      </LayersControl>
      <LocateControl />    </MapContainer>
  );
}
