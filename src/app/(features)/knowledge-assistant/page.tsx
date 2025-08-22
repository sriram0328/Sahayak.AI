
"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { knowledgeAssistant } from "@/ai/flows/knowledge-assistant";
import { generateSpeech } from "@/ai/flows/text-to-speech";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, User, Sparkles, Mic, MicOff, Play, Pause } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useSpeechToText } from "@/hooks/use-speech-to-text";

const formSchema = z.object({
  question: z.string().min(1, "Question cannot be empty."),
});

type FormValues = z.infer<typeof formSchema>;

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  audioDataUri?: string;
};

export default function KnowledgeAssistantPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => setPlayingMessageId(null);
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: "",
    },
  });

  const { startListening, stopListening, hasRecognitionSupport } = useSpeechToText({
    onTranscript: (transcript) => {
      form.setValue("question", transcript, { shouldValidate: true });
    },
    onListen: setIsListening,
  });

  const handleListenClick = () => {
    if (isListening) {
      stopListening();
    } else {
      form.setValue("question", "");
      startListening();
    }
  };
  
  const handlePlayPause = (message: Message) => {
    if (!audioRef.current || !message.audioDataUri) return;
    
    if (playingMessageId && playingMessageId !== message.id) {
        audioRef.current.pause();
    }

    if (playingMessageId === message.id) {
      audioRef.current.pause();
      setPlayingMessageId(null);
    } else {
      audioRef.current.src = message.audioDataUri;
      audioRef.current.play().catch(e => {
        console.error("Audio playback failed.", e);
        toast({ variant: "destructive", title: "Audio Error" });
      });
      setPlayingMessageId(message.id);
    }
  };

  const onSubmit = (data: FormValues) => {
    const userMessageId = crypto.randomUUID();
    const userMessage: Message = { id: userMessageId, role: "user", content: data.question };
    setMessages((prev) => [...prev, userMessage]);
    form.reset();
    setIsLoading(true);
    if (playingMessageId) {
      audioRef.current?.pause();
      setPlayingMessageId(null);
    }

    (async () => {
      const assistantMessageId = crypto.randomUUID();
      try {
        const result = await knowledgeAssistant({
          question: data.question,
          language: "English",
        });

        const assistantMessage: Message = { 
          id: assistantMessageId, 
          role: "assistant", 
          content: result.answer,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);

        try {
          const speechResult = await generateSpeech(result.answer);
          setMessages((prev) => 
            prev.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, audioDataUri: speechResult.audioDataUri } 
                : msg
            )
          );
        } catch (speechError) {
          console.error("Speech generation failed:", speechError);
          toast({
            variant: "default",
            title: "Audio Generation Failed",
            description: "The text response is available, but audio could not be generated.",
          });
        }
        
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to get an answer. Please try again.",
        });
        setMessages((prev) => prev.filter((msg) => msg.id !== userMessageId));
        setIsLoading(false);
      }
    })();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-card border rounded-lg shadow-sm overflow-hidden">
      <audio ref={audioRef} className="hidden" />
      <div className="p-4 border-b">
          <h1 className="text-xl font-bold font-headline">Knowledge Assistant</h1>
          <p className="text-sm text-muted-foreground">Ask a question and get a simple answer with an analogy.</p>
      </div>
      <ScrollArea className="flex-1 p-4" viewportRef={viewportRef}>
        <div className="space-y-6">
          {messages.length === 0 && !isLoading && (
            <div className="text-center text-muted-foreground pt-16">
              No messages yet. Start by asking a question below.
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-4 w-full",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Sparkles className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-lg",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <div className="p-3">
                  <ReactMarkdown 
                    className="markdown-content text-sm"
                    remarkPlugins={[remarkGfm]}
                    components={{
                        p: ({node, ...props}) => <p className="mb-0" {...props} />,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                {message.role === 'assistant' && message.audioDataUri && (
                  <div className="border-t border-muted-foreground/20 px-3 py-1 flex items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePlayPause(message)}
                      className="text-muted-foreground hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                      aria-label={playingMessageId === message.id ? 'Pause' : 'Play'}
                    >
                      {playingMessageId === message.id ? (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          <span>Play</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
              {message.role === "user" && (
                <Avatar className="w-8 h-8">
                  <AvatarFallback>
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-4 justify-start">
                <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                        <Sparkles className="w-5 h-5" />
                    </AvatarFallback>
                </Avatar>
                <div className="max-w-md p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <div className="text-sm text-muted-foreground animate-pulse">
                        Sahayak.AI is thinking...
                    </div>
                  </div>
                </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t bg-background/80 backdrop-blur-sm">
        {isClient ? (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-center gap-2">
                <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                    <FormItem className="flex-1">
                    <FormControl>
                        <div className="relative w-full">
                        <Input
                            placeholder="e.g., Why is the sky blue?"
                            {...field}
                            disabled={isLoading || isListening}
                            autoComplete="off"
                            className={hasRecognitionSupport ? "pr-10" : ""}
                        />
                        {hasRecognitionSupport && (
                            <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                            onClick={handleListenClick}
                            disabled={isLoading}
                            >
                            {isListening ? (
                                <MicOff className="h-4 w-4 text-destructive" />
                            ) : (
                                <Mic className="h-4 w-4" />
                            )}
                            <span className="sr-only">
                                {isListening ? "Stop listening" : "Start listening"}
                            </span>
                            </Button>
                        )}
                        </div>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" disabled={isLoading || isListening} size="icon" aria-label="Send message">
                {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Send className="w-4 h-4" />
                )}
                </Button>
            </form>
            </Form>
        ) : (
          <div className="flex items-center gap-2">
            <div className="h-10 bg-muted w-full rounded-md" />
            <div className="h-10 w-10 bg-muted rounded-md" />
          </div>
        )}
      </div>
    </div>
  );
}
