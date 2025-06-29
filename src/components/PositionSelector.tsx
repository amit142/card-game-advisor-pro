
import { Button } from '@/components/ui/button';

interface PositionSelectorProps {
  position: string;
  onPositionChange: (position: string) => void;
}

const PositionSelector = ({ position, onPositionChange }: PositionSelectorProps) => {
  const positions = [
    { name: 'UTG', fullName: 'Under the Gun', description: 'First to act pre-flop' },
    { name: 'UTG+1', fullName: 'Under the Gun +1', description: 'Second to act pre-flop' },
    { name: 'MP', fullName: 'Middle Position', description: 'Middle position' },
    { name: 'MP+1', fullName: 'Middle Position +1', description: 'Late middle position' },
    { name: 'CO', fullName: 'Cut-off', description: 'One seat before button' },
    { name: 'BTN', fullName: 'Button', description: 'Dealer position, acts last' },
    { name: 'SB', fullName: 'Small Blind', description: 'Posts small blind' },
    { name: 'BB', fullName: 'Big Blind', description: 'Posts big blind' }
  ];

  return (
    <div className="space-y-4">
      <p className="text-green-100 text-sm">Select your position at the table:</p>
      
      <div className="grid grid-cols-2 gap-2">
        {positions.map(pos => (
          <Button
            key={pos.name}
            variant={position === pos.name ? "default" : "outline"}
            size="sm"
            onClick={() => onPositionChange(pos.name)}
            className={position === pos.name 
              ? "bg-yellow-600 hover:bg-yellow-700 text-white" 
              : "border-green-400 text-green-100 hover:bg-green-700"
            }
            title={`${pos.fullName} - ${pos.description}`}
          >
            {pos.name}
          </Button>
        ))}
      </div>

      {position && (
        <div className="text-xs text-green-200 bg-green-900/50 p-2 rounded">
          <strong>{positions.find(p => p.name === position)?.fullName}</strong>
          <br />
          {positions.find(p => p.name === position)?.description}
        </div>
      )}
    </div>
  );
};

export default PositionSelector;
