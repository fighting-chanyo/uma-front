'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ManualInputTab } from './manual-input-tab';
import { ImageRecognitionTab } from './image-recognition-tab';
import { StagedBetsList } from './staged-bets-list';
import { TicketFormState } from '@/types/betting';
import { Button } from '@/components/ui/button';
import { saveBets } from '@/app/actions/ticket';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check } from 'lucide-react';

const STAGED_BETS_STORAGE_KEY = 'keiba_staged_bets';

export function BettingInterface({ defaultTab = 'manual' }: { defaultTab?: 'manual' | 'image' }) {
  const [stagedBets, setStagedBets] = useState<(TicketFormState & { mode: 'REAL' | 'AIR' })[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STAGED_BETS_STORAGE_KEY);
    if (saved) {
      try {
        setStagedBets(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse staged bets', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STAGED_BETS_STORAGE_KEY, JSON.stringify(stagedBets));
    }
  }, [stagedBets, isLoaded]);

  const handleAddBet = (bet: TicketFormState & { mode: 'REAL' | 'AIR' }) => {
    setStagedBets(prev => [...prev, bet]);
    toast({
      title: "買い目を追加しました",
      description: "下部のリストで確認できます。",
    });
  };

  const handleRemoveBet = (index: number) => {
    setStagedBets(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    if (stagedBets.length === 0) return;

    setIsSaving(true);
    try {
      const result = await saveBets(stagedBets);
      if (result.success) {
        setStagedBets([]);
        toast({
          title: "買い目を登録しました",
          description: "購入履歴に反映されます。",
          variant: "default",
        });
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

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20">
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="manual">手動入力</TabsTrigger>
          <TabsTrigger value="image">画像認識</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual">
          <ManualInputTab onAddBet={handleAddBet} />
        </TabsContent>
        
        <TabsContent value="image">
          <ImageRecognitionTab onAddBet={handleAddBet} />
        </TabsContent>
      </Tabs>

      <div className="space-y-4">
        <StagedBetsList bets={stagedBets} onRemove={handleRemoveBet} />
        
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
