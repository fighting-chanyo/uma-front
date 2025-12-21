import React from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BetMethod, BetType } from "@/types/betting";

export interface MarkSheetGridProps {
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
  'BRACKET_QUINELLA': ['1枠目', '2枠目'],
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
    const isNormalMultiRow = method === 'NORMAL' && ['EXACTA', 'QUINELLA', 'QUINELLA_PLACE', 'BRACKET_QUINELLA', 'TRIO', 'TRIFECTA'].includes(type);
    
    // 3連単ながし（2頭軸）の場合も同様の制限を適用
    // 軸馬は1頭しか選べず、かつ軸馬同士で被ってはいけない
    const isTrifectaNagashi2Axis = method === 'NAGASHI' && type === 'TRIFECTA' && positions.length === 2;

    if (isNormalMultiRow || isTrifectaNagashi2Axis) {
      if (row.includes(strNum)) {
        newSelections[rowIndex] = [];
      } else {
        // Check if already selected in other rows
        const isSelectedInOtherRow = newSelections.some((r, i) => i !== rowIndex && r && r.includes(strNum));
        
        if (isSelectedInOtherRow && type !== 'BRACKET_QUINELLA') {
          return;
        }
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

    // NAGASHI: Only 1 axis horse allowed per axis set
    // Exception: TRIO allows up to 2 axis horses
    if (method === 'NAGASHI') {
      const maxAxis = type === 'TRIO' ? 2 : 1;

      if (newAxis.includes(strNum)) {
        newAxis = newAxis.filter(n => n !== strNum);
      } else {
        if (newAxis.length < maxAxis) {
          newAxis = [...newAxis, strNum].sort();
        } else {
          // If max reached, replace the single one if max is 1, otherwise do nothing (or user must deselect)
          if (maxAxis === 1) {
            newAxis = [strNum];
          }
        }
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

  const toggleAxisAtIndex = (index: number, number: number) => {
    const strNum = toStr(number);
    const newAxis = [...axis];
    
    // Ensure array is long enough
    while (newAxis.length <= index) {
      newAxis.push("");
    }

    if (newAxis[index] === strNum) {
      newAxis[index] = "";
    } else {
      // Check if used in other axis position
      const isUsedElsewhere = newAxis.some((val, i) => i !== index && val === strNum);
      if (isUsedElsewhere) return;
      
      newAxis[index] = strNum;
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

  const setPosition = (pos: number[]) => {
    // Reset selections/axis when switching position modes to avoid confusion
    onUpdate({ positions: pos, axis: [], selections: [[]], partners: [] });
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
  }) => {
    const maxNumber = type === 'BRACKET_QUINELLA' ? 8 : 18;
    const displayNumbers = HORSE_NUMBERS.filter(n => n <= maxNumber);

    return (
      <div className="space-y-1">
        {label && <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</Label>}
        <div className="grid grid-cols-9 gap-1 w-fit">
          {displayNumbers.map((num) => (
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
  };

  if (method === 'NAGASHI') {
    const isExacta = type === 'EXACTA';
    const isTrio = type === 'TRIO';
    const isTrifecta = type === 'TRIFECTA';
    
    const showMulti = isExacta || isTrifecta;

    // Trifecta Nagashi Logic
    if (isTrifecta) {
      const currentPos = positions.length > 0 ? positions : [1];
      const is2Axis = currentPos.length === 2;

      const isPosSelected = (p: number[]) => {
        if (p.length !== currentPos.length) return false;
        return p.every((val, index) => val === currentPos[index]);
      };

      return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">軸馬選択</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "1着軸", val: [1] },
                { label: "2着軸", val: [2] },
                { label: "3着軸", val: [3] },
                { label: "1,2着軸", val: [1, 2] },
                { label: "1,3着軸", val: [1, 3] },
                { label: "2,3着軸", val: [2, 3] },
              ].map((opt) => (
                <label key={opt.label} className="flex items-center gap-1 cursor-pointer bg-muted/30 px-2 py-1 rounded border hover:bg-muted/50">
                  <input
                    type="radio"
                    name="trifecta-axis-pos"
                    checked={isPosSelected(opt.val)}
                    onChange={() => setPosition(opt.val)}
                    className="w-3 h-3 accent-primary"
                  />
                  <span className="text-xs">{opt.label}</span>
                </label>
              ))}
            </div>
             <div className="mt-2">
              <label className="flex items-center gap-1.5 cursor-pointer bg-muted/30 px-2 py-0.5 rounded border hover:bg-muted/50 transition-colors w-fit">
                <input
                  type="checkbox"
                  checked={multi}
                  onChange={toggleMulti}
                  className="w-3 h-3 rounded border-gray-300 accent-primary"
                />
                <span className="text-xs font-bold">マルチ</span>
              </label>
            </div>
          </div>

          {is2Axis ? (
            <>
              <NumberGrid 
                label={`${currentPos[0]}着軸`} 
                selected={axis[0] ? [axis[0]] : []} 
                onToggle={(n) => toggleAxisAtIndex(0, n)} 
              />
              <NumberGrid 
                label={`${currentPos[1]}着軸`} 
                selected={axis[1] ? [axis[1]] : []} 
                onToggle={(n) => toggleAxisAtIndex(1, n)} 
              />
            </>
          ) : (
            <NumberGrid 
              label={`${currentPos[0]}着軸`} 
              selected={axis} 
              onToggle={toggleAxis} 
            />
          )}

          <NumberGrid label="相手" selected={partners} onToggle={togglePartner} />
        </div>
      );
    }

    let axisLabel = "軸馬";
    if (type === 'BRACKET_QUINELLA') {
      axisLabel = "軸";
    } else if (isExacta) {
      axisLabel = positions.includes(2) ? "2着軸" : "1着軸";
    }

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            {isExacta ? (
              <div className="flex items-center gap-3">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">軸馬選択</Label>
                <div className="flex items-center gap-2 bg-muted/30 px-2 py-0.5 rounded border">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="axis-position"
                      checked={positions.includes(1) || positions.length === 0}
                      onChange={() => setPosition([1])}
                      className="w-3 h-3 accent-primary"
                    />
                    <span className="text-xs">1着軸</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="axis-position"
                      checked={positions.includes(2)}
                      onChange={() => setPosition([2])}
                      className="w-3 h-3 accent-primary"
                    />
                    <span className="text-xs">2着軸</span>
                  </label>
                </div>
              </div>
            ) : (
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{axisLabel}</Label>
            )}

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
          <NumberGrid label="相手" selected={partners} onToggle={togglePartner} />
        </div>
      </div>
    );
  }

  // Default rendering for NORMAL, BOX, FORMATION
  let depth = FORMATION_DEPTH[type] || 1;
  const labels = ROW_LABELS[type] || [];

  if (method === 'BOX') {
    depth = 1;
  }
  
  // For NORMAL method, we only show 1 row unless it's a multi-row type handled specially
  const rows = Array.from({ length: depth }, (_, i) => i);

  return (
    <div className="space-y-4">
      {rows.map((rowIndex) => (
        <NumberGrid
          key={rowIndex}
          label={method === 'BOX' ? (type === 'BRACKET_QUINELLA' ? '枠番' : '馬番') : (method === 'FORMATION' || method === 'NORMAL' ? labels[rowIndex] : undefined)}
          selected={selections[rowIndex] || []}
          onToggle={(n) => toggleSelection(rowIndex, n)}
        />
      ))}
    </div>
  );
}
