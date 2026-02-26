
"use client";

import { Phone } from 'lucide-react';

const EMERGENCY_CONTACTS = [
  { label: 'Defesa Civil', number: '3236907294', display: '(32) 3690-7294' },
  { label: 'SAMU', number: '192', display: '192' },
  { label: 'Bombeiros', number: '193', display: '193' },
  { label: 'Polícia', number: '190', display: '190' },
];

export default function Footer() {
  return (
    <footer className="h-12 fixed bottom-0 left-0 right-0 z-50 bg-[#450a0a] flex items-center overflow-x-auto no-scrollbar px-4 gap-4">
      <div className="flex items-center gap-6 min-w-max">
        {EMERGENCY_CONTACTS.map((contact) => (
          <a
            key={contact.label}
            href={`tel:${contact.number}`}
            className="flex items-center gap-2 text-white hover:text-red-200 transition-colors py-1 px-2 rounded-md active:bg-white/10"
            style={{ minHeight: '44px' }}
          >
            <Phone className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase whitespace-nowrap">
              {contact.label}: <span className="text-sm font-black">{contact.display}</span>
            </span>
          </a>
        ))}
      </div>
    </footer>
  );
}
