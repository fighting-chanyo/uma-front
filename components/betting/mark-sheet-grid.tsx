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
  'EXACTA': ['1着', '2着'],
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
    if (row.includes(strNum)) {
      newSelections[rowIndex] = row.filter(n => n !== strNum);
    } else {
      newSelections[rowIndex] = [...row, strNum].sort();
    }
    onUpdate({ selections: newSelections });
  };

  const toggleAxis = (number: number) => {
    const strNum = toStr(number);
    let newAxis = [...axis];
    if (newAxis.includes(strNum)) {
      newAxis = newAxis.filter(n => n !== strNum);
    } else {
      newAxis = [...newAxis, strNum].sort();
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
    return (
      <div className="space-y-6">
        {/* Axis Row */}
        <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Label className="text-base font-bold">軸馬選択</Label>
            
            <div className="flex items-center gap-4">
              {/* Position Radio (Only if not Multi) */}
              <div className={cn("flex items-center gap-2", multi && "opacity-50 pointer-events-none")}>
                {[1, 2, 3].map((pos) => (
                  <label key={pos} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="axis-position"
                      checked={positions.includes(pos)}
                      onChange={() => setPosition(pos)}
                      className="w-4 h-4 accent-primary"
                    />
                    <span className="text-sm">{pos}着</span>
                  </label>
                ))}
              </div>

              {/* Multi Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer border-l pl-4">
                <input
                  type="checkbox"
                  checked={multi}
                  onChange={toggleMulti}
                  className="w-4 h-4 rounded border-gray-300 accent-primary"
                />
                <span className="text-sm font-bold">マルチ</span>
              </label>
            </div>
          </div>
          
          <NumberGrid selected={axis} onToggle={toggleAxis} />
        </div>

        {/* Partners Row */}
        <div className="space-y-3 p-4 border rounded-lg">
          <Label className="text-base font-bold">相手選択</Label>
          <NumberGrid selected={partners} onToggle={togglePartner} />
        </div>
      </div>
    );
  }

  if (method === 'FORMATION') {
    const depth = FORMATION_DEPTH[type] || 3;
    const labels = ROW_LABELS[type] || ['1枚目', '2枚目', '3枚目'];

    return (
      <div className="space-y-6">
        {Array.from({ length: depth }).map((_, idx) => (
          <div key={idx} className="space-y-1">
            <NumberGrid 
              label={labels[idx] || `${idx + 1}枚目`} 
              selected={selections[idx] || []} 
              onToggle={(n) => toggleSelection(idx, n)} 
            />
          </div>
        ))}
      </div>
    );
  }

  // NORMAL or BOX
  return (
    <div className="space-y-4">
      <NumberGrid 
        label={method === 'BOX' ? "ボックス選択馬" : "選抜馬"}
        selected={selections[0] || []} 
        onToggle={(n) => toggleSelection(0, n)} 
      />
    </div>
  );
}
