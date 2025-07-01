import React from 'react';
import { getAvailablePositions } from '@/pages/Index'; // Adjust path as needed

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
    return <div className="text-center text-sm text-gray-500 py-4">Select number of opponents to see positions.</div>;
  }

  const tableWidth = 300; // Corresponds to .poker-table width in CSS
  const tableHeight = 180; // Corresponds to .poker-table height in CSS
  const seatWidth = 55; // Approximate width of a seat
  const seatHeight = 38; // Approximate height of a seat

  // Calculate positions for seats in an oval shape
  const getSeatStyle = (index: number, totalSeats: number): React.CSSProperties => {
    if (totalSeats === 0) return {};

    // For 2 players (Heads Up), place them opposite each other vertically
    if (totalSeats === 2) {
      const yOffset = tableHeight / 4; // Adjust for better vertical spacing
      return {
        left: `calc(50% - ${seatWidth / 2}px)`,
        top: index === 0 ? `${yOffset - seatHeight / 2}px` : `calc(100% - ${yOffset + seatHeight / 2}px)`,
        transform: 'translate(0, 0)', // No translation needed from center for left
      };
    }

    // General case for more than 2 players, arrange in an oval
    // Angle step, ensuring seats don't start exactly at 0 degrees (right middle) if it looks odd.
    // Start from top (-90 degrees or -PI/2) and go clockwise.
    const angleOffset = -Math.PI / 2;
    const angleStep = (2 * Math.PI) / totalSeats;
    const angle = angleOffset + index * angleStep;

    // Elliptical distribution
    // Make radius slightly smaller than half table dimensions to keep seats within the border
    const xRadius = (tableWidth / 2) - (seatWidth / 1.5) ; // Adjusted for seat width
    const yRadius = (tableHeight / 2) - (seatHeight / 1.5); // Adjusted for seat height

    let x = xRadius * Math.cos(angle);
    let y = yRadius * Math.sin(angle);

    // Adjust x for player counts like 3, 4, 5 to spread more horizontally
    if (totalSeats === 3 || totalSeats === 4 || totalSeats === 5) {
        // For 3 players, slightly adjust the bottom player to be centered
        if (totalSeats === 3 && index === 1) { // Assuming BB is index 1 and should be bottom center
             x = 0; // Center the BB
        }
         // For 4 players, try to make it more rectangular/diamond
        if (totalSeats === 4) {
            const factor = 1.2; // Stretch horizontal for 4 players
            if (index === 0 || index === 2) x *= factor; // Top/Bottom seats
            else y *= 0.8; // Side seats closer to vertical center
        }
    }


    // Center the coordinates within the table div
    const left = `calc(50% + ${x}px - ${seatWidth / 2}px)`;
    const top = `calc(50% + ${y}px - ${seatHeight / 2}px)`;

    return {
      left,
      top,
      // transform: `translate(-50%, -50%)`, // Center the seat element itself if needed
    };
  };

  return (
    <div className="flex flex-col items-center gap-4 my-2"> {/* Added my-2 for some vertical spacing */}
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
        Select Your Position
      </div>
      <div className="poker-table">
        {availablePositions.map((position, index) => {
          const isCurrent = position === currentPosition;
          const style = getSeatStyle(index, availablePositions.length);

          return (
            <div
              key={position}
              className={`poker-seat ${isCurrent ? 'selected' : ''}`}
              style={style}
              onClick={() => onPositionChange(position)}
              title={position} // Tooltip for full position name
            >
              {position}
            </div>
          );
        })}
      </div>
      {currentPosition && (
        <div className="mt-1 text-sm text-gray-700">
          Selected: <span className="font-semibold text-gray-900">{currentPosition}</span>
        </div>
      )}
    </div>
  );
};

export default PokerTableDisplay;
