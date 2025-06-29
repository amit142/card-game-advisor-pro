
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface CardSelectorProps {
  selectedCards: string[];
  onCardsChange: (cards: string[]) => void;
  maxCards: number;
  label: string;
}

const CardSelector = ({ selectedCards, onCardsChange, maxCards, label }: CardSelectorProps) => {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
  
  const [showSelector, setShowSelector] = useState(false);

  const getSuitColor = (suit: string) => {
    return suit === '♥' || suit === '♦' ? 'text-red-400' : 'text-slate-200';
  };

  const getCardNotation = (rank: string, suit: string) => {
    const suitMap: { [key: string]: string } = {
      '♠': 's', '♥': 'h', '♦': 'd', '♣': 'c'
    };
    return rank + suitMap[suit];
  };

  const toggleCard = (rank: string, suit: string) => {
    const cardNotation = getCardNotation(rank, suit);
    
    if (selectedCards.includes(cardNotation)) {
      onCardsChange(selectedCards.filter(card => card !== cardNotation));
    } else if (selectedCards.length < maxCards) {
      onCardsChange([...selectedCards, cardNotation]);
    }
  };

  const parseCard = (cardNotation: string) => {
    const suitMap: { [key: string]: string } = {
      's': '♠', 'h': '♥', 'd': '♦', 'c': '♣'
    };
    const suit = suitMap[cardNotation.slice(-1)];
    const rank = cardNotation.slice(0, -1);
    return { rank, suit };
  };

  return (
    <div className="space-y-3">
      {label && <div className="text-xs text-slate-400">{label}</div>}
      
      {/* Selected Cards Display */}
      <div className="flex gap-2">
        {selectedCards.map(cardNotation => {
          const { rank, suit } = parseCard(cardNotation);
          return (
            <div
              key={cardNotation}
              className="bg-white rounded-lg p-2 shadow-sm border w-12 h-16 flex flex-col items-center justify-center cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => toggleCard(rank, suit)}
            >
              <span className="text-xs font-bold text-slate-700">{rank}</span>
              <span className={`text-lg ${getSuitColor(suit)}`}>{suit}</span>
            </div>
          );
        })}
        
        {/* Empty slots */}
        {Array.from({ length: maxCards - selectedCards.length }).map((_, i) => (
          <Button
            key={i}
            variant="ghost"
            className="border-2 border-dashed border-slate-600 rounded-lg w-12 h-16 p-0 hover:border-slate-500 hover:bg-slate-800"
            onClick={() => setShowSelector(true)}
          >
            <Plus className="w-4 h-4 text-slate-500" />
          </Button>
        ))}
      </div>

      {/* Card Selector Modal */}
      {showSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 rounded-lg p-4 w-full max-w-sm max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-white">Select Card</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSelector(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {suits.map(suit => (
                <div key={suit} className="space-y-1">
                  <div className={`text-center text-sm ${getSuitColor(suit)}`}>{suit}</div>
                  {ranks.map(rank => {
                    const cardNotation = getCardNotation(rank, suit);
                    const isSelected = selectedCards.includes(cardNotation);
                    const isDisabled = selectedCards.length >= maxCards && !isSelected;
                    
                    return (
                      <button
                        key={cardNotation}
                        className={`
                          w-full h-8 text-xs rounded flex items-center justify-center font-medium
                          ${isSelected 
                            ? 'bg-blue-600 text-white' 
                            : isDisabled 
                              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                              : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                          }
                        `}
                        onClick={() => {
                          if (!isDisabled) {
                            toggleCard(rank, suit);
                            if (!isSelected && selectedCards.length + 1 >= maxCards) {
                              setShowSelector(false);
                            }
                          }
                        }}
                        disabled={isDisabled}
                      >
                        {rank}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardSelector;
