'use client';

import { useState, useEffect } from 'react';

interface WeatherData {
  temp: number;
  precip: number;
  wind: number;
  code: number;
}

const WMO_ICONS: Record<number, string> = {
  0: '☀️',
  1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌦️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  80: '⛈️', 81: '⛈️', 82: '⛈️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

/**
 * Tiny weather card positioned over the map corner.
 * Fetches current conditions from Open-Meteo every 5 minutes.
 * Renders nothing until data arrives or if the fetch fails.
 */
export default function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);

  const load = () => {
    fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=-21.76&longitude=-43.35' +
        '&current=temperature_2m,precipitation,wind_speed_10m,weather_code' +
        '&timezone=America/Sao_Paulo',
      { cache: 'no-store' }
    )
      .then((r) => r.json())
      .then((d) =>
        setData({
          temp:   d.current?.temperature_2m   ?? 0,
          precip: d.current?.precipitation    ?? 0,
          wind:   d.current?.wind_speed_10m   ?? 0,
          code:   d.current?.weather_code     ?? 0,
        })
      )
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(id);
  }, []);

  if (!data) return null;

  return (
    <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700/70 rounded-xl px-3 py-2 flex items-center gap-2.5 shadow-2xl select-none">
      <span className="text-xl leading-none" title="Condição atual">
        {WMO_ICONS[data.code] ?? '🌡️'}
      </span>
      <div>
        <div className="text-white text-base font-black leading-none">
          {data.temp.toFixed(0)}°C
        </div>
        <div className="text-slate-400 text-[9px] font-bold flex gap-1.5 mt-0.5">
          <span>💧{data.precip.toFixed(1)}mm</span>
          <span>💨{data.wind.toFixed(0)}km/h</span>
        </div>
      </div>
    </div>
  );
}
