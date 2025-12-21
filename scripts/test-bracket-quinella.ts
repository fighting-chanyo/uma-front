
import { calculateCombinations } from '../lib/betting-utils';
import { BetType, BetMethod } from '../types/betting';

const runTest = (
  name: string,
  type: BetType,
  method: BetMethod,
  selections: string[][],
  axis: string[],
  partners: string[],
  expected: number
) => {
  const result = calculateCombinations(type, method, selections, axis, partners, false, []);
  if (result === expected) {
    console.log(`[PASS] ${name}: Expected ${expected}, got ${result}`);
  } else {
    console.error(`[FAIL] ${name}: Expected ${expected}, got ${result}`);
  }
};

console.log('--- Testing Bracket Quinella (BRACKET_QUINELLA) ---');

// 1. Normal
// 1-2
runTest('Normal 1-2', 'BRACKET_QUINELLA', 'NORMAL', [['1'], ['2']], [], [], 1);
// 1-1 (Zorome)
runTest('Normal 1-1', 'BRACKET_QUINELLA', 'NORMAL', [['1'], ['1']], [], [], 1);

// 2. Box
// JRA Standard: Box does NOT include Zorome (same bracket pairs).
// For 2 selections (1, 2), it returns 1 (1-2).
runTest('Box 1,2 (JRA Standard)', 'BRACKET_QUINELLA', 'BOX', [['1', '2']], [], [], 1); 

// 3. Formation
// 1st: 1, 2. 2nd: 2, 3.
// Pairs: 1-2, 1-3, 2-2, 2-3. (4 points)
runTest('Formation 1,2 - 2,3', 'BRACKET_QUINELLA', 'FORMATION', [['1', '2'], ['2', '3']], [], [], 4);

// 4. Nagashi
// Axis: 1. Partners: 2, 3. -> 1-2, 1-3 (2 points)
runTest('Nagashi Axis:1, Partners:2,3', 'BRACKET_QUINELLA', 'NAGASHI', [], ['1'], ['2', '3'], 2);
// Axis: 1. Partners: 1, 2. -> 1-1, 1-2 (2 points)
runTest('Nagashi Axis:1, Partners:1,2', 'BRACKET_QUINELLA', 'NAGASHI', [], ['1'], ['1', '2'], 2);
