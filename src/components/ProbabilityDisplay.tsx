
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface GameState {
  holeCards: string[];
  communityCards: string[];
  position: string;
  opponents: number;
  potSize: number;
  gameStage: 'preflop' | 'flop' | 'turn' | 'river';
  bettingHistory: string[];
}

interface ProbabilityDisplayProps {
  probability: number | null;
  isCalculating: boolean;
  gameState: GameState;
}

const ProbabilityDisplay = ({ probability, isCalculating, gameState }: ProbabilityDisplayProps) => {
  const getProbabilityColor = (prob: number) => {
    if (prob >= 70) return 'text-green-500 dark:text-green-400';
    if (prob >= 50) return 'text-yellow-500 dark:text-yellow-400';
    if (prob >= 30) return 'text-orange-500 dark:text-orange-400';
    return 'text-red-500 dark:text-red-400';
  };

  const getProbabilityMessage = (prob: number) => {
    if (prob >= 80) return 'Excellent hand! 🚀';
    if (prob >= 60) return 'Strong hand! 💪';
    if (prob >= 40) return 'Decent hand 👍';
    if (prob >= 25) return 'Marginal hand ⚠️';
    return 'Weak hand 😬';
  };

  return (
    <Card> {/* Removed custom background and border, rely on default Card theming */}
      <CardHeader>
        <CardTitle className="text-card-foreground text-center"> {/* Use card-foreground */}
          🎯 Win Probability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isCalculating ? (
          <div className="text-center space-y-4">
            {/* Assuming dice emoji is fine, or replace with a themed spinner/icon */}
            <div className="animate-spin text-4xl text-primary">🎲</div>
            <p className="text-muted-foreground">Calculating odds...</p>
            <div className="flex space-x-1 justify-center">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        ) : probability !== null ? (
          <div className="text-center space-y-4">
            <div className={`text-6xl font-bold ${getProbabilityColor(probability)}`}>
              {probability}%
            </div>
            <p className="text-lg text-foreground"> {/* Changed from text-green-100 */}
              {getProbabilityMessage(probability)}
            </p>
            <Progress 
              value={probability} 
              className="w-full h-3" // Removed bg-green-900, rely on default Progress theming
            />
            
            {/* Additional insights */}
            <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded text-sm text-muted-foreground space-y-1">
              <div>vs {gameState.opponents} opponent{gameState.opponents > 1 ? 's' : ''}</div>
              <div>Stage: {gameState.gameStage}</div>
              {gameState.position && <div>Position: {gameState.position}</div>}
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4 text-muted-foreground"> {/* Changed from text-green-200 */}
            <div className="text-4xl">🃏</div>
            <p>Select your cards and click "Calculate Odds" to see your win probability</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="border-t border-border pt-4"> {/* Use theme border */}
          <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground"> {/* Changed from text-green-200 */}
            <div>
              <div className="font-semibold text-foreground">Cards Known</div> {/* Make title slightly more prominent */}
              <div>{gameState.holeCards.length + gameState.communityCards.length}/7</div>
            </div>
            <div>
              <div className="font-semibold text-foreground">Pot Odds</div> {/* Make title slightly more prominent */}
              <div>{gameState.potSize > 0 ? `$${gameState.potSize}` : 'N/A'}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProbabilityDisplay;
