'use client';

import React, { useState, useRef } from 'react';
import { Upload, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTicketAnalysis } from '@/hooks/use-ticket-analysis';
import { TicketFormState } from '@/types/betting';
import { ImageAnalysisRequest, AnalyzedTicketData } from '@/types/analysis';
import { cn } from '@/lib/utils';
import { calculateCombinations } from '@/lib/betting-utils';
import { AnalysisQueueList } from './analysis-queue-list';
import { AnalysisCorrectionView } from './analysis-correction-view';

interface ImageRecognitionTabProps {
  onAddBet: (bet: TicketFormState & { mode: 'REAL' | 'AIR' }) => void;
}

export function ImageRecognitionTab({ onAddBet }: ImageRecognitionTabProps) {
  const { analyzeImage } = useTicketAnalysis();
  const [queue, setQueue] = useState<ImageAnalysisRequest[]>([]);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeRequest = queue.find(r => r.id === activeRequestId);

  const convertToTicketFormState = (result: AnalyzedTicketData, previewUrl: string): (TicketFormState & { mode: 'REAL' | 'AIR' }) | null => {
    if (!result.date || !result.place || !result.raceNumber || !result.betType || !result.method || !result.amount) {
      return null;
    }

    const combinations = calculateCombinations(
      result.betType,
      result.method,
      result.selections || [],
      result.axis || [],
      result.partners || [],
      result.multi || false,
      result.positions || []
    );

    return {
      race_date: result.date,
      place_code: result.place,
      race_number: result.raceNumber,
      type: result.betType,
      method: result.method,
      selections: result.selections || [],
      axis: result.axis || [],
      partners: result.partners || [],
      positions: result.positions || [],
      multi: result.multi || false,
      amount: result.amount,
      total_points: combinations,
      total_cost: combinations * result.amount,
      mode: 'REAL', // Default to REAL for analyzed tickets
      image_url: previewUrl
    };
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newRequests: ImageAnalysisRequest[] = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending'
    }));

    setQueue(prev => [...prev, ...newRequests]);

    // Trigger analysis for each new request
    // We can do this in parallel or sequentially. 
    // For now, let's just fire them all.
    newRequests.forEach(req => processRequest(req));
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processRequest = async (request: ImageAnalysisRequest) => {
    updateRequestStatus(request.id, 'analyzing');

    try {
      const result = await analyzeImage(request.file);
      
      if (result) {
        const isComplete = 
          result.date && 
          result.place && 
          result.raceNumber && 
          result.betType && 
          result.method && 
          (result.selections?.length || result.axis?.length) &&
          result.amount;

        if (isComplete) {
          const bet = convertToTicketFormState(result, request.previewUrl);
          if (bet) {
            onAddBet(bet);
            updateRequest(request.id, {
              status: 'complete_auto',
              result
            });
          } else {
             // Should not happen if isComplete check is correct, but fallback
             updateRequest(request.id, {
              status: 'correction_needed',
              result
            });
          }
        } else {
          updateRequest(request.id, {
            status: 'correction_needed',
            result
          });
        }
      } else {
        updateRequestStatus(request.id, 'error', '解析できませんでした');
      }
    } catch (err) {
      updateRequestStatus(request.id, 'error', err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  const updateRequestStatus = (id: string, status: ImageAnalysisRequest['status'], error?: string) => {
    setQueue(prev => prev.map(item => 
      item.id === id ? { ...item, status, error } : item
    ));
  };

  const updateRequest = (id: string, updates: Partial<ImageAnalysisRequest>) => {
    setQueue(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const handleDelete = (id: string) => {
    setQueue(prev => {
      const item = prev.find(i => i.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter(i => i.id !== id);
    });
    if (activeRequestId === id) {
      setActiveRequestId(null);
    }
  };

  const handleEdit = (id: string) => {
    setActiveRequestId(id);
  };

  const handleConfirmCorrection = (bet: TicketFormState & { mode: 'REAL' | 'AIR' }) => {
    onAddBet(bet);
    // Update status to complete_manual instead of deleting
    if (activeRequestId) {
      updateRequestStatus(activeRequestId, 'complete_manual');
      setActiveRequestId(null);
    }
  };

  if (activeRequest) {
    return (
      <AnalysisCorrectionView 
        request={activeRequest} 
        onConfirm={handleConfirmCorrection}
        onCancel={() => setActiveRequestId(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 h-[600px] w-full">
      {/* Top: Upload Area */}
      <div className="space-y-4 flex flex-col shrink-0 w-full">
        <div className="bg-card/30 p-4 rounded-lg border border-border/50 flex flex-col w-full">
          <h2 className="text-lg font-semibold mb-4 text-accent">馬券アップロード</h2>
          
          <div 
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center p-4 transition-colors hover:bg-accent/5 hover:border-primary/50 min-h-[100px]"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files) {
                // Reuse handleFileSelect logic logic roughly
                const files = e.dataTransfer.files;
                const newRequests: ImageAnalysisRequest[] = Array.from(files).map(file => ({
                  id: crypto.randomUUID(),
                  file,
                  previewUrl: URL.createObjectURL(file),
                  status: 'pending'
                }));
                setQueue(prev => [...prev, ...newRequests]);
                newRequests.forEach(req => processRequest(req));
              }
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left space-y-1">
                <div>
                  <p className="text-base font-medium">画像をアップロード</p>
                  <p className="text-xs text-muted-foreground">ドラッグ＆ドロップ または クリック</p>
                </div>
              </div>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                size="sm"
                className="ml-4"
              >
                ファイルを選択
              </Button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              multiple
              onChange={handleFileSelect}
            />
          </div>
          
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
            実際の馬券や、ネット購入した馬券のスクリーンショットなどを解析し、登録します。
            解析できない情報があった場合、手入力で補足していただきます。<br />
            一度に複数枚、アップロードできます。
          </p>
        </div>
      </div>

      {/* Bottom: Queue List */}
      <div className="space-y-4 flex-1 min-h-0 overflow-y-auto">
        <div className="bg-card/30 p-4 rounded-lg border border-border/50 min-h-full">
          {queue.length > 0 ? (
            <AnalysisQueueList 
              items={queue} 
              onEdit={handleEdit} 
              onDelete={handleDelete} 
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground min-h-[100px]">
              <p>馬券画像をアップロードして解析を開始</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
