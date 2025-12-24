"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BettingInterface } from "./betting-interface"
import type { Ticket } from "@/types/ticket"

import { AnalysisQueueItemWithUrl } from "@/hooks/use-ticket-analysis-queue"

interface BettingWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMode?: 'manual' | 'image'
  editingQueueItem?: AnalysisQueueItemWithUrl | null
  editingTicket?: Ticket | null
}

export function BettingWizard({ open, onOpenChange, defaultMode = 'manual', editingQueueItem, editingTicket }: BettingWizardProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] flex flex-col bg-background/95 backdrop-blur-xl border-primary/20 p-0 gap-0">
        <DialogHeader className="p-6 pb-2 flex-none">
          <DialogTitle className="text-2xl font-bold tracking-wider text-accent">
            {editingTicket ? '馬券情報編集' : editingQueueItem ? '解析結果の確認・修正' : '馬券情報登録'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 min-h-0 overflow-hidden p-6 pt-2">
          <BettingInterface 
            defaultTab={defaultMode} 
            onClose={() => onOpenChange(false)}
            editingQueueItem={editingQueueItem}
            editingTicket={editingTicket}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
