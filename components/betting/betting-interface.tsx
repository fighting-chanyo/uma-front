'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ManualInputTab } from './manual-input-tab';
import { ImageRecognitionTab } from './image-recognition-tab';
import { StagedBetsList } from './staged-bets-list';
import { TicketFormState, BetType } from '@/types/betting';
import { Button } from '@/components/ui/button';
import { saveBets } from '@/app/actions/ticket';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check } from 'lucide-react';
import { AnalysisQueueItemWithUrl } from "@/hooks/use-ticket-analysis-queue"
import { deleteAnalysisQueue } from "@/app/actions/ticket-analysis"
import { calculateCombinations } from '@/lib/betting-utils';
import type { Ticket } from "@/types/ticket"

import { deleteTicket } from '@/app/actions/ticket';

const STAGED_BETS_STORAGE_KEY = 'keiba_staged_bets';

const PLACE_CODE_MAP: Record<string, string> = {
  "札幌": "01", "函館": "02", "福島": "03", "新潟": "04", "東京": "05", 
  "中山": "06", "中京": "07", "京都": "08", "阪神": "09", "小倉": "10"
};

export function BettingInterface({ defaultTab = 'manual', onClose, editingQueueItem, editingTicket }: { defaultTab?: 'manual' | 'image', onClose?: () => void, editingQueueItem?: AnalysisQueueItemWithUrl | null, editingTicket?: Ticket | null }) {
  const [stagedBets, setStagedBets] = useState<(TicketFormState & { mode: 'REAL' | 'AIR' })[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingBetIndex, setEditingBetIndex] = useState<number | null>(null);
  const { toast } = useToast();

  // Load from localStorage on mount (only if not editing queue item or ticket)
  useEffect(() => {
    if (editingQueueItem || editingTicket) return;
    
    const saved = localStorage.getItem(STAGED_BETS_STORAGE_KEY);
    if (saved) {
      try {
        setStagedBets(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse staged bets', e);
      }
    }
    setIsLoaded(true);
  }, [editingQueueItem, editingTicket]);

  // Initialize from editingQueueItem
  useEffect(() => {
    if (editingQueueItem && editingQueueItem.result_json) {
      const results = editingQueueItem.result_json.results || [];
      const newBets = results.map(result => {
         if (!result.betType || !result.method) return null;

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
            race_date: result.date || '',
            place_code: result.place || '',
            race_number: result.raceNumber || 0,
            type: result.betType,
            method: result.method,
            selections: result.selections || [],
            axis: result.axis || [],
            partners: result.partners || [],
            positions: result.positions || [],
            multi: result.multi || false,
            amount: result.amount || 100,
            total_points: combinations,
            total_cost: combinations * (result.amount || 100),
            mode: 'REAL',
            image_url: editingQueueItem.publicUrl
         } as TicketFormState & { mode: 'REAL' | 'AIR' };
      }).filter(Boolean);

      setStagedBets(newBets as any);
      setIsLoaded(true);
    }
  }, [editingQueueItem]);

  // Initialize from editingTicket
  useEffect(() => {
    if (editingTicket) {
      const placeCode = PLACE_CODE_MAP[editingTicket.venue || ""] || "";
      
      const bet: TicketFormState & { mode: 'REAL' | 'AIR' } = {
        id: editingTicket.id,
        race_date: editingTicket.race_date || "",
        place_code: placeCode,
        race_number: editingTicket.race_number || 0,
        type: editingTicket.content.type as BetType,
        method: editingTicket.content.method,
        multi: editingTicket.content.multi || false,
        selections: editingTicket.content.selections,
        axis: editingTicket.content.axis || [],
        partners: editingTicket.content.partners || [],
        positions: editingTicket.content.positions || [],
        amount: editingTicket.amount_per_point,
        total_points: editingTicket.total_points,
        total_cost: editingTicket.total_cost,
        mode: editingTicket.mode,
        image_url: editingTicket.image_url
      };
      
      setStagedBets([bet]);
      setEditingBetIndex(0);
      setIsLoaded(true);
    }
  }, [editingTicket]);

  // Save to localStorage when changed (only if not editing queue item or ticket)
  useEffect(() => {
    if (isLoaded && !editingQueueItem && !editingTicket) {
      localStorage.setItem(STAGED_BETS_STORAGE_KEY, JSON.stringify(stagedBets));
    }
  }, [stagedBets, isLoaded, editingQueueItem, editingTicket]);

  const handleAddBet = (bet: TicketFormState & { mode: 'REAL' | 'AIR' }) => {
    if (editingBetIndex !== null) {
      setStagedBets(prev => prev.map((b, i) => i === editingBetIndex ? bet : b));
      setEditingBetIndex(null);
      toast({ title: "買い目を更新しました" });
    } else {
      setStagedBets(prev => [...prev, bet]);
      toast({
        title: "買い目を追加しました",
        description: "下部のリストで確認できます。",
      });
    }
  };

  const handleRemoveBet = (index: number) => {
    setStagedBets(prev => prev.filter((_, i) => i !== index));
    if (editingBetIndex === index) {
      setEditingBetIndex(null);
    }
  };

  const handleConfirm = async () => {
    if (stagedBets.length === 0) return;

    setIsSaving(true);
    try {
      const result = await saveBets(stagedBets);
      if (result.success) {
        setStagedBets([]);
        if (!editingQueueItem) {
            localStorage.removeItem(STAGED_BETS_STORAGE_KEY);
        }
        
        // If editing queue item, delete it
        if (editingQueueItem) {
            await deleteAnalysisQueue(editingQueueItem.id);
        }

        toast({
          title: "買い目を登録しました",
          description: "購入履歴に反映されます。",
          variant: "default",
        });
        if (onClose) onClose();
      } else {
        toast({
          title: "登録エラー",
          description: "一部の買い目を保存できませんでした。",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "予期せぬエラー",
        description: "エラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTicket = async (updatedBet: TicketFormState & { mode: 'REAL' | 'AIR' }) => {
    setIsSaving(true);
    try {
      const result = await saveBets([updatedBet]);
      if (result.success) {
        toast({
          title: "更新しました",
          description: "チケット情報が更新されました。",
        });
        if (onClose) onClose();
      } else {
        toast({
          title: "更新エラー",
          description: "更新に失敗しました。",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "予期せぬエラー",
        description: "エラーが発生しました。",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!editingTicket) return;
    if (!confirm("本当に削除しますか？")) return;

    setIsSaving(true);
    try {
      await deleteTicket(editingTicket.id);
      toast({
        title: "削除しました",
        description: "チケットが削除されました。",
      });
      if (onClose) onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: "削除エラー",
        description: "削除に失敗しました。",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (editingTicket) {
    return (
      <div className="space-y-8 w-full pb-20">
        {stagedBets.length > 0 && (
          <ManualInputTab 
            key={editingTicket.id}
            onAddBet={handleUpdateTicket} 
            initialState={stagedBets[0]} 
            submitLabel="更新"
            onDelete={handleDeleteTicket}
          />
        )}
      </div>
    )
  }

  if (editingQueueItem) {
     return (
        <div className="space-y-8 w-full pb-20">
             {editingBetIndex !== null && (
                <div className="border-b border-border pb-8">
                    <ManualInputTab 
                        onAddBet={handleAddBet} 
                        initialState={stagedBets[editingBetIndex]} 
                    />
                    <div className="flex justify-end mt-2">
                        <Button variant="ghost" onClick={() => setEditingBetIndex(null)}>キャンセル</Button>
                    </div>
                </div>
             )}

             <StagedBetsList 
                bets={stagedBets} 
                onRemove={handleRemoveBet} 
                onEdit={(index) => setEditingBetIndex(index)}
             />
             
             <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border flex justify-end gap-4 z-50">
                <Button variant="outline" onClick={onClose} disabled={isSaving}>
                  キャンセル
                </Button>
                <Button onClick={handleConfirm} disabled={isSaving || stagedBets.length === 0}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  保存して完了
                </Button>
             </div>
        </div>
     )
  }

  return (
    <div className="space-y-8 w-full pb-20">
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="manual">手動入力</TabsTrigger>
          <TabsTrigger value="image">画像認識</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual">
          <ManualInputTab onAddBet={handleAddBet} />
        </TabsContent>
        
        <TabsContent value="image">
          <ImageRecognitionTab 
            onAddBet={handleAddBet} 
            onUploadComplete={() => {
              if (onClose) onClose();
            }}
          />
        </TabsContent>
      </Tabs>

      <div className="space-y-4">
        <StagedBetsList bets={stagedBets} onRemove={handleRemoveBet} onEdit={(index) => {
            // Switch to manual tab and populate form? 
            // For now, let's just log or ignore
            console.log('Edit not fully supported in normal mode yet', index);
        }} />
        
        {stagedBets.length > 0 && (
          <Button 
            className="w-full h-12 text-lg font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-[0_0_20px_rgba(0,243,255,0.3)]"
            onClick={handleConfirm}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Check className="mr-2 h-5 w-5" />
                買い目確定
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
