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
import { type HandStrength } from "./utils/pokerCalculator"; // Import HandStrength

// The name will still be used for display and stored in localStorage.
// This interface will now fully mirror HandStrength from pokerCalculator, plus the actual cards.
interface StrongestHandData extends HandStrength { // Extend HandStrength
  cards?: string[]; // Array of card strings e.g. ["Ah", "Ks"]
}

const App = () => {
  // strongestHand state now stores an object of type StrongestHandData or null
  const [strongestHand, setStrongestHand] = useState<StrongestHandData | null>(null);
  const [wins, setWins] = useState<number>(0);
  const [losses, setLosses] = useState<number>(0);

  useEffect(() => {
    // Load data from local storage on component mount
    const name = localStorage.getItem("strongestHandName");
    const rankStr = localStorage.getItem("strongestHandRank");
    const cardsStr = localStorage.getItem("strongestHandActualCards");
    const primaryRankValueStr = localStorage.getItem("strongestHandPrimaryRank");
    const secondaryRankValueStr = localStorage.getItem("strongestHandSecondaryRank");
    const kickerRankValuesStr = localStorage.getItem("strongestHandKickers");

    const storedWins = localStorage.getItem("wins");
    const storedLosses = localStorage.getItem("losses");

    if (name && rankStr) {
      const rank = parseInt(rankStr, 10);
      if (!isNaN(rank)) {
        const loadedHand: StrongestHandData = { type: name, rank: rank, name: name }; // type and name are the same here

        if (cardsStr) {
          try {
            const cards = JSON.parse(cardsStr);
            if (Array.isArray(cards) && cards.every(c => typeof c === 'string')) {
              loadedHand.cards = cards;
            } else { localStorage.removeItem("strongestHandActualCards"); }
          } catch { localStorage.removeItem("strongestHandActualCards"); }
        }
        if (primaryRankValueStr) {
          const val = parseInt(primaryRankValueStr, 10);
          if (!isNaN(val)) loadedHand.primaryRankValue = val;
          else localStorage.removeItem("strongestHandPrimaryRank");
        }
        if (secondaryRankValueStr) {
          const val = parseInt(secondaryRankValueStr, 10);
          if (!isNaN(val)) loadedHand.secondaryRankValue = val;
          else localStorage.removeItem("strongestHandSecondaryRank");
        }
        if (kickerRankValuesStr) {
          try {
            const kickers = JSON.parse(kickerRankValuesStr);
            if (Array.isArray(kickers) && kickers.every(k => typeof k === 'number')) {
              loadedHand.kickerRankValues = kickers;
            } else { localStorage.removeItem("strongestHandKickers"); }
          } catch { localStorage.removeItem("strongestHandKickers"); }
        }
        setStrongestHand(loadedHand);
        console.log("Loaded strongest hand:", loadedHand);
      } else {
        // Clear all if essential parts are missing/invalid
        localStorage.removeItem("strongestHandName");
        localStorage.removeItem("strongestHandRank");
        localStorage.removeItem("strongestHandActualCards");
        localStorage.removeItem("strongestHandPrimaryRank");
        localStorage.removeItem("strongestHandSecondaryRank");
        localStorage.removeItem("strongestHandKickers");
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
      localStorage.setItem("strongestHandName", strongestHand.name); // or strongestHand.type
      localStorage.setItem("strongestHandRank", strongestHand.rank.toString());

      if (strongestHand.cards && strongestHand.cards.length > 0) {
        localStorage.setItem("strongestHandActualCards", JSON.stringify(strongestHand.cards));
      } else {
        localStorage.removeItem("strongestHandActualCards");
      }
      if (strongestHand.primaryRankValue !== undefined) {
        localStorage.setItem("strongestHandPrimaryRank", strongestHand.primaryRankValue.toString());
      } else {
        localStorage.removeItem("strongestHandPrimaryRank");
      }
      if (strongestHand.secondaryRankValue !== undefined) {
        localStorage.setItem("strongestHandSecondaryRank", strongestHand.secondaryRankValue.toString());
      } else {
        localStorage.removeItem("strongestHandSecondaryRank");
      }
      if (strongestHand.kickerRankValues && strongestHand.kickerRankValues.length > 0) {
        localStorage.setItem("strongestHandKickers", JSON.stringify(strongestHand.kickerRankValues));
      } else {
        localStorage.removeItem("strongestHandKickers");
      }
      console.log("Saved strongest hand:", strongestHand);
    } else {
      localStorage.removeItem("strongestHandName");
      localStorage.removeItem("strongestHandRank");
      localStorage.removeItem("strongestHandActualCards");
      localStorage.removeItem("strongestHandPrimaryRank");
      localStorage.removeItem("strongestHandSecondaryRank");
      localStorage.removeItem("strongestHandKickers");
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

  // Function to compare kickers array by array
  const compareKickers = (kickerA: number[] | undefined, kickerB: number[] | undefined): number => {
    if (!kickerA && !kickerB) return 0; // Both undefined or empty
    if (!kickerA) return -1; // A is weaker (no kickers)
    if (!kickerB) return 1;  // B is weaker (no kickers)

    for (let i = 0; i < Math.min(kickerA.length, kickerB.length); i++) {
      if (kickerA[i] > kickerB[i]) return 1;
      if (kickerA[i] < kickerB[i]) return -1;
    }
    // If all compared kickers are equal, the one with more kickers (if any) might be considered,
    // but typically poker hands have a fixed number of kickers compared.
    // For simplicity, if prefixes match, consider them equal here.
    return 0;
  };

  const handleWin = (currentHandDetails: HandStrength, winningCards: string[]) => {
    setWins((prevWins) => prevWins + 1);

    if (currentHandDetails.rank === undefined || handStrengthOrder[currentHandDetails.type] === undefined) {
      console.warn(`Unknown hand type or rank received: ${currentHandDetails.type}. Strongest hand not updated.`);
      return;
    }

    const newHandData: StrongestHandData = { ...currentHandDetails, cards: winningCards };

    if (strongestHand === null || newHandData.rank > strongestHand.rank) {
      setStrongestHand(newHandData);
      console.log(`New strongest hand: ${newHandData.name} (Rank: ${newHandData.rank}, Cards: ${newHandData.cards?.join(', ')})`);
    } else if (newHandData.rank === strongestHand.rank) {
      let newHandIsStrongerInTie = false;
      // Implement tie-breaking logic based on hand type
      switch (newHandData.type) {
        case "Royal Flush": // Already highest, no tie-breaker needed beyond rank
          break;
        case "Straight Flush":
        case "Straight":
        case "Flush": // For flushes and straights, primaryRankValue is the high card
          if (newHandData.primaryRankValue && strongestHand.primaryRankValue && newHandData.primaryRankValue > strongestHand.primaryRankValue) {
            newHandIsStrongerInTie = true;
          } else if (newHandData.primaryRankValue === strongestHand.primaryRankValue) {
             // If primary high cards are same, compare all kicker cards (which are the hand cards themselves for these types)
            if (compareKickers(newHandData.kickerRankValues, strongestHand.kickerRankValues) > 0) {
              newHandIsStrongerInTie = true;
            }
          }
          break;
        case "Four of a Kind":
          if (newHandData.primaryRankValue && strongestHand.primaryRankValue && newHandData.primaryRankValue > strongestHand.primaryRankValue) {
            newHandIsStrongerInTie = true;
          } else if (newHandData.primaryRankValue === strongestHand.primaryRankValue) {
            if (compareKickers(newHandData.kickerRankValues, strongestHand.kickerRankValues) > 0) {
              newHandIsStrongerInTie = true;
            }
          }
          break;
        case "Full House":
          if (newHandData.primaryRankValue && strongestHand.primaryRankValue && newHandData.primaryRankValue > strongestHand.primaryRankValue) {
            newHandIsStrongerInTie = true;
          } else if (newHandData.primaryRankValue === strongestHand.primaryRankValue) {
            if (newHandData.secondaryRankValue && strongestHand.secondaryRankValue && newHandData.secondaryRankValue > strongestHand.secondaryRankValue) {
              newHandIsStrongerInTie = true;
            }
          }
          break;
        case "Three of a Kind":
          if (newHandData.primaryRankValue && strongestHand.primaryRankValue && newHandData.primaryRankValue > strongestHand.primaryRankValue) {
            newHandIsStrongerInTie = true;
          } else if (newHandData.primaryRankValue === strongestHand.primaryRankValue) {
            if (compareKickers(newHandData.kickerRankValues, strongestHand.kickerRankValues) > 0) {
              newHandIsStrongerInTie = true;
            }
          }
          break;
        case "Two Pair":
          if (newHandData.primaryRankValue && strongestHand.primaryRankValue && newHandData.primaryRankValue > strongestHand.primaryRankValue) {
            newHandIsStrongerInTie = true;
          } else if (newHandData.primaryRankValue === strongestHand.primaryRankValue) {
            if (newHandData.secondaryRankValue && strongestHand.secondaryRankValue && newHandData.secondaryRankValue > strongestHand.secondaryRankValue) {
              newHandIsStrongerInTie = true;
            } else if (newHandData.secondaryRankValue === strongestHand.secondaryRankValue) {
              if (compareKickers(newHandData.kickerRankValues, strongestHand.kickerRankValues) > 0) {
                newHandIsStrongerInTie = true;
              }
            }
          }
          break;
        case "One Pair":
          if (newHandData.primaryRankValue && strongestHand.primaryRankValue && newHandData.primaryRankValue > strongestHand.primaryRankValue) {
            newHandIsStrongerInTie = true;
          } else if (newHandData.primaryRankValue === strongestHand.primaryRankValue) {
            if (compareKickers(newHandData.kickerRankValues, strongestHand.kickerRankValues) > 0) {
              newHandIsStrongerInTie = true;
            }
          }
          break;
        case "High Card":
          if (compareKickers(newHandData.kickerRankValues, strongestHand.kickerRankValues) > 0) {
            newHandIsStrongerInTie = true;
          }
          break;
        default: // Should not happen if hand types are well-defined
          console.warn("Unhandled hand type in tie-breaking:", newHandData.type);
      }

      if (newHandIsStrongerInTie) {
        setStrongestHand(newHandData);
        console.log(`New strongest hand (tie-broken): ${newHandData.name} (Rank: ${newHandData.rank}, Primary: ${newHandData.primaryRankValue}, Cards: ${newHandData.cards?.join(', ')})`);
      } else {
        console.log(`Current hand ${newHandData.name} (Rank: ${newHandData.rank}, Primary: ${newHandData.primaryRankValue}) is same or weaker strength as strongest hand ${strongestHand.name} (Rank: ${strongestHand.rank}, Primary: ${strongestHand.primaryRankValue}). Not updated.`);
      }
    }
  };

  const handleLoss = () => {
    setLosses((prevLosses) => prevLosses + 1);
  };

  const resetAppStatistics = () => {
    setWins(0);
    setLosses(0);
    setStrongestHand(null); // This will trigger the useEffect to clear local storage for strongestHand
    console.log("App statistics reset.");
  };

  // Diagnostic logs
  console.log("App.tsx strongestHand state:", strongestHand);
  console.log("Prop value for Index (strongestHand.name or null):", strongestHand ? strongestHand.name : null);

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
            <Route path="/" element={<Index strongestHand={strongestHand ? strongestHand.name : null} wins={wins} losses={losses} handleWin={handleWin} handleLoss={handleLoss} resetAppStatistics={resetAppStatistics} />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
