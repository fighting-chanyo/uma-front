"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import DatePicker, { registerLocale } from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { Loader2, Upload, Camera, Calculator, Save, Plus, Trash2, ShoppingCart, Calendar as CalendarIcon } from "lucide-react"
import { MarkSheetGrid } from "./mark-sheet-grid"
import { CompactBetVisualizer } from "@/components/compact-bet-visualizer"

registerLocale("ja", ja)
import { useTicketAnalysis } from "@/hooks/use-ticket-analysis"
import { TicketFormState, BetType, BetMethod } from "@/types/betting"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const BET_TYPES: { value: BetType; label: string }[] = [
  { value: 'WIN', label: '単勝' },
  { value: 'PLACE', label: '複勝' },
  { value: 'BRACKET_QUINELLA', label: '枠連' },
  { value: 'QUINELLA', label: '馬連' },
  { value: 'QUINELLA_PLACE', label: 'ワイド' },
  { value: 'EXACTA', label: '馬単' },
  { value: 'TRIO', label: '3連複' },
  { value: 'TRIFECTA', label: '3連単' },
];

const BET_METHODS: { value: BetMethod; label: string }[] = [
  { value: 'NORMAL', label: '通常' },
  { value: 'BOX', label: 'ボックス' },
  { value: 'FORMATION', label: 'フォーメーション' },
  { value: 'NAGASHI', label: 'ながし' },
];

const PLACES = [
  { code: '01', name: '札幌' }, { code: '02', name: '函館' },
  { code: '03', name: '福島' }, { code: '04', name: '新潟' },
  { code: '05', name: '東京' }, { code: '06', name: '中山' },
  { code: '07', name: '中京' }, { code: '08', name: '京都' },
  { code: '09', name: '阪神' }, { code: '10', name: '小倉' },
];

const INITIAL_STATE: TicketFormState = {
  type: 'TRIFECTA',
  method: 'NORMAL',
  multi: false,
  selections: [[], [], []],
  axis: [],
  partners: [],
  positions: [1],
  race_date: new Date().toISOString().split('T')[0],
  place_code: '05', // Default Tokyo
  race_number: 11,
  amount: 100,
  total_points: 0,
  total_cost: 0,
};

export interface BettingWizardProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultMode?: 'manual' | 'image';
}

export function BettingWizard({ open, onOpenChange, defaultMode = 'manual' }: BettingWizardProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;

  const [mode, setMode] = useState<'manual' | 'image'>(defaultMode);
  const [formState, setFormState] = useState<TicketFormState>(INITIAL_STATE);
  const { analyzeImage, isAnalyzing, error: analysisError } = useTicketAnalysis();
  const { toast } = useToast();
  const [cart, setCart] = useState<TicketFormState[]>([]);

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormState(INITIAL_STATE);
      setCart([]);
    } else {
      setMode(defaultMode);
    }
  }, [isOpen, defaultMode]);

  const addToCart = () => {
    // Basic validation
    if (formState.amount <= 0) {
      toast({
        variant: "destructive",
        title: "入力エラー",
        description: "金額を入力してください。",
      });
      return;
    }

    if (formState.type === 'WIN' || formState.type === 'PLACE') {
      const selectedHorses = formState.selections[0];
      if (!selectedHorses || selectedHorses.length === 0) {
        toast({
          variant: "destructive",
          title: "入力エラー",
          description: "馬を選択してください。",
        });
        return;
      }

      const newTickets = selectedHorses.map(horse => ({
        ...formState,
        method: 'NORMAL' as BetMethod,
        selections: [[horse], [], []],
      }));
      
      setCart(prev => [...prev, ...newTickets]);
    } else {
      setCart(prev => [...prev, { ...formState }]);
    }
    
    // Reset form but keep context (date, place, race)
    setFormState(prev => ({
      ...INITIAL_STATE,
      race_date: prev.race_date,
      place_code: prev.place_code,
      race_number: prev.race_number,
      amount: prev.amount,
    }));

    toast({
      title: "買い目追加",
      description: "買い目をリストに追加しました。",
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleRegisterAll = async () => {
    if (cart.length === 0) return;

    // TODO: Save all tickets to Supabase
    console.log("Submitting tickets:", cart);
    
    toast({
      title: "一括登録完了",
      description: `${cart.length}件の買い目を保存しました。`,
    });
    
    setCart([]);
    setIsOpen(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setFormState(prev => ({ ...prev, image_url: objectUrl }));

    try {
      const result = await analyzeImage(file);
      if (result) {
        setFormState(prev => ({
          ...prev,
          ...result,
          // Ensure arrays are initialized if missing from result
          selections: result.selections || [[], [], []],
          axis: result.axis || [],
          partners: result.partners || [],
          positions: result.positions || [1],
        }));
        toast({
          title: "解析完了",
          description: "画像から買い目を読み取りました。内容を確認してください。",
        });
      }
    } catch (err) {
      // Error is handled by hook state, but we can show toast too
      toast({
        variant: "destructive",
        title: "解析エラー",
        description: "画像の読み取りに失敗しました。",
      });
    }
  };

  const updateForm = (updates: Partial<TicketFormState>) => {
    setFormState(prev => {
      const next = { ...prev, ...updates };
      // TODO: Recalculate points/cost here based on selections/method/type
      // For now, just update state
      return next;
    });
  };

  const handleSubmit = async () => {
    // TODO: Save to Supabase
    console.log("Submitting ticket:", formState);
    toast({
      title: "登録完了",
      description: "買い目を保存しました。",
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="default" className="gap-2">
            <Calculator className="w-4 h-4" />
            買い目登録
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>買い目登録</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Panel: Image Preview & Cart */}
          {((mode === 'image' && formState.image_url) || cart.length > 0) && (
            <div className="w-full md:w-1/3 bg-muted/30 border-b md:border-b-0 md:border-r flex flex-col overflow-hidden">
              <ScrollArea className="flex-1">
                <div className="p-4 flex flex-col gap-6">
                  {/* Image Preview */}
                  {mode === 'image' && formState.image_url && (
                    <div className="flex flex-col gap-2">
                      <h3 className="font-semibold flex items-center gap-2">
                        <Camera className="w-4 h-4" />
                        読み取り画像
                      </h3>
                      <div className="aspect-[3/4] relative rounded-lg overflow-hidden border bg-background shadow-sm">
                        <img 
                          src={formState.image_url} 
                          alt="Uploaded Ticket" 
                          className="w-full h-full object-contain"
                        />
                        {isAnalyzing && (
                          <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-8 h-8 animate-spin text-primary" />
                              <span className="text-sm font-medium">解析中...</span>
                            </div>
                          </div>
                        )}
                      </div>
                      {analysisError && (
                        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                          {analysisError}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        ※ 画像が不鮮明な場合は正しく読み取れないことがあります。右側のフォームで修正してください。
                      </div>
                    </div>
                  )}

                  {/* Cart List */}
                  {/* Moved to bottom of form */}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Main Form Area */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-8 max-w-2xl mx-auto">
                
                {/* Mode Selection (Only show if no image yet in image mode, or always?) */}
                {(!formState.image_url || mode === 'manual') && (
                  <Tabs value={mode} onValueChange={(v) => setMode(v as 'manual' | 'image')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="manual">手入力で登録</TabsTrigger>
                      <TabsTrigger value="image">画像で登録</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="image" className="mt-6">
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-10 text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={handleImageUpload}
                        />
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-4 bg-primary/10 rounded-full">
                            <Camera className="w-8 h-8 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-semibold text-lg">画像をアップロード</h3>
                            <p className="text-sm text-muted-foreground">
                              馬券やIPATのスクリーンショットをドラッグ＆ドロップ
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}

                {/* Form Content (Show if manual mode OR (image mode AND image loaded)) */}
                {(mode === 'manual' || formState.image_url) && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Race Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2 col-span-2 md:col-span-2">
                        <Label>開催日</Label>
                        <div className="relative">
                          <DatePicker
                            selected={formState.race_date ? new Date(formState.race_date) : null}
                            onChange={(date: Date | null) => {
                              if (date) {
                                updateForm({ race_date: format(date, 'yyyy-MM-dd') })
                              }
                            }}
                            dateFormat="yyyy年MM月dd日"
                            locale="ja"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            wrapperClassName="w-full"
                            popperProps={{ strategy: "fixed" }}
                            calendarClassName="z-[200]"
                          />
                          <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>開催場</Label>
                        <select 
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={formState.place_code}
                          onChange={(e) => updateForm({ place_code: e.target.value })}
                        >
                          {PLACES.map(p => (
                            <option key={p.code} value={p.code}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>レース</Label>
                        <select 
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={formState.race_number}
                          onChange={(e) => updateForm({ race_number: Number(e.target.value) })}
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>{n}R</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Bet Type & Method */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
                      <div className={cn("space-y-2", (formState.type === 'WIN' || formState.type === 'PLACE') && "col-span-2")}>
                        <Label>式別</Label>
                        <select
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={formState.type}
                          onChange={(e) => {
                            const newType = e.target.value as BetType;
                            let newMethod = formState.method;
                            if (newType === 'WIN' || newType === 'PLACE') {
                              newMethod = 'NORMAL';
                            }
                            updateForm({ type: newType, method: newMethod });
                          }}
                        >
                          {BET_TYPES.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                      </div>
                      {formState.type !== 'WIN' && formState.type !== 'PLACE' && (
                        <div className="space-y-2">
                          <Label>方式</Label>
                          <select
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={formState.method}
                            onChange={(e) => updateForm({ method: e.target.value as BetMethod })}
                          >
                            {BET_METHODS.map(method => (
                              <option key={method.value} value={method.value}>{method.label}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Mark Sheet */}
                    <div className="space-y-2">
                      <Label className="text-lg font-semibold">買い目選択</Label>
                      <MarkSheetGrid 
                        type={formState.type}
                        method={formState.method}
                        selections={formState.selections}
                        axis={formState.axis}
                        partners={formState.partners}
                        positions={formState.positions}
                        multi={formState.multi}
                        onUpdate={updateForm}
                      />
                    </div>

                    {/* Amount */}
                    <div className="flex items-end gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="space-y-2 flex-1">
                        <Label>1点あたりの金額</Label>
                        <div className="relative">
                          <Input 
                            type="number" 
                            min={100} 
                            step={100}
                            value={formState.amount}
                            onChange={(e) => updateForm({ amount: Number(e.target.value) })}
                            className="pl-8 text-lg font-bold"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                        </div>
                      </div>
                      <Button variant="secondary" onClick={addToCart} disabled={isAnalyzing} className="h-10 min-w-[120px]">
                        <Plus className="mr-2 h-4 w-4" />
                        買い目追加
                      </Button>
                    </div>

                    {/* Cart List */}
                    {cart.length > 0 && (
                      <div className="space-y-3 pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4" />
                            買い目リスト ({cart.length})
                          </h3>
                          <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-destructive" onClick={() => setCart([])}>
                            全削除
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {cart.map((ticket, index) => (
                            <Card key={index} className="p-3 relative group hover:border-primary transition-colors">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive" 
                                onClick={() => removeFromCart(index)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                              <div className="text-sm font-medium mb-1">
                                {ticket.race_number}R {BET_TYPES.find(t => t.value === ticket.type)?.label}
                              </div>
                              <CompactBetVisualizer content={ticket} />
                              <div className="text-xs text-muted-foreground mt-1 text-right border-t pt-1">
                                {BET_METHODS.find(m => m.value === ticket.method)?.label} / {ticket.amount}円
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex justify-between gap-3">
              <Button variant="outline" onClick={() => setIsOpen(false)}>キャンセル</Button>
              
              <div className="flex gap-3">
                <Button variant="secondary" onClick={addToCart} disabled={isAnalyzing}>
                  <Plus className="mr-2 h-4 w-4" />
                  買い目追加
                </Button>
                
                {cart.length > 0 && (
                  <Button onClick={handleRegisterAll} className="min-w-[120px]">
                    <Save className="mr-2 h-4 w-4" />
                    一括登録 ({cart.length})
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
