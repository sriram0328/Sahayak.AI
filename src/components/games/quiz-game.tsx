
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle } from 'lucide-react';

export type Question = {
  type: 'math' | 'vocabulary';
  questionText: string;
  options: (string | number)[];
  correctAnswer: string | number;
};

interface QuizGameProps {
  questions: Question[];
  onGameComplete: (score: number) => void;
}

export function QuizGame({ questions, onGameComplete }: QuizGameProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  useEffect(() => {
    // Reset state when questions change (e.g., new level or replay)
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setIsComplete(false);
  }, [questions]);

  const handleAnswerClick = (option: string | number) => {
    if (isAnswered || isComplete) return;

    setIsAnswered(true);
    setSelectedAnswer(option);
    
    let isCorrect = option === currentQuestion.correctAnswer;
    if (isCorrect) {
      setScore(prev => prev + 10);
    }

    setTimeout(() => {
      const nextQuestionIndex = currentQuestionIndex + 1;
      if (nextQuestionIndex < questions.length) {
        setCurrentQuestionIndex(nextQuestionIndex);
        setIsAnswered(false);
        setSelectedAnswer(null);
      } else {
        setIsComplete(true);
        // Pass the final score up, including the score from the last question
        onGameComplete(score + (isCorrect ? 10 : 0));
      }
    }, 1500);
  };

  if (!currentQuestion) {
    return <p>Loading quiz...</p>;
  }

  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex justify-between items-center mb-2">
            <CardTitle className="text-xl">Quiz</CardTitle>
            <div className="text-sm font-semibold text-muted-foreground">
                Question {currentQuestionIndex + 1} / {questions.length}
            </div>
        </div>
        <Progress value={progress} />
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-4 p-4 md:gap-6 md:p-6">
        <p className="text-lg font-bold text-center md:text-2xl">
            {currentQuestion.questionText}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:gap-4 w-full max-w-md">
          {currentQuestion.options.map((option, index) => {
            const isCorrect = option === currentQuestion.correctAnswer;
            const isSelected = option === selectedAnswer;
            return (
              <Button
                key={index}
                onClick={() => handleAnswerClick(option)}
                disabled={isAnswered || isComplete}
                className={cn(
                  "h-14 text-lg sm:h-16 sm:text-xl md:h-20 md:text-2xl font-bold",
                  isAnswered && isCorrect && "bg-green-500 hover:bg-green-500 text-white",
                  isAnswered && isSelected && !isCorrect && "bg-destructive hover:bg-destructive text-destructive-foreground"
                )}
                variant="outline"
              >
                {isAnswered && isSelected && isCorrect && <CheckCircle className="mr-2 h-5 w-5" />}
                {isAnswered && isSelected && !isCorrect && <XCircle className="mr-2 h-5 w-5" />}
                {option}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
