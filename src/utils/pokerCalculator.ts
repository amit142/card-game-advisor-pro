export interface HandStrength {
  type: string;
  rank: number;
  kicker?: number;
}

export const calculateWinProbability = (
  holeCards: string[],
  communityCards: string[],
  position: string,
  opponents: number,
  gameStage: 'preflop' | 'flop' | 'turn' | 'river'
): number => {
  if (holeCards.length !== 2) return 0;

  let probability = 0;

  if (gameStage === 'preflop') {
    probability = calculatePreflopEquity(holeCards, opponents);
  } else {
    probability = calculatePostflopEquity(holeCards, communityCards, opponents);
  }

  // Apply position adjustment (more conservative)
  const positionMultiplier = getPositionMultiplier(position);
  probability *= positionMultiplier;

  // Ensure realistic bounds
  return Math.max(5, Math.min(95, Math.round(probability)));
};

// Exporting evaluateHandStrength for use in other parts of the application
export const evaluateHandStrength = (cards: string[]): HandStrength => {
  const ranks = cards.map(card => getRankValue(card.slice(0, -1)));
  const suits = cards.map(card => card.slice(-1));

  const rankCounts = ranks.reduce((acc, rank) => {
    acc[rank] = (acc[rank] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const suitCounts = suits.reduce((acc, suit) => {
    acc[suit] = (acc[suit] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pairs = Object.entries(rankCounts).filter(([_, count]) => count >= 2);
  const hasFlush = Object.values(suitCounts).some(count => count >= 5);
  const sortedRanks = [...new Set(ranks)].sort((a, b) => b - a);

  const hasStraight = checkStraight(sortedRanks);

  // Basic Ace-low straight check (A2345)
  const isAceLowStraight = (evalRanks: number[]) => { // Changed parameter name to avoid conflict
    const uniqueSortedRanks = [...new Set(evalRanks)].sort((a, b) => a - b);
    return uniqueSortedRanks.length >= 5 &&
           uniqueSortedRanks.includes(14) && // Ace
           uniqueSortedRanks.includes(2) &&
           uniqueSortedRanks.includes(3) &&
           uniqueSortedRanks.includes(4) &&
           uniqueSortedRanks.includes(5);
  };

  if (hasFlush && hasStraight) {
    // Check for Royal Flush (A, K, Q, J, 10 of same suit)
    const flushSuit = Object.entries(suitCounts).find(([_,count]) => count >= 5)?.[0];
    if (flushSuit) {
        const flushCardsRanks = cards.filter(c => c.endsWith(flushSuit)).map(c => getRankValue(c.slice(0,-1)));
        const royalFlushRanks = [14, 13, 12, 11, 10];
        if (royalFlushRanks.every(rank => flushCardsRanks.includes(rank))) {
            return { type: 'Royal Flush', rank: 9 }; // Assign rank 9 for Royal Flush
        }
    }
    return { type: 'Straight Flush', rank: 8 };
  }
  if (Object.values(rankCounts).includes(4)) return { type: 'Four of a Kind', rank: 7 };
  // A bit more robust check for full house:
  // It needs one rank with count 3, and another rank with count >= 2
  const counts = Object.values(rankCounts);
  if (counts.includes(3) && counts.some(c => c >= 2 && c !== 3)) { // Ensure the pair is of a different rank than the three-of-a-kind
      return { type: 'Full House', rank: 6 };
  }
  if (hasFlush) return { type: 'Flush', rank: 5 };
  if (hasStraight || isAceLowStraight(ranks)) return { type: 'Straight', rank: 4 }; // Use original 'ranks' for isAceLowStraight
  if (Object.values(rankCounts).includes(3)) return { type: 'Three of a Kind', rank: 3 };

  const pairCounts = Object.values(rankCounts).filter(count => count === 2).length;
  if (pairCounts >= 2) return { type: 'Two Pair', rank: 2 };
  if (Object.values(rankCounts).some(count => count === 2)) return { type: 'One Pair', rank: 1 };

  return { type: 'High Card', rank: 0, kicker: Math.max(...ranks.filter(rank => rank > 0)) }; // Ensure Math.max doesn't get empty array if ranks is empty
};

const calculatePreflopEquity = (holeCards: string[], opponents: number): number => {
  const [card1, card2] = holeCards;
  const rank1 = card1.slice(0, -1);
  const rank2 = card2.slice(0, -1);
  const suit1 = card1.slice(-1);
  const suit2 = card2.slice(-1);
  
  const rankValue1 = getRankValue(rank1);
  const rankValue2 = getRankValue(rank2);
  const isPair = rank1 === rank2;
  const isSuited = suit1 === suit2;
  const highRank = Math.max(rankValue1, rankValue2);
  const lowRank = Math.min(rankValue1, rankValue2);
  const gap = highRank - lowRank;

  let baseEquity = 0;

  if (isPair) {
    const pairEquities: Record<number, number> = { // Explicit type for pairEquities
      14: 85.3, 13: 82.4, 12: 79.9, 11: 77.5, 10: 75.1, 
      9: 72.1, 8: 69.1, 7: 66.2, 6: 63.4, 5: 60.6, 
      4: 57.9, 3: 55.2, 2: 52.5
    };
    baseEquity = pairEquities[highRank] || 50;
  } else {
    if (highRank === 14) { // Ace hands
      const aceEquities: Record<number, number> = isSuited ?
        { 13: 66.2, 12: 63.4, 11: 60.1, 10: 56.9, 9: 53.2, 8: 50.1, 7: 47.8, 6: 46.1, 5: 47.3, 4: 45.2, 3: 44.1, 2: 43.2 } :
        { 13: 63.5, 12: 60.2, 11: 56.8, 10: 53.1, 9: 48.9, 8: 45.7, 7: 43.2, 6: 41.5, 5: 42.8, 4: 40.6, 3: 39.4, 2: 38.7 };
      baseEquity = aceEquities[lowRank] || 35;
    } else if (highRank === 13) { // King hands
      const kingEquities: Record<number, number> = isSuited ?
        { 12: 59.1, 11: 55.8, 10: 52.4, 9: 48.6, 8: 45.7, 7: 43.2, 6: 41.1, 5: 39.4, 4: 37.9, 3: 36.7, 2: 35.8 } :
        { 12: 56.7, 11: 53.1, 10: 49.2, 9: 44.8, 8: 41.3, 7: 38.9, 6: 36.8, 5: 35.2, 4: 33.8, 3: 32.6, 2: 31.7 };
      baseEquity = kingEquities[lowRank] || 30;
    } else if (highRank === 12) { // Queen hands
      const queenEquities: Record<number, number> = isSuited ?
        { 11: 52.3, 10: 48.9, 9: 45.2, 8: 42.1, 7: 39.4, 6: 37.2, 5: 35.4, 4: 33.9, 3: 32.7, 2: 31.8 } :
        { 11: 49.8, 10: 46.1, 9: 41.7, 8: 38.3, 7: 35.6, 6: 33.4, 5: 31.6, 4: 30.1, 3: 28.9, 2: 28.0 };
      baseEquity = queenEquities[lowRank] || 28;
    } else if (highRank === 11) { // Jack hands
      const jackEquities: Record<number, number> = isSuited ?
        { 10: 45.7, 9: 42.1, 8: 39.0, 7: 36.3, 6: 34.1, 5: 32.3, 4: 30.8, 3: 29.6, 2: 28.7 } :
        { 10: 43.2, 9: 38.9, 8: 35.4, 7: 32.6, 6: 30.2, 5: 28.4, 4: 26.9, 3: 25.7, 2: 24.8 };
      baseEquity = jackEquities[lowRank] || 25;
    } else {
      // Middle and low non-pairs, connectors, and suited cards
      if (gap === 0) { // Connectors (e.g. T9, 76)
          if (highRank >= 10) baseEquity = isSuited ? 42.3 : 39.1;
          else if (highRank >= 7) baseEquity = isSuited ? 38.7 : 35.2;
          else baseEquity = isSuited ? 35.1 : 31.4;
      } else if (gap === 1) { // One-gappers (e.g. T8, 75)
          if (highRank >= 10) baseEquity = isSuited ? 39.2 : 35.8;
          else if (highRank >= 7) baseEquity = isSuited ? 35.4 : 31.7;
          else baseEquity = isSuited ? 31.8 : 28.1;
      } else if (gap === 2) { // Two-gappers (e.g. T7, 74)
          if (highRank >= 10) baseEquity = isSuited ? 36.1 : 32.4;
          else baseEquity = isSuited ? 29.7 : 26.3;
      } else if (isSuited) { // Other suited cards
          baseEquity = Math.max(25, 35 - (gap * 2));
      } else { // Offsuit trash
          baseEquity = Math.max(15, 25 - (gap * 1.5));
      }
    }
  }

  const opponentFactor = Math.pow(0.88, opponents - 1);
  const adjustedEquity = baseEquity * opponentFactor;
  
  return Math.max(8, Math.min(92, adjustedEquity));
};

const calculatePostflopEquity = (
  holeCards: string[],
  communityCards: string[],
  opponents: number
): number => {
  const allCards = [...holeCards, ...communityCards];
  // Ensure evaluateHandStrength is called with enough cards for a valid hand
  const handStrength = allCards.length >= 2 ? evaluateHandStrength(allCards) : { type: 'High Card', rank: 0 }; // Default if not enough cards for full eval
  const draws = evaluateDraws(holeCards, communityCards);
  
  let equity = getHandEquity(handStrength, communityCards.length);
  
  const cardsToCome = 5 - communityCards.length; // Renamed for clarity
  const unseenCards = 52 - allCards.length; // Renamed for clarity
  
  if (draws.flushDraw) {
    const flushSuit = getFlushSuit(holeCards, communityCards);
    const flushOuts = Math.max(0, 9 - countFlushCards(allCards, flushSuit || "")); // Handle null from getFlushSuit
    equity += calculateOutsEquity(flushOuts, cardsToCome, unseenCards);
  }
  
  if (draws.openEndedStraightDraw) {
    const straightOuts = 8; // Assuming 8 outs for open-ended
    equity += calculateOutsEquity(straightOuts, cardsToCome, unseenCards);
  }
  
  if (draws.gutshot) {
    const gutshotOuts = 4; // Assuming 4 outs for gutshot
    equity += calculateOutsEquity(gutshotOuts, cardsToCome, unseenCards);
  }
  
  if (draws.overCards > 0) {
    const overCardOuts = draws.overCards * 3; // Each overcard has 3 outs to pair
    equity += calculateOutsEquity(overCardOuts, cardsToCome, unseenCards) * 0.6; // Discounted
  }
  
  const boardTexture = analyzeBoardTexture(communityCards);
  if (boardTexture.paired && handStrength.rank < 3) equity *= 0.82; // Less equity if board is paired and we have less than trips
  if (boardTexture.flushy && !draws.flushDraw && handStrength.rank < 5) equity *= 0.87; // Less equity if board is flushy and we don't have a flush/draw
  if (boardTexture.straight && handStrength.rank < 4) equity *= 0.85; // Less equity if board is straighty and we don't have a straight
  
  const opponentPenalty = Math.pow(0.91, opponents); // Adjusted penalty slightly
  equity *= opponentPenalty;
  
  return Math.max(5, Math.min(95, equity));
};

const calculateOutsEquity = (outs: number, cardsToCome: number, unseenCards: number): number => {
  if (unseenCards <= 0) return 0; // Avoid division by zero
  if (cardsToCome === 1) {
    return (outs / unseenCards) * 100;
  } else if (cardsToCome === 2) {
    // Probability of hitting on turn OR river: P(A) + P(B) - P(A and B)
    // P(hit on turn) = outs / unseen
    // P(hit on river given missed turn) = outs / (unseen - 1)
    // P(miss on turn) = (unseen - outs) / unseen
    // P(miss on river given missed turn) = (unseen - outs - 1) / (unseen - 1)
    // P(miss both) = P(miss on turn) * P(miss on river given missed turn)
    if (unseenCards < 2) return (outs / unseenCards) * 100; // Effectively one card if only one unseen left
    const probMissBoth = ((unseenCards - outs) / unseenCards) * ((unseenCards - outs - 1) / (unseenCards - 1));
    return (1 - probMissBoth) * 100;
  }
  return 0;
};

const getHandEquity = (handStrength: HandStrength, boardCardsCount: number): number => { // Renamed param
  const baseEquities: Record<number, number> = { // Explicit type
    0: 12,  // High card
    1: 28,  // One pair
    2: 48,  // Two pair
    3: 68,  // Three of a kind
    4: 82,  // Straight
    5: 86,  // Flush
    6: 92,  // Full house
    7: 96,  // Four of a kind
    8: 98,  // Straight flush
    9: 99   // Royal Flush (added)
  };
  
  let equity = baseEquities[handStrength.rank] || 10; // Default for unknown or very low rank
  
  if (boardCardsCount === 3) equity *= 0.95;
  else if (boardCardsCount === 4) equity *= 0.98;
  
  return equity;
};

const evaluateDraws = (holeCards: string[], communityCards: string[]) => {
  const allCards = [...holeCards, ...communityCards];
  const ranks = allCards.map(card => getRankValue(card.slice(0, -1)));
  const suits = allCards.map(card => card.slice(-1));
  
  const suitCounts = suits.reduce((acc, suit) => {
    acc[suit] = (acc[suit] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const flushDraw = Object.values(suitCounts).some(count => count === 4);
  const { openEndedStraightDraw, gutshot } = checkStraightDraws(ranks);
  
  const boardHighCard = communityCards.length > 0 ? 
    Math.max(...communityCards.map(card => getRankValue(card.slice(0, -1))).filter(r => r > 0)) : 0;
  const overCards = holeCards.filter(card => 
    getRankValue(card.slice(0, -1)) > boardHighCard
  ).length;
  
  return { flushDraw, openEndedStraightDraw, gutshot, overCards };
};

const checkStraight = (sortedRanks: number[]): boolean => {
  if (sortedRanks.length < 5) return false;
  // Check for Ace-low straight (A,2,3,4,5) - ranks are [14,5,4,3,2]
  const aceLowStraight = sortedRanks.includes(14) && sortedRanks.includes(2) && sortedRanks.includes(3) && sortedRanks.includes(4) && sortedRanks.includes(5);
  if (aceLowStraight) return true;

  // Check for other straights
  for (let i = 0; i <= sortedRanks.length - 5; i++) {
    let isStraight = true;
    for (let j = 0; j < 4; j++) {
      if (sortedRanks[i+j] - 1 !== sortedRanks[i+j+1]) {
        isStraight = false;
        break;
      }
    }
    if (isStraight) return true;
  }
  return false;
};

const checkStraightDraws = (ranks: number[]) => {
  const uniqueSortedRanks = [...new Set(ranks)].sort((a, b) => a - b); // Ascending sort
  let openEndedStraightDraw = false;
  let gutshot = false;

  if (uniqueSortedRanks.length < 3) return { openEndedStraightDraw, gutshot }; // Not enough cards for a draw

  // Check for open-ended (4 consecutive cards)
  // e.g., 5,6,7,8 for a 4 or 9
  for (let i = 0; i <= uniqueSortedRanks.length - 4; i++) {
    if (uniqueSortedRanks[i+3] - uniqueSortedRanks[i] === 3) {
      openEndedStraightDraw = true;
      break;
    }
  }
  // Check for Ace-low open-ended (A,2,3,4 needs a 5; or 2,3,4,5 needs an A)
  if (uniqueSortedRanks.includes(14) && uniqueSortedRanks.includes(2) && uniqueSortedRanks.includes(3) && uniqueSortedRanks.includes(4)) openEndedStraightDraw = true;
  if (uniqueSortedRanks.includes(2) && uniqueSortedRanks.includes(3) && uniqueSortedRanks.includes(4) && uniqueSortedRanks.includes(5)) openEndedStraightDraw = true;


  // Check for gutshot (4 cards with one internal gap)
  // e.g., 5,6,8,9 needs a 7
  if (!openEndedStraightDraw && uniqueSortedRanks.length >= 4) {
    for (let i = 0; i <= uniqueSortedRanks.length - 4; i++) {
      // Check for pattern like x, x+1, x+3, x+4 (gap of 1 in middle)
      if (uniqueSortedRanks[i+1] === uniqueSortedRanks[i]+1 &&
          uniqueSortedRanks[i+2] === uniqueSortedRanks[i]+3 &&
          uniqueSortedRanks[i+3] === uniqueSortedRanks[i]+4) {
        gutshot = true;
        break;
      }
       // Check for pattern like x, x+2, x+3, x+4 (gap of 1 at start)
      if (uniqueSortedRanks[i+1] === uniqueSortedRanks[i]+2 &&
          uniqueSortedRanks[i+2] === uniqueSortedRanks[i]+3 &&
          uniqueSortedRanks[i+3] === uniqueSortedRanks[i]+4) {
        gutshot = true;
        break;
      }
    }
     // Check for Ace-low gutshot (e.g. A23_5 needs 4, A2_45 needs 3, A_345 needs 2)
    if (uniqueSortedRanks.includes(14)) { // Ace present
        if (uniqueSortedRanks.includes(2) && uniqueSortedRanks.includes(3) && uniqueSortedRanks.includes(5)) gutshot = true; // A23_5
        if (uniqueSortedRanks.includes(2) && uniqueSortedRanks.includes(4) && uniqueSortedRanks.includes(5)) gutshot = true; // A2_45
        if (uniqueSortedRanks.includes(3) && uniqueSortedRanks.includes(4) && uniqueSortedRanks.includes(5)) gutshot = true; // A_345
    }
  }
  
  return { openEndedStraightDraw, gutshot };
};

const analyzeBoardTexture = (communityCards: string[]) => {
  if (communityCards.length < 3) return { paired: false, flushy: false, straight: false };
  
  const ranks = communityCards.map(card => getRankValue(card.slice(0, -1)));
  const suits = communityCards.map(card => card.slice(-1));
  
  const rankCounts = ranks.reduce((acc, rank) => {
    acc[rank] = (acc[rank] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  const suitCounts = suits.reduce((acc, suit) => {
    acc[suit] = (acc[suit] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const paired = Object.values(rankCounts).some(count => count >= 2);
  const flushy = Object.values(suitCounts).some(count => count >= 3); // 3 cards of same suit on board

  // Check for straight possibilities on board
  const uniqueSortedRanks = [...new Set(ranks)].sort((a,b) => a-b);
  let straightPossible = false;
  if (uniqueSortedRanks.length >= 3) {
      for(let i=0; i <= uniqueSortedRanks.length - 3; i++) {
          if (uniqueSortedRanks[i+2] - uniqueSortedRanks[i] <= 4) { // Max gap of 4 for 3 cards to form part of straight
              straightPossible = true;
              break;
          }
      }
      // Ace-low straight check on board
      if (uniqueSortedRanks.includes(14) && uniqueSortedRanks.includes(2) && uniqueSortedRanks.includes(3)) straightPossible = true;
      if (uniqueSortedRanks.includes(14) && uniqueSortedRanks.includes(2) && uniqueSortedRanks.includes(4)) straightPossible = true;
      if (uniqueSortedRanks.includes(14) && uniqueSortedRanks.includes(2) && uniqueSortedRanks.includes(5)) straightPossible = true;
      if (uniqueSortedRanks.includes(14) && uniqueSortedRanks.includes(3) && uniqueSortedRanks.includes(4)) straightPossible = true;
      if (uniqueSortedRanks.includes(14) && uniqueSortedRanks.includes(3) && uniqueSortedRanks.includes(5)) straightPossible = true;
      if (uniqueSortedRanks.includes(14) && uniqueSortedRanks.includes(4) && uniqueSortedRanks.includes(5)) straightPossible = true;
  }

  return { paired, flushy, straight: straightPossible };
};

const countFlushCards = (cards: string[], suit: string): number => {
  if (!suit) return 0;
  return cards.filter(card => card.slice(-1) === suit).length;
};

const getFlushSuit = (holeCards: string[], communityCards: string[]): string | null => {
  const allCards = [...holeCards, ...communityCards];
  const suits = allCards.map(card => card.slice(-1));
  const suitCounts = suits.reduce((acc, suit) => {
    acc[suit] = (acc[suit] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const flushSuitEntry = Object.entries(suitCounts).find(([_, count]) => count >= 4); // Check for 4 cards for a flush draw
  return flushSuitEntry ? flushSuitEntry[0] : null;
};

const getRankValue = (rank: string): number => {
  const rankMap: Record<string, number> = {
    'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10, // Changed '10' to 'T' for consistency if card format is 'Ts' etc.
    '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
  };
  // If rank is '10', handle it specifically, otherwise use the map
  if (rank === "10") return 10;
  return rankMap[rank] || 0;
};

const getPositionMultiplier = (position: string): number => {
  const positionMap: Record<string, number> = {
    'BTN': 1.05, 'CO': 1.03, 'MP': 1.00, 'UTG': 0.95, 'SB': 0.92, 'BB': 0.94
    // Add other positions like UTG+1, UTG+2, LJ, HJ if they are distinct in your position selector
  };
  // Fallback for positions not explicitly listed, e.g. UTG+1 might be treated as UTG or MP
  if (position.startsWith("UTG")) return positionMap["UTG"] || 0.95;
  if (position.includes("MP") || position === "LJ" || position === "HJ") return positionMap["MP"] || 1.00;
  return positionMap[position] || 1.0; // Default multiplier
};
