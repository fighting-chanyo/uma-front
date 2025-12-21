
import { BetType, BetMethod } from "@/types/betting";

export const PLACE_NAME_TO_CODE: Record<string, string> = {
  '札幌': '01',
  '函館': '02',
  '福島': '03',
  '新潟': '04',
  '東京': '05',
  '中山': '06',
  '中京': '07',
  '京都': '08',
  '阪神': '09',
  '小倉': '10',
};

export const PLACE_CODE_TO_NAME: Record<string, string> = Object.entries(PLACE_NAME_TO_CODE).reduce((acc, [name, code]) => {
  acc[code] = name;
  return acc;
}, {} as Record<string, string>);

function normalizeBetData(
  selections: string[][],
  axis: string[],
  partners: string[],
  type: BetType
): { selections: string[][]; axis: string[]; partners: string[] } {
  // Helper to unique and sort
  const uniqueSort = (arr: string[]) => Array.from(new Set(arr)).filter(Boolean).sort();

  const newSelections = selections.map(row => uniqueSort(row));
  const newAxis = uniqueSort(axis);
  let newPartners = uniqueSort(partners);

  // Remove axis from partners (Nagashi rule: partner cannot be axis)
  // Exception: BRACKET_QUINELLA allows same bracket in axis and partner
  if (newAxis.length > 0 && type !== 'BRACKET_QUINELLA') {
    newPartners = newPartners.filter(p => !newAxis.includes(p));
  }

  return {
    selections: newSelections,
    axis: newAxis,
    partners: newPartners
  };
}

export function calculateCombinations(
  type: BetType,
  method: BetMethod,
  selections: string[][],
  axis: string[],
  partners: string[],
  multi: boolean,
  positions: number[] = []
): number {
  // Basic validation
  if (!type || !method) return 0;

  // Normalize inputs
  const normalized = normalizeBetData(selections, axis, partners, type);
  const normSelections = normalized.selections;
  const normAxis = normalized.axis;
  const normPartners = normalized.partners;

  // Helper for nCr
  const combinations = (n: number, r: number): number => {
    if (n < r) return 0;
    if (n === r) return 1;
    if (r === 1) return n;
    let num = 1;
    let den = 1;
    for (let i = 0; i < r; i++) {
      num *= (n - i);
      den *= (i + 1);
    }
    return Math.round(num / den);
  };

  // Helper for nPr
  const permutations = (n: number, r: number): number => {
    if (n < r) return 0;
    let res = 1;
    for (let i = 0; i < r; i++) res *= (n - i);
    return res;
  };

  // WIN / PLACE (Single selection usually, but if multiple selected in Normal, it's multiple bets)
  if (type === 'WIN' || type === 'PLACE') {
    // In MarkSheetGrid, selections[0] holds the horses
    return normSelections[0]?.length || 0;
  }

  // NORMAL
  if (method === 'NORMAL') {
    if (['EXACTA', 'QUINELLA', 'QUINELLA_PLACE', 'BRACKET_QUINELLA', 'TRIO', 'TRIFECTA'].includes(type)) {
      const s1 = normSelections[0] || [];
      const s2 = normSelections[1] || [];
      const s3 = normSelections[2] || [];
      
      // Basic check: need at least 1 selection in required rows
      if (s1.length === 0 || s2.length === 0) return 0;
      if ((type === 'TRIO' || type === 'TRIFECTA') && s3.length === 0) return 0;
      
      const h1 = s1[0];
      const h2 = s2[0];
      const h3 = s3[0];

      if (type === 'BRACKET_QUINELLA') {
        return 1; // Bracket Quinella allows same bracket
      } else if (type === 'TRIO' || type === 'TRIFECTA') {
        // Must be distinct
        if (h1 === h2 || h1 === h3 || h2 === h3) return 0;
        return 1;
      } else {
        // EXACTA, QUINELLA, QUINELLA_PLACE
        return h1 !== h2 ? 1 : 0;
      }
    }
  }

  // BOX
  if (method === 'BOX') {
    const count = normSelections[0]?.length || 0;
    switch (type) {
      case 'BRACKET_QUINELLA': 
      case 'QUINELLA': 
      case 'QUINELLA_PLACE': 
        return combinations(count, 2);
      case 'EXACTA': 
        return permutations(count, 2);
      case 'TRIO': 
        return combinations(count, 3);
      case 'TRIFECTA': 
        return permutations(count, 3);
      default:
        return 0;
    }
  }

  // FORMATION
  if (method === 'FORMATION') {
    const s1 = normSelections[0] || [];
    const s2 = normSelections[1] || [];
    const s3 = normSelections[2] || [];

    if (type === 'EXACTA') {
      let count = 0;
      for (const h1 of s1) {
        for (const h2 of s2) {
          if (h1 !== h2) count++;
        }
      }
      return count;
    }

    if (type === 'QUINELLA' || type === 'QUINELLA_PLACE') {
      const pairs = new Set<string>();
      for (const h1 of s1) {
        for (const h2 of s2) {
          if (h1 === h2) continue;
          const key = [h1, h2].sort().join('-');
          pairs.add(key);
        }
      }
      return pairs.size;
    }

    if (type === 'BRACKET_QUINELLA') {
      const pairs = new Set<string>();
      for (const h1 of s1) {
        for (const h2 of s2) {
          const key = [h1, h2].sort().join('-');
          pairs.add(key);
        }
      }
      return pairs.size;
    }

    if (type === 'TRIFECTA') {
      let count = 0;
      for (const h1 of s1) {
        for (const h2 of s2) {
          if (h1 === h2) continue;
          for (const h3 of s3) {
            if (h1 !== h3 && h2 !== h3) count++;
          }
        }
      }
      return count;
    }

    if (type === 'TRIO') {
      const trios = new Set<string>();
      for (const h1 of s1) {
        for (const h2 of s2) {
          if (h1 === h2) continue;
          for (const h3 of s3) {
            if (h1 === h3 || h2 === h3) continue;
            const key = [h1, h2, h3].sort().join('-');
            trios.add(key);
          }
        }
      }
      return trios.size;
    }
    
    return 0;
  }

  // NAGASHI
  if (method === 'NAGASHI') {
    // TRIO
    if (type === 'TRIO') {
      const a = normAxis;
      const p = normPartners;
      
      // Basic validation: exclude axis from partners for calculation
      // Already done in normalizeBetData, but keeping logic clean
      const validPartners = p; // p is already filtered

      if (a.length === 1) {
        // 1-Axis Nagashi: Choose 2 from partners
        return combinations(validPartners.length, 2);
      } else if (a.length === 2) {
        // 2-Axis Nagashi: Choose 1 from partners
        return combinations(validPartners.length, 1);
      }
      
      return 0;
    }

    // EXACTA
    if (type === 'EXACTA') {
      const a = normAxis;
      const p = normPartners;
      if (a.length === 0 || p.length === 0) return 0;

      if (multi) {
        // Multi: Axis can be 1st or 2nd
        let count = 0;
        for (const ax of a) {
          for (const pt of p) {
            if (ax !== pt) count += 2;
          }
        }
        return count;
      }

      const is1stAxis = positions.includes(1) || positions.length === 0;
      const is2ndAxis = positions.includes(2);
      
      if (!is1stAxis && !is2ndAxis) return 0;
      
      let count = 0;
      for (const ax of a) {
        for (const pt of p) {
          if (ax !== pt) count++;
        }
      }
      return count;
    }

    // QUINELLA / WIDE / BRACKET
    if (type === 'QUINELLA' || type === 'QUINELLA_PLACE' || type === 'BRACKET_QUINELLA') {
      const a = normAxis;
      const p = normPartners;
      if (a.length === 0 || p.length === 0) return 0;

      const pairs = new Set<string>();
      for (const ax of a) {
        for (const pt of p) {
          if (type !== 'BRACKET_QUINELLA' && ax === pt) continue;
          const key = [ax, pt].sort().join('-');
          pairs.add(key);
        }
      }
      return pairs.size;
    }

    // TRIFECTA
    if (type === 'TRIFECTA') {
      const numAxes = positions.length;
      
      // 1 Axis Case (e.g. 1st fixed)
      if (numAxes === 1 || numAxes === 0) { // Default to 1 axis if empty
        const a = normAxis;
        const p = normPartners;
        if (a.length !== 1 || p.length === 0) return 0;
        
        const ax = a[0];
        const validPartners = p.filter(pt => pt !== ax);
        const n = validPartners.length;

        if (multi) {
          // 1 Axis Multi: nC2 * 6
          return combinations(n, 2) * 6;
        } else {
          // 1 Axis Normal: nP2 = n * (n-1)
          return permutations(n, 2);
        }
      }

      // 2 Axes Case (e.g. 1st & 2nd fixed)
      if (numAxes === 2) {
        // For 2 axes, we use axis[0] and axis[1]
        // Note: normAxis is sorted, but positions might imply order.
        // However, for calculation count, order of axis in array doesn't matter if they are distinct.
        // But wait, if positions=[1,2], axis=["06", "05"] (sorted "05", "06").
        // Does it matter which is 1st?
        // If we fix 1st=5, 2nd=6. Or 1st=6, 2nd=5.
        // The input `axis` comes from UI. If UI passes `axis` corresponding to `positions`, we should respect that?
        // But `normalizeBetData` sorts `axis`.
        // If `positions` are used to map specific axis horses to specific positions, then sorting `axis` breaks that mapping if the original order mattered.
        // In MarkSheetGrid, `axis` is just a list of selected horses. `positions` tells WHICH positions are fixed.
        // But for 2-axis fixed (1st and 2nd), we need to know WHICH horse is 1st and WHICH is 2nd.
        // The current implementation of `calculateCombinations` for 2-axis TRIFECTA used `axis[0]` and `axis[1]`.
        // If we sort `axis`, we lose the user's intent of which horse is 1st vs 2nd?
        // Let's check MarkSheetGrid again.
        // In MarkSheetGrid for Trifecta 2-axis, we use `toggleAxisAtIndex(0, n)` and `toggleAxisAtIndex(1, n)`.
        // This updates `axis` array at specific indices.
        // So `axis[0]` is the horse for `positions[0]`, `axis[1]` is for `positions[1]`.
        // If we sort `axis` in `normalizeBetData`, we BREAK this logic.
        
        // Correction: We should NOT sort `axis` if order matters.
        // When does order matter?
        // - Trifecta 2-axis fixed (Nagashi).
        // - Normal/Formation/Box: order doesn't matter.
        // - Other Nagashi: usually 1 axis, or multi (order doesn't matter).
        
        // So `normalizeBetData` should probably NOT sort `axis` if it's Trifecta Nagashi with 2 axes?
        // Or we should handle it differently.
        
        // Actually, `normalizeBetData` is intended to clean up data.
        // If we have `axis=["06", "05"]` (User selected 6 for 1st, 5 for 2nd), and we sort it to `["05", "06"]`,
        // then `a1="05"`, `a2="06"`.
        // If the bet is "1st: 6, 2nd: 5, 3rd: ...", then we calculated for "1st: 5, 2nd: 6, 3rd: ...".
        // The number of combinations is the SAME.
        // 1 point is 1 point.
        // So for calculating the NUMBER of combinations (cost), sorting does not affect the result.
        // It only affects the generated ticket content if we were generating the actual combinations list.
        // But this function only returns `number`.
        
        // So, sorting is safe for `calculateCombinations`.
        
        const a1 = normAxis[0];
        const a2 = normAxis[1];
        const p = normPartners;

        if (!a1 || !a2 || p.length === 0) return 0;

        if (a1 === a2) return 0; // Axes must be different

        const validPartners = p.filter(pt => pt !== a1 && pt !== a2);
        const n = validPartners.length;

        if (multi) {
          // 2 Axes Multi: nC1 * 6
          return combinations(n, 1) * 6;
        } else {
          // 2 Axes Normal: n
          return n;
        }
      }
    }
  }

  return 0;
}
