
"use client";

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DONATION_POINTS } from '@/data/seed-data';
import { Location } from '@/types';
import { MapPin, Phone, Clock, ExternalLink, Heart, List } from 'lucide-react';

export default function DonationManager() {
  const [centers] = useState<Location[]>(DONATION_POINTS);

  const openInGoogleMaps = (address: string) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address + ", Juiz de Fora, MG")}`, '_blank');
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/30">
      <div className="p-4 border-b bg-slate-900/80">
        <h2 className="text-xl font-headline font-bold flex items-center gap-2">
          <Heart className="text-primary fill-primary/20 w-6 h-6" />
          Pontos de Doação
        </h2>
        <p className="text-xs text-muted-foreground">Ajude as vítimas das chuvas em Juiz de Fora</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
          {centers.map((center) => (
            <Card key={center.id} className="bg-slate-800/50 border-slate-700/50 overflow-hidden hover:border-primary/50 transition-colors">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-bold leading-tight">{center.name}</CardTitle>
                  <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none text-[10px]">Ativo</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-primary/80 uppercase tracking-tighter">Itens Aceitos</p>
                  <div className="flex flex-wrap gap-1">
                    {center.acceptedItems?.map((item, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] py-0 h-5 border-slate-700 bg-slate-900/50">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {center.address}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                    {center.phone}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    {center.openHours}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button 
                  className="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 text-xs h-9"
                  onClick={() => openInGoogleMaps(center.address ?? center.name)}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-2" />
                  Como Chegar
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
