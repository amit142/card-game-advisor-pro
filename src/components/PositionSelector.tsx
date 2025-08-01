import PokerTableDisplay from './PokerTableDisplay'; // Import the new component

interface PositionSelectorProps {
  position: string;
  onPositionChange: (position: string) => void;
  numberOfPlayers: number; // Added numberOfPlayers prop
}

const PositionSelector = ({ position, onPositionChange, numberOfPlayers }: PositionSelectorProps) => {
  // const positions = [
  //   { name: 'UTG', fullName: 'Under Gun' },
  //   { name: 'MP', fullName: 'Middle' },
  //   { name: 'CO', fullName: 'Cut-off' },
  //   { name: 'BTN', fullName: 'Button' },
  //   { name: 'SB', fullName: 'Small Blind' },
  //   { name: 'BB', fullName: 'Big Blind' }
  // ];

  return (
    <div className="space-y-3">
      {/* The PokerTableDisplay will show its own title and selected position info */}
      {/* <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        Position: {position || 'None'}
      </div> */}
      
      <PokerTableDisplay
        numberOfPlayers={numberOfPlayers}
        currentPosition={position}
        onPositionChange={onPositionChange}
      />

      {/* Old button layout commented out: */}
      {/* <div className="grid grid-cols-3 gap-2">
        {positions.map(pos => (
          <Button
            key={pos.name}
            variant={position === pos.name ? "default" : "outline"}
            size="sm"
            onClick={() => onPositionChange(pos.name)}
            className={`h-10 text-xs font-medium rounded-lg transition-all duration-200 ${
              position === pos.name 
                ? "bg-blue-500 hover:bg-blue-600 text-white shadow-md border-0" 
                : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300"
            }`}
            title={pos.fullName}
          >
            {pos.name}
          </Button>
        ))}
      </div> */}
    </div>
  );
};

export default PositionSelector;
