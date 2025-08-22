
"use client";

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BrainCircuit, Calculator, Puzzle as PuzzleIcon, Rocket, Shield, Star, RefreshCw, Award, ArrowRight } from 'lucide-react';
import { QuizGame } from '@/components/games/quiz-game';
import type { Question } from '@/components/games/quiz-game';
import { PuzzleGame } from '@/components/games/puzzle-game';
import type { Puzzle } from '@/components/games/puzzle-game';
import { MemoryGame } from '@/components/games/memory-game';
import type { CardItem } from '@/components/games/memory-game';

type GameType = 'quiz' | 'puzzle' | 'memory';
type Difficulty = 'beginner' | 'intermediate' | 'advanced';

const getDifficulty = (level: number): Difficulty => {
  if (level < 4) return 'beginner';
  if (level < 8) return 'intermediate';
  return 'advanced';
};

const getLevelBadge = (level: number) => {
    const difficulty = getDifficulty(level);
    switch(difficulty) {
        case 'beginner': return <Badge variant="secondary"><Shield className="mr-1 h-3 w-3"/>{difficulty}</Badge>
        case 'intermediate': return <Badge><Star className="mr-1 h-3 w-3"/>{difficulty}</Badge>
        case 'advanced': return <Badge variant="destructive"><Rocket className="mr-1 h-3 w-3"/>{difficulty}</Badge>
    }
}

// Mock question/content generators
const generateQuizQuestions = (level: number): Question[] => {
    return Array.from({ length: 5 }, () => {
        const operators = ['+', '-', '*', '/'];
        const operator = operators[Math.floor(Math.random() * operators.length)];
        let num1, num2, questionText, correctAnswer;

        const maxNum = level * 5;

        switch (operator) {
            case '+':
                num1 = Math.floor(Math.random() * maxNum) + 1;
                num2 = Math.floor(Math.random() * maxNum) + 1;
                correctAnswer = num1 + num2;
                questionText = `What is ${num1} + ${num2}?`;
                break;
            case '-':
                const a = Math.floor(Math.random() * maxNum) + 1;
                const b = Math.floor(Math.random() * maxNum) + 1;
                num1 = Math.max(a, b);
                num2 = Math.min(a, b);
                correctAnswer = num1 - num2;
                questionText = `What is ${num1} - ${num2}?`;
                break;
            case '*':
                num1 = Math.floor(Math.random() * (level + 4)) + 1; // Smaller numbers for multiplication
                num2 = Math.floor(Math.random() * 9) + 1;
                correctAnswer = num1 * num2;
                questionText = `What is ${num1} × ${num2}?`;
                break;
            case '/':
                const result = Math.floor(Math.random() * (level + 2)) + 1; // Smaller result number
                num2 = Math.floor(Math.random() * 8) + 2; // Avoid division by 0 or 1
                num1 = result * num2;
                correctAnswer = result;
                questionText = `What is ${num1} ÷ ${num2}?`;
                break;
            default: // Fallback to addition
                num1 = Math.floor(Math.random() * maxNum) + 1;
                num2 = Math.floor(Math.random() * maxNum) + 1;
                correctAnswer = num1 + num2;
                questionText = `What is ${num1} + ${num2}?`;
        }
        
        const options = new Set<number>();
        options.add(correctAnswer);
        while(options.size < 4) {
            const randomOption = correctAnswer + (Math.floor(Math.random() * 10) - 5);
            if (randomOption >= 0 && randomOption !== correctAnswer) {
                 options.add(randomOption);
            }
        }

        return {
            type: 'math',
            questionText: questionText,
            options: Array.from(options).sort(() => Math.random() - 0.5),
            correctAnswer: correctAnswer,
        };
    });
};

const generatePuzzles = (level: number): Puzzle[] => {
    const allWords = [
        // Easy (3-4 letters)
        'cat', 'dog', 'sun', 'run', 'cup', 'egg', 'pen', 'bed', 'tree', 'moon',
        // Medium (5-6 letters)
        'apple', 'house', 'water', 'earth', 'train', 'smile', 'happy', 'cloud', 'school', 'friend',
        // Hard (7+ letters)
        'banana', 'orange', 'purple', 'window', 'teacher', 'student', 'computer', 'learning', 'puzzle', 'journey'
    ];

    let wordSet;
    if (level < 3) {
        wordSet = allWords.filter(w => w.length <= 4);
    } else if (level < 6) {
        wordSet = allWords.filter(w => w.length >= 5 && w.length <= 6);
    } else {
        wordSet = allWords.filter(w => w.length > 6);
    }

    const shuffled = wordSet.sort(() => 0.5 - Math.random());
    const selectedWords = shuffled.slice(0, 5);

    // Fallback in case a category has less than 5 words
    while (selectedWords.length < 5) {
        const fallbackWord = allWords[Math.floor(Math.random() * allWords.length)];
        if (!selectedWords.includes(fallbackWord)) {
            selectedWords.push(fallbackWord);
        }
    }
    
    return selectedWords.map(word => ({
        word: word,
        hint: `A ${word.length}-letter word.`,
    }));
};

const generateMemoryItems = (level: number): CardItem[] => {
    const icons = ['dog', 'cat', 'tree', 'sun', 'star', 'moon', 'car', 'bus', 'house', 'boat', 'fish', 'bird'];
    const numPairs = Math.min(Math.max(level + 1, 3), 8);
    const selectedIcons = icons.slice(0, numPairs);
    const items = [...selectedIcons, ...selectedIcons].sort(() => Math.random() - 0.5);
    return items.map((icon, index) => ({
        id: `${icon}-${index}`,
        type: icon,
    }));
};

const gameOptions = [
    { type: 'quiz' as GameType, title: 'Math Quiz', description: 'Solve quick math problems.', icon: Calculator },
    { type: 'puzzle' as GameType, title: 'Word Scramble', description: 'Unscramble letters to find the word.', icon: PuzzleIcon },
    { type: 'memory' as GameType, title: 'Memory Match', description: 'Find all the matching pairs.', icon: BrainCircuit },
]

export default function GamifiedLearningPage() {
    const [activeGame, setActiveGame] = useState<GameType | null>(null);
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [gameKey, setGameKey] = useState(Date.now());
    const [isGameCompleted, setIsGameCompleted] = useState(false);
    const [lastGameScore, setLastGameScore] = useState(0);

    const quizQuestions = useMemo(() => generateQuizQuestions(level), [level, gameKey]);
    const puzzles = useMemo(() => generatePuzzles(level), [level, gameKey]);
    const memoryItems = useMemo(() => generateMemoryItems(level), [level, gameKey]);

    const handleGameComplete = useCallback((gameScore: number) => {
        const newTotalScore = score + gameScore;
        setScore(newTotalScore);
        setLastGameScore(gameScore);
        setIsGameCompleted(true);
    }, [score]);

    const handleSelectGame = (gameType: GameType) => {
        setLevel(1);
        setScore(0);
        setLastGameScore(0);
        setGameKey(Date.now());
        setIsGameCompleted(false);
        setActiveGame(gameType);
    };

    const handlePlayAgain = () => {
        setGameKey(Date.now());
        setIsGameCompleted(false);
        setLastGameScore(0);
    };

    const handleNextLevel = () => {
        setLevel(prev => prev + 1);
        handlePlayAgain();
    };
    
    const handleEndSession = () => {
        setActiveGame(null);
    };

    const renderGame = () => {
        switch (activeGame) {
            case 'quiz':
                return <QuizGame key={gameKey} questions={quizQuestions} onGameComplete={handleGameComplete} />;
            case 'puzzle':
                 return <PuzzleGame key={gameKey} puzzles={puzzles} onGameComplete={handleGameComplete} />;
            case 'memory':
                return <MemoryGame key={gameKey} items={memoryItems} onGameComplete={handleGameComplete} />
            default:
                return null;
        }
    };

    const renderGameCompleteCard = () => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Award className="w-8 h-8 text-yellow-500" />
                    <span className="text-2xl md:text-3xl">Level Complete!</span>
                </CardTitle>
                <CardDescription>Great job! Here are your results.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-lg md:text-xl">You earned <span className="font-bold text-primary">{lastGameScore}</span> points.</p>
                <p className="text-base mt-2">Your total score is <span className="font-bold">{score}</span>.</p>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-end gap-2">
                <Button variant="outline" onClick={handleEndSession}>
                    <ArrowLeft className="mr-2 h-4 w-4"/> Back to Games
                </Button>
                <Button variant="secondary" onClick={handlePlayAgain}>
                    <RefreshCw className="mr-2 h-4 w-4"/> Play Again
                </Button>
                <Button onClick={handleNextLevel}>
                    Next Level <ArrowRight className="ml-2 h-4 w-4"/>
                </Button>
            </CardFooter>
        </Card>
    );

    if (activeGame) {
        return (
            <div className="flex flex-col gap-4 md:gap-6">
                 <Card>
                    <CardHeader className="p-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                            <div>
                                <CardTitle className="font-headline">{gameOptions.find(g => g.type === activeGame)?.title}</CardTitle>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm pt-2">
                                    <div className="flex items-center gap-2">
                                        <Star className="w-4 h-4 text-yellow-400" />
                                        <span className="font-semibold">{score} Points</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">Level:</span>
                                        <span className="font-semibold">{level}</span>
                                        {getLevelBadge(level)}
                                    </div>
                                </div>
                            </div>
                            <Button variant="outline" onClick={handleEndSession} disabled={isGameCompleted} size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4"/> Back
                            </Button>
                        </div>
                    </CardHeader>
                </Card>
    
                <div className="w-full">
                    {isGameCompleted ? renderGameCompleteCard() : renderGame()}
                </div>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col gap-4 md:gap-6">
             <Card className="w-full">
                <CardHeader className="p-4 md:p-6">
                    <CardTitle className="font-headline text-2xl md:text-3xl">Learning Games Arcade</CardTitle>
                    <CardDescription>Choose a game to start a new learning session.</CardDescription>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {gameOptions.map((game) => (
                    <Card key={game.type} className="flex flex-col">
                        <CardHeader className="flex-row items-center gap-4 p-4">
                            <div className="p-3 border rounded-lg bg-primary/10">
                                <game.icon className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="font-headline text-lg md:text-xl">{game.title}</CardTitle>
                                <CardDescription className="pt-1 text-sm">{game.description}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow flex items-end justify-end p-4 pt-0">
                            <Button onClick={() => handleSelectGame(game.type)} size="sm">Play Game</Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
