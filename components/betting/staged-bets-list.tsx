'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CompactBetVisualizer } from '@/components/compact-bet-visualizer';
import { TicketFormState } from '@/types/betting';
import { cn } from '@/lib/utils';

interface StagedBetsListProps {
  bets: (TicketFormState & { mode: 'REAL' | 'AIR' })[];
  onRemove: (index: number) => void;
}

export function StagedBetsList({ bets, onRemove }: StagedBetsListProps) {
  if (bets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold mb-4">STAGED BETS</h3>
      <div className="space-y-2">
        {bets.map((bet, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between p-3 bg-card border border-border rounded-lg hover:bg-accent/5 transition-colors"
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{bet.race_date}</span>
                <span>{bet.place_code}</span>
                <span>{bet.race_number}R</span>
                <Badge variant={bet.mode === 'REAL' ? 'default' : 'secondary'} className="text-[10px] h-5">
                  {bet.mode}
                </Badge>
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={cn(
                  "font-bold",
                  getBetTypeColor(bet.type)
                )}>
                  {bet.type}
                </Badge>
                <div className="flex-1">
                  <CompactBetVisualizer content={bet} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">{bet.amount}円 × {bet.total_points}点</div>
                <div className="font-bold text-primary">¥{bet.total_cost.toLocaleString()}</div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => onRemove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getBetTypeColor(type: string): string {
  switch (type) {
    case 'WIN': return 'text-green-500 border-green-500/50';
    case 'PLACE': return 'text-blue-500 border-blue-500/50';
    case 'QUINELLA': return 'text-red-500 border-red-500/50';
    case 'QUINELLA_PLACE': return 'text-green-600 border-green-600/50';
    case 'EXACTA': return 'text-orange-500 border-orange-500/50';
    case 'TRIO': return 'text-blue-400 border-blue-400/50';
    case 'TRIFECTA': return 'text-pink-500 border-pink-500/50';
    case 'BRACKET_QUINELLA': return 'text-orange-600 border-orange-600/50';
    default: return '';
  }
}
