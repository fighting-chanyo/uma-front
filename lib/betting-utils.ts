
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
  multi: boolean
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
    return num / den;
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

  // BOX
  if (method === 'BOX') {
    const count = selections[0]?.length || 0;
    switch (type) {
      case 'BRACKET_QUINELLA': // 枠連
      case 'QUINELLA': // 馬連
      case 'QUINELLA_PLACE': // ワイド
        return combinations(count, 2);
      case 'EXACTA': // 馬単
        return permutations(count, 2);
      case 'TRIO': // 3連複
        return combinations(count, 3);
      case 'TRIFECTA': // 3連単
        return permutations(count, 3);
      default:
        return 0;
    }
  }

  // FORMATION
  if (method === 'FORMATION') {
    // Simplified formation calculation
    // This needs rigorous logic for each type to avoid duplicates and invalid combos
    // For now, a very basic approximation or specific logic for common types
    
    const s1 = selections[0] || [];
    const s2 = selections[1] || [];
    const s3 = selections[2] || [];

    if (type === 'QUINELLA' || type === 'QUINELLA_PLACE' || type === 'BRACKET_QUINELLA') {
      let count = 0;
      for (const h1 of s1) {
        for (const h2 of s2) {
          if (h1 !== h2) count++;
        }
      }
      // Note: For Quinella/Wide, 1-2 and 2-1 are same. Formation usually implies 1st set - 2nd set.
      // If sets overlap, we must ensure unique pairs and order doesn't matter.
      // Actually JRA Formation for Quinella:
      // Select horses for 1st horse and 2nd horse.
      // Combinations are all pairs (a, b) where a in s1, b in s2, a != b.
      // And since order doesn't matter, (1, 2) is same as (2, 1).
      // Usually we iterate and count unique pairs.
      const pairs = new Set<string>();
      for (const h1 of s1) {
        for (const h2 of s2) {
          if (h1 !== h2) {
            const pair = [h1, h2].sort().join('-');
            pairs.add(pair);
          }
        }
      }
      return pairs.size;
    }

    if (type === 'EXACTA') {
      let count = 0;
      for (const h1 of s1) {
        for (const h2 of s2) {
          if (h1 !== h2) count++;
        }
      }
      return count;
    }

    if (type === 'TRIO') {
      const triples = new Set<string>();
      for (const h1 of s1) {
        for (const h2 of s2) {
          for (const h3 of s3) {
            if (h1 !== h2 && h1 !== h3 && h2 !== h3) {
              const triple = [h1, h2, h3].sort().join('-');
              triples.add(triple);
            }
          }
        }
      }
      return triples.size;
    }

    if (type === 'TRIFECTA') {
      let count = 0;
      for (const h1 of s1) {
        for (const h2 of s2) {
          for (const h3 of s3) {
            if (h1 !== h2 && h1 !== h3 && h2 !== h3) {
              count++;
            }
          }
        }
      }
      return count;
    }
  }

  // NAGASHI (Flow)
  if (method === 'NAGASHI') {
    const a = axis.length;
    const p = partners.length;
    
    if (type === 'QUINELLA' || type === 'QUINELLA_PLACE' || type === 'BRACKET_QUINELLA') {
      // 1 axis, N partners.
      // If axis has 1 horse, combinations = partners.length
      return p;
    }
    
    if (type === 'EXACTA') {
      // 1 axis, N partners.
      // Multi means Axis -> Partner OR Partner -> Axis
      return multi ? p * 2 : p;
    }

    if (type === 'TRIO') {
      // 1 axis: Axis - Partner - Partner (combinations of partners taken 2 at a time)
      // 2 axis: Axis1 - Axis2 - Partner (partners.length)
      if (a === 1) return combinations(p, 2);
      if (a === 2) return p;
    }

    if (type === 'TRIFECTA') {
      // 1 axis: 
      //   Multi: Axis is 1st, 2nd, or 3rd. Partners fill other 2 spots (permutations of partners 2)
      //   Normal: Axis is 1st. Partners are 2nd, 3rd (permutations of partners 2)
      // 2 axis:
      //   Multi: Axis1, Axis2 in any order with Partner.
      //   Normal: Axis1 1st, Axis2 2nd, Partner 3rd.
      
      if (a === 1) {
        const perms = permutations(p, 2);
        return multi ? perms * 3 : perms; // Multi: Axis can be 1st, 2nd, 3rd
      }
      if (a === 2) {
        return multi ? p * 6 : p; // Multi: 3! = 6 arrangements of (A1, A2, P) ? No.
        // With 2 axis (fixed), and 1 partner.
        // If Multi, A1, A2, P can be in any order. 3! = 6 combinations per partner.
        // If Normal, A1 -> A2 -> P. 1 combination per partner.
      }
    }
  }

  // NORMAL (Individual selection)
  // Usually implies selecting specific combinations directly, but in this UI it might mean "Regular" mode
  // where you select 1st, 2nd, 3rd candidates and it generates all valid combinations (like Formation but simpler?)
  // Or maybe it just means "Single Bet" repeated?
  // In JRA Marksheet, "Normal" usually means you mark one specific combination per row.
  // But here we use arrays. If we treat "Normal" as "Formation" logic (standard expansion), we can use that.
  // Or if "Normal" means "Box" for single row?
  // Let's assume "Normal" behaves like Formation for now as it's the most generic "select candidates for each position" logic.
  return 0;
}
