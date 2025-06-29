
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CardSelector from '@/components/CardSelector';
import PositionSelector from '@/components/PositionSelector';
import GameStage from '@/components/GameStage';
import BettingHistory from '@/components/BettingHistory';
import ProbabilityDisplay from '@/components/ProbabilityDisplay';
import { toast } from '@/hooks/use-toast';

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
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateOdds = async () => {
    if (gameState.holeCards.length !== 2) {
      toast({
        title: "Invalid Input",
        description: "Please select exactly 2 hole cards",
        variant: "destructive"
      });
      return;
    }

    setIsCalculating(true);
    
    // Simulate calculation delay
    setTimeout(() => {
      // Mock calculation - in real implementation this would call the backend
      const mockProbability = Math.floor(Math.random() * 100) + 1;
      setWinProbability(mockProbability);
      setIsCalculating(false);
      
      toast({
        title: "Calculation Complete",
        description: `Win probability: ${mockProbability}%`
      });
    }, 1500);
  };

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
    
    toast({
      title: "Game Reset",
      description: "All inputs have been cleared"
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🃏 Poker Win Probability Advisor
          </h1>
          <p className="text-green-100 text-lg">
            Real-time poker odds calculation and strategic analysis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Game Setup */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hole Cards */}
            <Card className="bg-green-800/50 border-green-600 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  🂠 Your Hole Cards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardSelector
                  selectedCards={gameState.holeCards}
                  onCardsChange={(cards) => setGameState(prev => ({ ...prev, holeCards: cards }))}
                  maxCards={2}
                  label="Select your 2 hole cards"
                />
              </CardContent>
            </Card>

            {/* Community Cards */}
            <Card className="bg-green-800/50 border-green-600 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  🃏 Community Cards
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GameStage
                  gameState={gameState}
                  onGameStateChange={setGameState}
                />
              </CardContent>
            </Card>

            {/* Position & Opponents */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-green-800/50 border-green-600 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    🎯 Position
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PositionSelector
                    position={gameState.position}
                    onPositionChange={(position) => setGameState(prev => ({ ...prev, position }))}
                  />
                </CardContent>
              </Card>

              <Card className="bg-green-800/50 border-green-600 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    👥 Opponents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <label className="text-green-100 text-sm">Number of opponents:</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <Button
                          key={num}
                          variant={gameState.opponents === num ? "default" : "outline"}
                          size="sm"
                          onClick={() => setGameState(prev => ({ ...prev, opponents: num }))}
                          className={gameState.opponents === num 
                            ? "bg-yellow-600 hover:bg-yellow-700 text-white" 
                            : "border-green-400 text-green-100 hover:bg-green-700"
                          }
                        >
                          {num}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Betting History */}
            <Card className="bg-green-800/50 border-green-600 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  💰 Betting & Pot Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <BettingHistory
                  gameState={gameState}
                  onGameStateChange={setGameState}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Probability Display & Actions */}
          <div className="space-y-6">
            <ProbabilityDisplay
              probability={winProbability}
              isCalculating={isCalculating}
              gameState={gameState}
            />

            {/* Action Buttons */}
            <div className="space-y-4">
              <Button
                onClick={calculateOdds}
                disabled={isCalculating || gameState.holeCards.length !== 2}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 text-lg"
              >
                {isCalculating ? "Calculating..." : "🎲 Calculate Odds"}
              </Button>

              <Button
                onClick={resetGame}
                variant="outline"
                className="w-full border-red-400 text-red-100 hover:bg-red-900/50"
              >
                🔄 Reset Game
              </Button>
            </div>

            {/* Game Info */}
            <Card className="bg-green-800/50 border-green-600 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white text-sm">Game Status</CardTitle>
              </CardHeader>
              <CardContent className="text-green-100 text-sm space-y-2">
                <div>Stage: <span className="font-semibold capitalize">{gameState.gameStage}</span></div>
                <div>Cards dealt: {gameState.holeCards.length + gameState.communityCards.length}/7</div>
                <div>Pot size: ${gameState.potSize}</div>
                {gameState.position && <div>Position: {gameState.position}</div>}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
