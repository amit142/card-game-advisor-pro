
import { Button } from '@/components/ui/button';

interface PositionSelectorProps {
  position: string;
  onPositionChange: (position: string) => void;
}

const PositionSelector = ({ position, onPositionChange }: PositionSelectorProps) => {
  const positions = [
    { name: 'UTG', fullName: 'Under Gun' },
    { name: 'MP', fullName: 'Middle' },
    { name: 'CO', fullName: 'Cut-off' },
    { name: 'BTN', fullName: 'Button' },
    { name: 'SB', fullName: 'Small Blind' },
    { name: 'BB', fullName: 'Big Blind' }
  ];

  return (
    <div className="space-y-2">
      <div className="text-xs text-slate-400">Position: {position || 'None'}</div>
      
      <div className="grid grid-cols-3 gap-1">
        {positions.map(pos => (
          <Button
            key={pos.name}
            variant={position === pos.name ? "default" : "ghost"}
            size="sm"
            onClick={() => onPositionChange(pos.name)}
            className={`h-8 text-xs ${
              position === pos.name 
                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            title={pos.fullName}
          >
            {pos.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default PositionSelector;
