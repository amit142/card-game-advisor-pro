
export interface Insight {
  type: 'positive' | 'warning' | 'negative' | 'neutral';
  category: string;
  message: string;
  recommendation: string;
  priority: number;
}

export const generatePokerInsights = (
  holeCards: string[],
  communityCards: string[],
  position: string,
  opponents: number,
  gameStage: 'preflop' | 'flop' | 'turn' | 'river',
  probability: number
): Insight[] => {
  const insights: Insight[] = [];

  // Hand strength insights
  insights.push(...getHandStrengthInsights(holeCards, communityCards, probability, gameStage));
  
  // Position insights
  insights.push(...getPositionInsights(position, holeCards, gameStage));
  
  // Opponent count insights
  insights.push(...getOpponentInsights(opponents, probability));
  
  // Game stage insights
  insights.push(...getGameStageInsights(gameStage, holeCards, communityCards, probability));
  
  // Board texture insights
  if (communityCards.length > 0) {
    insights.push(...getBoardTextureInsights(communityCards, holeCards));
  }
  
  // Betting strategy insights
  insights.push(...getBettingStrategyInsights(probability, position, opponents, gameStage));

  // Sort by priority and return top insights
  return insights
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 4);
};

const getHandStrengthInsights = (
  holeCards: string[],
  communityCards: string[],
  probability: number,
  gameStage: string
): Insight[] => {
  const insights: Insight[] = [];

  if (holeCards.length !== 2) return insights;

  const [card1, card2] = holeCards;
  const rank1 = card1.slice(0, -1);
  const rank2 = card2.slice(0, -1);
  const suit1 = card1.slice(-1);
  const suit2 = card2.slice(-1);

  // Premium hands
  if (rank1 === rank2) {
    const rankValue = getRankValue(rank1);
    if (rankValue >= 11) {
      insights.push({
        type: 'positive',
        category: 'Hand Strength',
        message: `Premium pocket pair (${rank1}${rank1})`,
        recommendation: 'Raise aggressively for value. This is a premium starting hand.',
        priority: 9
      });
    } else if (rankValue >= 8) {
      insights.push({
        type: 'positive',
        category: 'Hand Strength',
        message: `Strong pocket pair (${rank1}${rank1})`,
        recommendation: 'Play for value but be cautious on scary boards.',
        priority: 7
      });
    } else {
      insights.push({
        type: 'neutral',
        category: 'Hand Strength',
        message: `Small pocket pair (${rank1}${rank1})`,
        recommendation: 'Look to set mine or fold to significant pressure.',
        priority: 5
      });
    }
  }

  // Suited connectors and broadway cards
  if (suit1 === suit2) {
    const highRank = Math.max(getRankValue(rank1), getRankValue(rank2));
    if (highRank >= 10) {
      insights.push({
        type: 'positive',
        category: 'Hand Strength',
        message: 'Suited broadway cards',
        recommendation: 'Good playability and multiple ways to win.',
        priority: 6
      });
    } else {
      insights.push({
        type: 'neutral',
        category: 'Hand Strength',
        message: 'Suited cards with flush potential',
        recommendation: 'Play cautiously but look for flush draws.',
        priority: 4
      });
    }
  }

  // Probability-based insights
  if (probability >= 75) {
    insights.push({
      type: 'positive',
      category: 'Win Probability',
      message: 'Very strong hand!',
      recommendation: 'Bet/raise for value. Extract maximum value.',
      priority: 10
    });
  } else if (probability >= 60) {
    insights.push({
      type: 'positive',
      category: 'Win Probability',
      message: 'Above average hand strength',
      recommendation: 'Consider betting for value or calling reasonable bets.',
      priority: 7
    });
  } else if (probability <= 30) {
    insights.push({
      type: 'warning',
      category: 'Win Probability',
      message: 'Weak hand with low equity',
      recommendation: 'Consider folding unless getting good pot odds.',
      priority: 8
    });
  }

  return insights;
};

const getPositionInsights = (position: string, holeCards: string[], gameStage: string): Insight[] => {
  const insights: Insight[] = [];

  switch (position) {
    case 'BTN':
      insights.push({
        type: 'positive',
        category: 'Position',
        message: 'Button position - maximum advantage',
        recommendation: 'Use position to control pot size and steal blinds.',
        priority: 6
      });
      break;
    case 'CO':
      insights.push({
        type: 'positive',
        category: 'Position',
        message: 'Cut-off position - good stealing position',
        recommendation: 'Consider raising with wider range to steal blinds.',
        priority: 5
      });
      break;
    case 'SB':
      insights.push({
        type: 'warning',
        category: 'Position',
        message: 'Small blind - worst position post-flop',
        recommendation: 'Play tighter range and be more cautious.',
        priority: 7
      });
      break;
    case 'BB':
      insights.push({
        type: 'neutral',
        category: 'Position',
        message: 'Big blind - getting pot odds pre-flop',
        recommendation: 'Defend with wider range but play cautiously post-flop.',
        priority: 5
      });
      break;
    case 'UTG':
      insights.push({
        type: 'warning',
        category: 'Position',
        message: 'Under the gun - early position',
        recommendation: 'Play only premium hands from early position.',
        priority: 6
      });
      break;
  }

  return insights;
};

const getOpponentInsights = (opponents: number, probability: number): Insight[] => {
  const insights: Insight[] = [];

  if (opponents >= 6) {
    insights.push({
      type: 'warning',
      category: 'Opponents',
      message: 'Many opponents in the hand',
      recommendation: 'Tighten range significantly. Someone likely has a strong hand.',
      priority: 8
    });
  } else if (opponents === 1) {
    insights.push({
      type: 'positive',
      category: 'Opponents',
      message: 'Heads-up situation',
      recommendation: 'Play wider range and be more aggressive.',
      priority: 6
    });
  } else if (opponents <= 3) {
    insights.push({
      type: 'neutral',
      category: 'Opponents',
      message: 'Few opponents - good spot for aggression',
      recommendation: 'Can play more hands and be more aggressive.',
      priority: 5
    });
  }

  return insights;
};

const getGameStageInsights = (
  gameStage: string,
  holeCards: string[],
  communityCards: string[],
  probability: number
): Insight[] => {
  const insights: Insight[] = [];

  switch (gameStage) {
    case 'preflop':
      insights.push({
        type: 'neutral',
        category: 'Game Stage',
        message: 'Pre-flop - position and hand selection crucial',
        recommendation: 'Focus on premium hands and position.',
        priority: 4
      });
      break;
    case 'flop':
      insights.push({
        type: 'neutral',
        category: 'Game Stage',
        message: 'Flop - most important betting round',
        recommendation: 'Evaluate hand strength and draws carefully.',
        priority: 5
      });
      break;
    case 'turn':
      insights.push({
        type: 'warning',
        category: 'Game Stage',
        message: 'Turn - pot sizes getting larger',
        recommendation: 'Be more selective with bluffs and draws.',
        priority: 6
      });
      break;
    case 'river':
      insights.push({
        type: 'warning',
        category: 'Game Stage',
        message: 'River - no more cards coming',
        recommendation: 'Only bet/call with strong made hands.',
        priority: 7
      });
      break;
  }

  return insights;
};

const getBoardTextureInsights = (communityCards: string[], holeCards: string[]): Insight[] => {
  const insights: Insight[] = [];

  if (communityCards.length < 3) return insights;

  const ranks = communityCards.map(card => getRankValue(card.slice(0, -1)));
  const suits = communityCards.map(card => card.slice(-1));

  // Check for pairs on board
  const rankCounts = ranks.reduce((acc, rank) => {
    acc[rank] = (acc[rank] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  if (Object.values(rankCounts).some(count => count >= 2)) {
    insights.push({
      type: 'warning',
      category: 'Board Texture',
      message: 'Paired board - full house possible',
      recommendation: 'Be cautious with two pair and sets.',
      priority: 6
    });
  }

  // Check for flush possibilities
  const suitCounts = suits.reduce((acc, suit) => {
    acc[suit] = (acc[suit] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (Object.values(suitCounts).some(count => count >= 3)) {
    insights.push({
      type: 'warning',
      category: 'Board Texture',
      message: 'Flush draw possible on board',
      recommendation: 'Be aware of flush possibilities.',
      priority: 5
    });
  }

  // Check for straight possibilities
  const sortedRanks = [...new Set(ranks)].sort((a, b) => a - b);
  let maxGap = 0;
  for (let i = 0; i < sortedRanks.length - 1; i++) {
    const gap = sortedRanks[i + 1] - sortedRanks[i];
    if (gap <= 4) maxGap = Math.max(maxGap, gap);
  }

  if (maxGap <= 4 && sortedRanks.length >= 3) {
    insights.push({
      type: 'warning',
      category: 'Board Texture',
      message: 'Coordinated board - straight draws possible',
      recommendation: 'Be cautious of straight possibilities.',
      priority: 5
    });
  }

  return insights;
};

const getBettingStrategyInsights = (
  probability: number,
  position: string,
  opponents: number,
  gameStage: string
): Insight[] => {
  const insights: Insight[] = [];

  if (probability >= 70) {
    insights.push({
      type: 'positive',
      category: 'Strategy',
      message: 'Strong hand - value betting spot',
      recommendation: 'Bet/raise for value. Build the pot with strong hands.',
      priority: 8
    });
  } else if (probability >= 45 && (position === 'BTN' || position === 'CO')) {
    insights.push({
      type: 'neutral',
      category: 'Strategy',
      message: 'Decent hand in good position',
      recommendation: 'Consider semi-bluffing or thin value betting.',
      priority: 6
    });
  } else if (probability <= 25 && opponents >= 3) {
    insights.push({
      type: 'negative',
      category: 'Strategy',
      message: 'Weak hand against multiple opponents',
      recommendation: 'Fold unless getting excellent pot odds.',
      priority: 9
    });
  }

  // Bluffing opportunities
  if (probability <= 35 && position === 'BTN' && opponents <= 2) {
    insights.push({
      type: 'neutral',
      category: 'Strategy',
      message: 'Potential bluffing spot',
      recommendation: 'Consider bluffing from position against few opponents.',
      priority: 5
    });
  }

  return insights;
};

const getRankValue = (rank: string): number => {
  const rankMap: Record<string, number> = {
    'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10,
    '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
  };
  return rankMap[rank] || 0;
};
