
"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { generateRolePlayScript, generateAudioForScript } from "@/ai/flows/role-play-script-creator";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, Pause, CircleDashed } from "lucide-react";
import { GeneratingLoader } from "@/components/ui/generating-loader";

const formSchema = z.object({
  topic: z.string().min(5, "Topic must be at least 5 characters long."),
  characters: z.string().optional(),
  setting: z.string().optional(),
  language: z.string({ required_error: "Please select a language." }),
});

type FormValues = z.infer<typeof formSchema>;

type GeneratedOutput = {
    script: string;
    audioDataUri?: string;
}

export default function RolePlayScriptPage() {
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState<GeneratedOutput | null>(null);
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "",
      characters: "",
      setting: "",
      language: "English",
    },
  });
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);
  
  const handlePlayPause = () => {
      if (!audioRef.current || !generatedOutput?.audioDataUri) return;
      if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
      } else {
          audioRef.current.src = generatedOutput.audioDataUri;
          audioRef.current.play().catch(e => console.error("Audio playback failed.", e));
          setIsPlaying(true);
      }
  }

  const handleAudioGeneration = async (script: string) => {
    setIsGeneratingAudio(true);
    try {
        const result = await generateAudioForScript(script);
        setGeneratedOutput(prev => prev ? { ...prev, audioDataUri: result.audioDataUri } : null);
        if (!result.audioDataUri) {
            toast({
                title: "Audio Not Available",
                description: "The script was generated, but audio playback is not available for it.",
            });
        }
    } catch (error) {
        console.error("Audio generation failed:", error);
        toast({
            variant: "destructive",
            title: "Audio Generation Failed",
            description: "Could not generate audio for the script.",
        });
    } finally {
        setIsGeneratingAudio(false);
    }
  }

  const onSubmit = async (data: FormValues) => {
    setIsGeneratingScript(true);
    setGeneratedOutput(null);
    if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
    }

    try {
      const scriptResult = await generateRolePlayScript(data);
      setGeneratedOutput({ script: scriptResult });
      // Trigger audio generation in the background
      handleAudioGeneration(scriptResult);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error Generating Script",
        description: error.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const isLoading = isGeneratingScript;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <audio ref={audioRef} className="hidden" />
      <Card>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="font-headline">Role-Play Script Creator</CardTitle>
              <CardDescription>
                Create a script for an educational role-play scenario. Just provide a topic, and the AI will do the rest!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isClient ? (
                <>
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic / Learning Objective</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., How to politely ask for directions."
                            {...field}
                            disabled={isLoading}
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="characters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Characters (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Tourist, Police Officer"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="setting"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Context (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., On a busy street corner in a new city."
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Hindi">Hindi</SelectItem>
                            <SelectItem value="Marathi">Marathi</SelectItem>
                            <SelectItem value="Tamil">Tamil</SelectItem>
                            <SelectItem value="Telugu">Telugu</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="h-4 w-1/4 bg-muted rounded"></div>
                    <div className="h-10 w-full bg-muted rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-1/4 bg-muted rounded"></div>
                    <div className="h-10 w-full bg-muted rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-1/4 bg-muted rounded"></div>
                    <div className="h-10 w-full bg-muted rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-1/4 bg-muted rounded"></div>
                    <div className="h-10 w-full bg-muted rounded"></div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading || !isClient}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Script...
                  </>
                ) : (
                  "Generate Script"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card className="min-h-[400px]">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="font-headline">Generated Script</CardTitle>
              <CardDescription>Your role-play script will appear here.</CardDescription>
            </div>
            {isGeneratingAudio && (
                <Button variant="outline" disabled>
                    <CircleDashed className="mr-2 h-4 w-4 animate-spin" />
                    Generating Audio...
                </Button>
            )}
            {!isGeneratingAudio && generatedOutput?.audioDataUri && (
                <Button variant="outline" onClick={handlePlayPause}>
                    {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                    {isPlaying ? "Pause" : "Play Script"}
                </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isGeneratingScript && <GeneratingLoader>Writing your script...</GeneratingLoader>}
          {generatedOutput && (
            <div className="markdown-content text-sm p-4 bg-muted/50 rounded-lg max-h-[60vh] overflow-y-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedOutput.script}</ReactMarkdown>
            </div>
          )}
          {!isGeneratingScript && !generatedOutput && (
            <div className="flex items-center justify-center h-48 text-center text-muted-foreground">
              <p>Waiting for script details...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
