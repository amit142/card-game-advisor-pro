import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ThemeToggle } from "./components/ThemeToggle";
import { useEffect, useState } from "react";

// Define the order of hand strengths for comparison
const handStrengthOrder: Record<string, number> = {
  "High Card": 0,
  "One Pair": 1,
  "Two Pair": 2,
  "Three of a Kind": 3,
  "Straight": 4,
  "Flush": 5,
  "Full House": 6,
  "Four of a Kind": 7,
  "Straight Flush": 8,
  "Royal Flush": 9,
  // Add any other hand types your evaluator might return, in order
};

const queryClient = new QueryClient();

// Store the rank of the strongest hand, not just the name, for easier comparison.
// The name will still be used for display and stored in localStorage.
interface StrongestHandData {
  name: string;
  rank: number;
  cards?: string[]; // Added to store the actual cards
}

const App = () => {
  // strongestHand state now stores an object { name: string, rank: number, cards?: string[] } or null
  const [strongestHand, setStrongestHand] = useState<StrongestHandData | null>(null);
  const [wins, setWins] = useState<number>(0);
  const [losses, setLosses] = useState<number>(0);

  useEffect(() => {
    // Load data from local storage on component mount
    const storedStrongestHandName = localStorage.getItem("strongestHandName");
    const storedStrongestHandRank = localStorage.getItem("strongestHandRank");
    const storedStrongestHandCards = localStorage.getItem("strongestHandActualCards"); // Key for cards
    const storedWins = localStorage.getItem("wins");
    const storedLosses = localStorage.getItem("losses");

    if (storedStrongestHandName && storedStrongestHandRank) {
      const rank = parseInt(storedStrongestHandRank, 10);
      let cards: string[] | undefined = undefined;
      if (storedStrongestHandCards) {
        try {
          cards = JSON.parse(storedStrongestHandCards);
          if (!Array.isArray(cards) || !cards.every(c => typeof c === 'string')) {
            console.warn("Invalid format for stored strongest hand cards. Clearing.");
            cards = undefined;
            localStorage.removeItem("strongestHandActualCards");
          }
        } catch (error) {
          console.error("Error parsing strongest hand cards from local storage:", error);
          cards = undefined;
          localStorage.removeItem("strongestHandActualCards"); // Clear invalid data
        }
      }

      if (!isNaN(rank)) {
        const loadedHand: StrongestHandData = { name: storedStrongestHandName, rank: rank };
        if (cards) {
          loadedHand.cards = cards;
        }
        setStrongestHand(loadedHand);
        console.log("Loaded strongest hand:", loadedHand);
      } else {
        localStorage.removeItem("strongestHandName");
        localStorage.removeItem("strongestHandRank");
        localStorage.removeItem("strongestHandActualCards");
      }
    }
    if (storedWins) {
      setWins(parseInt(storedWins, 10));
      console.log("Loaded wins:", storedWins);
    }
    if (storedLosses) {
      setLosses(parseInt(storedLosses, 10));
      console.log("Loaded losses:", storedLosses);
    }
  }, []);

  // Update local storage when state changes
  useEffect(() => {
    if (strongestHand !== null) {
      localStorage.setItem("strongestHandName", strongestHand.name);
      localStorage.setItem("strongestHandRank", strongestHand.rank.toString());
      if (strongestHand.cards && strongestHand.cards.length > 0) {
        localStorage.setItem("strongestHandActualCards", JSON.stringify(strongestHand.cards));
      } else {
        // If there are no cards (e.g. old data or an issue), remove the item
        localStorage.removeItem("strongestHandActualCards");
      }
      console.log("Saved strongest hand:", strongestHand);
    } else {
      localStorage.removeItem("strongestHandName");
      localStorage.removeItem("strongestHandRank");
      localStorage.removeItem("strongestHandActualCards"); // Also clear cards
      console.log("Cleared strongest hand from local storage.");
    }
  }, [strongestHand]);

  useEffect(() => {
    localStorage.setItem("wins", wins.toString());
    console.log("Saved wins:", wins);
  }, [wins]);

  useEffect(() => {
    localStorage.setItem("losses", losses.toString());
    console.log("Saved losses:", losses);
  }, [losses]);

  // Example functions to update game data (replace with actual game logic)
  const handleWin = (handTypeName: string, winningCards: string[]) => { // Added winningCards parameter
    setWins((prevWins) => prevWins + 1);
    const currentHandRank = handStrengthOrder[handTypeName];

    if (currentHandRank === undefined) {
      console.warn(`Unknown hand type received: ${handTypeName}. Strongest hand not updated.`);
      return;
    }

    // Logic to update strongestHand if the current hand is stronger
    if (strongestHand === null || currentHandRank > strongestHand.rank) {
      setStrongestHand({ name: handTypeName, rank: currentHandRank, cards: winningCards });
      console.log(`New strongest hand: ${handTypeName} (Rank: ${currentHandRank}, Cards: ${winningCards.join(', ')})`);
    } else if (currentHandRank === strongestHand.rank) {
      // Optional: Tie-breaking logic could be added here.
      // For now, if ranks are equal, we keep the existing strongest hand.
      // If you wanted to update to the most recent of equal strength, you could call setStrongestHand here too.
      console.log(`Current hand ${handTypeName} (Rank: ${currentHandRank}, Cards: ${winningCards.join(', ')}) is same strength as strongest hand ${strongestHand.name} (Rank: ${strongestHand.rank}). Not updated.`);
    }
  };

  const handleLoss = () => {
    setLosses((prevLosses) => prevLosses + 1);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Pass state and update functions to Index or other relevant components */}
            {/* For Index, we now pass strongestHand.name for display, or null */}
            <Route path="/" element={<Index strongestHand={strongestHand ? strongestHand.name : null} wins={wins} losses={losses} handleWin={handleWin} handleLoss={handleLoss} />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
