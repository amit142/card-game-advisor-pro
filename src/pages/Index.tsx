
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CardSelector from '@/components/CardSelector';
import PositionSelector from '@/components/PositionSelector';
import GameStage from '@/components/GameStage';
import { Shuffle, RotateCcw } from 'lucide-react';

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

  // Live calculation - runs whenever relevant game state changes
  useEffect(() => {
    if (gameState.holeCards.length === 2) {
      // Simulate calculation with a more realistic algorithm
      const calculateLiveOdds = () => {
        let baseProbability = Math.floor(Math.random() * 40) + 30; // 30-70% base
        
        // Adjust based on cards (simplified)
        const hasAce = gameState.holeCards.some(card => card.startsWith('A'));
        const hasKing = gameState.holeCards.some(card => card.startsWith('K'));
        const isPair = gameState.holeCards[0]?.charAt(0) === gameState.holeCards[1]?.charAt(0);
        
        if (isPair) baseProbability += 15;
        if (hasAce) baseProbability += 10;
        if (hasKing) baseProbability += 5;
        
        // Adjust based on opponents
        baseProbability -= (gameState.opponents - 1) * 3;
        
        // Adjust based on stage
        if (gameState.gameStage !== 'preflop' && gameState.communityCards.length > 0) {
          baseProbability += Math.floor(Math.random() * 20) - 10;
        }
        
        return Math.max(5, Math.min(95, baseProbability));
      };
      
      setWinProbability(calculateLiveOdds());
    } else {
      setWinProbability(null);
    }
  }, [gameState.holeCards, gameState.communityCards, gameState.opponents, gameState.gameStage]);

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
  };

  const getProbabilityColor = (prob: number) => {
    if (prob >= 70) return 'text-emerald-400';
    if (prob >= 50) return 'text-yellow-400';
    if (prob >= 30) return 'text-orange-400';
    return 'text-red-400';
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
