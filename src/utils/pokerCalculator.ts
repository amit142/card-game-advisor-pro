export interface HandStrength {
  type: string; // e.g., "Four of a Kind", "Flush"
  rank: number; // Numerical rank of the hand type (e.g., Four of a Kind = 7)
  primaryRankValue?: number; // Rank of the primary cards (e.g., rank of the 4 cards in 4-of-a-kind, rank of triplet in Full House)
  secondaryRankValue?: number; // Rank of secondary cards (e.g., rank of pair in Full House, rank of lower pair in Two Pair)
  kickerRankValues?: number[]; // Sorted array of kicker card ranks (high to low)
  // kicker?: number; // This was the old kicker, can be removed or repurposed if only single kicker needed.
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

  // Apply position adjustment (more conservative) - REMOVING THIS
  // const positionMultiplier = getPositionMultiplier(position);
  // probability *= positionMultiplier;

  // Ensure realistic bounds - REMOVING THIS, simulation should be accurate
  return Math.max(0, Math.min(100, Math.round(probability))); // Clamp to 0-100
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
  const sortedRanks = [...new Set(ranks)].sort((a, b) => b - a); // Distinct ranks, sorted high to low

  // Helper to check for Ace-low straight (A,2,3,4,5) from a list of ranks
  const isAceLowStraight = (evalRanks: number[]): boolean => {
    const uniqueSortedAceLow = [...new Set(evalRanks)].sort((a, b) => a - b); // Sort low to high for A-5 check
    return uniqueSortedAceLow.length >= 5 &&
           uniqueSortedAceLow.includes(14) && uniqueSortedAceLow.includes(2) &&
           uniqueSortedAceLow.includes(3) && uniqueSortedAceLow.includes(4) &&
           uniqueSortedAceLow.includes(5);
  };

  // Helper to get kicker ranks
  // allCardRanks: all unique ranks available from player's 7 cards, sorted high-low
  // primaryHandRanks: ranks used in the primary hand (e.g., the rank of the pair in One Pair)
  // kickerCount: number of kickers needed
  const getKickers = (allCardRanks: number[], primaryHandRanks: number[], kickerCount: number): number[] => {
    const kickers = allCardRanks.filter(rank => !primaryHandRanks.includes(rank));
    return kickers.slice(0, kickerCount);
};


  // Helper to get the ranks of pairs, triplets, quads
  // rankCounts: map of rank to its count
  // targetCount: 2 for pair, 3 for triplet, 4 for quads
  // numToGet: how many such groups to get (e.g., 2 for Two Pair, 1 for Three of a Kind)
  const getTopMatchingRanks = (rankMap: Record<number, number>, targetCount: number, numToGet: number): number[] => {
    return Object.entries(rankMap)
      .filter(([_, count]) => count === targetCount)
      .map(([rankStr, _]) => parseInt(rankStr))
      .sort((a, b) => b - a) // Sort found ranks high to low
      .slice(0, numToGet);
  };

  // Check for Straight Flush (includes Royal Flush)
  if (hasFlush) {
    const flushSuit = Object.entries(suitCounts).find(([_, count]) => count >= 5)?.[0];
    if (flushSuit) {
      const flushCardRanks = cards
        .filter(c => c.endsWith(flushSuit))
        .map(c => getRankValue(c.slice(0, -1)))
        .sort((a, b) => b - a); // High to low

      const uniqueFlushRanks = [...new Set(flushCardRanks)]; // Already sorted high-low

      // Check for Ace-low Straight Flush (A,2,3,4,5 of the same suit)
      if (isAceLowStraight(uniqueFlushRanks)) {
          // Check if these specific cards form the flush
          const aceLowSFActualRanks = [14, 5, 4, 3, 2];
          if (aceLowSFActualRanks.every(r => uniqueFlushRanks.includes(r))) {
            return { type: 'Straight Flush', rank: 8, primaryRankValue: 5, kickerRankValues: aceLowSFActualRanks.sort((a,b) => b-a) };
          }
      }

      // Check for other Straight Flushes
      if (uniqueFlushRanks.length >= 5) {
        for (let i = 0; i <= uniqueFlushRanks.length - 5; i++) {
          let isCurrentSF = true;
          for (let j = 0; j < 4; j++) {
            if (uniqueFlushRanks[i + j] - 1 !== uniqueFlushRanks[i + j + 1]) {
              isCurrentSF = false;
              break;
            }
          }
          if (isCurrentSF) {
            const sfRanks = uniqueFlushRanks.slice(i, i + 5);
            if (sfRanks[0] === 14 && sfRanks[1] === 13 && sfRanks[2] === 12 && sfRanks[3] === 11 && sfRanks[4] === 10) {
              return { type: 'Royal Flush', rank: 9, kickerRankValues: sfRanks };
            }
            return { type: 'Straight Flush', rank: 8, primaryRankValue: sfRanks[0], kickerRankValues: sfRanks };
          }
        }
      }
    }
  }

  // Four of a Kind
  const quadsRank = getTopMatchingRanks(rankCounts, 4, 1)[0];
  if (quadsRank !== undefined) {
    const kickers = getKickers(sortedRanks, [quadsRank], 1);
    return { type: 'Four of a Kind', rank: 7, primaryRankValue: quadsRank, kickerRankValues: kickers };
  }

  // Full House
  const tripletRanks = getTopMatchingRanks(rankCounts, 3, 1);
  const pairRanksForFH = getTopMatchingRanks(rankCounts, 2, 1);

  if (tripletRanks.length > 0 && pairRanksForFH.length > 0) {
      // Standard case: one triplet and one pair
      if (tripletRanks[0] !== undefined && pairRanksForFH[0] !== undefined) {
          return { type: 'Full House', rank: 6, primaryRankValue: tripletRanks[0], secondaryRankValue: pairRanksForFH[0] };
      }
  }
  // Case: Two triplets (use highest triplet as three of a kind, next highest as pair)
  const allTripletRanks = Object.entries(rankCounts)
                            .filter(([_, count]) => count === 3)
                            .map(([rankStr, _]) => parseInt(rankStr))
                            .sort((a,b) => b-a);
  if (allTripletRanks.length >= 2) {
      return { type: 'Full House', rank: 6, primaryRankValue: allTripletRanks[0], secondaryRankValue: allTripletRanks[1] };
  }


  // Flush (if not a Straight Flush)
  if (hasFlush) {
    const flushSuit = Object.entries(suitCounts).find(([_, count]) => count >= 5)?.[0];
    if (flushSuit) {
      const flushKickers = cards
        .filter(c => c.endsWith(flushSuit))
        .map(c => getRankValue(c.slice(0, -1)))
        .sort((a, b) => b - a)
        .slice(0, 5);
      return { type: 'Flush', rank: 5, primaryRankValue: flushKickers[0], kickerRankValues: flushKickers };
    }
  }

  // Straight (if not a Straight Flush)
  // Check Ace-low straight first: A,2,3,4,5
  if (isAceLowStraight(sortedRanks)) {
    return { type: 'Straight', rank: 4, primaryRankValue: 5, kickerRankValues: [14,5,4,3,2].sort((a,b)=>b-a) };
  }
  // Check other straights
  if (sortedRanks.length >= 5) {
    for (let i = 0; i <= sortedRanks.length - 5; i++) {
      let isCurrentStraight = true;
      for (let j = 0; j < 4; j++) {
        if (sortedRanks[i + j] - 1 !== sortedRanks[i + j + 1]) {
          isCurrentStraight = false;
          break;
        }
      }
      if (isCurrentStraight) {
        const straightKickers = sortedRanks.slice(i, i + 5);
        return { type: 'Straight', rank: 4, primaryRankValue: straightKickers[0], kickerRankValues: straightKickers };
      }
    }
  }

  // Three of a Kind (if not part of Full House)
  const threeOfAKindRank = getTopMatchingRanks(rankCounts, 3, 1)[0];
  if (threeOfAKindRank !== undefined) {
    const kickers = getKickers(sortedRanks, [threeOfAKindRank], 2);
    return { type: 'Three of a Kind', rank: 3, primaryRankValue: threeOfAKindRank, kickerRankValues: kickers };
  }

  // Two Pair
  const twoPairRanks = getTopMatchingRanks(rankCounts, 2, 2);
  if (twoPairRanks.length === 2) {
    const kickers = getKickers(sortedRanks, twoPairRanks, 1);
    return { type: 'Two Pair', rank: 2, primaryRankValue: twoPairRanks[0], secondaryRankValue: twoPairRanks[1], kickerRankValues: kickers };
  }

  // One Pair
  const onePairRank = getTopMatchingRanks(rankCounts, 2, 1)[0];
  if (onePairRank !== undefined) {
    const kickers = getKickers(sortedRanks, [onePairRank], 3);
    return { type: 'One Pair', rank: 1, primaryRankValue: onePairRank, kickerRankValues: kickers };
  }

  // High Card
  const highCardKickers = sortedRanks.slice(0, 5);
  return { type: 'High Card', rank: 0, primaryRankValue: highCardKickers[0], kickerRankValues: highCardKickers };
};

const calculatePreflopEquity = (holeCards: string[], opponents: number): number => {
  // --- START MONTE CARLO SIMULATION FOR PREFLOP ---
  const SIMULATION_COUNT_PREFLOP = 10000; // Can be adjusted
  let preflopWins = 0;
  let preflopTies = 0;

  const knownPreflopCards = [...holeCards];
  let preflopDeck = createDeck();
  preflopDeck = preflopDeck.filter(card => !knownPreflopCards.includes(card));

  for (let i = 0; i < SIMULATION_COUNT_PREFLOP; i++) {
    let currentDeck = [...preflopDeck];
    shuffleArray(currentDeck);

    const opponentHands: string[][] = [];
    for (let j = 0; j < opponents; j++) {
      if (currentDeck.length < 2) break;
      opponentHands.push([currentDeck.pop()!, currentDeck.pop()!]);
    }
    if (opponents > 0 && opponentHands.length !== opponents) continue;


    const communityCardsSim: string[] = [];
    for (let k = 0; k < 5; k++) {
      if (currentDeck.length === 0) break;
      communityCardsSim.push(currentDeck.pop()!);
    }
    if (communityCardsSim.length !== 5) continue;

    const playerHandStrength = evaluateHandStrength([...holeCards, ...communityCardsSim]);

    let playerBeatsAll = true;
    let tiesWithBestOpponentThisRound = 0; // Number of opponents player ties with

    for (const oppHand of opponentHands) {
      const oppStrength = evaluateHandStrength([...oppHand, ...communityCardsSim]);
      const comparison = compareHandStrengths(playerHandStrength, oppStrength);
      if (comparison < 0) {
        playerBeatsAll = false;
        break;
      } else if (comparison === 0) {
        tiesWithBestOpponentThisRound++;
      }
    }

    if (playerBeatsAll) {
      if (tiesWithBestOpponentThisRound > 0) {
        preflopTies += 1 / (tiesWithBestOpponentThisRound + 1); // Player gets 1 share of the tie
      } else {
        preflopWins++;
      }
    }
  }

  if (SIMULATION_COUNT_PREFLOP > 0) {
    const equity = ((preflopWins + preflopTies) / SIMULATION_COUNT_PREFLOP) * 100;
    return Math.max(0, Math.min(100, Math.round(equity)));
  }
  return 50; // Fallback, should ideally not be reached
  // --- END MONTE CARLO SIMULATION FOR PREFLOP ---
};

const calculatePostflopEquity = (
  holeCards: string[],
  communityCards: string[],
  opponents: number
): number => {
  const SIMULATION_COUNT_POSTFLOP = 10000; // Number of simulations to run
  let wins = 0;
  let ties = 0;

  const knownCards = [...holeCards, ...communityCards];
  let deck = createDeck();
  deck = deck.filter(card => !knownCards.includes(card));

  for (let i = 0; i < SIMULATION_COUNT_POSTFLOP; i++) {
    let currentDeck = [...deck];
    shuffleArray(currentDeck);

    const opponentHands: string[][] = [];
    for (let j = 0; j < opponents; j++) {
      if (currentDeck.length < 2) break;
      opponentHands.push([currentDeck.pop()!, currentDeck.pop()!]);
    }
    if (opponents > 0 && opponentHands.length !== opponents) continue;


    const simulatedCommunityCards = [...communityCards];
    const cardsToDraw = 5 - communityCards.length;
    for (let k = 0; k < cardsToDraw; k++) {
      if (currentDeck.length === 0) break;
      simulatedCommunityCards.push(currentDeck.pop()!);
    }
    if (simulatedCommunityCards.length !== 5) continue;


    const playerHandStrength = evaluateHandStrength([...holeCards, ...simulatedCommunityCards]);
    let playerBeatsAll = true;
    let tiesWithBestOpponentThisRound = 0; // Number of opponents player ties with

    for (const oppHand of opponentHands) {
      const oppStrength = evaluateHandStrength([...oppHand, ...simulatedCommunityCards]);
      const comparison = compareHandStrengths(playerHandStrength, oppStrength);
      if (comparison < 0) {
        playerBeatsAll = false;
        break;
      } else if (comparison === 0) {
        tiesWithBestOpponentThisRound++;
      }
    }

    if (playerBeatsAll) {
        if (tiesWithBestOpponentThisRound > 0) {
            ties += 1 / (tiesWithBestOpponentThisRound + 1); // Player gets 1 share of the tie
        } else {
            wins++;
        }
    }
  }

  if (SIMULATION_COUNT_POSTFLOP > 0) {
    const equity = ((wins + ties) / SIMULATION_COUNT_POSTFLOP) * 100;
    return Math.max(0, Math.min(100, Math.round(equity)));
  }
  
  return 0; // Fallback, should ideally not be reached if simulations run
};

// Helper function to create a standard 52-card deck
const createDeck = (): string[] => {
  const suits = ['H', 'D', 'C', 'S']; // Hearts, Diamonds, Clubs, Spades
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  const deck: string[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push(rank + suit);
    }
  }
  return deck;
};

// Helper function to shuffle an array (Fisher-Yates shuffle)
const shuffleArray = <T>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Helper function to compare two hand strengths
// Returns > 0 if hand1 is stronger, < 0 if hand2 is stronger, 0 if equal
export const compareHandStrengths = (hand1: HandStrength, hand2: HandStrength): number => {
  if (hand1.rank !== hand2.rank) {
    return hand1.rank - hand2.rank;
  }
  if (hand1.primaryRankValue !== undefined && hand2.primaryRankValue !== undefined && hand1.primaryRankValue !== hand2.primaryRankValue) {
    return hand1.primaryRankValue - hand2.primaryRankValue;
  }
  if (hand1.secondaryRankValue !== undefined && hand2.secondaryRankValue !== undefined && hand1.secondaryRankValue !== hand2.secondaryRankValue) {
    return hand1.secondaryRankValue - hand2.secondaryRankValue;
  }
  if (hand1.kickerRankValues && hand2.kickerRankValues) {
    for (let i = 0; i < Math.min(hand1.kickerRankValues.length, hand2.kickerRankValues.length); i++) {
      if (hand1.kickerRankValues[i] !== hand2.kickerRankValues[i]) {
        return hand1.kickerRankValues[i] - hand2.kickerRankValues[i];
      }
    }
  }
  return 0; // Hands are identical
};

const getRankValue = (rank: string): number => {
  const rankMap: Record<string, number> = {
    'A': 14, 'K': 13, 'Q': 12, 'J': 11, 'T': 10,
    '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
  };
  if (rank === "10") return 10; // Handle '10' if card format is like '10S'
  return rankMap[rank] || 0;
};
