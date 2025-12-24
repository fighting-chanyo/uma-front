'use client';

import React, { useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTicketAnalysis } from '@/hooks/use-ticket-analysis';
import { TicketFormState } from '@/types/betting';

interface ImageRecognitionTabProps {
  onAddBet: (bet: TicketFormState & { mode: 'REAL' | 'AIR' }) => void;
  onUploadComplete?: () => void;
}

export function ImageRecognitionTab({ onAddBet, onUploadComplete }: ImageRecognitionTabProps) {
  const { uploadAndAnalyze, isUploading } = useTicketAnalysis();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Process files sequentially or parallel
    for (const file of Array.from(files)) {
      await uploadAndAnalyze(file);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (onUploadComplete) {
      onUploadComplete();
    }
  };

  return (
    <div className="flex flex-col gap-6 h-[400px] w-full items-center justify-center">
      <div className="bg-card/30 p-8 rounded-lg border border-border/50 flex flex-col w-full max-w-md items-center text-center">
        <h2 className="text-lg font-semibold mb-4 text-accent">馬券アップロード</h2>
        
        <div 
          className="w-full border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center p-8 transition-colors hover:bg-accent/5 hover:border-primary/50 cursor-pointer"
          onClick={() => !isUploading && fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={async (e) => {
            e.preventDefault();
            if (isUploading) return;
            if (e.dataTransfer.files) {
              for (const file of Array.from(e.dataTransfer.files)) {
                await uploadAndAnalyze(file);
              }
              if (onUploadComplete) onUploadComplete();
            }
          }}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">アップロード中...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-medium">画像をアップロード</p>
                <p className="text-xs text-muted-foreground">ドラッグ＆ドロップ または クリック</p>
              </div>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </div>
        
        <p className="text-xs text-muted-foreground mt-6 leading-relaxed">
          アップロードされた画像はバックグラウンドで解析され、<br/>
          完了次第リストに表示されます。
        </p>
      </div>
    </div>
  );
}
