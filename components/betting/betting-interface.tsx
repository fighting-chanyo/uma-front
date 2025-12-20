'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ManualInputTab } from './manual-input-tab';
import { ImageRecognitionTab } from './image-recognition-tab';
import { StagedBetsList } from './staged-bets-list';
import { TicketFormState } from '@/types/betting';
import { Button } from '@/components/ui/button';
import { saveBets } from '@/app/actions/ticket';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function BettingInterface({ defaultTab = 'manual' }: { defaultTab?: 'manual' | 'image' }) {
  const [stagedBets, setStagedBets] = useState<(TicketFormState & { mode: 'REAL' | 'AIR' })[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleAddBet = (bet: TicketFormState & { mode: 'REAL' | 'AIR' }) => {
    setStagedBets(prev => [...prev, bet]);
    toast({
      title: "Bet Staged",
      description: "Added to the list below.",
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
          title: "Bets Confirmed",
          description: "Your bets have been successfully registered.",
          variant: "default", // or success if available
        });
      } else {
        toast({
          title: "Error Saving Bets",
          description: "Some bets could not be saved.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
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
            className="w-full h-12 text-lg font-bold bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(255,0,60,0.3)]"
            onClick={handleConfirm}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                SAVING...
              </>
            ) : (
              'CONFIRM BETS'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
