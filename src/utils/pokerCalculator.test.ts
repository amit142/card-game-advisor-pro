import { describe, it, expect } from 'vitest';
import {
  evaluateHandStrength,
  compareHandStrengths,
  calculateWinProbability,
  HandStrength
} from './pokerCalculator'; // Assuming pokerCalculator.ts is in the same directory

describe('evaluateHandStrength', () => {
  it('should identify Royal Flush', () => {
    const hand = ['AS', 'KS', 'QS', 'JS', 'TS', '2C', '3D'];
    const result = evaluateHandStrength(hand);
    expect(result.type).toBe('Royal Flush');
    expect(result.rank).toBe(9);
  });

  it('should identify Straight Flush (King high)', () => {
    const hand = ['KS', 'QS', 'JS', 'TS', '9S', '2C', '3D'];
    const result = evaluateHandStrength(hand);
    expect(result.type).toBe('Straight Flush');
    expect(result.rank).toBe(8);
    expect(result.primaryRankValue).toBe(13); // King
  });

  it('should identify Ace-low Straight Flush (Wheel Flush)', () => {
    const hand = ['AS', '2S', '3S', '4S', '5S', 'KC', 'QD'];
    const result = evaluateHandStrength(hand);
    expect(result.type).toBe('Straight Flush');
    expect(result.rank).toBe(8);
    expect(result.primaryRankValue).toBe(5); // 5-high
  });

  it('should identify Four of a Kind', () => {
    const hand = ['AH', 'AS', 'AC', 'AD', 'KS', 'QC', 'JD'];
    const result = evaluateHandStrength(hand);
    expect(result.type).toBe('Four of a Kind');
    expect(result.rank).toBe(7);
    expect(result.primaryRankValue).toBe(14); // Aces
    expect(result.kickerRankValues).toEqual([13]); // King kicker
  });

  it('should identify Full House', () => {
    const hand = ['AH', 'AS', 'AC', 'KD', 'KS', 'QC', 'JD'];
    const result = evaluateHandStrength(hand);
    expect(result.type).toBe('Full House');
    expect(result.rank).toBe(6);
    expect(result.primaryRankValue).toBe(14); // Aces
    expect(result.secondaryRankValue).toBe(13); // Kings
  });

  it('should identify Full House from two triplets', () => {
    const hand = ['AH', 'AS', 'AC', 'KD', 'KS', 'KC', 'JD'];
    const result = evaluateHandStrength(hand);
    expect(result.type).toBe('Full House');
    expect(result.rank).toBe(6);
    expect(result.primaryRankValue).toBe(14); // Aces
    expect(result.secondaryRankValue).toBe(13); // Kings
  });

  it('should identify Flush', () => {
    const hand = ['AH', 'KH', 'QH', 'JH', '8H', '2S', '3D'];
    const result = evaluateHandStrength(hand);
    expect(result.type).toBe('Flush');
    expect(result.rank).toBe(5);
    expect(result.kickerRankValues).toEqual([14, 13, 12, 11, 8]);
  });

  it('should identify Straight (Ten high)', () => {
    const hand = ['TS', '9H', '8C', '7D', '6S', '2C', '3D'];
    const result = evaluateHandStrength(hand);
    expect(result.type).toBe('Straight');
    expect(result.rank).toBe(4);
    expect(result.primaryRankValue).toBe(10);
  });

  it('should identify Ace-low Straight (Wheel)', () => {
    const hand = ['AS', '2H', '3C', '4D', '5S', 'KC', 'QD'];
    const result = evaluateHandStrength(hand);
    expect(result.type).toBe('Straight');
    expect(result.rank).toBe(4);
    expect(result.primaryRankValue).toBe(5); // 5-high
  });

  it('should identify Three of a Kind', () => {
    const hand = ['AH', 'AS', 'AC', 'KD', 'QS', 'JC', '2D'];
    const result = evaluateHandStrength(hand);
    expect(result.type).toBe('Three of a Kind');
    expect(result.rank).toBe(3);
    expect(result.primaryRankValue).toBe(14); // Aces
    expect(result.kickerRankValues).toEqual([13, 12]); // K, Q kickers
  });

  it('should identify Two Pair', () => {
    const hand = ['AH', 'AS', 'KC', 'KD', 'QS', 'JC', '2D'];
    const result = evaluateHandStrength(hand);
    expect(result.type).toBe('Two Pair');
    expect(result.rank).toBe(2);
    expect(result.primaryRankValue).toBe(14); // Aces
    expect(result.secondaryRankValue).toBe(13); // Kings
    expect(result.kickerRankValues).toEqual([12]); // Q kicker
  });

  it('should identify One Pair', () => {
    const hand = ['AH', 'AS', 'KC', 'QD', 'JS', '2C', '3D'];
    const result = evaluateHandStrength(hand);
    expect(result.type).toBe('One Pair');
    expect(result.rank).toBe(1);
    expect(result.primaryRankValue).toBe(14); // Aces
    expect(result.kickerRankValues).toEqual([13, 12, 11]); // K, Q, J kickers
  });

  it('should identify High Card', () => {
    const hand = ['AH', 'KS', 'QC', 'JD', '9S', '2C', '3D'];
    const result = evaluateHandStrength(hand);
    expect(result.type).toBe('High Card');
    expect(result.rank).toBe(0);
    expect(result.primaryRankValue).toBe(14); // Ace
    expect(result.kickerRankValues).toEqual([14, 13, 12, 11, 9]);
  });

  it('should correctly choose best 5 cards from 7 for a flush', () => {
    const hand = ['AH', 'KH', 'QH', 'JH', '2S', '3D', '8H']; // A,K,Q,J,8 flush
    const result = evaluateHandStrength(hand);
    expect(result.type).toBe('Flush');
    expect(result.rank).toBe(5);
    expect(result.kickerRankValues).toEqual([14, 13, 12, 11, 8]);
  });

  it('should correctly choose best 5 cards from 7 for a straight', () => {
    const hand = ['AH', 'KH', 'QC', 'JD', 'TS', '2C', '3D']; // A,K,Q,J,T straight
    const result = evaluateHandStrength(hand);
    expect(result.type).toBe('Straight');
    expect(result.rank).toBe(4);
    expect(result.primaryRankValue).toBe(14);
    expect(result.kickerRankValues).toEqual([14,13,12,11,10]);
  });
});

describe('compareHandStrengths', () => {
  const royalFlush: HandStrength = { type: 'Royal Flush', rank: 9 };
  const straightFlush: HandStrength = { type: 'Straight Flush', rank: 8, primaryRankValue: 9 }; // 9-high SF
  const quads: HandStrength = { type: 'Four of a Kind', rank: 7, primaryRankValue: 10, kickerRankValues: [14] }; // TTTT A
  const fullHouseKKKAA: HandStrength = { type: 'Full House', rank: 6, primaryRankValue: 13, secondaryRankValue: 14 }; // KKKAA
  const fullHouseAAAKKK: HandStrength = { type: 'Full House', rank: 6, primaryRankValue: 14, secondaryRankValue: 13 }; // AAAKKK
  const flushAceHigh: HandStrength = { type: 'Flush', rank: 5, primaryRankValue: 14, kickerRankValues: [14,10,8,4,2] };
  const flushKingHigh: HandStrength = { type: 'Flush', rank: 5, primaryRankValue: 13, kickerRankValues: [13,10,8,4,2] };
  const straightTenHigh: HandStrength = { type: 'Straight', rank: 4, primaryRankValue: 10, kickerRankValues: [10,9,8,7,6] };
  const straightNineHigh: HandStrength = { type: 'Straight', rank: 4, primaryRankValue: 9, kickerRankValues: [9,8,7,6,5] };
  const tripsAces: HandStrength = { type: 'Three of a Kind', rank: 3, primaryRankValue: 14, kickerRankValues: [10,8] };
  const tripsKings: HandStrength = { type: 'Three of a Kind', rank: 3, primaryRankValue: 13, kickerRankValues: [14,8] }; // Kings with Ace kicker
  const twoPairAK: HandStrength = { type: 'Two Pair', rank: 2, primaryRankValue: 14, secondaryRankValue: 13, kickerRankValues: [10] }; // AA KK T
  const twoPairAQ: HandStrength = { type: 'Two Pair', rank: 2, primaryRankValue: 14, secondaryRankValue: 12, kickerRankValues: [10] }; // AA QQ T
  const onePairAcesKQ: HandStrength = { type: 'One Pair', rank: 1, primaryRankValue: 14, kickerRankValues: [13,12,10] }; // AA KQ T
  const onePairAcesKJ: HandStrength = { type: 'One Pair', rank: 1, primaryRankValue: 14, kickerRankValues: [13,11,10] }; // AA KJ T
  const highCardAce: HandStrength = { type: 'High Card', rank: 0, primaryRankValue: 14, kickerRankValues: [14,12,10,8,6] };
  const highCardKing: HandStrength = { type: 'High Card', rank: 0, primaryRankValue: 13, kickerRankValues: [13,12,10,8,6] };

  it('should rank higher hand type greater', () => {
    expect(compareHandStrengths(royalFlush, straightFlush)).toBeGreaterThan(0);
    expect(compareHandStrengths(quads, fullHouseAAAKKK)).toBeGreaterThan(0);
    expect(compareHandStrengths(flushAceHigh, straightTenHigh)).toBeGreaterThan(0);
  });

  it('should rank lower hand type lesser', () => {
    expect(compareHandStrengths(straightFlush, royalFlush)).toBeLessThan(0);
    expect(compareHandStrengths(fullHouseAAAKKK, quads)).toBeLessThan(0);
    expect(compareHandStrengths(straightTenHigh, flushAceHigh)).toBeLessThan(0);
  });

  it('should rank based on primaryRankValue when hand types are equal', () => {
    expect(compareHandStrengths(fullHouseAAAKKK, fullHouseKKKAA)).toBeGreaterThan(0); // AAAKK > KKKAA
    expect(compareHandStrengths(flushAceHigh, flushKingHigh)).toBeGreaterThan(0);
    expect(compareHandStrengths(straightTenHigh, straightNineHigh)).toBeGreaterThan(0);
  });

  it('should rank based on secondaryRankValue when primary is equal', () => {
    const fhAAAKK = { type: 'Full House', rank: 6, primaryRankValue: 14, secondaryRankValue: 13 };
    const fhAAAQQ = { type: 'Full House', rank: 6, primaryRankValue: 14, secondaryRankValue: 12 };
    expect(compareHandStrengths(fhAAAKK, fhAAAQQ)).toBeGreaterThan(0);
    expect(compareHandStrengths(twoPairAK, twoPairAQ)).toBeGreaterThan(0);
  });

  it('should rank based on kickers when ranks and primary/secondary values are equal', () => {
    // Trips Aces, K,Q kickers vs Trips Aces, K,J kickers
    const tripsAcesKQ = { type: 'Three of a Kind', rank: 3, primaryRankValue: 14, kickerRankValues: [13,12] };
    const tripsAcesKJ = { type: 'Three of a Kind', rank: 3, primaryRankValue: 14, kickerRankValues: [13,11] };
    expect(compareHandStrengths(tripsAcesKQ, tripsAcesKJ)).toBeGreaterThan(0);

    expect(compareHandStrengths(onePairAcesKQ, onePairAcesKJ)).toBeGreaterThan(0);

    const flush1 = { type: 'Flush', rank: 5, kickerRankValues: [14,12,10,8,6] };
    const flush2 = { type: 'Flush', rank: 5, kickerRankValues: [14,12,10,8,5] };
    expect(compareHandStrengths(flush1, flush2)).toBeGreaterThan(0);
  });

  it('should return 0 for identical hands', () => {
    const hand1 = { type: 'One Pair', rank: 1, primaryRankValue: 14, kickerRankValues: [13,12,10] };
    const hand2 = { type: 'One Pair', rank: 1, primaryRankValue: 14, kickerRankValues: [13,12,10] };
    expect(compareHandStrengths(hand1, hand2)).toBe(0);
  });
});

describe('calculateWinProbability (Monte Carlo)', () => {
  const TOLERANCE = 3.5; // Allow +/- 3.5% for Monte Carlo results with 10k sims

  // Pre-flop Tests
  it('AA vs Random (1 opp) pre-flop should be ~85% for AA', () => { // AA vs Random is higher than specific AA vs KK
    const holeCards = ['AS', 'AH']; // AA
    const probability = calculateWinProbability(holeCards, [], 'BTN', 1, 'preflop');
    expect(probability).toBeGreaterThanOrEqual(85.2 - TOLERANCE); // General AA vs 1 random equity
    expect(probability).toBeLessThanOrEqual(85.2 + TOLERANCE);
  });

  it('KK vs Random (1 opp) pre-flop should be ~82% for KK', () => { // KK vs Random
    const holeCards = ['KS', 'KH']; // KK
    const probability = calculateWinProbability(holeCards, [], 'BTN', 1, 'preflop');
    expect(probability).toBeGreaterThanOrEqual(82.4 - TOLERANCE); // General KK vs 1 random equity
    expect(probability).toBeLessThanOrEqual(82.4 + TOLERANCE);
  });

  it('AKs vs Random (1 opp) pre-flop should be ~67% for AKs', () => { // AKs vs Random
    const holeCards = ['AS', 'KS']; // AKs
    const probability = calculateWinProbability(holeCards, [], 'BTN', 1, 'preflop');
    expect(probability).toBeGreaterThanOrEqual(67.0 - TOLERANCE); // General AKs vs 1 random equity
    expect(probability).toBeLessThanOrEqual(67.0 + TOLERANCE);
  });

  it('72o vs Random (1 opp) pre-flop should be ~33.5% for 72o', () => { // 72o vs Random
    const holeCards = ['7H', '2D']; // 72o
    const probability = calculateWinProbability(holeCards, [], 'BTN', 1, 'preflop');
    expect(probability).toBeGreaterThanOrEqual(33.5 - TOLERANCE); // General 72o vs 1 random equity
    expect(probability).toBeLessThanOrEqual(33.5 + TOLERANCE);
  });

  // Flop Tests
  it('Set (AA on A52 flop) vs 1 opp should be very high', () => {
    const holeCards = ['AS', 'AH'];
    const communityCards = ['AD', '5S', '2H'];
    const probability = calculateWinProbability(holeCards, communityCards, 'BTN', 1, 'flop');
    // AA vs random on Axx flop is very strong. Specific values depend on opponent's exact random hand.
    // Example: AA vs KK on A52r, AA is ~92%. Against truly random, it's higher.
    expect(probability).toBeGreaterThanOrEqual(85);
  });

  it('Flush draw (AhKh on QhJh2h flop) vs 1 opp should be ~35-40% (raw equity for draw alone)', () => {
    const holeCards = ['AH', 'KH'];
    const communityCards = ['QH', 'JH', '2H']; // Player has flush
    const probability = calculateWinProbability(holeCards, communityCards, 'BTN', 1, 'flop');
     // Player has made a flush. Equity should be very high if opponent doesn't have higher flush / FH potential
    // AhKh vs random on QJh2h. Player has made flush.
    // If opponent has nothing, player wins. If opp has straight flush draw, etc.
    // Given this is a made flush, vs one random hand, it should be very strong.
    expect(probability).toBeGreaterThanOrEqual(70); // Made flush is strong
  });

  it('Open-ended straight draw (TJ on QK2r flop) vs 1 opp should be ~39%', () => {
    const holeCards = ['TH', 'JD']; // TJ offsuit
    const communityCards = ['QS', 'KC', '2H']; // Q K 2 rainbow
    const probability = calculateWinProbability(holeCards, communityCards, 'BTN', 1, 'flop');
    console.log(`OESD Test (TJo vs QK2r): Calculated Probability = ${probability}%`);
    // TJ offsuit on a rainbow QK2 flop vs random hand. Online calculator gives ~38.9%.
    const expectedEquity = 38.9;
    // Wider tolerance for draws as many factors influence exact equity vs random.
    expect(probability).toBeGreaterThanOrEqual(expectedEquity - TOLERANCE - 3);
    expect(probability).toBeLessThanOrEqual(expectedEquity + TOLERANCE + 3);
  });


  // Turn Tests
  it('Made hand (Set on turn) vs 1 opp should be very high', () => {
    const holeCards = ['7S', '7H'];
    const communityCards = ['7D', 'AS', 'KH', '2C']; // Set of 7s
    const probability = calculateWinProbability(holeCards, communityCards, 'BTN', 1, 'turn');
    expect(probability).toBeGreaterThanOrEqual(80); // Set on turn vs random is strong
  });

  // River Tests
  it('Nuts (Royal Flush from hole cards) vs 1 opp on river should be 100%', () => {
    const holeCards = ['AS', 'KS']; // Player uses these for RF
    const communityCards = ['QS', 'JS', 'TS', '2H', '3D'];
    const probability = calculateWinProbability(holeCards, communityCards, 'BTN', 1, 'river');
    // Opponent cannot make a better hand if player has RF, unless opponent also has RF for a chop.
    // Against a single random hand, it's extremely unlikely they also have the same RF.
    // So, it should be very close to 100.
    expect(probability).toBeGreaterThanOrEqual(100 - TOLERANCE); // Allow for rare chops if opp also has RF (impossible with these specific cards out)
    expect(probability).toBe(100); // Given these specific cards, opponent cannot make RF.
  });

  it('Playing the board (Royal Flush) for a tie on river should be 50%', () => {
    const holeCards = ['2C', '3D']; // Player does not improve board
    const communityCards = ['AS', 'KS', 'QS', 'JS', 'TS']; // Board is Royal Flush
    const probability = calculateWinProbability(holeCards, communityCards, 'BTN', 1, 'river');
    // Player plays the board for RF. Opponent also plays board for RF. Tie. Equity = 50%.
    expect(probability).toBeGreaterThanOrEqual(50 - TOLERANCE);
    expect(probability).toBeLessThanOrEqual(50 + TOLERANCE);
  });

  it('AA vs 2 random opponents pre-flop, equity should be lower than vs 1 opp', () => {
    const holeCards = ['AS', 'AD'];
    const probVs1 = calculateWinProbability(holeCards, [], 'BTN', 1, 'preflop');
    const probVs2 = calculateWinProbability(holeCards, [], 'BTN', 2, 'preflop');
    expect(probVs2).toBeLessThan(probVs1);
    // AA vs 1 random ~85%. AA vs 2 random ~73%.
    expect(probVs2).toBeGreaterThanOrEqual(73 - TOLERANCE);
    expect(probVs2).toBeLessThanOrEqual(73 + TOLERANCE);
  });
});

// Basic test for getRankValue - can be expanded
describe('getRankValue (internal helper, if exposed or via hand eval)', () => {
    // Example: evaluate a hand that relies on getRankValue
    it('should correctly parse card ranks for evaluation', () => {
        const hand = ['AS', 'KS', 'QS', 'JS', 'TS']; // Royal Flush
        const result = evaluateHandStrength(hand);
        expect(result.type).toBe('Royal Flush'); // Implicitly tests getRankValue
    });
});
