import React from 'react';
import { getAvailablePositions } from '@/pages/Index'; // Adjust path as needed
import { Button } from '@/components/ui/button';

interface PokerTableDisplayProps {
  numberOfPlayers: number;
  currentPosition: string;
  onPositionChange: (position: string) => void;
}

const PokerTableDisplay: React.FC<PokerTableDisplayProps> = ({
  numberOfPlayers,
  currentPosition,
  onPositionChange,
}) => {
  const availablePositions = getAvailablePositions(numberOfPlayers);

  if (availablePositions.length === 0) {
    return <div className="text-center text-gray-500">Select number of opponents to see positions.</div>;
  }

  // Helper to get seat class for positioning
  const getSeatPositionClass = (index: number, totalSeats: number): string => {
    if (totalSeats === 2) {
      return `poker-seat-hu-${index}`;
    }
    if (totalSeats === 6) {
      // Use the 6-max positions defined in CSS
      // Ensure order matches ALL_POSITIONS_6_MAX: ['SB', 'BB', 'UTG', 'MP', 'CO', 'BTN']
      // This mapping might need to be smarter if availablePositions isn't always ALL_POSITIONS_6_MAX for 6 players
      return `poker-seat-${index}`;
    }
    // Fallback for other numbers of players - no specific positional CSS class, will stack them
    return '';
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Select Your Position
      </div>
      <div className="poker-table">
        {availablePositions.map((position, index) => {
          const isCurrent = position === currentPosition;
          const positionClass = getSeatPositionClass(index, availablePositions.length);

          return (
            <Button
              key={position}
              variant={isCurrent ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPositionChange(position)}
              className={`poker-seat ${positionClass} ${isCurrent ? 'ring-2 ring-offset-2 ring-blue-500' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              // title={position} // Tooltip for full position name if needed
            >
              {position}
            </Button>
          );
        })}
      </div>
      {currentPosition && (
        <div className="mt-1 text-xs text-gray-600">
          Position: <span className="font-semibold text-gray-800">{currentPosition}</span>
        </div>
      )}
      {availablePositions.length > 0 && availablePositions.length !== 2 && availablePositions.length !== 6 && (
        <div className="mt-1 text-xs text-amber-600">
          Visual table layout is optimized for 2 or 6 players. Other counts are listed linearly.
        </div>
      )}
    </div>
  );
};

export default PokerTableDisplay;
