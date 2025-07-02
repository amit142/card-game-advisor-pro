import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Assuming this is the correct path for Select

// Standard poker positions
const POSITIONS_10_MAX = ['SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'MP1', 'LJ', 'HJ', 'CO', 'BTN'];
const POSITIONS_FULL_RING = ['SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN']; // 9-max
const POSITIONS_6_MAX = ['SB', 'BB', 'UTG', 'MP', 'CO', 'BTN'];

// Helper function to get available positions based on the number of players
export const getAvailablePositions = (numberOfPlayers: number): string[] => {
  if (numberOfPlayers < 2) return [];
  if (numberOfPlayers > 10) numberOfPlayers = 10; // Cap at 10 players

  switch (numberOfPlayers) {
    case 2: // Heads Up
      return ['SB', 'BB'];
    case 3: // SB, BB, BTN
      return [POSITIONS_10_MAX[0], POSITIONS_10_MAX[1], POSITIONS_10_MAX[9]]; // SB, BB, BTN from 10-max
    case 4: // SB, BB, CO, BTN
      return [POSITIONS_10_MAX[0], POSITIONS_10_MAX[1], POSITIONS_10_MAX[8], POSITIONS_10_MAX[9]];
    case 5: // SB, BB, UTG, CO, BTN
      return [POSITIONS_10_MAX[0], POSITIONS_10_MAX[1], POSITIONS_10_MAX[2], POSITIONS_10_MAX[8], POSITIONS_10_MAX[9]];
    case 6: // Standard 6-max names
      return POSITIONS_6_MAX;
    case 7: // SB, BB, UTG, UTG+1, HJ, CO, BTN (using 10-max as base for consistency)
      // POSITIONS_10_MAX: ['SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'MP1', 'LJ', 'HJ', 'CO', 'BTN']
      // For 7 players: SB, BB, UTG, UTG+1, HJ, CO, BTN
      return [POSITIONS_10_MAX[0], POSITIONS_10_MAX[1], POSITIONS_10_MAX[2], POSITIONS_10_MAX[3], POSITIONS_10_MAX[7], POSITIONS_10_MAX[8], POSITIONS_10_MAX[9]];
    case 8: // SB, BB, UTG, UTG+1, LJ, HJ, CO, BTN
      return [POSITIONS_10_MAX[0], POSITIONS_10_MAX[1], POSITIONS_10_MAX[2], POSITIONS_10_MAX[3], POSITIONS_10_MAX[6], POSITIONS_10_MAX[7], POSITIONS_10_MAX[8], POSITIONS_10_MAX[9]];
    case 9: // Full ring (9-max)
      return POSITIONS_FULL_RING; // This is POSITIONS_10_MAX without MP1 essentially, or a specific 9-set. Let's use the defined 9-max.
                                // POSITIONS_FULL_RING = ['SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'LJ', 'HJ', 'CO', 'BTN']
                                // For consistency, could derive from POSITIONS_10_MAX by omitting one (e.g. MP1)
                                // For now, using the specific POSITIONS_FULL_RING is fine.
    case 10:
      return POSITIONS_10_MAX;
    default: // Should not be reached if numberOfPlayers is between 2 and 10
      return [];
  }
};
import CardSelector from '@/components/CardSelector';
import PositionSelector from '@/components/PositionSelector';
import GameStage from '@/components/GameStage';

import { RotateCcw, TrendingUp, AlertTriangle, Target, Users, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { calculateWinProbability } from '@/utils/pokerCalculator';
import { generatePokerInsights, type Insight } from '@/utils/pokerInsights';

interface GameState {
  holeCards: string[];
  communityCards: string[];
  position: string;
  opponents: number;
  potSize: number;
  gameStage: 'preflop' | 'flop' | 'turn' | 'river';
  bettingHistory: string[];
  roundOutcomes: Array<'win' | 'lose'>;
}

const Index = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const storedOpponents = localStorage.getItem('opponents');
    const initialOpponents = storedOpponents ? parseInt(storedOpponents, 10) : 2;
    return {
      holeCards: [],
      communityCards: [],
      position: '',
      opponents: initialOpponents,
      potSize: 0,
      gameStage: 'preflop',
      bettingHistory: [],
      roundOutcomes: [],
    };
  });

  const [winProbability, setWinProbability] = useState<number | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);

  // Get all selected cards to prevent duplicates
  const allSelectedCards = [...gameState.holeCards, ...gameState.communityCards];

  // Save opponents to local storage
  useEffect(() => {
    localStorage.setItem('opponents', gameState.opponents.toString());
  }, [gameState.opponents]);

  // Automatic game stage advancement
  useEffect(() => {
    const { holeCards, communityCards, gameStage } = gameState;

    if (holeCards.length === 2 && gameStage === 'preflop') {
      setGameState(prev => ({ ...prev, gameStage: 'flop' }));
    } else if (holeCards.length === 2 && communityCards.length === 3 && gameStage === 'flop') {
      setGameState(prev => ({ ...prev, gameStage: 'turn' }));
    } else if (holeCards.length === 2 && communityCards.length === 4 && gameStage === 'turn') {
      setGameState(prev => ({ ...prev, gameStage: 'river' }));
    }
  }, [gameState.holeCards, gameState.communityCards, gameState.gameStage]);

  // Enhanced live calculation with improved algorithm
  useEffect(() => {
    if (gameState.holeCards.length === 2) {
      const probability = calculateWinProbability(
        gameState.holeCards,
        gameState.communityCards,
        gameState.position,
        gameState.opponents,
        gameState.gameStage
      );
      setWinProbability(probability);
      
      const insights = generatePokerInsights(
        gameState.holeCards,
        gameState.communityCards,
        gameState.position,
        gameState.opponents,
        gameState.gameStage,
        probability
      );
      setInsights(insights);
    } else {
      setWinProbability(null);
      setInsights([]);
    }
  }, [gameState.holeCards, gameState.communityCards, gameState.opponents, gameState.gameStage, gameState.position]);

  const resetGame = () => {
    setGameState(prevState => {
      const numberOfPlayers = prevState.opponents + 1;
      const availablePositions = getAvailablePositions(numberOfPlayers);
      let nextPosition = prevState.position;

      if (availablePositions.length > 0) {
        const currentPositionIndex = availablePositions.indexOf(prevState.position);
        if (currentPositionIndex !== -1) {
          // Current position is valid, find next
          nextPosition = availablePositions[(currentPositionIndex + 1) % availablePositions.length];
        } else {
          // Current position is not in the available list (e.g. num players changed),
          // or no position was set. Default to the first available one.
          nextPosition = availablePositions[0];
        }
      } else {
        // No available positions (e.g., 0 or 1 player), so clear position
        nextPosition = '';
      }

      return {
        ...prevState,
        holeCards: [],
        communityCards: [],
        position: nextPosition, // Set to the next position
        // opponents: prevState.opponents, // This is already preserved by ...prevState
        potSize: 0,
        gameStage: 'preflop',
        bettingHistory: []
      };
    });

    setWinProbability(null);
    setInsights([]);
  };

  const hardResetGame = () => {
    setGameState({
      holeCards: [],
      communityCards: [],
      position: 'SB', // Default for 5 players (Hero + 4 opponents)
      opponents: 4,    // Default opponents
      potSize: 0,
      gameStage: 'preflop',
      bettingHistory: [],
      roundOutcomes: [], // Clear round outcomes on hard reset

    });
    setWinProbability(null);
    setInsights([]);
    // Ensure localStorage for opponents is also updated to the default
    localStorage.setItem('opponents', '4');
  };

  const handleWin = () => {
    setGameState(prev => ({
      ...prev,
      roundOutcomes: [...prev.roundOutcomes, 'win'],
    }));
    resetGame(); // Proceed to next round
  };

  const handleLose = () => {
    setGameState(prev => ({
      ...prev,
      roundOutcomes: [...prev.roundOutcomes, 'lose'],
    }));
    resetGame(); // Proceed to next round
  };

  const getProbabilityColor = (prob: number) => {
    if (prob >= 70) return 'text-emerald-500';
    if (prob >= 55) return 'text-blue-500';
    if (prob >= 40) return 'text-amber-500';
    if (prob >= 25) return 'text-orange-500';
    return 'text-red-500';
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'negative': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'neutral': return <Target className="w-4 h-4 text-blue-500" />;
      default: return <Target className="w-4 h-4 text-gray-500" />;
    }
  };

  const getInsightBgColor = (type: string) => {
    switch (type) {
      case 'positive': return 'bg-emerald-50/80 border border-emerald-100';
      case 'warning': return 'bg-amber-50/80 border border-amber-100';
      case 'negative': return 'bg-red-50/80 border border-red-100';
      case 'neutral': return 'bg-blue-50/80 border border-blue-100';
      default: return 'bg-gray-50/80 border border-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Hand Strength': return '🃏';
      case 'Position': return '📍';
      case 'Opponents': return '👥';
      case 'Win Probability': return '🎯';
      case 'Board Texture': return '📋';
      case 'Strategy': return '🧠';
      case 'Game Stage': return '⏱️';
      default: return '💡';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground"> {/* CORRECTED: Use theme variables */}
      <div className="max-w-sm mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-2xl">🃏</div>
          <div className="space-y-0.5">
            <div className="text-lg font-semibold text-gray-900 tracking-tight">Poker Pro</div>
            <div className="text-xs text-gray-500 font-medium">Advanced probability & insights</div>
          </div>
        </div>

        {/* Win Probability Display */}
        <Card className="bg-white/90 border-0 shadow-lg shadow-black/3 rounded-2xl overflow-hidden">
          <CardContent className="p-6 text-center">
            {winProbability !== null ? (
              <div className="space-y-3">
                <div className={`text-4xl font-light tracking-tight ${getProbabilityColor(winProbability)}`}>
                  {winProbability}%
                </div>
                <div className="text-xs text-gray-500 font-medium tracking-wider uppercase">Win Probability</div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-1000 ease-out ${
                      winProbability >= 70 ? 'bg-emerald-500' :
                      winProbability >= 55 ? 'bg-blue-500' :
                      winProbability >= 40 ? 'bg-amber-500' :
                      winProbability >= 25 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${winProbability}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 font-medium">
                  <span>vs {gameState.opponents} opponent{gameState.opponents > 1 ? 's' : ''}</span>
                  <span className="capitalize">{gameState.gameStage}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                  <div className="text-lg">🎯</div>
                </div>
                <div className="text-sm text-gray-500 font-medium">Select your cards</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Insights */}
        {insights.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <div className="text-sm font-semibold text-gray-700">💡 Smart Insights</div>
              <div className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {insights.length}
              </div>
            </div>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <Card 
                  key={index}
                  className={`${getInsightBgColor(insight.type)} shadow-sm rounded-xl overflow-hidden`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex items-center gap-1">
                        <span className="text-sm">{getCategoryIcon(insight.category)}</span>
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {insight.category}
                          </div>
                          <div className="text-xs text-gray-400 font-medium">
                            Priority: {insight.priority}/10
                          </div>
                        </div>
                        <div className="font-medium text-gray-900 text-sm leading-snug">
                          {insight.message}
                        </div>
                        <div className="text-gray-600 text-xs leading-relaxed">
                          {insight.recommendation}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Hole Cards */}
        <Card className="bg-white/90 border-0 shadow-lg shadow-black/3 rounded-2xl">
          <CardContent className="p-5">
            <div className="text-sm font-semibold text-gray-700 mb-3">Your Cards</div>
            <CardSelector
              selectedCards={gameState.holeCards}
              onCardsChange={(cards) => setGameState(prev => ({ ...prev, holeCards: cards }))}
              maxCards={2}
              label=""
              allSelectedCards={allSelectedCards}
            />
          </CardContent>
        </Card>

        {/* Game Stage & Community Cards */}
        <Card className="bg-white/90 border-0 shadow-lg shadow-black/3 rounded-2xl">
          <CardContent className="p-5">
            <GameStage
              gameState={gameState}
              onGameStateChange={setGameState}
              allSelectedCards={allSelectedCards}
            />
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="bg-white/90 border-0 shadow-lg shadow-black/3 rounded-2xl">
          <CardContent className="p-5 space-y-5">
            <div className="text-sm font-semibold text-gray-700">Game Settings</div>
            
            {/* Opponents */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Opponents: {gameState.opponents}
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <Button
                    key={num}
                    variant={gameState.opponents === num ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGameState(prev => ({ ...prev, opponents: num }))}
                    // Base classes for layout, plus specific dark mode overrides for the outline (unselected) state
                    className={`h-9 rounded-lg font-medium transition-all duration-200 ${
                      gameState.opponents !== num
                        ? 'dark:bg-neutral-700 dark:text-neutral-200 dark:border-neutral-600 dark:hover:bg-neutral-600'
                        : '' // The 'default' variant (selected) should handle its own dark theming
                    }`}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>

            {/* Position */}
            <PositionSelector
              position={gameState.position}
              onPositionChange={(position) => setGameState(prev => ({ ...prev, position }))}
              numberOfPlayers={gameState.opponents + 1} // hero + opponents
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleWin}
            variant="outline"
            className="h-11 font-medium rounded-xl shadow-sm transition-all duration-200 border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600"
          >
            <ThumbsUp className="w-4 h-4 mr-2" />
            WIN
          </Button>
          <Button
            onClick={handleLose}
            variant="outline"
            className="h-11 font-medium rounded-xl shadow-sm transition-all duration-200 border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600"
          >
            <ThumbsDown className="w-4 h-4 mr-2" />
            LOSE
          </Button>
          <Button
            onClick={resetGame}
            variant="outline"
            className="h-11 bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-700 font-medium rounded-xl shadow-sm transition-all duration-200"

          >
            <RotateCcw className="w-4 h-4 mr-2" />
            NEXT ROUND
          </Button>
          <Button
            onClick={hardResetGame}
            variant="destructive"
            className="h-11 font-medium rounded-xl shadow-sm transition-all duration-200"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            RESET
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
