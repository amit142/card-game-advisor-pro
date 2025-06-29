
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
    { name: 'preflop', cards: 0, label: 'Pre' },
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
      <div className="space-y-2">
        <div className="text-sm text-slate-300">Board</div>
        <div className="flex gap-1">
          {stages.map(stage => (
            <Button
              key={stage.name}
              variant={gameState.gameStage === stage.name ? "default" : "ghost"}
              size="sm"
              onClick={() => setGameStage(stage.name as any)}
              className={`h-8 text-xs ${
                gameState.gameStage === stage.name 
                  ? "bg-blue-600 hover:bg-blue-700 text-white" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {stage.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Community Cards */}
      {gameState.gameStage !== 'preflop' && (
        <CardSelector
          selectedCards={gameState.communityCards}
          onCardsChange={onCommunityCardsChange}
          maxCards={getMaxCardsForStage()}
          label=""
        />
      )}

      {gameState.gameStage === 'preflop' && (
        <div className="text-center text-slate-500 py-4 text-sm">
          No community cards yet
        </div>
      )}
    </div>
  );
};

export default GameStage;
