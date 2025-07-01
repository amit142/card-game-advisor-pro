import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X } from 'lucide-react';

interface CardSelectorProps {
  selectedCards: string[];
  onCardsChange: (cards: string[]) => void;
  maxCards: number;
  label: string;
  allSelectedCards?: string[];
}

const CardSelector = ({ selectedCards, onCardsChange, maxCards, label, allSelectedCards = [] }: CardSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];

  const getSuitColor = (suit: string) => {
    return suit === '♥' || suit === '♦' ? 'text-red-500' : 'text-gray-900';
  };

  const isCardSelected = (rank: string, suit: string) => {
    return selectedCards.includes(`${rank}${suit}`);
  };

  const isCardUnavailable = (rank: string, suit: string) => {
    const card = `${rank}${suit}`;
    return allSelectedCards.includes(card) && !selectedCards.includes(card);
  };

  const handleCardClick = (rank: string, suit: string) => {
    const card = `${rank}${suit}`;
    
    if (isCardSelected(rank, suit)) {
      onCardsChange(selectedCards.filter(c => c !== card));
    } else if (selectedCards.length < maxCards && !isCardUnavailable(rank, suit)) {
      onCardsChange([...selectedCards, card]);
    }
  };

  const removeCard = (cardToRemove: string) => {
    onCardsChange(selectedCards.filter(card => card !== cardToRemove));
  };

  const formatCardDisplay = (card: string) => {
    const rank = card.slice(0, -1);
    const suit = card.slice(-1);
    return { rank, suit };
  };

  return (
    <div className="space-y-4">
      {/* Selected Cards Display */}
      <div className="flex gap-3 min-h-[60px] items-center">
        {selectedCards.map((card, index) => {
          const { rank, suit } = formatCardDisplay(card);
          return (
            <div
              key={card}
              className="relative bg-white border-2 border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all duration-200 group"
            >
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{rank}</div>
                <div className={`text-xl ${getSuitColor(suit)}`}>{suit}</div>
              </div>
              <button
                onClick={() => removeCard(card)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
        
        {/* Add Card Button */}
        {selectedCards.length < maxCards && (
          <Button
            onClick={() => setIsOpen(true)}
            variant="outline"
            className="h-[60px] w-[48px] border-2 border-dashed border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 rounded-xl transition-all duration-200"
          >
            <div className="text-2xl text-gray-400">+</div>
          </Button>
        )}
      </div>

      {/* Card Picker Modal - Fixed scrolling */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[99999]">
          <div className="w-full max-w-lg bg-white shadow-2xl rounded-2xl max-h-[90vh] flex flex-col">
            {/* Fixed Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-white rounded-t-2xl flex-shrink-0 relative z-[10000]">
              <h3 className="text-xl font-semibold text-gray-900">Select Card</h3>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
                className="h-10 w-10 rounded-full p-0 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="space-y-8">
                {suits.map(suit => (
                  <div key={suit} className="space-y-4">
                    <div className={`text-center font-bold text-2xl ${getSuitColor(suit)}`}>
                      {suit}
                    </div>
                    <div className="grid grid-cols-7 gap-3">
                      {ranks.map(rank => {
                        const isSelected = isCardSelected(rank, suit);
                        const isUnavailable = isCardUnavailable(rank, suit);
                        
                        return (
                          <Button
                            key={`${rank}${suit}`}
                            onClick={() => {
                              handleCardClick(rank, suit);
                              if (!isSelected && selectedCards.length + 1 >= maxCards) {
                                setIsOpen(false);
                              }
                            }}
                            disabled={isSelected || isUnavailable}
                            variant={isSelected ? "secondary" : "outline"}
                            size="sm"
                            className={`h-12 w-12 p-0 text-sm font-bold rounded-lg transition-all duration-200 ${
                              isSelected
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : isUnavailable
                                ? 'bg-red-50 text-red-300 border-red-200 cursor-not-allowed opacity-50'
                                : 'bg-white hover:bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-md'
                            }`}
                          >
                            {rank}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {/* Extra padding at bottom */}
                <div className="h-6"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardSelector;