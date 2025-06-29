import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CardSelector from '@/components/CardSelector';
import PositionSelector from '@/components/PositionSelector';
import GameStage from '@/components/GameStage';
import { Shuffle, RotateCcw, TrendingUp, AlertTriangle } from 'lucide-react';

interface GameState {
  holeCards: string[];
  communityCards: string[];
  position: string;
  opponents: number;
  potSize: number;
  gameStage: 'preflop' | 'flop' | 'turn' | 'river';
  bettingHistory: string[];
}

interface Insight {
  type: 'positive' | 'warning' | 'negative';
  message: string;
  recommendation: string;
}

const Index = () => {
  const [gameState, setGameState] = useState<GameState>({
    holeCards: [],
    communityCards: [],
    position: '',
    opponents: 2,
    potSize: 0,
    gameStage: 'preflop',
    bettingHistory: []
  });

  const [winProbability, setWinProbability] = useState<number | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);

  // Calculate more realistic probabilities
  const calculateRealisticProbability = (state: GameState): number => {
    if (state.holeCards.length !== 2) return 0;

    const [card1, card2] = state.holeCards;
    const rank1 = card1.slice(0, -1);
    const rank2 = card2.slice(0, -1);
    const suit1 = card1.slice(-1);
    const suit2 = card2.slice(-1);

    // Base probability calculation
    let probability = 15; // Base for random hand

    // Pocket pair bonus
    if (rank1 === rank2) {
      const rankValue = getRankValue(rank1);
      if (rankValue >= 10) probability += 35; // High pairs (TT+)
      else if (rankValue >= 7) probability += 25; // Mid pairs (77-99)
      else probability += 15; // Low pairs (22-66)
    } else {
      // High card combinations
      const highRank = Math.max(getRankValue(rank1), getRankValue(rank2));
      const lowRank = Math.min(getRankValue(rank1), getRankValue(rank2));
      
      if (highRank === 14) probability += 20; // Ace high
      if (highRank === 13) probability += 15; // King high
      if (highRank === 12) probability += 10; // Queen high
      
      // Connected cards
      if (Math.abs(getRankValue(rank1) - getRankValue(rank2)) === 1) {
        probability += 8; // Connected
      }
      
      // Suited bonus
      if (suit1 === suit2) {
        probability += 12; // Suited
      }
    }

    // Position adjustments
    const positionMultiplier = getPositionMultiplier(state.position);
    probability *= positionMultiplier;

    // Opponent count adjustment
    probability -= (state.opponents - 1) * 4;

    // Game stage adjustments
    if (state.gameStage !== 'preflop' && state.communityCards.length > 0) {
      // Simplified board texture analysis
      probability += analyzeBoard(state.holeCards, state.communityCards);
    }

    return Math.max(5, Math.min(85, Math.round(probability)));
  };

  const getRankValue = (rank: string): number => {
    const rankMap: { [key: string]: number } = {
      'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10,
      '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
    };
    return rankMap[rank] || 0;
  };

  const getPositionMultiplier = (position: string): number => {
    const positionMap: { [key: string]: number } = {
      'BTN': 1.15, 'CO': 1.10, 'MP': 1.05, 'UTG': 0.95, 'SB': 0.90, 'BB': 0.85
    };
    return positionMap[position] || 1.0;
  };

  const analyzeBoard = (holeCards: string[], communityCards: string[]): number => {
    // Simplified board analysis - in real implementation this would be much more complex
    let adjustment = 0;
    
    // Check for potential draws/made hands
    const allCards = [...holeCards, ...communityCards];
    const ranks = allCards.map(card => card.slice(0, -1));
    const suits = allCards.map(card => card.slice(-1));
    
    // Pair on board
    const rankCounts = ranks.reduce((acc, rank) => {
      acc[rank] = (acc[rank] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    if (Object.values(rankCounts).some(count => count >= 2)) {
      adjustment += Math.random() * 20 - 10; // -10 to +10
    }
    
    return adjustment;
  };

  const generateInsights = (state: GameState, probability: number): Insight[] => {
    const insights: Insight[] = [];

    // Probability-based insights
    if (probability >= 70) {
      insights.push({
        type: 'positive',
        message: 'Strong hand with high win probability',
        recommendation: 'Consider betting for value or raising'
      });
    } else if (probability >= 50) {
      insights.push({
        type: 'positive',
        message: 'Above-average hand strength',
        recommendation: 'Play cautiously but consider calling'
      });
    } else if (probability <= 25) {
      insights.push({
        type: 'negative',
        message: 'Weak hand with low win probability',
        recommendation: 'Consider folding unless pot odds are favorable'
      });
    }

    // Position-based insights
    if (state.position === 'BTN') {
      insights.push({
        type: 'positive',
        message: 'You have position advantage',
        recommendation: 'Use position to control pot size and betting'
      });
    } else if (state.position === 'SB' || state.position === 'BB') {
      insights.push({
        type: 'warning',
        message: 'You are out of position',
        recommendation: 'Play tighter range and be more cautious'
      });
    }

    // Opponent count insights
    if (state.opponents >= 5) {
      insights.push({
        type: 'warning',
        message: 'Many opponents in the hand',
        recommendation: 'Tighten your range, someone likely has a strong hand'
      });
    } else if (state.opponents === 1) {
      insights.push({
        type: 'positive',
        message: 'Heads-up situation',
        recommendation: 'You can play a wider range and be more aggressive'
      });
    }

    // Hand type insights
    if (state.holeCards.length === 2) {
      const [card1, card2] = state.holeCards;
      const rank1 = card1.slice(0, -1);
      const rank2 = card2.slice(0, -1);
      const suit1 = card1.slice(-1);
      const suit2 = card2.slice(-1);

      if (rank1 === rank2) {
        const rankValue = getRankValue(rank1);
        if (rankValue >= 10) {
          insights.push({
            type: 'positive',
            message: 'Premium pocket pair',
            recommendation: 'Strong hand - consider raising or betting'
          });
        }
      }

      if (suit1 === suit2) {
        insights.push({
          type: 'positive',
          message: 'Suited cards - flush potential',
          recommendation: 'Good drawing potential, especially in position'
        });
      }
    }

    return insights.slice(0, 3); // Limit to 3 insights
  };

  // Live calculation
  useEffect(() => {
    if (gameState.holeCards.length === 2) {
      const probability = calculateRealisticProbability(gameState);
      setWinProbability(probability);
      setInsights(generateInsights(gameState, probability));
    } else {
      setWinProbability(null);
      setInsights([]);
    }
  }, [gameState.holeCards, gameState.communityCards, gameState.opponents, gameState.gameStage, gameState.position]);

  const resetGame = () => {
    setGameState({
      holeCards: [],
      communityCards: [],
      position: '',
      opponents: 2,
      potSize: 0,
      gameStage: 'preflop',
      bettingHistory: []
    });
    setWinProbability(null);
    setInsights([]);
  };

  const getProbabilityColor = (prob: number) => {
    if (prob >= 70) return 'text-emerald-400';
    if (prob >= 50) return 'text-yellow-400';
    if (prob >= 30) return 'text-orange-400';
    return 'text-red-400';
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'negative': return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default: return null;
    }
  };

  const getInsightBgColor = (type: string) => {
    switch (type) {
      case 'positive': return 'bg-green-900/20 border-green-700/50';
      case 'warning': return 'bg-yellow-900/20 border-yellow-700/50';
      case 'negative': return 'bg-red-900/20 border-red-700/50';
      default: return 'bg-slate-900/20 border-slate-700/50';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-2xl font-bold">🃏 Poker Advisor</div>
          <div className="text-slate-400 text-sm">Live probability calculator</div>
        </div>

        {/* Win Probability Display */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-6 text-center">
            {winProbability !== null ? (
              <div className="space-y-2">
                <div className={`text-4xl font-bold ${getProbabilityColor(winProbability)}`}>
                  {winProbability}%
                </div>
                <div className="text-slate-400 text-sm">Win Probability</div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      winProbability >= 70 ? 'bg-emerald-400' :
                      winProbability >= 50 ? 'bg-yellow-400' :
                      winProbability >= 30 ? 'bg-orange-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${winProbability}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Shuffle className="w-8 h-8 mx-auto text-slate-600" />
                <div className="text-slate-500">Select 2 hole cards</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights */}
        {insights.length > 0 && (
          <Card className="bg-slate-900/30 border-slate-700">
            <CardContent className="p-4">
              <div className="text-sm text-slate-300 mb-3">💡 Insights</div>
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${getInsightBgColor(insight.type)}`}
                  >
                    <div className="flex items-start gap-2">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1 text-sm">
                        <div className="font-medium text-slate-200 mb-1">
                          {insight.message}
                        </div>
                        <div className="text-slate-400 text-xs">
                          {insight.recommendation}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hole Cards */}
        <Card className="bg-slate-900/30 border-slate-700">
          <CardContent className="p-4">
            <div className="text-sm text-slate-300 mb-3">Your Cards</div>
            <CardSelector
              selectedCards={gameState.holeCards}
              onCardsChange={(cards) => setGameState(prev => ({ ...prev, holeCards: cards }))}
              maxCards={2}
              label=""
            />
          </CardContent>
        </Card>

        {/* Game Stage & Community Cards */}
        <Card className="bg-slate-900/30 border-slate-700">
          <CardContent className="p-4">
            <GameStage
              gameState={gameState}
              onGameStateChange={setGameState}
            />
          </CardContent>
        </Card>

        {/* Quick Settings */}
        <Card className="bg-slate-900/30 border-slate-700">
          <CardContent className="p-4 space-y-4">
            <div className="text-sm text-slate-300">Settings</div>
            
            {/* Opponents */}
            <div className="space-y-2">
              <div className="text-xs text-slate-400">Opponents: {gameState.opponents}</div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <Button
                    key={num}
                    variant={gameState.opponents === num ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setGameState(prev => ({ ...prev, opponents: num }))}
                    className={`h-8 w-8 p-0 text-xs ${
                      gameState.opponents === num 
                        ? "bg-blue-600 hover:bg-blue-700" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>

            {/* Position */}
            <div className="space-y-2">
              <PositionSelector
                position={gameState.position}
                onPositionChange={(position) => setGameState(prev => ({ ...prev, position }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Reset Button */}
        <Button
          onClick={resetGame}
          variant="outline"
          className="w-full border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  );
};

export default Index;
