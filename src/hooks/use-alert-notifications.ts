'use client';

import { useEffect, useRef } from 'react';
import { AlertLevel } from '@/types';

const PRIORITY: Record<AlertLevel, number> = {
  VERDE: 0,
  AMARELO: 1,
  LARANJA: 2,
  VERMELHO: 3,
};

const MESSAGES: Record<AlertLevel, string> = {
  VERDE: 'Situação normalizada em Juiz de Fora. Sem alertas ativos.',
  AMARELO: 'Atenção: nível de alerta AMARELO em Juiz de Fora. Fique em observação.',
  LARANJA: '⚠️ Alerta LARANJA em Juiz de Fora. Evite áreas de risco e acompanhe as atualizações.',
  VERMELHO: '🚨 EMERGÊNCIA — Alerta VERMELHO em Juiz de Fora! Siga as instruções da Defesa Civil imediatamente.',
};

/**
 * Sends a browser push notification (if permitted) whenever the alert level escalates.
 * Silently requests permission on first escalation above VERDE.
 */
export function useAlertNotifications(alertLevel: AlertLevel): void {
  const prevLevel = useRef<AlertLevel | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const prev = prevLevel.current;
    prevLevel.current = alertLevel;

    // Skip on first render (no previous value yet)
    if (prev === null) return;
    // Only notify on escalation, never on de-escalation
    if (PRIORITY[alertLevel] <= PRIORITY[prev]) return;

    const send = () => {
      try {
        new Notification('JF Alerta — Nível Atualizado', {
          body: MESSAGES[alertLevel],
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'jf-alerta-level',
          requireInteraction: alertLevel === 'VERMELHO',
        });
      } catch {
        // Notification API can fail in some browsers — silently ignore
      }
    };

    if (Notification.permission === 'granted') {
      send();
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((p) => {
        if (p === 'granted') send();
      });
    }
  }, [alertLevel]);
}
