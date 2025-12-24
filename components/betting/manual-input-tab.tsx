'use client';

import React from 'react';
import { BettingForm } from './betting-form';
import { TicketFormState } from '@/types/betting';

interface ManualInputTabProps {
  onAddBet: (bet: TicketFormState & { mode: 'REAL' | 'AIR' }) => void;
  initialState?: Partial<TicketFormState>;
  submitLabel?: string;
  onDelete?: () => void;
}

export function ManualInputTab({ onAddBet, initialState, submitLabel, onDelete }: ManualInputTabProps) {
  return (
    <div className="space-y-4 min-h-[600px] w-full">
      <div className="bg-card/30 p-4 rounded-lg border border-border/50 w-full">
        <h2 className="text-lg font-semibold mb-4 text-accent">
          {initialState ? '買い目編集' : '手動登録'}
        </h2>
        <BettingForm 
          onAdd={onAddBet} 
          initialState={initialState} 
          submitLabel={submitLabel}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
