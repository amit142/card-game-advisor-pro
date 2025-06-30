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

  // Apply position adjustment (more conservative)
  const positionMultiplier = getPositionMultiplier(position);
  probability *= positionMultiplier;

  // Ensure realistic bounds
  return Math.max(3, Math.min(97, Math.round(probability)));
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
    // Pocket pairs - more realistic equity
    if (highRank === 14) baseEquity = 85;      // AA
    else if (highRank === 13) baseEquity = 82; // KK  
    else if (highRank === 12) baseEquity = 79; // QQ
    else if (highRank === 11) baseEquity = 77; // JJ
    else if (highRank === 10) baseEquity = 75; // TT
    else if (highRank === 9) baseEquity = 72;  // 99
    else if (highRank === 8) baseEquity = 69;  // 88
    else if (highRank === 7) baseEquity = 66;  // 77
    else if (highRank === 6) baseEquity = 63;  // 66
    else if (highRank === 5) baseEquity = 60;  // 55
    else if (highRank === 4) baseEquity = 57;  // 44
    else if (highRank === 3) baseEquity = 54;  // 33
    else baseEquity = 51;                      // 22
  } else {
    // Non-pairs - more nuanced calculation
    if (highRank === 14) {
      // Ace hands
      if (lowRank === 13) baseEquity = isSuited ? 67 : 65; // AK
      else if (lowRank === 12) baseEquity = isSuited ? 64 : 62; // AQ
      else if (lowRank === 11) baseEquity = isSuited ? 61 : 59; // AJ
      else if (lowRank === 10) baseEquity = isSuited ? 58 : 56; // AT
      else if (lowRank === 9) baseEquity = isSuited ? 55 : 52; // A9
      else if (lowRank === 8) baseEquity = isSuited ? 52 : 49; // A8
      else if (lowRank === 7) baseEquity = isSuited ? 49 : 46; // A7
      else if (lowRank === 6) baseEquity = isSuited ? 47 : 44; // A6
      else if (lowRank === 5) baseEquity = isSuited ? 48 : 45; // A5 (wheel)
      else if (lowRank === 4) baseEquity = isSuited ? 46 : 43; // A4
      else if (lowRank === 3) baseEquity = isSuited ? 45 : 42; // A3
      else baseEquity = isSuited ? 44 : 41; // A2
    } else if (highRank === 13) {
      // King hands
      if (lowRank === 12) baseEquity = isSuited ? 60 : 58; // KQ
      else if (lowRank === 11) baseEquity = isSuited ? 57 : 55; // KJ
      else if (lowRank === 10) baseEquity = isSuited ? 54 : 52; // KT
      else if (lowRank === 9) baseEquity = isSuited ? 51 : 48; // K9
      else if (lowRank >= 7) baseEquity = isSuited ? 48 : 44; // K8-K7
      else baseEquity = isSuited ? 44 : 40; // K6-K2
    } else if (highRank === 12) {
      // Queen hands
      if (lowRank === 11) baseEquity = isSuited ? 54 : 52; // QJ
      else if (lowRank === 10) baseEquity = isSuited ? 51 : 49; // QT
      else if (lowRank === 9) baseEquity = isSuited ? 48 : 45; // Q9
      else baseEquity = isSuited ? 44 : 40; // Q8-Q2
    } else if (highRank === 11) {
      // Jack hands
      if (lowRank === 10) baseEquity = isSuited ? 48 : 46; // JT
      else if (lowRank === 9) baseEquity = isSuited ? 45 : 42; // J9
      else baseEquity = isSuited ? 41 : 37; // J8-J2
    } else if (gap === 0) {
      // Connectors
      if (highRank >= 10) baseEquity = isSuited ? 45 : 42; // T9, 98, etc high
      else if (highRank >= 7) baseEquity = isSuited ? 42 : 38; // mid connectors
      else baseEquity = isSuited ? 38 : 34; // low connectors
    } else if (gap === 1) {
      // One gap (suited connectors)
      if (highRank >= 10) baseEquity = isSuited ? 42 : 38;
      else if (highRank >= 7) baseEquity = isSuited ? 38 : 34;
      else baseEquity = isSuited ? 34 : 30;
    } else if (gap === 2) {
      // Two gap
      if (highRank >= 10) baseEquity = isSuited ? 38 : 34;
      else baseEquity = isSuited ? 32 : 28;
    } else if (isSuited) {
      // Other suited
      baseEquity = 30;
    } else {
      // Offsuit trash
      baseEquity = 25;
    }
  }

  // Opponent adjustment - more realistic scaling
  const opponentFactor = Math.pow(0.85, opponents - 1);
  const adjustedEquity = baseEquity * opponentFactor;
  
  return Math.max(8, Math.min(90, adjustedEquity));
};

const calculatePostflopEquity = (
  holeCards: string[],
  communityCards: string[],
  opponents: number
): number => {
  const allCards = [...holeCards, ...communityCards];
  const handStrength = evaluateHandStrength(allCards);
  const draws = evaluateDraws(holeCards, communityCards);
  
  // Base equity from hand strength
  let equity = getHandEquity(handStrength, communityCards.length);
  
  // Add draw equity more precisely
  const cardsLeft = 5 - communityCards.length;
  if (draws.flushDraw) {
    const flushOuts = 9;
    equity += (flushOuts * 2 * cardsLeft);
  }
  if (draws.openEndedStraightDraw) {
    const straightOuts = 8;
    equity += (straightOuts * 2 * cardsLeft);
  }
  if (draws.gutshot) {
    const gutshotOuts = 4;
    equity += (gutshotOuts * 2 * cardsLeft);
  }
  if (draws.overCards > 0) {
    equity += (draws.overCards * 3 * cardsLeft * 0.5);
  }
  
  // Board texture adjustment
  const boardTexture = analyzeBoardTexture(communityCards);
  if (boardTexture.paired && handStrength.rank < 3) equity *= 0.85;
  if (boardTexture.flushy && !draws.flushDraw && handStrength.rank < 5) equity *= 0.9;
  if (boardTexture.straight && handStrength.rank < 4) equity *= 0.88;
  
  // Opponent adjustment
  const opponentPenalty = (opponents - 1) * 5;
  equity -= opponentPenalty;
  
  return Math.max(5, Math.min(95, equity));
};

const getHandEquity = (handStrength: HandStrength, boardCards: number): number => {
  const baseEquities = {
    0: 15,  // High card
    1: 25,  // One pair
    2: 45,  // Two pair
    3: 65,  // Three of a kind
    4: 80,  // Straight
    5: 85,  // Flush
    6: 90,  // Full house
    7: 95,  // Four of a kind
    8: 98   // Straight flush
  };
  
  return baseEquities[handStrength.rank as keyof typeof baseEquities] || 15;
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
  const { openEndedStraightDraw, gutshot } = checkStraightDraws(ranks);
  
  // Count overcards more accurately
  const boardHighCard = communityCards.length > 0 ? 
    Math.max(...communityCards.map(card => getRankValue(card.slice(0, -1)))) : 0;
  const overCards = holeCards.filter(card => 
    getRankValue(card.slice(0, -1)) > boardHighCard
  ).length;
  
  return { flushDraw, openEndedStraightDraw, gutshot, overCards };
};

const checkStraight = (sortedRanks: number[]): boolean => {
  // Check for normal straights
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
  
  // Check for A-2-3-4-5 straight (wheel)
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
  
  // Check for open-ended straight draws (4 cards in sequence)
  for (let i = 0; i < uniqueRanks.length - 3; i++) {
    const sequence = uniqueRanks.slice(i, i + 4);
    if (sequence[3] - sequence[0] === 3) {
      openEndedStraightDraw = true;
      break;
    }
  }
  
  // Check for gutshot (missing one card in the middle)
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

const getRankValue = (rank: string): number => {
  const rankMap: Record<string, number> = {
    'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10,
    '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
  };
  return rankMap[rank] || 0;
};

const getPositionMultiplier = (position: string): number => {
  const positionMap: Record<string, number> = {
    'BTN': 1.03, 'CO': 1.02, 'MP': 1.00, 'UTG': 0.97, 'SB': 0.94, 'BB': 0.96
  };
  return positionMap[position] || 1.0;
};
