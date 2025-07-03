import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type StrongestHandData } from "@/App"; // Assuming StrongestHandData is exported from App.tsx

interface StatisticsDisplayDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  wins: number;
  losses: number;
  strongestHandData: StrongestHandData | null;
}

const StatisticsDisplayDialog: React.FC<StatisticsDisplayDialogProps> = ({
  isOpen,
  onOpenChange,
  wins,
  losses,
  strongestHandData,
}) => {
  const totalGames = wins + losses;
  const winPercentage = totalGames > 0 ? ((wins / totalGames) * 100) : 0;

  const formatPercentage = (percentage: number) => {
    if (totalGames === 0) return "N/A";
    return percentage.toFixed(1) + "%";
  };

  const getHandDisplay = () => {
    if (!strongestHandData) {
      return "N/A";
    }
    let display = strongestHandData.type;
    if (strongestHandData.cards && strongestHandData.cards.length > 0) {
      // Display up to 5 cards for brevity, or all if less than 5.
      // This assumes the 'cards' in StrongestHandData are the relevant ones for the made hand.
      // For some hands like Flush or Straight, all 5 are important. For pairs, quads, trips, less so.
      // The evaluateHandStrength function stores the 5 cards that make the hand in kickerRankValues for some types,
      // or just 'cards' could be the full 7 cards if not processed.
      // For now, let's join what's in `strongestHandData.cards`.
      display += ` (${strongestHandData.cards.slice(0,5).join(', ')})`;
    }
    return display;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-neutral-800">
        <DialogHeader>
          <DialogTitle className="text-neutral-800 dark:text-neutral-100">Session Statistics</DialogTitle>
          <DialogDescription className="text-neutral-600 dark:text-neutral-300">
            Here are your statistics for the current session.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-neutral-700 dark:text-neutral-200">Total Games Played:</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-100">{totalGames}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-neutral-700 dark:text-neutral-200">Wins:</span>
            <span className="font-semibold text-green-600 dark:text-green-400">{wins}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-neutral-700 dark:text-neutral-200">Losses:</span>
            <span className="font-semibold text-red-600 dark:text-red-400">{losses}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-neutral-700 dark:text-neutral-200">Win Percentage:</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-100">{formatPercentage(winPercentage)}</span>
          </div>
          <div className="grid grid-cols-2 items-center gap-4">
            <span className="text-neutral-700 dark:text-neutral-200">Best Hand Achieved:</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-100 truncate" title={getHandDisplay()}>
              {getHandDisplay()}
            </span>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="dark:text-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-700">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default StatisticsDisplayDialog;
