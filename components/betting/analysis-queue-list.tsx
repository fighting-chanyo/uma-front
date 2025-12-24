import React from 'react';
import { CheckCircle2, AlertTriangle, Loader2, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnalysisQueueItemWithUrl } from '@/hooks/use-ticket-analysis-queue';
import { cn } from '@/lib/utils';

interface AnalysisQueueListProps {
  items: AnalysisQueueItemWithUrl[];
  onEdit: (item: AnalysisQueueItemWithUrl) => void;
  onDelete: (id: string) => void;
}

export function AnalysisQueueList({ items, onEdit, onDelete }: AnalysisQueueListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">解析中・確認待ち ({items.length})</h3>
      <div className="grid gap-2">
        {items.map((item) => (
          <div 
            key={item.id}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg border bg-card transition-colors",
              item.status === 'error' && "border-destructive/50 bg-destructive/5",
              item.status === 'completed' && "border-green-500/50 bg-green-500/5"
            )}
          >
            {/* Thumbnail */}
            <div className="relative w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
              <img 
                src={item.publicUrl} 
                alt="Thumbnail" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {item.status === 'pending' ? '待機中' : 
                   item.status === 'processing' ? '解析中' :
                   item.status === 'completed' ? '確認待ち' : 'エラー'}
                </span>
                {getStatusBadge(item.status)}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {item.error_message || (item.status === 'completed' ? 'タップして内容を確認・登録' : '解析完了までお待ちください')}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {item.status === 'completed' && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(item)}
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

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">待機中</span>;
    case 'processing':
      return <Loader2 className="w-3 h-3 animate-spin text-primary" />;
    case 'completed':
      return <CheckCircle2 className="w-3 h-3 text-green-500" />;
    case 'error':
      return <AlertTriangle className="w-3 h-3 text-destructive" />;
    default:
      return null;
  }
}
