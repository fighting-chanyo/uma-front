import React from 'react';
import { CheckCircle2, AlertTriangle, Loader2, Edit, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageAnalysisRequest } from '@/types/analysis';
import { cn } from '@/lib/utils';

interface AnalysisQueueListProps {
  items: ImageAnalysisRequest[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AnalysisQueueList({ items, onEdit, onDelete }: AnalysisQueueListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">解析リスト ({items.length})</h3>
      <div className="grid gap-2">
        {items.map((item) => (
          <div 
            key={item.id}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg border bg-card transition-colors",
              item.status === 'correction_needed' && "border-yellow-500/50 bg-yellow-500/5",
              item.status === 'error' && "border-destructive/50 bg-destructive/5",
              item.status === 'complete' && "border-green-500/50 bg-green-500/5"
            )}
          >
            {/* Thumbnail */}
            <div className="relative w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
              <img 
                src={item.previewUrl} 
                alt="Thumbnail" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {item.file.name}
                </span>
                {getStatusBadge(item.status)}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {getStatusMessage(item)}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {(item.status === 'correction_needed' || item.status === 'complete') && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(item.id)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getStatusBadge(status: ImageAnalysisRequest['status']) {
  switch (status) {
    case 'pending':
      return <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">待機中</span>;
    case 'analyzing':
      return <Loader2 className="w-3 h-3 animate-spin text-primary" />;
    case 'complete':
    case 'complete_auto':
    case 'complete_manual':
      return <CheckCircle2 className="w-3 h-3 text-green-500" />;
    case 'correction_needed':
      return <AlertTriangle className="w-3 h-3 text-yellow-500" />;
    case 'error':
      return <AlertTriangle className="w-3 h-3 text-destructive" />;
  }
}

function getStatusMessage(item: ImageAnalysisRequest) {
  const fieldTranslations: Record<string, string> = {
    date: '日付',
    place: '開催場',
    raceNumber: 'レース番号',
    betType: '式別',
    method: '方式',
    amount: '金額',
    selections: '買い目',
    axis: '軸馬',
    partners: '相手馬',
    positions: '着順'
  };

  switch (item.status) {
    case 'pending':
      return '解析待ち...';
    case 'analyzing':
      return '解析中...';
    case 'complete':
      return '解析完了';
    case 'complete_auto':
      return '解析完了：確定待ちリストに追加しました。';
    case 'complete_manual':
      return '修正完了：確定待ちリストに追加しました。';
    case 'correction_needed':
      const missing = item.result?.missingFields?.map(field => fieldTranslations[field] || field).join(', ') || '不明な項目';
      return `確認が必要: ${missing}`;
    case 'error':
      return item.error || 'エラーが発生しました';
  }
}
