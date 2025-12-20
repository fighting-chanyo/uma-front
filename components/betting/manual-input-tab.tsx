'use client';

import React from 'react';
import { BettingForm } from './betting-form';
import { TicketFormState } from '@/types/betting';

interface ManualInputTabProps {
  onAddBet: (bet: TicketFormState & { mode: 'REAL' | 'AIR' }) => void;
}

export function ManualInputTab({ onAddBet }: ManualInputTabProps) {
  return (
    <div className="space-y-4">
      <div className="bg-card/30 p-4 rounded-lg border border-border/50">
        <h2 className="text-lg font-semibold mb-4 text-primary">手動登録</h2>
        <BettingForm onAdd={onAddBet} />
      </div>
    </div>
  );
}
