import React from 'react';
import { CheckCircle2, AlertTriangle, Loader2, Edit, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnalysisQueueItemWithUrl } from '@/hooks/use-ticket-analysis-queue';
import { cn } from '@/lib/utils';
import { AnalysisResult } from '@/types/analysis';
import { analyzeTicketQueue } from '@/app/actions/ticket-analysis';
import { useToast } from '@/hooks/use-toast';

interface AnalysisQueueListProps {
  items: AnalysisQueueItemWithUrl[];
  onEdit: (item: AnalysisQueueItemWithUrl) => void;
  onDelete: (id: string) => void;
}

function isAnalysisComplete(result: AnalysisResult | null): boolean {
  if (!result) return false;
  
  // Check race info
  if (!result.race.date || !result.race.place || !result.race.race_number) {
    return false;
  }

  // Check tickets
  if (!result.tickets || result.tickets.length === 0) {
    return false;
  }

  // Check each ticket for essential info
  // Note: We might need stricter checks depending on requirements, 
  // but for now, let's check if basic fields are present.
  // Assuming 'content' always exists if ticket exists.
  for (const ticket of result.tickets) {
    if (!ticket.bet_type || !ticket.buy_type || !ticket.amount_per_point) {
      return false;
    }
    // Check selections? 
    if (!ticket.content.selections || ticket.content.selections.length === 0) {
      return false;
    }
  }

  return true;
}

function isStuck(item: AnalysisQueueItemWithUrl): boolean {
  if (item.status === 'pending') return true;
  if (item.status === 'error') return true;
  if (item.status === 'processing') {
    const updatedAt = new Date(item.updated_at).getTime();
    const now = Date.now();
    // 1分以上経過していたらスタックとみなす
    return (now - updatedAt) > 60 * 1000;
  }
  return false;
}

export function AnalysisQueueList({ items, onEdit, onDelete }: AnalysisQueueListProps) {
  const { toast } = useToast();

  const handleRetry = async (id: string) => {
    try {
      toast({
        title: "再解析を開始しました",
        description: "解析完了までお待ちください",
      });
      await analyzeTicketQueue(id);
    } catch (error) {
      console.error('Retry error:', error);
      toast({
        variant: "destructive",
        title: "再解析に失敗しました",
        description: "時間をおいて再度お試しください",
      });
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">解析中・確認待ち ({items.length})</h3>
      <div className="grid gap-2">
        {items.map((item) => {
          const result = item.result_json as AnalysisResult | null;
          const isComplete = item.status === 'completed' ? isAnalysisComplete(result) : false;
          
          return (
          <div 
            key={item.id}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg border bg-card transition-colors",
              item.status === 'error' && "border-destructive/50 bg-destructive/5",
              item.status === 'completed' && isComplete && "border-green-500/50 bg-green-500/5",
              item.status === 'completed' && !isComplete && "border-yellow-500/50 bg-yellow-500/5"
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
                <span className="text-sm font-medium truncate max-w-[150px]">
                  {item.status === 'pending' ? '待機中' : 
                   item.status === 'processing' ? '解析中' :
                   item.status === 'completed' ? (isComplete ? '解析完了-OK' : '解析完了-要補完') : 'エラー'}
                </span>
                {getStatusBadge(item.status, isComplete)}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {item.error_message || (
                  item.status === 'completed' 
                    ? (isComplete ? '内容を確認・登録してください' : '一部の情報を解析できませんでした・手動で補完してください。')
                    : '解析完了までお待ちください'
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {isStuck(item) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRetry(item.id)}
                  title="再解析を実行"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
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
        )})}
      </div>
    </div>
  );
}

function getStatusBadge(status: string, isComplete: boolean) {
  switch (status) {
    case 'pending':
      return <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">待機中</span>;
    case 'processing':
      return <Loader2 className="w-3 h-3 animate-spin text-primary" />;
    case 'completed':
      return isComplete 
        ? <CheckCircle2 className="w-3 h-3 text-green-500" />
        : <AlertTriangle className="w-3 h-3 text-yellow-500" />;
    case 'error':
      return <AlertCircle className="w-3 h-3 text-destructive" />;
    default:
      return null;
  }
}
