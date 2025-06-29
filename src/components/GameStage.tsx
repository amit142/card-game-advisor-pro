
import { Button } from '@/components/ui/button';
import CardSelector from './CardSelector';

interface GameState {
  holeCards: string[];
  communityCards: string[];
  position: string;
  opponents: number;
  potSize: number;
  gameStage: 'preflop' | 'flop' | 'turn' | 'river';
  bettingHistory: string[];
}

interface GameStageProps {
  gameState: GameState;
  onGameStateChange: (gameState: GameState) => void;
}

const GameStage = ({ gameState, onGameStateChange }: GameStageProps) => {
  const stages = [
    { name: 'preflop', cards: 0, label: 'Pre-flop' },
    { name: 'flop', cards: 3, label: 'Flop' },
    { name: 'turn', cards: 4, label: 'Turn' },
    { name: 'river', cards: 5, label: 'River' }
  ];

  const setGameStage = (stage: 'preflop' | 'flop' | 'turn' | 'river') => {
    const stageInfo = stages.find(s => s.name === stage);
    if (!stageInfo) return;

    const newCommunityCards = gameState.communityCards.slice(0, stageInfo.cards);
    
    onGameStateChange({
      ...gameState,
      gameStage: stage,
      communityCards: newCommunityCards
    });
  };

  const onCommunityCardsChange = (cards: string[]) => {
    onGameStateChange({
      ...gameState,
      communityCards: cards
    });
  };

  const getMaxCardsForStage = () => {
    const currentStage = stages.find(s => s.name === gameState.gameStage);
    return currentStage?.cards || 0;
  };

  return (
    <div className="space-y-4">
      {/* Stage Selector */}
      <div className="flex gap-2 justify-center">
        {stages.map(stage => (
          <Button
            key={stage.name}
            variant={gameState.gameStage === stage.name ? "default" : "outline"}
            size="sm"
            onClick={() => setGameStage(stage.name as any)}
            className={gameState.gameStage === stage.name 
              ? "bg-yellow-600 hover:bg-yellow-700 text-white" 
              : "border-green-400 text-green-100 hover:bg-green-700"
            }
          >
            {stage.label}
          </Button>
        ))}
      </div>

      {/* Community Cards */}
      {gameState.gameStage !== 'preflop' && (
        <div>
          <CardSelector
            selectedCards={gameState.communityCards}
            onCardsChange={onCommunityCardsChange}
            maxCards={getMaxCardsForStage()}
            label={`Select ${getMaxCardsForStage()} community cards for ${gameState.gameStage}`}
          />
        </div>
      )}

      {gameState.gameStage === 'preflop' && (
        <div className="text-center text-green-200 py-8">
          <p>🃏 Pre-flop stage - No community cards dealt yet</p>
        </div>
      )}
    </div>
  );
};

export default GameStage;
