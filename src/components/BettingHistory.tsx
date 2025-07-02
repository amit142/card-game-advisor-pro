
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface GameState {
  holeCards: string[];
  communityCards: string[];
  position: string;
  opponents: number;
  potSize: number;
  gameStage: 'preflop' | 'flop' | 'turn' | 'river';
  bettingHistory: string[];
}

interface BettingHistoryProps {
  gameState: GameState;
  onGameStateChange: (gameState: GameState) => void;
}

const BettingHistory = ({ gameState, onGameStateChange }: BettingHistoryProps) => {
  const [potInput, setPotInput] = useState(gameState.potSize.toString());

  // Using variants for buttons now, colors will be handled by theme.
  // We can map action names to variants if needed, or use a consistent variant.
  const bettingActions = [
    { name: 'Check', variant: 'secondary' as const },
    { name: 'Call', variant: 'secondary' as const },
    { name: 'Bet', variant: 'secondary' as const },
    { name: 'Raise', variant: 'secondary' as const },
    { name: 'Fold', variant: 'destructive' as const } // Or outline/secondary
  ];

  const addBettingAction = (action: string) => {
    onGameStateChange({
      ...gameState,
      bettingHistory: [...gameState.bettingHistory, action]
    });
  };

  const clearBettingHistory = () => {
    onGameStateChange({
      ...gameState,
      bettingHistory: []
    });
  };

  const updatePotSize = (value: string) => {
    setPotInput(value);
    const numValue = parseFloat(value) || 0;
    onGameStateChange({
      ...gameState,
      potSize: numValue
    });
  };

  return (
    <div className="space-y-4">
      {/* Pot Size */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Current Pot Size ($):</label>
        <Input
          type="number"
          value={potInput}
          onChange={(e) => updatePotSize(e.target.value)}
          placeholder="Enter pot size"
          // Removed custom classes to allow default Input theming
        />
      </div>

      {/* Betting Actions */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Add betting action:</label>
        <div className="flex flex-wrap gap-2">
          {bettingActions.map(action => (
            <Button
              key={action.name}
              size="sm"
              variant={action.variant} // Use defined variant
              onClick={() => addBettingAction(action.name)}
              // text-white might be okay for most variants, or rely on variant's default text color
            >
              {action.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Betting History Display */}
      {gameState.bettingHistory.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-foreground">Betting History:</label>
            <Button
              size="sm"
              variant="ghost" // Ghost variant is good for less prominent actions
              onClick={clearBettingHistory}
              className="text-destructive hover:text-destructive/90" // Use destructive theme color
            >
              Clear
            </Button>
          </div>
          <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded border border-border max-h-32 overflow-y-auto">
            <div className="flex flex-wrap gap-1">
              {gameState.bettingHistory.map((action, index) => (
                <span
                  key={index}
                  className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs"
                >
                  {action}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BettingHistory;
