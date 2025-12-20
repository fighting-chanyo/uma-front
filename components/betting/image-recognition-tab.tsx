'use client';

import React, { useState, useRef } from 'react';
import { Upload, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BettingForm } from './betting-form';
import { useTicketAnalysis } from '@/hooks/use-ticket-analysis';
import { TicketFormState } from '@/types/betting';
import { cn } from '@/lib/utils';

interface ImageRecognitionTabProps {
  onAddBet: (bet: TicketFormState & { mode: 'REAL' | 'AIR' }) => void;
}

export function ImageRecognitionTab({ onAddBet }: ImageRecognitionTabProps) {
  const { analyzeImage, isAnalyzing, error } = useTicketAnalysis();
  const [editingBet, setEditingBet] = useState<Partial<TicketFormState> | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setEditingBet(null);

    const result = await analyzeImage(file);
    
    if (result) {
      // Check if result is complete enough to auto-add
      // For now, let's assume we always want to verify or at least show the form if anything is ambiguous.
      // But the requirement says "well analyzed ones go to list".
      // Let's check for critical fields.
      const isComplete = 
        result.race_date && 
        result.place_code && 
        result.race_number && 
        result.type && 
        result.method && 
        (result.selections?.length || result.axis?.length) &&
        result.amount;

      if (isComplete) {
        // Auto add
        onAddBet({
          ...result as TicketFormState,
          mode: 'REAL', // Default to REAL for OCR? Or maybe AIR? Let's default to REAL as it's a physical ticket usually.
          image_url: url
        });
        // Clear preview after auto-add? Or keep it?
        // Maybe show a success message.
        setEditingBet(null);
        setPreviewUrl(null);
      } else {
        // Show form for correction
        setEditingBet({ ...result, image_url: url });
      }
    }
  };

  const handleCorrectionAdd = (bet: TicketFormState & { mode: 'REAL' | 'AIR' }) => {
    onAddBet(bet);
    setEditingBet(null);
    setPreviewUrl(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Upload Area */}
      <div className="space-y-4">
        <div className="bg-card/30 p-4 rounded-lg border border-border/50 h-full flex flex-col">
          <h2 className="text-lg font-semibold mb-4 text-accent">BET SLIP UPLOAD</h2>
          
          <div 
            className={cn(
              "flex-1 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center p-8 transition-colors min-h-[300px]",
              isAnalyzing ? "bg-accent/5" : "hover:bg-accent/5 hover:border-primary/50"
            )}
          >
            {previewUrl ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img 
                  src={previewUrl} 
                  alt="Ticket Preview" 
                  className="max-w-full max-h-[400px] object-contain rounded-md shadow-lg" 
                />
                {isAnalyzing && (
                  <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium">Upload Image</p>
                  <p className="text-sm text-muted-foreground">Drag & drop or click to browse</p>
                </div>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnalyzing}
                >
                  Select File
                </Button>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileSelect}
            />
          </div>

          {error && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md flex items-center text-sm">
              <AlertTriangle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Right: Analysis Result / Correction Form */}
      <div className="space-y-4">
        {editingBet ? (
          <div className="bg-card/30 p-4 rounded-lg border border-destructive/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-destructive/50" />
            <div className="flex items-center gap-2 mb-4 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <h2 className="text-lg font-semibold">一部の情報を解析できませんでした。</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              解析できなかった項目を修正してください。
            </p>
            
            <BettingForm 
              initialState={editingBet} 
              onAdd={handleCorrectionAdd} 
              className="border-none bg-transparent p-0"
            />
          </div>
        ) : (
          <div className="bg-card/30 p-4 rounded-lg border border-border/50 h-full flex items-center justify-center text-muted-foreground">
            {isAnalyzing ? (
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p>Analyzing ticket...</p>
              </div>
            ) : (
              <p>Upload a ticket to see analysis results here.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
