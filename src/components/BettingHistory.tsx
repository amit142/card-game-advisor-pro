
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

  const bettingActions = [
    { name: 'Check', color: 'bg-blue-600 hover:bg-blue-700' },
    { name: 'Call', color: 'bg-green-600 hover:bg-green-700' },
    { name: 'Bet', color: 'bg-orange-600 hover:bg-orange-700' },
    { name: 'Raise', color: 'bg-red-600 hover:bg-red-700' },
    { name: 'Fold', color: 'bg-gray-600 hover:bg-gray-700' }
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
        <label className="text-green-100 text-sm">Current Pot Size ($):</label>
        <Input
          type="number"
          value={potInput}
          onChange={(e) => updatePotSize(e.target.value)}
          placeholder="Enter pot size"
          className="bg-green-900/50 border-green-600 text-white placeholder:text-green-300"
        />
      </div>

      {/* Betting Actions */}
      <div className="space-y-2">
        <label className="text-green-100 text-sm">Add betting action:</label>
        <div className="flex flex-wrap gap-2">
          {bettingActions.map(action => (
            <Button
              key={action.name}
              size="sm"
              onClick={() => addBettingAction(action.name)}
              className={`${action.color} text-white`}
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
            <label className="text-green-100 text-sm">Betting History:</label>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearBettingHistory}
              className="text-red-300 hover:text-red-200 hover:bg-red-900/50"
            >
              Clear
            </Button>
          </div>
          <div className="bg-green-900/50 p-3 rounded border border-green-700 max-h-32 overflow-y-auto">
            <div className="flex flex-wrap gap-1">
              {gameState.bettingHistory.map((action, index) => (
                <span
                  key={index}
                  className="bg-green-800 text-green-100 px-2 py-1 rounded text-xs"
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
