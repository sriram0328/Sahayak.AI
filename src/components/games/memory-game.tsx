
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Card as UICard, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PawPrint, Cat, TreeDeciduous, Sun, Star, Moon, Car, Bus, Home, Sailboat, Fish, Bird, BrainCircuit } from 'lucide-react';

const ICONS: { [key: string]: React.ElementType } = {
  dog: PawPrint, cat: Cat, tree: TreeDeciduous, sun: Sun, star: Star, moon: Moon,
  car: Car, bus: Bus, house: Home, boat: Sailboat, fish: Fish, bird: Bird,
};

export type CardItem = {
  id: string;
  type: string;
};

interface MemoryGameProps {
  items: CardItem[];
  onGameComplete: (score: number) => void;
}

export function MemoryGame({ items, onGameComplete }: MemoryGameProps) {
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [turns, setTurns] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const gridClass = useMemo(() => {
    const count = items.length;
    if (count <= 6) return "grid-cols-3";
    if (count <= 8) return "grid-cols-4";
    if (count <= 12) return "grid-cols-4";
    if (count <= 16) return "grid-cols-4";
    return "grid-cols-4";
  }, [items.length]);

  useEffect(() => {
    // Reset game when items change
    setFlippedCards([]);
    setMatchedPairs([]);
    setTurns(0);
    setIsComplete(false);
  }, [items]);

  useEffect(() => {
    if (isComplete) return;

    if (flippedCards.length === 2) {
      setTurns(prev => prev + 1);
      const [firstIndex, secondIndex] = flippedCards;
      const firstCard = items[firstIndex];
      const secondCard = items[secondIndex];

      if (firstCard.type === secondCard.type) {
        setMatchedPairs(prev => [...prev, firstCard.type]);
      }

      const timeoutId = setTimeout(() => {
        setFlippedCards([]);
      }, 1200);

      return () => clearTimeout(timeoutId);
    }
  }, [flippedCards, items, isComplete]);

  useEffect(() => {
    if (isComplete) return;

    if (matchedPairs.length > 0 && matchedPairs.length === items.length / 2) {
      setIsComplete(true);
      const score = Math.max(100 - (turns * 5), 10); // Calculate score based on turns
      onGameComplete(score);
    }
  }, [matchedPairs, items, turns, onGameComplete, isComplete]);

  const handleCardClick = (index: number) => {
    if (isComplete || flippedCards.length >= 2 || flippedCards.includes(index) || matchedPairs.includes(items[index].type)) {
      return;
    }
    setFlippedCards(prev => [...prev, index]);
  };

  return (
    <UICard>
      <CardHeader className="p-4">
        <CardTitle className="text-xl">Memory Match</CardTitle>
        <CardDescription>Find all the matching pairs!</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-4 p-2 md:p-6">
        <div className={cn("grid w-full max-w-sm sm:max-w-md gap-2 sm:gap-3", gridClass)}>
          {items.map((item, index) => {
            const isFlipped = flippedCards.includes(index) || matchedPairs.includes(item.type);
            const Icon = ICONS[item.type] || BrainCircuit;
            return (
              <div
                key={item.id}
                className={cn(
                  "aspect-square rounded-lg flex items-center justify-center cursor-pointer transition-transform duration-300",
                  isFlipped ? 'bg-primary/20 rotate-y-180' : 'bg-secondary hover:bg-secondary/80',
                  isComplete ? 'cursor-default' : ''
                )}
                onClick={() => handleCardClick(index)}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className={cn("transition-opacity duration-200", isFlipped ? 'opacity-100' : 'opacity-0')}>
                  <Icon className="w-full h-full p-2 text-primary" />
                </div>
              </div>
            );
          })}
        </div>
        <div className='text-sm text-muted-foreground'>Turns: {turns}</div>
      </CardContent>
    </UICard>
  );
}
