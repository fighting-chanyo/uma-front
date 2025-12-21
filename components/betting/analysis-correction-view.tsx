import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BettingForm } from './betting-form';
import { ImageAnalysisRequest } from '@/types/analysis';
import { TicketFormState } from '@/types/betting';

interface AnalysisCorrectionViewProps {
  request: ImageAnalysisRequest;
  onConfirm: (bet: TicketFormState & { mode: 'REAL' | 'AIR' }) => void;
  onCancel: () => void;
}

export function AnalysisCorrectionView({ request, onConfirm, onCancel }: AnalysisCorrectionViewProps) {
  // Convert AnalyzedTicketData to Partial<TicketFormState>
  const initialState: Partial<TicketFormState> = request.result ? {
    race_date: request.result.date || undefined,
    place_code: request.result.place || undefined,
    race_number: request.result.raceNumber || undefined,
    type: request.result.betType || undefined,
    method: request.result.method || undefined,
    selections: request.result.selections || undefined,
    axis: request.result.axis || undefined,
    partners: request.result.partners || undefined,
    positions: request.result.positions || undefined,
    multi: request.result.multi || undefined,
    amount: request.result.amount || undefined,
    image_url: request.previewUrl,
  } : { image_url: request.previewUrl };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          戻る
        </Button>
        <h3 className="font-semibold">解析結果の確認・修正</h3>
      </div>

      <div className="flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto">
        {/* Image View */}
        <div className="bg-muted/30 rounded-lg border overflow-hidden flex items-center justify-center p-4 min-h-[300px] max-h-[500px] shrink-0">
          <img 
            src={request.previewUrl} 
            alt="Ticket" 
            className="max-w-full max-h-full object-contain shadow-md rounded"
          />
        </div>

        {/* Form View */}
        <div className="pb-4">
          <div className="bg-card border rounded-lg p-4 shadow-sm">
            <BettingForm 
              initialState={initialState} 
              onAdd={onConfirm}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
