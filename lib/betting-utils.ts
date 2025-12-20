
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
    return selections[0]?.length || 0;
  }

  // NORMAL
  if (method === 'NORMAL') {
    if (['EXACTA', 'QUINELLA', 'QUINELLA_PLACE', 'BRACKET_QUINELLA'].includes(type)) {
      const s1 = selections[0] || [];
      const s2 = selections[1] || [];
      
      if (s1.length === 0 || s2.length === 0) return 0;
      
      const h1 = s1[0];
      const h2 = s2[0];

      if (type === 'BRACKET_QUINELLA') {
        return 1;
      } else {
        return h1 !== h2 ? 1 : 0;
      }
    }
  }

  // BOX
  if (method === 'BOX') {
    const count = selections[0]?.length || 0;
    switch (type) {
      case 'BRACKET_QUINELLA': 
        return (count * (count + 1)) / 2;
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
    const s1 = selections[0] || [];
    const s2 = selections[1] || [];
    const s3 = selections[2] || [];

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
    
    // Fallback for other types (TRIO, TRIFECTA) - simplified or existing logic
    // Assuming existing logic was placeholder, we leave it as 0 or implement if needed.
    // For now, focusing on requested types.
    return 0;
  }

  // NAGASHI
  if (method === 'NAGASHI') {
    const a = axis;
    const p = partners;
    
    if (a.length === 0 || p.length === 0) return 0;

    if (type === 'EXACTA') {
      // Multi: Axis can be 1st or 2nd (A->B and B->A)
      if (multi) {
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

    if (type === 'QUINELLA' || type === 'QUINELLA_PLACE') {
      const pairs = new Set<string>();
      for (const ax of a) {
        for (const pt of p) {
          if (ax === pt) continue;
          const key = [ax, pt].sort().join('-');
          pairs.add(key);
        }
      }
      return pairs.size;
    }

    if (type === 'BRACKET_QUINELLA') {
      const pairs = new Set<string>();
      for (const ax of a) {
        for (const pt of p) {
          const key = [ax, pt].sort().join('-');
          pairs.add(key);
        }
      }
      return pairs.size;
    }
  }

  return 0;
}
