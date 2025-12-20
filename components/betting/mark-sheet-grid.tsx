import React from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BetMethod, BetType } from "@/types/betting";

interface MarkSheetGridProps {
  type: BetType;
  method: BetMethod;
  selections: string[][];
  axis: string[];
  partners: string[];
  positions: number[];
  multi: boolean;
  onUpdate: (updates: {
    selections?: string[][];
    axis?: string[];
    partners?: string[];
    positions?: number[];
    multi?: boolean;
  }) => void;
}

const HORSE_NUMBERS = Array.from({ length: 18 }, (_, i) => i + 1);

// 式別ごとのフォーメーションの深さ（行数）定義
const FORMATION_DEPTH: Record<string, number> = {
  'WIN': 1,             // 単勝
  'PLACE': 1,           // 複勝
  'BRACKET_QUINELLA': 2,// 枠連
  'QUINELLA': 2,        // 馬連
  'QUINELLA_PLACE': 2,  // ワイド
  'EXACTA': 2,          // 馬単
  'TRIO': 3,            // 3連複
  'TRIFECTA': 3,        // 3連単
};

// ラベル定義
const ROW_LABELS: Record<string, string[]> = {
  'EXACTA': ['1頭目', '2頭目'],
  'QUINELLA': ['1頭目', '2頭目'],
  'QUINELLA_PLACE': ['1頭目', '2頭目'],
  'BRACKET_QUINELLA': ['1頭目', '2頭目'],
  'TRIFECTA': ['1着', '2着', '3着'],
  'TRIO': ['1頭目', '2頭目', '3頭目'],
};

export function MarkSheetGrid({
  type,
  method,
  selections,
  axis,
  partners,
  positions,
  multi,
  onUpdate,
}: MarkSheetGridProps) {
  
  const toStr = (n: number) => String(n).padStart(2, '0');

  const toggleSelection = (rowIndex: number, number: number) => {
    const strNum = toStr(number);
    const newSelections = [...selections];
    // Ensure row exists
    if (!newSelections[rowIndex]) newSelections[rowIndex] = [];
    
    const row = newSelections[rowIndex];
    
    // Special handling for NORMAL method with multi-row types (Exacta, Quinella, etc.)
    // User requirement: "1セットにつき、1つまでしかチェックできない"
    const isNormalMultiRow = method === 'NORMAL' && ['EXACTA', 'QUINELLA', 'QUINELLA_PLACE', 'BRACKET_QUINELLA'].includes(type);

    if (isNormalMultiRow) {
      if (row.includes(strNum)) {
        newSelections[rowIndex] = [];
      } else {
        newSelections[rowIndex] = [strNum];
      }
    } else {
      if (row.includes(strNum)) {
        newSelections[rowIndex] = row.filter(n => n !== strNum);
      } else {
        newSelections[rowIndex] = [...row, strNum].sort();
      }
    }
    onUpdate({ selections: newSelections });
  };

  const toggleAxis = (number: number) => {
    const strNum = toStr(number);
    let newAxis = [...axis];

    // NAGASHI: Only 1 axis horse allowed
    if (method === 'NAGASHI') {
      if (newAxis.includes(strNum)) {
        newAxis = [];
      } else {
        newAxis = [strNum];
      }
    } else {
      if (newAxis.includes(strNum)) {
        newAxis = newAxis.filter(n => n !== strNum);
      } else {
        newAxis = [...newAxis, strNum].sort();
      }
    }
    onUpdate({ axis: newAxis });
  };

  const togglePartner = (number: number) => {
    const strNum = toStr(number);
    let newPartners = [...partners];
    if (newPartners.includes(strNum)) {
      newPartners = newPartners.filter(n => n !== strNum);
    } else {
      newPartners = [...newPartners, strNum].sort();
    }
    onUpdate({ partners: newPartners });
  };

  const setPosition = (pos: number) => {
    onUpdate({ positions: [pos] });
  };

  const toggleMulti = () => {
    onUpdate({ multi: !multi });
  };

  const NumberGrid = ({ 
    selected, 
    onToggle, 
    label 
  }: { 
    selected: string[], 
    onToggle: (n: number) => void, 
    label?: string 
  }) => (
    <div className="space-y-1">
      {label && <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</Label>}
      <div className="grid grid-cols-9 gap-1 w-fit">
        {HORSE_NUMBERS.map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onToggle(num)}
            className={cn(
              "h-7 w-7 rounded-sm flex items-center justify-center text-xs font-bold transition-all border",
              selected.includes(toStr(num))
                ? "bg-red-600 text-white border-red-700 shadow-inner"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
            )}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  );

  if (method === 'NAGASHI') {
    const isExacta = type === 'EXACTA';
    const isTrio = type === 'TRIO';
    const isTrifecta = type === 'TRIFECTA';
    
    // Multi is needed for Exacta, Trio, Trifecta. Not for Quinella, Wide, Bracket.
    const showMulti = isExacta || isTrio || isTrifecta;

    // Label for Axis
    let axisLabel = "軸馬";
    if (isExacta) {
      axisLabel = positions.includes(2) ? "2着軸" : "1着軸";
    }

    return (
      <div className="space-y-6">
        {/* Axis Row */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            {/* Position Radio (Only for Exacta) */}
            {isExacta ? (
              <div className="flex items-center gap-3">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">軸馬選択</Label>
                <div className="flex items-center gap-2 bg-muted/30 px-2 py-0.5 rounded border">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="axis-position"
                      checked={positions.includes(1) || positions.length === 0} // Default to 1st if empty
                      onChange={() => setPosition(1)}
                      className="w-3 h-3 accent-primary"
                    />
                    <span className="text-xs">1着軸</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="axis-position"
                      checked={positions.includes(2)}
                      onChange={() => setPosition(2)}
                      className="w-3 h-3 accent-primary"
                    />
                    <span className="text-xs">2着軸</span>
                  </label>
                </div>
              </div>
            ) : (
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{axisLabel}</Label>
            )}

            {/* Multi Checkbox */}
            {showMulti && (
              <label className="flex items-center gap-1.5 cursor-pointer bg-muted/30 px-2 py-0.5 rounded border hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={multi}
                  onChange={toggleMulti}
                  className="w-3 h-3 rounded border-gray-300 accent-primary"
                />
                <span className="text-xs font-bold">マルチ</span>
              </label>
            )}
          </div>
          
          <NumberGrid selected={axis} onToggle={toggleAxis} />
        </div>

        {/* Partners Row */}
        <div className="space-y-2">
          <NumberGrid label="相手" selected={partners} onToggle={togglePartner} />
        </div>
      </div>
    );
  }

  // FORMATION or NORMAL (for multi-row types)
  if (method === 'FORMATION' || (method === 'NORMAL' && ['EXACTA', 'QUINELLA', 'QUINELLA_PLACE', 'BRACKET_QUINELLA'].includes(type))) {
    const depth = FORMATION_DEPTH[type] || 2;
    const labels = ROW_LABELS[type] || ['1頭目', '2頭目', '3頭目'];

    return (
      <div className="space-y-6">
        {Array.from({ length: depth }).map((_, idx) => (
          <div key={idx} className="space-y-1">
            <NumberGrid 
              label={labels[idx] || `${idx + 1}頭目`} 
              selected={selections[idx] || []} 
              onToggle={(n) => toggleSelection(idx, n)} 
            />
          </div>
        ))}
      </div>
    );
  }

  // NORMAL (WIN/PLACE) or BOX
  let label = "選抜馬";
  if (method === 'BOX') {
    label = "馬番";
  } else if (method === 'NORMAL' && (type === 'WIN' || type === 'PLACE')) {
    label = "馬番";
  }

  return (
    <div className="space-y-4">
      <NumberGrid 
        label={label}
        selected={selections[0] || []} 
        onToggle={(n) => toggleSelection(0, n)} 
      />
    </div>
  );
}
