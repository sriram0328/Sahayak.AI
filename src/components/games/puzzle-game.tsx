
"use client";

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, CheckCircle } from 'lucide-react';
import { Progress } from '../ui/progress';

export type Puzzle = {
  word: string;
  hint: string;
};

interface PuzzleGameProps {
  puzzles: Puzzle[];
  onGameComplete: (score: number) => void;
}

const shuffleWord = (word: string): string => {
  const a = word.split('');
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // Ensure the shuffled word is not the same as the original
  if (a.join('') === word && word.length > 1) {
    return shuffleWord(word);
  }
  return a.join('');
};

export function PuzzleGame({ puzzles, onGameComplete }: PuzzleGameProps) {
  const [currentPuzzleIndex, setCurrentPuzzleIndex] = useState(0);
  const [guess, setGuess] = useState('');
  const [isSolved, setIsSolved] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  const currentPuzzle = puzzles[currentPuzzleIndex];
  const scrambledWord = useMemo(() => shuffleWord(currentPuzzle.word), [currentPuzzle.word]);
  const progress = ((currentPuzzleIndex + 1) / puzzles.length) * 100;

  useEffect(() => {
    setIsSolved(false);
    setGuess('');
  }, [currentPuzzle]);

  const handleSubmit = () => {
    if (isComplete) return;

    if (guess.toLowerCase() === currentPuzzle.word.toLowerCase()) {
      setIsSolved(true);
      toast({ title: 'Correct!', description: 'Great job!', duration: 2000 });
      setTimeout(() => {
        const nextIndex = currentPuzzleIndex + 1;
        if (nextIndex < puzzles.length) {
          setCurrentPuzzleIndex(nextIndex);
        } else {
          setIsComplete(true);
          onGameComplete(puzzles.length * 10); // Award points for completing the puzzle
        }
      }, 1500);
    } else {
      toast({ variant: 'destructive', title: 'Not quite!', description: 'Try again.', duration: 2000 });
    }
  };

  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex justify-between items-center mb-2">
            <CardTitle className="text-xl">Word Scramble</CardTitle>
            <div className="text-sm font-semibold text-muted-foreground">
                Puzzle {currentPuzzleIndex + 1} / {puzzles.length}
            </div>
        </div>
        <Progress value={progress} />
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-4 p-4 md:gap-6 md:p-8">
        {isSolved && !isComplete ? (
            <div className='flex flex-col items-center gap-4 text-green-500'>
                <CheckCircle className='w-12 h-12 md:w-16 md:h-16' />
                <p className="text-xl md:text-2xl font-bold">Solved!</p>
            </div>
        ) : (
            <>
                <p className="text-2xl md:text-4xl font-bold tracking-widest text-center uppercase text-primary">
                    {scrambledWord}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lightbulb className="w-4 h-4" />
                    <span>Hint: {currentPuzzle.hint}</span>
                </div>
                <div className="flex w-full max-w-xs sm:max-w-sm items-center space-x-2">
                    <Input
                        type="text"
                        placeholder="Your guess..."
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        disabled={isSolved || isComplete}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    />
                    <Button onClick={handleSubmit} disabled={isSolved || isComplete || !guess}>Submit</Button>
                </div>
            </>
        )}
      </CardContent>
    </Card>
  );
}
