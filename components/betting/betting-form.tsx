'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, AlertCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MarkSheetGrid } from './mark-sheet-grid';
import { TicketFormState, BetType, BetMethod } from '@/types/betting';
import { calculateCombinations } from '@/lib/betting-utils';

interface BettingFormProps {
  initialState?: Partial<TicketFormState>;
  onAdd: (bet: TicketFormState & { mode: 'REAL' | 'AIR' }) => void;
  className?: string;
}

const BET_TYPES: { value: BetType; label: string }[] = [
  { value: 'WIN', label: '単勝' },
  { value: 'PLACE', label: '複勝' },
  { value: 'QUINELLA', label: '馬連' },
  { value: 'QUINELLA_PLACE', label: 'ワイド' },
  { value: 'EXACTA', label: '馬単' },
  { value: 'TRIO', label: '3連複' },
  { value: 'TRIFECTA', label: '3連単' },
  { value: 'BRACKET_QUINELLA', label: '枠連' },
];

const BET_METHODS: { value: BetMethod; label: string }[] = [
  { value: 'NORMAL', label: '通常' },
  { value: 'BOX', label: 'ボックス' },
  { value: 'FORMATION', label: 'フォーメーション' },
  { value: 'NAGASHI', label: 'ながし' },
];

const RACE_COURSES = [
  '札幌', '函館', '福島', '新潟', '東京', '中山', '中京', '京都', '阪神', '小倉'
];

export function BettingForm({ initialState, onAdd, className }: BettingFormProps) {
  const [date, setDate] = useState<Date | undefined>(
    initialState?.race_date ? new Date(initialState.race_date) : new Date()
  );
  const [place, setPlace] = useState<string>(initialState?.place_code || '東京');
  const [raceNo, setRaceNo] = useState<number>(initialState?.race_number || 11);
  
  const [betType, setBetType] = useState<BetType>(initialState?.type || 'WIN');
  const [betMethod, setBetMethod] = useState<BetMethod>(initialState?.method || 'NORMAL');
  
  const [selections, setSelections] = useState<string[][]>(initialState?.selections || [[]]);
  const [axis, setAxis] = useState<string[]>(initialState?.axis || []);
  const [partners, setPartners] = useState<string[]>(initialState?.partners || []);
  const [positions, setPositions] = useState<number[]>(initialState?.positions || []);
  const [multi, setMulti] = useState<boolean>(initialState?.multi || false);
  
  const [mode, setMode] = useState<'REAL' | 'AIR'>('REAL');
  const [amount, setAmount] = useState<number>(initialState?.amount || 100);
  
  const [combinations, setCombinations] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  const [showError, setShowError] = useState(false);

  // Recalculate combinations and cost
  useEffect(() => {
    const points = calculateCombinations(betType, betMethod, selections, axis, partners, multi);
    setCombinations(points);
    setTotalCost(points * amount);
    setShowError(false); // Hide error when inputs change
  }, [betType, betMethod, selections, axis, partners, multi, amount]);

  const isMissingInfo = !date || !place || !raceNo || !amount || combinations === 0;

  const handleAdd = () => {
    if (isMissingInfo) {
      setShowError(true);
      return;
    }
    
    if (!date) return;
    
    // Special handling for WIN/PLACE with NORMAL method (Split into individual bets)
    if ((betType === 'WIN' || betType === 'PLACE') && betMethod === 'NORMAL') {
      const selectedHorses = selections[0] || [];
      
      selectedHorses.forEach(horse => {
        const bet: TicketFormState & { mode: 'REAL' | 'AIR' } = {
          race_date: format(date, 'yyyy-MM-dd'),
          place_code: place,
          race_number: raceNo,
          type: betType,
          method: betMethod,
          selections: [[horse]],
          axis: [],
          partners: [],
          positions: [],
          multi: false,
          amount,
          total_points: 1,
          total_cost: amount,
          mode,
          image_hash: initialState?.image_hash,
          image_url: initialState?.image_url
        };
        onAdd(bet);
      });
    } else {
      const bet: TicketFormState & { mode: 'REAL' | 'AIR' } = {
        race_date: format(date, 'yyyy-MM-dd'),
        place_code: place,
        race_number: raceNo,
        type: betType,
        method: betMethod,
        selections,
        axis,
        partners,
        positions,
        multi,
        amount,
        total_points: combinations,
        total_cost: totalCost,
        mode,
        image_hash: initialState?.image_hash,
        image_url: initialState?.image_url
      };
      
      onAdd(bet);
    }
    
    // Reset selections after add (optional, maybe keep race info)
    setSelections([[]]);
    setAxis([]);
    setPartners([]);
    setPositions([]);
    setShowError(false);
  };

  return (
    <div className={cn("space-y-6 p-4 bg-card/50 rounded-lg border border-border", className)}>
      {/* Row 1: Date, Place, RaceNo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col space-y-2">
          <Label>開催日</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "yyyy-MM-dd") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col space-y-2">
          <Label>会場</Label>
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
          >
            {RACE_COURSES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex flex-col space-y-2">
          <Label>レース番号</Label>
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={raceNo}
            onChange={(e) => setRaceNo(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{n}R</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Bet Type */}
      <div className="space-y-2">
        <Label>式別</Label>
        <div className="flex flex-wrap gap-2">
          {BET_TYPES.map((type) => (
            <Button
              key={type.value}
              type="button"
              variant={betType === type.value ? "default" : "outline"}
              className={cn(
                "min-w-[80px]",
                betType === type.value && 'bg-accent text-accent-foreground hover:bg-accent/90'
              )}
              onClick={() => {
                setBetType(type.value);
                // Reset selections when type changes
                setSelections([[]]);
                setAxis([]);
                setPartners([]);
                
                // Reset method to NORMAL if switching to WIN or PLACE
                if (type.value === 'WIN' || type.value === 'PLACE') {
                  setBetMethod('NORMAL');
                }
              }}
            >
              {type.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Row 3: Bet Method */}
      <div className="space-y-2">
        <Label>メソッド</Label>
        <div className={cn(
          "grid gap-2 w-full",
          (betType === 'WIN' || betType === 'PLACE') ? "grid-cols-1" : "grid-cols-4"
        )}>
          {(betType === 'WIN' || betType === 'PLACE' 
            ? BET_METHODS.filter(m => m.value === 'NORMAL') 
            : BET_METHODS
          ).map((method) => (
            <Button
              key={method.value}
              type="button"
              variant={betMethod === method.value ? "default" : "outline"}
              className={cn(
                "w-full px-1 text-xs", // Reduce padding and font size to fit in one line
                betMethod === method.value && 'bg-accent text-accent-foreground hover:bg-accent/90'
              )}
              onClick={() => {
                setBetMethod(method.value);
                setSelections([[]]);
                setAxis([]);
                setPartners([]);
              }}
            >
              {method.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Row 4: MarkSheet */}
      <div className="border border-border rounded-md p-4 bg-background/50">
        <MarkSheetGrid
          type={betType}
          method={betMethod}
          selections={selections}
          axis={axis}
          partners={partners}
          positions={positions}
          multi={multi}
          onUpdate={(updates) => {
            if (updates.selections) setSelections(updates.selections);
            if (updates.axis) setAxis(updates.axis);
            if (updates.partners) setPartners(updates.partners);
            if (updates.positions) setPositions(updates.positions);
            if (updates.multi !== undefined) setMulti(updates.multi);
          }}
        />
      </div>

      {/* Row 5: Real/Air & Price */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
        <div className="space-y-2">
          <Label>リアル/エア馬券</Label>
          <div className="flex items-center space-x-2 bg-secondary/50 p-1 rounded-lg w-fit">
            <Button
              type="button"
              size="sm"
              variant={mode === 'REAL' ? 'default' : 'ghost'}
              onClick={() => setMode('REAL')}
              className={cn(mode === 'REAL' && 'bg-accent text-accent-foreground hover:bg-accent/90')}
            >
              リアル
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === 'AIR' ? 'default' : 'ghost'}
              onClick={() => setMode('AIR')}
              className={cn(mode === 'AIR' && 'bg-accent text-accent-foreground hover:bg-accent/90')}
            >
              エア
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>1点あたり</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-muted-foreground">¥</span>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="pl-8"
              step={100}
              min={100}
            />
          </div>
        </div>
      </div>

      {/* Summary & Action */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-border">
        <div className="text-right md:text-left w-full">
          <div className="text-sm text-muted-foreground">買い目点数 <span className="text-foreground font-bold">{combinations}</span></div>
          <div className="text-lg">合計金額: <span className="text-primary font-bold">¥{totalCost.toLocaleString()}</span></div>
        </div>
        
        <Button 
          onClick={handleAdd} 
          className="w-full md:w-auto min-w-[200px] bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          {initialState ? '買い目更新' : '買い目追加'}
        </Button>
      </div>
      
      {showError && isMissingInfo && (
        <div className="flex items-center text-destructive text-sm">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span>すべての必須項目を入力し、少なくとも1つの組み合わせを選択してください。</span>
        </div>
      )}
    </div>
  );
}
