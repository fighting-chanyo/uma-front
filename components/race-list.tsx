"use client"

import { useMemo, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { RaceAccordionItem } from "./race-accordion-item"
import { Button } from "@/components/ui/button"
import { RefreshCw, ScanLine, PenLine, Loader2 } from "lucide-react"
import type { Race } from "@/types/ticket"
import { checkIpatAuth, syncIpat } from "@/app/actions/ipat-sync"
import { IpatAuthForm, type IpatAuthData } from "@/components/ipat-auth-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface RaceListProps {
  races: Race[]
  title: string
  variant?: "my" | "friend"
}

export function RaceList({ races, title, variant = "my" }: RaceListProps) {
  const [isSyncing, setIsSyncing] = useState(false)
  const [isIpatDialogOpen, setIsIpatDialogOpen] = useState(false)
  const [hasAuth, setHasAuth] = useState<boolean | null>(null)

  // 編集モードを管理するためのStateを追加
  const [isEditingAuth, setIsEditingAuth] = useState(false)
  const [currentAuth, setCurrentAuth] = useState<IpatAuthData | null>(null)

  useEffect(() => {
    // ダイアログが開かれ、かつ編集モードでない場合に認証状態をチェック
    if (isIpatDialogOpen && !isEditingAuth) {
      setHasAuth(null)
      checkIpatAuth().then(setHasAuth)
    }
  }, [isIpatDialogOpen, isEditingAuth])

  const handleIpatSync = async (mode: "past" | "today") => {
    setIsIpatDialogOpen(false)
    setIsSyncing(true)
    
    try {
      const result = await syncIpat(mode)
      if (result.success) {
        console.log(`Sync started: ${result.logId}`)
      } else {
        console.error(result.error)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSyncing(false)
    }
  }
  
  // 編集ボタンがクリックされたときの処理
  const handleEditClick = async () => {
    setIsEditingAuth(true)
    setCurrentAuth(null) // 既存のデータを取得するまでローダーを表示
    try {
      const res = await fetch('/api/ipat-auth')
      if (res.ok) {
        const data = await res.json()
        setCurrentAuth(data.ipatAuth)
      } else {
        console.error('Failed to fetch IPAT auth data')
        setIsEditingAuth(false) // エラー時は同期モード選択画面に戻る
      }
    } catch (error) {
      console.error('Failed to fetch IPAT auth data', error)
      setIsEditingAuth(false)
    }
  }

  const { totalBet, totalReturn, winCount } = useMemo(() => {
    let bet = 0
    let ret = 0
    const winningRaceIds = new Set<string>()

    races.forEach((race) => {
      race.tickets.forEach((ticket) => {
        if (
          (variant === "my" && ticket.owner === "me") ||
          (variant === "friend" && ticket.owner === "friend")
        ) {
          bet += ticket.total_cost
          ret += ticket.payout || 0
          if (ticket.status === "WIN") {
            winningRaceIds.add(race.raceId)
          }
        }
      })
    })

    return { totalBet: bet, totalReturn: ret, winCount: winningRaceIds.size }
  }, [races, variant])

  const balance = totalReturn - totalBet

  const handleSync = async (type: "ipat" | "ocr" | "manual") => {
    setIsSyncing(true)
    await new Promise((r) => setTimeout(r, 2000))
    setIsSyncing(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-stretch gap-2 mb-3">
        <div className="glass-panel p-3 md:p-4 hud-border relative overflow-hidden flex-1">
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#00f3ff]/50" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#00f3ff]/50" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#00f3ff]/50" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#00f3ff]/50" />

          <div className="flex flex-col justify-between h-full">
            <div className="flex items-center gap-3 md:gap-4 flex-wrap">
              <h2 className="text-sm md:text-base font-bold tracking-[0.15em] text-foreground uppercase">{title}</h2>
              <div className="flex items-center gap-2 text-[10px] md:text-xs font-mono">
                <span className="text-[#ff003c]">Bet: ¥{totalBet.toLocaleString()}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-[#00ff41]">Ret: ¥{totalReturn.toLocaleString()}</span>
                <span
                  className={cn(
                    "font-bold px-1.5 py-0.5 border",
                    balance >= 0
                      ? "text-[#00ff41] border-[#00ff41]/30 bg-[#00ff41]/10"
                      : "text-[#ff003c] border-[#ff003c]/30 bg-[#ff003c]/10",
                  )}
                >
                  {balance >= 0 ? "+" : ""}¥{balance.toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1 font-mono tracking-wider">
              {races.length} RACES • {winCount} WINS
            </p>
          </div>
        </div>

        {variant === "my" && (
          <div className="flex items-center gap-1">
            <Dialog open={isIpatDialogOpen} onOpenChange={(open) => {
                setIsIpatDialogOpen(open);
                if (!open) {
                    // ダイアログが閉じる時に編集モードをリセット
                    setIsEditingAuth(false);
                }
            }}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex flex-col items-center justify-center h-full w-24 px-0 text-[#00f3ff] hover:bg-[#00f3ff]/20 hover:text-[#00f3ff] border border-[#00f3ff]/50"
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <Loader2 className="w-5 h-5 mb-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-5 h-5 mb-1" />
                  )}
                  <span className="text-[10px] font-mono font-bold tracking-widest">IPAT 同期</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-black/90 border-[#00f3ff]/20 text-white">
                <DialogHeader>
                  <DialogTitle className="text-[#00f3ff]">
                    {hasAuth === false
                      ? "IPAT認証設定"
                      : isEditingAuth
                      ? "IPAT認証情報の編集"
                      : "同期モード選択"}
                  </DialogTitle>
                  <DialogDescription className="text-gray-400">
                    {hasAuth === false
                      ? "IPAT連携のために認証情報を設定してください。"
                      : isEditingAuth
                      ? "新しい認証情報を入力し、更新してください。"
                      : "同期するデータの範囲を選択してください。"}
                  </DialogDescription>
                </DialogHeader>
                
                {hasAuth === null ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-[#00f3ff]" />
                  </div>
                ) : hasAuth === false ? (
                  <IpatAuthForm onSuccess={() => setHasAuth(true)} />
                ) : isEditingAuth ? (
                  currentAuth ? (
                    <IpatAuthForm
                      initialData={currentAuth}
                      onSuccess={() => {
                        setIsEditingAuth(false)
                      }}
                    />
                  ) : (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-[#00f3ff]" />
                    </div>
                  )
                ) : (
                  <>
                    <div className="grid gap-4 py-4">
                      <Button
                        variant="outline"
                        className="flex flex-col items-start h-auto p-4 border-white/10 hover:bg-white/5 hover:text-[#00f3ff] hover:border-[#00f3ff]/50 transition-all"
                        onClick={() => handleIpatSync("today")}
                      >
                        <span className="font-bold mb-1">今日の馬券</span>
                        <span className="text-xs text-gray-400 font-normal text-left whitespace-normal">
                          本日購入した馬券データを同期します。
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        className="flex flex-col items-start h-auto p-4 border-white/10 hover:bg-white/5 hover:text-[#00f3ff] hover:border-[#00f3ff]/50 transition-all"
                        onClick={() => handleIpatSync("past")}
                      >
                        <span className="font-bold mb-1">前日までの馬券</span>
                        <span className="text-xs text-gray-400 font-normal text-left whitespace-normal">
                          過去60日以内にIPATで購入した馬券データを取得します。（今日分のデータは取得できません）
                        </span>
                      </Button>
                    </div>
                    <div className="text-center mt-2">
                        <Button variant="link" onClick={handleEditClick} className="text-xs text-gray-400 hover:text-white">
                            IPAT認証情報を編集する
                        </Button>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center h-full w-24 px-0 text-[#00f3ff] hover:bg-[#00f3ff]/20 hover:text-[#00f3ff] border border-[#00f3ff]/50"
              onClick={() => handleSync("ocr")}
              disabled={isSyncing}
            >
              <ScanLine className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-mono font-bold tracking-widest">画像認識</span>
            </Button>
            <Button
              variant="ghost"
              className="flex flex-col items-center justify-center h-full w-24 px-0 text-[#00f3ff] hover:bg-[#00f3ff]/20 hover:text-[#00f3ff] border border-[#00f3ff]/50"
              onClick={() => handleSync("manual")}
              disabled={isSyncing}
            >
              <PenLine className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-mono font-bold tracking-widest">手入力</span>
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto max-h-[calc(100vh-280px)] border border-white/10 bg-black/20">
        <div
          className={cn(
            "sticky top-0 z-10 px-3 py-2 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/10",
            "grid grid-cols-[140px_1fr_90px_24px] gap-3 items-center",
            "text-[9px] font-mono text-muted-foreground tracking-wider uppercase",
          )}
        >
          <span>DATE / RACE</span>
          <span>NAME</span>
          <span className="text-right">P&L</span>
          <span></span>
        </div>

        {races.length > 0 ? (
          races.map((race, index) => (
            <RaceAccordionItem key={race.raceId} race={race} index={index} variant={variant} />
          ))
        ) : (
          <div className="p-8 text-center text-muted-foreground text-sm">NO DATA FOUND</div>
        )}
      </div>
    </div>
  )
}
