
import { useState } from 'react';
import { Button } from '@/components/ui/button';

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
    return suit === '♥' || suit === '♦' ? 'text-red-500' : 'text-black';
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
    <div className="space-y-4">
      <p className="text-green-100 text-sm">{label}</p>
      
      {/* Selected Cards Display */}
      <div className="flex gap-2 min-h-[80px] items-center">
        {selectedCards.map(cardNotation => {
          const { rank, suit } = parseCard(cardNotation);
          return (
            <div
              key={cardNotation}
              className="bg-white rounded-lg p-3 shadow-lg border-2 border-gray-300 w-16 h-20 flex flex-col items-center justify-center cursor-pointer hover:border-red-400 transition-colors"
              onClick={() => toggleCard(rank, suit)}
            >
              <span className="text-xs font-bold text-gray-700">{rank}</span>
              <span className={`text-2xl ${getSuitColor(suit)}`}>{suit}</span>
            </div>
          );
        })}
        
        {/* Empty slots */}
        {Array.from({ length: maxCards - selectedCards.length }).map((_, i) => (
          <div
            key={i}
            className="border-2 border-dashed border-green-400 rounded-lg w-16 h-20 flex items-center justify-center cursor-pointer hover:border-green-300 transition-colors"
            onClick={() => setShowSelector(true)}
          >
            <span className="text-green-300 text-2xl">+</span>
          </div>
        ))}
      </div>

      {/* Card Selector */}
      {showSelector && (
        <div className="bg-white rounded-lg p-4 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Select a card</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSelector(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </Button>
          </div>
          
          <div className="grid grid-cols-13 gap-1">
            {ranks.map(rank => (
              suits.map(suit => {
                const cardNotation = getCardNotation(rank, suit);
                const isSelected = selectedCards.includes(cardNotation);
                const isDisabled = selectedCards.length >= maxCards && !isSelected;
                
                return (
                  <button
                    key={cardNotation}
                    className={`
                      w-8 h-10 text-xs border rounded flex flex-col items-center justify-center
                      ${isSelected 
                        ? 'bg-blue-100 border-blue-400' 
                        : isDisabled 
                          ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
                          : 'bg-white border-gray-300 hover:bg-gray-50'
                      }
                    `}
                    onClick={() => !isDisabled && toggleCard(rank, suit)}
                    disabled={isDisabled}
                  >
                    <span className="text-xs font-bold text-gray-700">{rank}</span>
                    <span className={`text-sm ${getSuitColor(suit)}`}>{suit}</span>
                  </button>
                );
              })
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CardSelector;
