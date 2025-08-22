
"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { generateAnswerForLater } from "@/ai/flows/ask-later-generator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mic, MicOff, Play, Pause, AlertCircle, HelpCircle, RefreshCw } from "lucide-react";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { GeneratingLoader } from "@/components/ui/generating-loader";

const formSchema = z.object({
  questionText: z.string().min(5, "Question must be at least 5 characters long."),
});
type FormValues = z.infer<typeof formSchema>;

type QuestionStatus = "processing" | "answered" | "error";

type QueuedQuestion = {
  id: string;
  questionText: string;
  status: QuestionStatus;
  answerText?: string;
  answerImageUrl?: string;
  answerAudioUri?: string;
};

export default function AskLaterPage() {
  const [questionQueue, setQuestionQueue] = useState<QueuedQuestion[]>([]);
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [playingQuestionId, setPlayingQuestionId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { questionText: "" },
  });

  const { startListening, stopListening, hasRecognitionSupport } = useSpeechToText({
    onTranscript: (transcript) => form.setValue("questionText", transcript, { shouldValidate: true }),
    onListen: setIsListening,
  });

  const handleListenClick = () => {
    if (isListening) {
      stopListening();
    } else {
      form.setValue("questionText", "");
      startListening();
    }
  };

  const handleGenerateAnswer = async (questionId: string, questionText: string) => {
    try {
      const result = await generateAnswerForLater({ question: questionText, language: 'English' });
      setQuestionQueue(prev => prev.map(q => q.id === questionId ? {
        ...q,
        status: 'answered',
        answerText: result.answer,
        answerImageUrl: result.imageUrl,
        answerAudioUri: result.audioDataUri,
      } : q));
    } catch (error) {
      console.error("Failed to generate answer:", error);
      toast({ variant: 'destructive', title: "Generation Failed", description: "Couldn't generate an answer for this question." });
      setQuestionQueue(prev => prev.map(q => q.id === questionId ? { ...q, status: 'error' } : q));
    }
  };

  const onSubmit = (data: FormValues) => {
    const newQuestionId = crypto.randomUUID();
    const newQuestion: QueuedQuestion = {
      id: newQuestionId,
      questionText: data.questionText,
      status: "processing",
    };

    setQuestionQueue((prev) => [newQuestion, ...prev]);
    form.reset();

    handleGenerateAnswer(newQuestionId, data.questionText);
  };
  
  const handleRegenerate = (question: QueuedQuestion) => {
    if (playingQuestionId === question.id) {
      audioRef.current?.pause();
      setPlayingQuestionId(null);
    }
    setQuestionQueue(prev => prev.map(q => q.id === question.id ? { ...q, status: 'processing', answerText: undefined, answerImageUrl: undefined, answerAudioUri: undefined } : q));
    handleGenerateAnswer(question.id, question.questionText);
  };
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => setPlayingQuestionId(null);
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);
  
  const handlePlayPause = (question: QueuedQuestion) => {
    if (!audioRef.current || !question.answerAudioUri) return;
    
    if (playingQuestionId && playingQuestionId !== question.id) {
        audioRef.current.pause();
    }

    if (playingQuestionId === question.id) {
      audioRef.current.pause();
      setPlayingQuestionId(null);
    } else {
      audioRef.current.src = question.answerAudioUri;
      audioRef.current.play().catch(e => console.error("Audio playback failed.", e));
      setPlayingQuestionId(question.id);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <audio ref={audioRef} className="hidden" />
      <Card className="lg:col-span-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="font-headline">Ask Later</CardTitle>
              <CardDescription>Capture student questions now, get AI-powered answers later.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="questionText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student's Question</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Textarea
                          placeholder="e.g., Why do stars twinkle? Or, use the mic."
                          {...field}
                          rows={4}
                          disabled={isListening}
                        />
                        {isClient && hasRecognitionSupport && (
                          <Button type="button" variant="ghost" size="icon" className="absolute bottom-2 right-2" onClick={handleListenClick}>
                            {isListening ? <MicOff className="h-4 w-4 text-destructive" /> : <Mic className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit">Add Question to Queue</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card className="lg:col-span-2 min-h-full">
        <CardHeader>
          <CardTitle className="font-headline">Question Queue</CardTitle>
          <CardDescription>Questions are answered automatically and will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          {questionQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-64">
                <HelpCircle className="w-12 h-12 mb-4" />
                <p>No questions yet.</p>
                <p className="text-sm">Captured questions will appear here.</p>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {questionQueue.map((q) => (
                <AccordionItem value={q.id} key={q.id}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-4 w-full">
                        <div className="flex-1 truncate">{q.questionText}</div>
                        <Badge variant={
                            q.status === 'answered' ? 'default' : 
                            q.status === 'error' ? 'destructive' : 'outline'
                        } className="capitalize ml-auto mr-2">
                            {q.status === 'processing' ? <Loader2 className="w-4 h-4 animate-spin"/> : q.status}
                        </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {q.status === 'processing' && (
                        <div className="p-4">
                            <GeneratingLoader>Thinking of a simple explanation...</GeneratingLoader>
                        </div>
                    )}
                    {q.status === 'error' && (
                        <div className="text-destructive flex items-center gap-2">
                           <AlertCircle className="w-4 h-4"/>
                           <span>Something went wrong. Please try again.</span>
                        </div>
                    )}
                    {q.status === 'answered' && q.answerText && (
                      <div className="space-y-4">
                        {q.answerImageUrl && (
                           <div className="border rounded-lg p-2 bg-muted/50">
                               <Image src={q.answerImageUrl} alt="Visual Aid" width={300} height={150} className="rounded-md mx-auto object-contain" data-ai-hint="explanation diagram" />
                           </div>
                        )}
                        <p className="whitespace-pre-wrap text-sm">{q.answerText}</p>
                        <div className="flex items-center gap-2">
                          {q.answerAudioUri && (
                              <Button variant="outline" size="sm" onClick={() => handlePlayPause(q)}>
                                 {playingQuestionId === q.id ? <Pause className="mr-2 h-4 w-4"/> : <Play className="mr-2 h-4 w-4"/>}
                                 {playingQuestionId === q.id ? "Pause" : "Play Answer"}
                              </Button>
                          )}
                          <Button variant="secondary" size="sm" onClick={() => handleRegenerate(q)}>
                            <RefreshCw className="mr-2 h-4 w-4"/>
                            Regenerate
                          </Button>
                        </div>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
