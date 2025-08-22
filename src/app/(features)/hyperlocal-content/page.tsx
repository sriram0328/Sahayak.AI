
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { generateHyperlocalContent } from "@/ai/flows/hyperlocal-content-generator";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mic, MicOff } from "lucide-react";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { GeneratingLoader } from "@/components/ui/generating-loader";

const formSchema = z.object({
  prompt: z.string().min(10, "Prompt must be at least 10 characters long."),
  language: z.string({ required_error: "Please select a language." }),
});

type FormValues = z.infer<typeof formSchema>;

type GeneratedContent = {
  story: string;
  imageUrl: string;
};

export default function StoryCreatorPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      language: "English",
    },
  });

  const { startListening, stopListening, hasRecognitionSupport } = useSpeechToText({
    onTranscript: (transcript) => {
      form.setValue("prompt", transcript, { shouldValidate: true });
    },
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

  const onSubmit = (data: FormValues) => {
    setIsLoading(true);
    setGeneratedContent(null);
    setTimeout(async () => {
      try {
        const result = await generateHyperlocalContent(data);
        setGeneratedContent(result);
      } catch (error: any) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to generate content. Please try again.",
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
              <CardTitle className="font-headline">Story Creator</CardTitle>
              <CardDescription>
                Generate a culturally relevant story, with a custom illustration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Prompt</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Textarea
                          placeholder="e.g., A story about a clever fox and a foolish crow... Or, click the mic to speak."
                          {...field}
                          disabled={isLoading || isListening}
                          rows={4}
                        />
                        {isClient && hasRecognitionSupport && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute bottom-2 right-2"
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
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || isListening}>
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
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading || isListening}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Story"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Generated Story</CardTitle>
          <CardDescription>Your story and illustration will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && (
            <div className="p-6">
              <GeneratingLoader>Crafting your story and illustration...</GeneratingLoader>
            </div>
          )}
          {generatedContent && (
             <div className="flex flex-col">
              <div className="bg-muted aspect-video flex items-center justify-center">
                <Image
                  src={generatedContent.imageUrl}
                  alt="Generated story illustration"
                  width={512}
                  height={288}
                  className="w-full h-full object-cover rounded-t-lg"
                  data-ai-hint="story illustration"
                />
              </div>
              <div className="p-6 pt-4 bg-background rounded-b-lg whitespace-pre-wrap text-sm">
                {generatedContent.story}
              </div>
            </div>
          )}
          {!isLoading && !generatedContent && (
             <div className="flex items-center justify-center h-48 text-center text-muted-foreground p-6">
                <p>Waiting for story prompt...</p>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
