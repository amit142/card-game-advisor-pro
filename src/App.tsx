import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { ThemeToggle } from "./components/ThemeToggle";
import { useEffect, useState } from "react";

const queryClient = new QueryClient();

const App = () => {
  const [strongestHand, setStrongestHand] = useState<string | null>(null);
  const [wins, setWins] = useState<number>(0);
  const [losses, setLosses] = useState<number>(0);

  useEffect(() => {
    // Load data from local storage on component mount
    const storedStrongestHand = localStorage.getItem("strongestHand");
    const storedWins = localStorage.getItem("wins");
    const storedLosses = localStorage.getItem("losses");

    if (storedStrongestHand) {
      setStrongestHand(storedStrongestHand);
      console.log("Loaded strongest hand:", storedStrongestHand);
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
      localStorage.setItem("strongestHand", strongestHand);
      console.log("Saved strongest hand:", strongestHand);
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
  const handleWin = (hand: string) => {
    setWins((prevWins) => prevWins + 1);
    if (!strongestHand || hand > strongestHand) { // This logic might need adjustment based on how hands are compared
      setStrongestHand(hand);
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
            <Route path="/" element={<Index strongestHand={strongestHand} wins={wins} losses={losses} handleWin={handleWin} handleLoss={handleLoss} />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
