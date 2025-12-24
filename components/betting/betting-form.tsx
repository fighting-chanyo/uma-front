'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, AlertCircle, Plus, Trash2 } from 'lucide-react';
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
import { MarkSheetGrid } from '@/components/betting/mark-sheet-grid';
import { TicketFormState, BetType, BetMethod } from '@/types/betting';
import { calculateCombinations, PLACE_NAME_TO_CODE, PLACE_CODE_TO_NAME } from '@/lib/betting-utils';
import { useRaceSchedule } from '@/hooks/use-race-schedule';

interface BettingFormProps {
  initialState?: Partial<TicketFormState>;
  onAdd: (bet: TicketFormState & { mode: 'REAL' | 'AIR' }) => void;
  className?: string;
  submitLabel?: string;
  onDelete?: () => void;
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

export function BettingForm({ initialState, onAdd, className, submitLabel, onDelete }: BettingFormProps) {
  const { getAvailableDates, getPlacesForDate, getRacesForDateAndPlace, loading: scheduleLoading } = useRaceSchedule();

  const [date, setDate] = useState<Date | undefined>(
    initialState?.race_date ? new Date(initialState.race_date) : undefined
  );
  const [place, setPlace] = useState<string>(initialState?.place_code || '');
  const [raceNo, setRaceNo] = useState<number>(initialState?.race_number || 0);
  
  const [betType, setBetType] = useState<BetType>(initialState?.type || 'WIN');
  const [betMethod, setBetMethod] = useState<BetMethod>(initialState?.method || 'NORMAL');
  
  const [selections, setSelections] = useState<string[][]>(() => {
    if (!initialState?.selections) return [[]];
    
    // Unflatten logic for NORMAL bets
    // When saving NORMAL bets for multi-row types, we flatten them to a single array.
    // We need to reverse this when loading to display correctly in the grid.
    const type = initialState.type || 'WIN';
    const method = initialState.method || 'NORMAL';
    
    if (method === 'NORMAL' && ['EXACTA', 'QUINELLA', 'QUINELLA_PLACE', 'BRACKET_QUINELLA', 'TRIO', 'TRIFECTA'].includes(type)) {
      const firstRow = initialState.selections[0] || [];
      const otherRowsEmpty = initialState.selections.slice(1).every(r => !r || r.length === 0);
      
      if (firstRow.length > 1 && otherRowsEmpty) {
        return firstRow.map(item => [item]);
      }
    }
    
    return initialState.selections;
  });
  const [axis, setAxis] = useState<string[]>(initialState?.axis || []);
  const [partners, setPartners] = useState<string[]>(initialState?.partners || []);
  const [positions, setPositions] = useState<number[]>(initialState?.positions || []);
  const [multi, setMulti] = useState<boolean>(initialState?.multi || false);
  
  const [mode, setMode] = useState<'REAL' | 'AIR'>('REAL');
  const [amount, setAmount] = useState<number>(
    initialState ? (initialState.amount || 0) : 100
  );
  
  const [combinations, setCombinations] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  const [showError, setShowError] = useState(() => {
    if (initialState) {
      return !initialState.race_date || !initialState.place_code || !initialState.race_number || !initialState.amount;
    }
    return false;
  });

  // Recalculate combinations and cost
  useEffect(() => {
    const points = calculateCombinations(betType, betMethod, selections, axis, partners, multi, positions);
    setCombinations(points);
    setTotalCost(points * amount);
    setShowError(false); // Hide error when inputs change
  }, [betType, betMethod, selections, axis, partners, multi, amount, positions]);

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
      // For NORMAL method with multi-row types (Exacta, Quinella, etc.),
      // we need to flatten the selections to match the expected data structure (e.g. [["13", "14"]])
      // instead of [["13"], ["14"]].
      let finalSelections = selections;
      if (betMethod === 'NORMAL' && ['EXACTA', 'QUINELLA', 'QUINELLA_PLACE', 'BRACKET_QUINELLA', 'TRIO', 'TRIFECTA'].includes(betType)) {
        const flat = selections.map(row => row[0]).filter(Boolean);
        if (flat.length > 0) {
          finalSelections = [flat];
        }
      }

      const bet: TicketFormState & { mode: 'REAL' | 'AIR' } = {
        race_date: format(date, 'yyyy-MM-dd'),
        place_code: place,
        race_number: raceNo,
        type: betType,
        method: betMethod,
        selections: finalSelections,
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

  const availableDates = getAvailableDates();
  const availablePlaces = date ? getPlacesForDate(format(date, 'yyyy-MM-dd')) : [];
  const availableRaces = (date && place) ? getRacesForDateAndPlace(format(date, 'yyyy-MM-dd'), place) : [];

  return (
    <div className={cn("space-y-6 p-4 bg-card/50 rounded-lg border border-border", className)}>
      {/* Row 1: Date, Place, RaceNo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col space-y-2">
          <Label className={cn((!date && showError) && "text-destructive")}>開催日</Label>
          <select
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              (!date && showError) && "border-destructive"
            )}
            value={date ? format(date, "yyyy-MM-dd") : ""}
            onChange={(e) => {
              const newDate = e.target.value ? new Date(e.target.value) : undefined;
              setDate(newDate);
              setPlace('');
              setRaceNo(0);
            }}
          >
            <option value="" disabled>選択してください</option>
            {availableDates.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col space-y-2">
          <Label className={cn((!place && showError) && "text-destructive")}>会場</Label>
          <select 
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              (!place && showError) && "border-destructive"
            )}
            value={place}
            onChange={(e) => {
              setPlace(e.target.value);
              setRaceNo(0);
            }}
            disabled={!date}
          >
            <option value="" disabled>選択してください</option>
            {availablePlaces.map(code => (
              <option key={code} value={code}>{PLACE_CODE_TO_NAME[code] || code}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col space-y-2">
          <Label className={cn((!raceNo && showError) && "text-destructive")}>レース番号</Label>
          <select 
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              (!raceNo && showError) && "border-destructive"
            )}
            value={raceNo || ''}
            onChange={(e) => setRaceNo(Number(e.target.value))}
            disabled={!place}
          >
            <option value="" disabled>選択してください</option>
            {availableRaces.map(n => (
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
          <Label className={cn((!amount && showError) && "text-destructive")}>1点あたり</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-muted-foreground">¥</span>
            <Input
              type="number"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              className={cn("pl-8", (!amount && showError) && "border-destructive")}
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
        
        <div className="flex gap-2 w-full md:w-auto">
          {onDelete && (
            <Button
              variant="destructive"
              onClick={onDelete}
              className="w-full md:w-auto"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              削除
            </Button>
          )}
          <Button 
            onClick={handleAdd} 
            className="w-full md:w-auto min-w-[200px] bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4 mr-2" />
            {submitLabel || (initialState ? '買い目更新' : '買い目追加')}
          </Button>
        </div>
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
