'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CompactBetVisualizer } from '@/components/compact-bet-visualizer';
import { RaceNameDisplay } from './race-name-display';
import { TicketFormState } from '@/types/betting';
import { cn } from '@/lib/utils';
import { PLACE_CODE_TO_NAME } from '@/lib/betting-utils';

interface StagedBetsListProps {
  bets: (TicketFormState & { mode: 'REAL' | 'AIR' })[];
  onRemove: (index: number) => void;
  onEdit?: (index: number) => void;
}

const BET_TYPE_MAP: Record<string, string> = {
  'WIN': '単勝',
  'PLACE': '複勝',
  'QUINELLA': '馬連',
  'QUINELLA_PLACE': 'ワイド',
  'EXACTA': '馬単',
  'TRIO': '3連複',
  'TRIFECTA': '3連単',
  'BRACKET_QUINELLA': '枠連',
};

export function StagedBetsList({ bets, onRemove, onEdit }: StagedBetsListProps) {
  if (bets.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold mb-4">確定待ち馬券</h3>
      <div className="space-y-2">
        {bets.map((bet, index) => (
          <div 
            key={index} 
            className={cn(
              "flex items-center justify-between p-3 bg-card border rounded-lg hover:bg-accent/5 transition-colors",
              bet.mode === 'AIR' ? "border-dashed border-accent/50 bg-accent/5" : "border-border"
            )}
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{bet.race_date}</span>
                <span>{PLACE_CODE_TO_NAME[bet.place_code] || bet.place_code}</span>
                <span>{bet.race_number}R</span>
                <RaceNameDisplay 
                  date={bet.race_date} 
                  placeCode={bet.place_code} 
                  raceNumber={bet.race_number}
                  className="font-medium text-foreground ml-1"
                />
                {bet.mode === 'AIR' && (
                  <Badge variant="outline" className="text-[10px] h-5 border-accent text-accent">
                    エア馬券
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={cn(
                  "font-bold",
                  getBetTypeColor(bet.type)
                )}>
                  {BET_TYPE_MAP[bet.type] || bet.type}
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
              <div className="flex items-center gap-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(index)}
                  >
                    編集
                  </Button>
                )}
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
          </div>
        ))}
      </div>
    </div>
  );
}

function getBetTypeColor(type: string): string {
  // User requested specific styling for all bet types
  return 'text-[10px] font-bold px-1.5 py-0.5 border text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
}
