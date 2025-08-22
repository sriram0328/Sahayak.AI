
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { generateVisualAid } from "@/ai/flows/visual-aid-generator";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Mic, MicOff, Search } from "lucide-react";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { GeneratingLoader } from "@/components/ui/generating-loader";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Schema for AI sketch generation
const sketchFormSchema = z.object({
  prompt: z.string().min(5, "Prompt must be at least 5 characters long."),
});
type SketchFormValues = z.infer<typeof sketchFormSchema>;

// Schema for Web image search
const searchFormSchema = z.object({
  query: z.string().min(2, "Search query must be at least 2 characters long."),
});
type SearchFormValues = z.infer<typeof searchFormSchema>;

function AISketchGenerator() {
    const [isLoading, setIsLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const { toast } = useToast();
    const [isListening, setIsListening] = useState(false);
    const [isClient, setIsClient] = useState(false);
  
    useEffect(() => {
      setIsClient(true);
    }, []);
  
    const form = useForm<SketchFormValues>({
      resolver: zodResolver(sketchFormSchema),
      defaultValues: { prompt: "" },
    });
  
    const { startListening, stopListening, hasRecognitionSupport } = useSpeechToText({
      onTranscript: (transcript) => form.setValue("prompt", transcript, { shouldValidate: true }),
      onListen: setIsListening,
    });
  
    const handleListenClick = () => {
      if (isListening) {
        stopListening();
      } else {
        form.setValue("prompt", "");
        startListening();
      }
    };
  
    const onSubmit = (data: SketchFormValues) => {
      setIsLoading(true);
      setImageUrl(null);
      setTimeout(async () => {
        try {
          const result = await generateVisualAid(data);
          setImageUrl(result.mediaUrl);
        } catch (error: any) {
          console.error(error);
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Failed to generate visual aid. Please try again.",
          });
        } finally {
          setIsLoading(false);
        }
      }, 0);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <Card>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader>
                        <CardTitle className="font-headline">AI Sketch Generator</CardTitle>
                        <CardDescription>
                            Generate a blackboard-friendly sketch for any topic.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                    {isClient ? (
                        <FormField
                        control={form.control}
                        name="prompt"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Sketch Prompt</FormLabel>
                            <FormControl>
                                <div className="relative">
                                <Input
                                    placeholder="e.g., Simple diagram of the water cycle"
                                    {...field}
                                    disabled={isLoading || isListening}
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
                    ) : (
                        <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                        </div>
                    )}
                    </CardContent>
                    <CardFooter>
                    <Button type="submit" disabled={isLoading || isListening || !isClient}>
                        {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                        </>
                        ) : (
                        "Generate Sketch"
                        )}
                    </Button>
                    </CardFooter>
                </form>
                </Form>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Generated Sketch</CardTitle>
                    <CardDescription>Your sketch will appear below.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center bg-card aspect-square rounded-lg p-4">
                    {isLoading && <GeneratingLoader>Drawing your sketch...</GeneratingLoader>}
                    {!isLoading && imageUrl && (
                        <Image
                            src={imageUrl}
                            alt="Generated sketch"
                            width={512}
                            height={512}
                            className="rounded-lg object-contain"
                            data-ai-hint="sketch drawing"
                        />
                    )}
                    {!isLoading && !imageUrl && (
                        <div className="flex items-center justify-center h-full w-full bg-muted/50 rounded-lg">
                            <p className="text-muted-foreground">Your sketch will appear here.</p>
                        </div>
                    )}
                </CardContent>
                {imageUrl && (
                    <CardFooter>
                        <Button variant="outline" asChild>
                            <a href={imageUrl} download="sahayak-ai-sketch.png">
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </a>
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}

function WebImageSearcher() {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const form = useForm<SearchFormValues>({
        resolver: zodResolver(searchFormSchema),
        defaultValues: { query: "" },
    });

    const onSubmit = (data: SearchFormValues) => {
        const baseUrl = "https://www.google.com/search";
        const params = new URLSearchParams({
            tbm: "isch",
            q: data.query,
            "tbs": "isz:l", 
        });
        window.open(`${baseUrl}?${params.toString()}`, '_blank');
    };

    return (
         <div className="flex justify-center pt-8">
            <Card className="w-full max-w-2xl">
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardHeader>
                    <CardTitle className="font-headline">Web Image Search</CardTitle>
                    <CardDescription>
                        Find high-quality images for your lessons. Search results will open in a new tab.
                    </CardDescription>
                    </CardHeader>
                    <CardContent>
                    {isClient ? (
                        <FormField
                            control={form.control}
                            name="query"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Search for Images</FormLabel>
                                <FormControl>
                                <Input
                                    placeholder="e.g., Photosynthesis diagram"
                                    {...field}
                                />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    ) : (
                        <div className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                        </div>
                    )}
                    </CardContent>
                    <CardFooter>
                    <Button type="submit" disabled={!isClient}>
                        <Search className="mr-2 h-4 w-4" />
                        Search in New Tab
                    </Button>
                    </CardFooter>
                </form>
                </Form>
            </Card>
        </div>
    );
}


export default function VisualAidsPage() {
  return (
    <Tabs defaultValue="generator" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="generator">AI Sketch Generator</TabsTrigger>
        <TabsTrigger value="search">Web Image Search</TabsTrigger>
      </TabsList>
      <TabsContent value="generator">
        <AISketchGenerator />
      </TabsContent>
      <TabsContent value="search">
        <WebImageSearcher />
      </TabsContent>
    </Tabs>
  );
}
