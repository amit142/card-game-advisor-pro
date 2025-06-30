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

  const [card1, card2] = holeCards;
  const rank1 = card1.slice(0, -1);
  const rank2 = card2.slice(0, -1);
  const suit1 = card1.slice(-1);
  const suit2 = card2.slice(-1);

  let probability = 0;

  if (gameStage === 'preflop') {
    probability = calculatePreflopEquity(rank1, rank2, suit1, suit2, opponents);
  } else {
    probability = calculatePostflopEquity(holeCards, communityCards, opponents);
  }

  // Position adjustment
  const positionMultiplier = getPositionMultiplier(position);
  probability *= positionMultiplier;

  return Math.max(5, Math.min(95, Math.round(probability)));
};

const calculatePreflopEquity = (
  rank1: string,
  rank2: string,
  suit1: string,
  suit2: string,
  opponents: number
): number => {
  const rankValue1 = getRankValue(rank1);
  const rankValue2 = getRankValue(rank2);
  const isPair = rank1 === rank2;
  const isSuited = suit1 === suit2;
  const highRank = Math.max(rankValue1, rankValue2);
  const lowRank = Math.min(rankValue1, rankValue2);
  const gap = highRank - lowRank;

  let baseEquity = 0;

  if (isPair) {
    // Pocket pairs
    if (highRank >= 14) baseEquity = 85; // AA
    else if (highRank >= 13) baseEquity = 82; // KK
    else if (highRank >= 12) baseEquity = 80; // QQ
    else if (highRank >= 11) baseEquity = 78; // JJ
    else if (highRank >= 10) baseEquity = 75; // TT
    else if (highRank >= 8) baseEquity = 65; // 88-99
    else if (highRank >= 6) baseEquity = 55; // 66-77
    else baseEquity = 45; // 22-55
  } else {
    // Non-pairs
    if (highRank === 14 && lowRank >= 10) {
      // AK, AQ, AJ, AT
      baseEquity = isSuited ? 67 : 63;
    } else if (highRank === 14 && lowRank >= 7) {
      // A9-A7
      baseEquity = isSuited ? 58 : 52;
    } else if (highRank === 14) {
      // A6-A2
      baseEquity = isSuited ? 55 : 47;
    } else if (highRank === 13 && lowRank >= 10) {
      // KQ, KJ, KT
      baseEquity = isSuited ? 62 : 58;
    } else if (highRank === 13 && lowRank >= 8) {
      // K9-K8
      baseEquity = isSuited ? 55 : 49;
    } else if (highRank >= 12 && lowRank >= 10 && gap <= 2) {
      // QJ, QT, JT
      baseEquity = isSuited ? 60 : 55;
    } else if (gap === 0) {
      // Connectors
      baseEquity = isSuited ? 52 : 45;
    } else if (gap === 1) {
      // One gap
      baseEquity = isSuited ? 48 : 42;
    } else if (isSuited) {
      // Other suited
      baseEquity = 40;
    } else {
      // Offsuit junk
      baseEquity = 32;
    }
  }

  // Opponent adjustment - more realistic
  const opponentPenalty = (opponents - 1) * 3.5;
  return Math.max(15, baseEquity - opponentPenalty);
};

const calculatePostflopEquity = (
  holeCards: string[],
  communityCards: string[],
  opponents: number
): number => {
  const allCards = [...holeCards, ...communityCards];
  const handStrength = evaluateHandStrength(allCards);
  const draws = evaluateDraws(holeCards, communityCards);
  
  let equity = handStrength.rank * 10;
  
  // Add draw equity
  if (draws.flushDraw) equity += 15;
  if (draws.straightDraw) equity += 12;
  if (draws.gutshot) equity += 6;
  if (draws.overCards) equity += draws.overCards * 3;
  
  // Board texture adjustment
  const boardTexture = analyzeBoardTexture(communityCards);
  if (boardTexture.paired) equity *= 0.9;
  if (boardTexture.coordinated) equity *= 0.85;
  
  // Opponent adjustment
  const opponentPenalty = (opponents - 1) * 4;
  return Math.max(10, equity - opponentPenalty);
};

const evaluateHandStrength = (cards: string[]): HandStrength => {
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
  
  // Check for straight
  const hasStraight = checkStraight(sortedRanks);
  
  if (hasFlush && hasStraight) return { type: 'Straight Flush', rank: 8 };
  if (Object.values(rankCounts).includes(4)) return { type: 'Four of a Kind', rank: 7 };
  if (Object.values(rankCounts).includes(3) && Object.values(rankCounts).includes(2)) {
    return { type: 'Full House', rank: 6 };
  }
  if (hasFlush) return { type: 'Flush', rank: 5 };
  if (hasStraight) return { type: 'Straight', rank: 4 };
  if (Object.values(rankCounts).includes(3)) return { type: 'Three of a Kind', rank: 3 };
  if (pairs.length >= 2) return { type: 'Two Pair', rank: 2 };
  if (pairs.length === 1) return { type: 'One Pair', rank: 1 };
  
  return { type: 'High Card', rank: 0 };
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
  const straightDraw = checkStraightDraw(ranks);
  const gutshot = checkGutshotDraw(ranks);
  
  // Count overcards
  const boardHighCard = Math.max(...communityCards.map(card => getRankValue(card.slice(0, -1))));
  const overCards = holeCards.filter(card => getRankValue(card.slice(0, -1)) > boardHighCard).length;
  
  return { flushDraw, straightDraw, gutshot, overCards };
};

const checkStraight = (sortedRanks: number[]): boolean => {
  for (let i = 0; i <= sortedRanks.length - 5; i++) {
    let consecutive = 1;
    for (let j = i; j < sortedRanks.length - 1; j++) {
      if (sortedRanks[j] - sortedRanks[j + 1] === 1) {
        consecutive++;
        if (consecutive >= 5) return true;
      } else if (sortedRanks[j] !== sortedRanks[j + 1]) {
        break;
      }
    }
  }
  
  // Check for A-2-3-4-5 straight
  if (sortedRanks.includes(14) && sortedRanks.includes(5) && 
      sortedRanks.includes(4) && sortedRanks.includes(3) && sortedRanks.includes(2)) {
    return true;
  }
  
  return false;
};

const checkStraightDraw = (ranks: number[]): boolean => {
  const uniqueRanks = [...new Set(ranks)].sort((a, b) => b - a);
  let maxConsecutive = 0;
  let currentConsecutive = 1;
  
  for (let i = 0; i < uniqueRanks.length - 1; i++) {
    if (uniqueRanks[i] - uniqueRanks[i + 1] === 1) {
      currentConsecutive++;
    } else {
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      currentConsecutive = 1;
    }
  }
  maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
  
  return maxConsecutive >= 4;
};

const checkGutshotDraw = (ranks: number[]): boolean => {
  const uniqueRanks = [...new Set(ranks)].sort((a, b) => b - a);
  // Simplified gutshot detection
  return uniqueRanks.length >= 4;
};

const analyzeBoardTexture = (communityCards: string[]) => {
  if (communityCards.length < 3) return { paired: false, coordinated: false };
  
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
  const coordinated = Object.values(suitCounts).some(count => count >= 3) || 
                     checkStraightDraw(ranks);
  
  return { paired, coordinated };
};

const getRankValue = (rank: string): number => {
  const rankMap: Record<string, number> = {
    'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10,
    '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
  };
  return rankMap[rank] || 0;
};

const getPositionMultiplier = (position: string): number => {
  const positionMap: Record<string, number> = {
    'BTN': 1.08, 'CO': 1.05, 'MP': 1.02, 'UTG': 0.96, 'SB': 0.92, 'BB': 0.88
  };
  return positionMap[position] || 1.0;
};
