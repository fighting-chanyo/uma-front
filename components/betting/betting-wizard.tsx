"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { BettingInterface } from "./betting-interface"

interface BettingWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMode?: 'manual' | 'image'
}

export function BettingWizard({ open, onOpenChange, defaultMode = 'manual' }: BettingWizardProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-wider text-accent">
            馬券情報登録
          </DialogTitle>
        </DialogHeader>
        
        <BettingInterface defaultTab={defaultMode} />
      </DialogContent>
    </Dialog>
  )
}
