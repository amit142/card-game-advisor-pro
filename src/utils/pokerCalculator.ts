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
  const isAceLowStraight = (ranks: number[]) => {
    const uniqueSortedRanks = [...new Set(ranks)].sort((a, b) => a - b);
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
  if (Object.values(rankCounts).some(count => count === 3) && pairs.length > 1 && pairs.some(p => parseInt(Object.keys(p)[0]) > 0 && Object.values(p)[0] >=2 )) { // check if one of the pairs has count >=2
    // A bit more robust check for full house:
    // It needs one rank with count 3, and another rank with count >= 2
    const counts = Object.values(rankCounts);
    if (counts.includes(3) && counts.some(c => c >= 2 && c !== 3)) {
        return { type: 'Full House', rank: 6 };
    }
  }
  if (hasFlush) return { type: 'Flush', rank: 5 };
  if (hasStraight || isAceLowStraight(ranks)) return { type: 'Straight', rank: 4 };
  if (Object.values(rankCounts).includes(3)) return { type: 'Three of a Kind', rank: 3 };

  // Adjusted Two Pair logic: ensure there are at least two distinct ranks with counts of 2 or more.
  const pairCounts = Object.values(rankCounts).filter(count => count === 2).length;
  if (pairCounts >= 2) return { type: 'Two Pair', rank: 2 };
  if (Object.values(rankCounts).some(count => count === 2)) return { type: 'One Pair', rank: 1 }; // Changed from pairs.length === 1

  return { type: 'High Card', rank: 0, kicker: Math.max(...ranks) };
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
    // Pocket pairs - based on actual poker statistics
    const pairEquities = {
      14: 85.3, 13: 82.4, 12: 79.9, 11: 77.5, 10: 75.1, 
      9: 72.1, 8: 69.1, 7: 66.2, 6: 63.4, 5: 60.6, 
      4: 57.9, 3: 55.2, 2: 52.5
    };
    baseEquity = pairEquities[highRank as keyof typeof pairEquities] || 50;
  } else {
    // Non-pairs - more accurate based on poker solver data
    if (highRank === 14) { // Ace hands
      const aceEquities = {
        13: isSuited ? 66.2 : 63.5, // AK
        12: isSuited ? 63.4 : 60.2, // AQ  
        11: isSuited ? 60.1 : 56.8, // AJ
        10: isSuited ? 56.9 : 53.1, // AT
        9: isSuited ? 53.2 : 48.9,  // A9
        8: isSuited ? 50.1 : 45.7,  // A8
        7: isSuited ? 47.8 : 43.2,  // A7
        6: isSuited ? 46.1 : 41.5,  // A6
        5: isSuited ? 47.3 : 42.8,  // A5 (wheel potential)
        4: isSuited ? 45.2 : 40.6,  // A4
        3: isSuited ? 44.1 : 39.4,  // A3
        2: isSuited ? 43.2 : 38.7   // A2
      };
      baseEquity = aceEquities[lowRank as keyof typeof aceEquities] || 35;
    } else if (highRank === 13) { // King hands
      const kingEquities = {
        12: isSuited ? 59.1 : 56.7, // KQ
        11: isSuited ? 55.8 : 53.1, // KJ
        10: isSuited ? 52.4 : 49.2, // KT
        9: isSuited ? 48.6 : 44.8,  // K9
        8: isSuited ? 45.7 : 41.3,  // K8
        7: isSuited ? 43.2 : 38.9,  // K7
        6: isSuited ? 41.1 : 36.8,  // K6
        5: isSuited ? 39.4 : 35.2,  // K5
        4: isSuited ? 37.9 : 33.8,  // K4
        3: isSuited ? 36.7 : 32.6,  // K3
        2: isSuited ? 35.8 : 31.7   // K2
      };
      baseEquity = kingEquities[lowRank as keyof typeof kingEquities] || 30;
    } else if (highRank === 12) { // Queen hands
      const queenEquities = {
        11: isSuited ? 52.3 : 49.8, // QJ
        10: isSuited ? 48.9 : 46.1, // QT
        9: isSuited ? 45.2 : 41.7,  // Q9
        8: isSuited ? 42.1 : 38.3,  // Q8
        7: isSuited ? 39.4 : 35.6,  // Q7
        6: isSuited ? 37.2 : 33.4,  // Q6
        5: isSuited ? 35.4 : 31.6,  // Q5
        4: isSuited ? 33.9 : 30.1,  // Q4
        3: isSuited ? 32.7 : 28.9,  // Q3
        2: isSuited ? 31.8 : 28.0   // Q2
      };
      baseEquity = queenEquities[lowRank as keyof typeof queenEquities] || 28;
    } else if (highRank === 11) { // Jack hands
      const jackEquities = {
        10: isSuited ? 45.7 : 43.2, // JT
        9: isSuited ? 42.1 : 38.9,  // J9
        8: isSuited ? 39.0 : 35.4,  // J8
        7: isSuited ? 36.3 : 32.6,  // J7
        6: isSuited ? 34.1 : 30.2,  // J6
        5: isSuited ? 32.3 : 28.4,  // J5
        4: isSuited ? 30.8 : 26.9,  // J4
        3: isSuited ? 29.6 : 25.7,  // J3
        2: isSuited ? 28.7 : 24.8   // J2
      };
      baseEquity = jackEquities[lowRank as keyof typeof jackEquities] || 25;
    } else {
      // Middle and low pairs, connectors, and suited cards
      if (gap === 0) { // Connectors
        if (highRank >= 10) baseEquity = isSuited ? 42.3 : 39.1; // T9, 98, etc
        else if (highRank >= 7) baseEquity = isSuited ? 38.7 : 35.2; // 76, 65, etc
        else baseEquity = isSuited ? 35.1 : 31.4; // 54, 43, 32
      } else if (gap === 1) { // One-gappers
        if (highRank >= 10) baseEquity = isSuited ? 39.2 : 35.8; // T8, 97, etc
        else if (highRank >= 7) baseEquity = isSuited ? 35.4 : 31.7; // 75, 64, etc
        else baseEquity = isSuited ? 31.8 : 28.1; // 53, 42
      } else if (gap === 2) { // Two-gappers
        if (highRank >= 10) baseEquity = isSuited ? 36.1 : 32.4; // T7, 96, etc
        else baseEquity = isSuited ? 29.7 : 26.3; // 74, 63, etc
      } else if (isSuited) {
        // Other suited cards
        baseEquity = Math.max(25, 35 - (gap * 2));
      } else {
        // Offsuit trash
        baseEquity = Math.max(15, 25 - (gap * 1.5));
      }
    }
  }

  // More accurate opponent scaling based on actual poker math
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
  const handStrength = evaluateHandStrength(allCards);
  const draws = evaluateDraws(holeCards, communityCards);
  
  // Base equity from current hand strength - more accurate
  let equity = getHandEquity(handStrength, communityCards.length);
  
  // Add draw equity with proper calculations
  const cardsLeft = 5 - communityCards.length;
  const unseen = 52 - allCards.length;
  
  if (draws.flushDraw) {
    const flushOuts = Math.max(0, 9 - countFlushCards(allCards, getFlushSuit(holeCards, communityCards)));
    equity += calculateOutsEquity(flushOuts, cardsLeft, unseen);
  }
  
  if (draws.openEndedStraightDraw) {
    const straightOuts = 8;
    equity += calculateOutsEquity(straightOuts, cardsLeft, unseen);
  }
  
  if (draws.gutshot) {
    const gutshotOuts = 4;
    equity += calculateOutsEquity(gutshotOuts, cardsLeft, unseen);
  }
  
  if (draws.overCards > 0) {
    const overCardOuts = draws.overCards * 3;
    equity += calculateOutsEquity(overCardOuts, cardsLeft, unseen) * 0.6; // Discounted
  }
  
  // Board texture penalties - more nuanced
  const boardTexture = analyzeBoardTexture(communityCards);
  if (boardTexture.paired && handStrength.rank < 3) equity *= 0.82;
  if (boardTexture.flushy && !draws.flushDraw && handStrength.rank < 5) equity *= 0.87;
  if (boardTexture.straight && handStrength.rank < 4) equity *= 0.85;
  
  // Opponent penalty - more realistic
  const opponentPenalty = Math.pow(0.91, opponents - 1);
  equity *= opponentPenalty;
  
  return Math.max(5, Math.min(95, equity));
};

const calculateOutsEquity = (outs: number, cardsLeft: number, unseenCards: number): number => {
  if (cardsLeft === 1) {
    return (outs / unseenCards) * 100;
  } else if (cardsLeft === 2) {
    // Rule of 4 for two cards
    const prob = 1 - ((unseenCards - outs) / unseenCards) * ((unseenCards - outs - 1) / (unseenCards - 1));
    return prob * 100;
  }
  return 0;
};

const getHandEquity = (handStrength: HandStrength, boardCards: number): number => {
  const baseEquities = {
    0: 12,  // High card
    1: 28,  // One pair
    2: 48,  // Two pair
    3: 68,  // Three of a kind
    4: 82,  // Straight
    5: 86,  // Flush
    6: 92,  // Full house
    7: 96,  // Four of a kind
    8: 98   // Straight flush
  };
  
  let equity = baseEquities[handStrength.rank as keyof typeof baseEquities] || 12;
  
  // Adjust based on board cards
  if (boardCards === 3) equity *= 0.95; // Flop uncertainty
  else if (boardCards === 4) equity *= 0.98; // Turn more certain
  
  return equity;
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
  const { openEndedStraightDraw, gutshot } = checkStraightDraws(ranks);
  
  const boardHighCard = communityCards.length > 0 ? 
    Math.max(...communityCards.map(card => getRankValue(card.slice(0, -1)))) : 0;
  const overCards = holeCards.filter(card => 
    getRankValue(card.slice(0, -1)) > boardHighCard
  ).length;
  
  return { flushDraw, openEndedStraightDraw, gutshot, overCards };
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
  
  if (sortedRanks.includes(14) && sortedRanks.includes(5) && 
      sortedRanks.includes(4) && sortedRanks.includes(3) && sortedRanks.includes(2)) {
    return true;
  }
  
  return false;
};

const checkStraightDraws = (ranks: number[]) => {
  const uniqueRanks = [...new Set(ranks)].sort((a, b) => a - b);
  let openEndedStraightDraw = false;
  let gutshot = false;
  
  for (let i = 0; i < uniqueRanks.length - 3; i++) {
    const sequence = uniqueRanks.slice(i, i + 4);
    if (sequence[3] - sequence[0] === 3) {
      openEndedStraightDraw = true;
      break;
    }
  }
  
  if (!openEndedStraightDraw) {
    for (let i = 0; i < uniqueRanks.length - 2; i++) {
      for (let j = i + 1; j < uniqueRanks.length - 1; j++) {
        for (let k = j + 1; k < uniqueRanks.length; k++) {
          const cards = [uniqueRanks[i], uniqueRanks[j], uniqueRanks[k]];
          if ((cards[2] - cards[0]) === 4 && (cards[1] - cards[0]) !== 2 && (cards[2] - cards[1]) !== 2) {
            gutshot = true;
            break;
          }
        }
      }
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
  const flushy = Object.values(suitCounts).some(count => count >= 3);
  const straight = checkStraightDraws(ranks).openEndedStraightDraw || checkStraight([...new Set(ranks)].sort((a, b) => b - a));
  
  return { paired, flushy, straight };
};

const countFlushCards = (cards: string[], suit: string): number => {
  return cards.filter(card => card.slice(-1) === suit).length;
};

const getFlushSuit = (holeCards: string[], communityCards: string[]): string => {
  const allCards = [...holeCards, ...communityCards];
  const suits = allCards.map(card => card.slice(-1));
  const suitCounts = suits.reduce((acc, suit) => {
    acc[suit] = (acc[suit] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(suitCounts).find(([_, count]) => count >= 3)?.[0] || '';
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
    'BTN': 1.05, 'CO': 1.03, 'MP': 1.00, 'UTG': 0.95, 'SB': 0.92, 'BB': 0.94
  };
  return positionMap[position] || 1.0;
};
