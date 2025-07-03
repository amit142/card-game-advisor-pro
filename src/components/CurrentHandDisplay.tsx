import React from 'react';
import { evaluateHandStrength, HandStrength as HandStrengthType } from '@/utils/pokerCalculator';
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CurrentHandDisplayProps {
  holeCards: string[];
  communityCards: string[];
}

// Helper to convert rank number to string (e.g., 14 -> Ace, 13 -> King)
const rankToString = (rank: number | undefined, plural: boolean = true): string => {
  if (rank === undefined) return '';
  const s = plural ? 's' : '';
  // For single character display (like AK high), no 's' needed unless it's a number like 2s, 3s
  const singleCharPlural = plural && rank < 10 && rank > 1 ? 's' : '';

  if (rank === 14) return `Ace${s}`;
  if (rank === 13) return `King${s}`;
  if (rank === 12) return `Queen${s}`;
  if (rank === 11) return `Jack${s}`;
  if (rank === 10) return `Ten${s}`; // For "Pair of Tens"
  // For "T" character in "AT High", handle in getRankValue/display directly
  if (!plural && rank < 10 && rank > 1) return rank.toString(); // for "K5 High", just "5"
  if (rank < 10 && rank > 1) return rank.toString() + singleCharPlural;


  return rank.toString() + (plural ? s : ''); // Default for numbers, e.g. "Pair of 7s" or "7"
};

const getRankChar = (rankValue: number | undefined): string => {
    if (rankValue === undefined) return '';
    if (rankValue === 14) return 'A';
    if (rankValue === 13) return 'K';
    if (rankValue === 12) return 'Q';
    if (rankValue === 11) return 'J';
    if (rankValue === 10) return 'T';
    return rankValue.toString();
};


const CurrentHandDisplay: React.FC<CurrentHandDisplayProps> = ({ holeCards, communityCards }) => {
  let displayMessage: string = "Select hole cards";
  let evaluatedHand: HandStrengthType | null = null;

  // Temporary getRankValue, assuming card format like "Ah", "Ks", "Td", "9c"
  // This should ideally be imported or be part of a shared util if pokerCalculator's getRankValue is not directly usable here
  const getRankValue = (rankChar: string): number => {
    if (rankChar === "A") return 14;
    if (rankChar === "K") return 13;
    if (rankChar === "Q") return 12;
    if (rankChar === "J") return 11;
    if (rankChar === "T") return 10;
    if (rankChar === "10") return 10; // if format is "10s"
    const num = parseInt(rankChar);
    return isNaN(num) ? 0 : num;
  };

  if (holeCards.length === 2) {
    const allCards = [...holeCards, ...communityCards];
    evaluatedHand = evaluateHandStrength(allCards);

    if (evaluatedHand) {
      if (communityCards.length === 0) { // Only hole cards
        if (evaluatedHand.type === "One Pair" && evaluatedHand.primaryRankValue) {
          displayMessage = `Pocket ${rankToString(evaluatedHand.primaryRankValue, true)}`;
        } else if (evaluatedHand.type === "High Card") {
            // Sort hole cards by rank for consistent display e.g. AK, not KA
            const sortedHoleCards = [...holeCards].sort((a,b) => getRankValue(b.slice(0,-1)) - getRankValue(a.slice(0,-1)));
            const r1Char = sortedHoleCards[0].slice(0,-1); // e.g. "A" from "Ah"
            const r2Char = sortedHoleCards[1].slice(0,-1); // e.g. "K" from "Ks"
            displayMessage = `${r1Char}${r2Char} High`; // e.g. AK High
        } else {
           // Should not happen with 2 cards, evaluateHandStrength covers Pair or High Card
          displayMessage = evaluatedHand.type;
        }
      } else { // Hole cards + community cards
        displayMessage = evaluatedHand.type; // Default to general type
        if (evaluatedHand.primaryRankValue) {
          switch(evaluatedHand.type) {
            case "One Pair":
              displayMessage = `Pair of ${rankToString(evaluatedHand.primaryRankValue, true)}`;
              break;
            case "Two Pair":
              displayMessage = `Two Pair: ${rankToString(evaluatedHand.primaryRankValue, true)} & ${rankToString(evaluatedHand.secondaryRankValue, true)}`;
              break;
            case "Three of a Kind":
              displayMessage = `Three of a Kind (${rankToString(evaluatedHand.primaryRankValue, true)})`;
              break;
            case "Full House":
              displayMessage = `Full House: ${rankToString(evaluatedHand.primaryRankValue, true)} full of ${rankToString(evaluatedHand.secondaryRankValue, true)}`;
              break;
            // Other specific descriptions can be added here (e.g. Straight to the King, Ace High Flush)
            default: // For Straight, Flush, Four of a Kind, Straight Flush, Royal Flush
              if (evaluatedHand.primaryRankValue && (evaluatedHand.type === "Straight" || evaluatedHand.type === "Flush" || evaluatedHand.type === "Straight Flush")) {
                displayMessage = `${evaluatedHand.type} (High: ${getRankChar(evaluatedHand.primaryRankValue)})`;
              } else if (evaluatedHand.type === "Four of a Kind" && evaluatedHand.primaryRankValue) {
                 displayMessage = `Four of a Kind (${rankToString(evaluatedHand.primaryRankValue, true)})`;
              }
              // Royal Flush needs no extra detail beyond its type.
              break;
          }
        }
      }
    } else {
      displayMessage = "Evaluating...";
    }
  } else if (holeCards.length === 1) {
    displayMessage = "Select second hole card";
  }

  return (
    <UICard className="mt-4 bg-white/90 dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 shadow-md">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Your Current Hand</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-lg font-semibold text-neutral-800 dark:text-neutral-100 py-2">
          {displayMessage}
        </p>
      </CardContent>
    </UICard>
  );
};

export default CurrentHandDisplay;
