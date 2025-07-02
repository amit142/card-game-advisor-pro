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
      return [POSITIONS_10_MAX[0], POSITIONS_10_MAX[1], POSITIONS_10_MAX[2], POSITIONS_10_MAX[3], POSITIONS_10_MAX[7], POSITIONS_10_MAX[8], POSITIONS_10_MAX[9]];
    case 8: // SB, BB, UTG, UTG+1, LJ, HJ, CO, BTN
      return [POSITIONS_10_MAX[0], POSITIONS_10_MAX[1], POSITIONS_10_MAX[2], POSITIONS_10_MAX[3], POSITIONS_10_MAX[6], POSITIONS_10_MAX[7], POSITIONS_10_MAX[8], POSITIONS_10_MAX[9]];
    case 9: // Full ring (9-max)
      return POSITIONS_FULL_RING;
    case 10:
      return POSITIONS_10_MAX;
    default:
      return [];
  }
};
import CardSelector from '@/components/CardSelector';
import PositionSelector from '@/components/PositionSelector';
import GameStage from '@/components/GameStage';
import { RotateCcw, TrendingUp, AlertTriangle, Target, Users } from 'lucide-react';
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
      bettingHistory: []
    };
  });

  const [winProbability, setWinProbability] = useState<number | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);

  const allSelectedCards = [...gameState.holeCards, ...gameState.communityCards];

  useEffect(() => {
    localStorage.setItem('opponents', gameState.opponents.toString());
  }, [gameState.opponents]);

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
          nextPosition = availablePositions[(currentPositionIndex + 1) % availablePositions.length];
        } else {
          nextPosition = availablePositions[0];
        }
      } else {
        nextPosition = '';
      }

      return {
        ...prevState,
        holeCards: [],
        communityCards: [],
        position: nextPosition,
        potSize: 0,
        gameStage: 'preflop',
        bettingHistory: []
      };
    });
    setWinProbability(null);
    setInsights([]);
  };

  const getProbabilityColor = (prob: number) => {
    // These colors might need dark mode specific versions if they don't contrast well.
    // For now, keeping them as is, assuming they are chosen for general visibility.
    if (prob >= 70) return 'text-emerald-500 dark:text-emerald-400';
    if (prob >= 55) return 'text-blue-500 dark:text-blue-400';
    if (prob >= 40) return 'text-amber-500 dark:text-amber-400';
    if (prob >= 25) return 'text-orange-500 dark:text-orange-400';
    return 'text-red-500 dark:text-red-400';
  };

  const getInsightIcon = (type: string) => {
    // Added dark mode variants for icon colors
    switch (type) {
      case 'positive': return <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
      case 'negative': return <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400" />;
      case 'neutral': return <Target className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
      default: return <Target className="w-4 h-4 text-gray-500 dark:text-gray-400" />;
    }
  };

  // Removed getInsightBgColor as Card backgrounds should be handled by Card's default theming.
  // If specific insight card background colors are needed, this function would need to return
  // theme-aware classes (e.g., with dark: variants for background and border).

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
    <div className="min-h-screen bg-background text-foreground"> {/* Use CSS variables via Tailwind utilities */}
      <div className="max-w-sm mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-2xl">🃏</div>
          <div className="space-y-0.5">
            <div className="text-lg font-semibold tracking-tight">Poker Pro</div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Advanced probability & insights</div>
          </div>
        </div>

        {/* Win Probability Display */}
        <Card className="shadow-lg rounded-2xl overflow-hidden">
          <CardContent className="p-6 text-center">
            {winProbability !== null ? (
              <div className="space-y-3">
                <div className={`text-4xl font-light tracking-tight ${getProbabilityColor(winProbability)}`}>
                  {winProbability}%
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium tracking-wider uppercase">Win Probability</div>
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-1000 ease-out ${
                      winProbability >= 70 ? 'bg-emerald-500 dark:bg-emerald-600' :
                      winProbability >= 55 ? 'bg-blue-500 dark:bg-blue-600' :
                      winProbability >= 40 ? 'bg-amber-500 dark:bg-amber-600' :
                      winProbability >= 25 ? 'bg-orange-500 dark:bg-orange-600' : 'bg-red-500 dark:bg-red-600'
                    }`}
                    style={{ width: `${winProbability}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                  <span>vs {gameState.opponents} opponent{gameState.opponents > 1 ? 's' : ''}</span>
                  <span className="capitalize">{gameState.gameStage}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 mx-auto bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                  <div className="text-lg">🎯</div>
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Select your cards</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Insights */}
        {insights.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">💡 Smart Insights</div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                {insights.length}
              </div>
            </div>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <Card 
                  key={index}
                  className="shadow-sm rounded-xl overflow-hidden" // Rely on default Card bg/fg from index.css
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex items-center gap-1">
                        <span className="text-sm">{getCategoryIcon(insight.category)}</span>
                        {getInsightIcon(insight.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                            {insight.category}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                            Priority: {insight.priority}/10
                          </div>
                        </div>
                        <div className="font-medium text-neutral-900 dark:text-neutral-100 text-sm leading-snug">
                          {insight.message}
                        </div>
                        <div className="text-neutral-600 dark:text-neutral-300 text-xs leading-relaxed">
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
        <Card className="shadow-lg rounded-2xl">
          <CardContent className="p-5">
            <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Your Cards</div>
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
        <Card className="shadow-lg rounded-2xl">
          <CardContent className="p-5">
            {/* Assuming GameStage component internals are theme-aware or use themed sub-components */}
            <GameStage
              gameState={gameState}
              onGameStateChange={setGameState}
              allSelectedCards={allSelectedCards}
            />
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="shadow-lg rounded-2xl">
          <CardContent className="p-5 space-y-5">
            <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Game Settings</div>
            
            {/* Opponents */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                <div className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
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
                    // Relying on shadcn/ui Button variants to be theme-aware
                    className="h-9 rounded-lg font-medium transition-all duration-200"
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>

            {/* Position */}
            {/* Assuming PositionSelector internals are theme-aware */}
            <PositionSelector
              position={gameState.position}
              onPositionChange={(position) => setGameState(prev => ({ ...prev, position }))}
              numberOfPlayers={gameState.opponents + 1}
            />
          </CardContent>
        </Card>

        {/* Reset Button */}
        <Button
          onClick={resetGame}
          variant="outline" // Relying on Button variant to be theme-aware
          className="w-full h-11 font-medium rounded-xl shadow-sm transition-all duration-200"
        >
          <RotateCcw className="w-4 h-4 mr-2" /> {/* Icon inherits text color from button */}
          Reset Game
        </Button>
      </div>
    </div>
  );
};

export default Index;
