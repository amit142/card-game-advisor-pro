
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
  allSelectedCards: string[];
}

const GameStage = ({ gameState, onGameStateChange, allSelectedCards }: GameStageProps) => {
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
    <div className="space-y-6">
      {/* Stage Selector */}
      <div className="space-y-3">
        <div className="text-sm font-semibold text-foreground">Board</div> {/* Themed */}
        <div className="flex gap-2">
          {stages.map(stage => (
            <Button
              key={stage.name}
              variant={gameState.gameStage === stage.name ? "default" : "outline"}
              size="sm"
              onClick={() => setGameStage(stage.name as any)}
              className={`h-10 text-xs font-medium rounded-lg transition-all duration-200 flex-1 ${
                gameState.gameStage !== stage.name
                  ? 'dark:bg-neutral-700 dark:text-neutral-200 dark:border-neutral-600 dark:hover:bg-neutral-600'
                  : '' // Selected 'default' variant handles its own dark theming
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
          allSelectedCards={allSelectedCards}
        />
      )}

      {gameState.gameStage === 'preflop' && (
        <div className="text-center text-muted-foreground py-6 text-sm font-medium"> {/* Themed */}
          No community cards yet
        </div>
      )}
    </div>
  );
};

export default GameStage;
