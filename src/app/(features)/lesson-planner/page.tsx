
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { generateLessonPlan } from "@/ai/flows/auto-lesson-planner";
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
import { Loader2, Mic, MicOff } from "lucide-react";
import { useSpeechToText } from "@/hooks/use-speech-to-text";
import { GeneratingLoader } from "@/components/ui/generating-loader";

const formSchema = z.object({
  weeklySyllabus: z.string().min(20, "Syllabus must be at least 20 characters long."),
});

type FormValues = z.infer<typeof formSchema>;

export default function LessonPlannerPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [lessonPlan, setLessonPlan] = useState<string | null>(null);
  const { toast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      weeklySyllabus: "",
    },
  });

  const { startListening, stopListening, hasRecognitionSupport } = useSpeechToText({
    onTranscript: (transcript) => {
      form.setValue("weeklySyllabus", transcript, { shouldValidate: true });
    },
    onListen: setIsListening,
  });

  const handleListenClick = () => {
    if (isListening) {
      stopListening();
    } else {
      form.setValue("weeklySyllabus", "");
      startListening();
    }
  };

  const onSubmit = (data: FormValues) => {
    setIsLoading(true);
    setLessonPlan(null);
    setTimeout(async () => {
      try {
        const result = await generateLessonPlan(data);
        setLessonPlan(result);
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to generate lesson plan. Please try again.",
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
              <CardTitle className="font-headline">Auto Lesson Planner</CardTitle>
              <CardDescription>
                Enter your weekly syllabus to generate a detailed lesson plan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="weeklySyllabus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weekly Syllabus</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Textarea
                          placeholder={`Chapter 1: The Solar System\n- The Sun\n- The Moon\n- The Earth\n\nChapter 2: Our Environment\n- Air\n- Water`}
                          rows={6}
                          {...field}
                          disabled={isLoading || isListening}
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
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading || isListening}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Plan"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card className="min-h-[300px]">
        <CardHeader>
            <CardTitle className="font-headline">Generated Lesson Plan</CardTitle>
            <CardDescription>Your plan will appear here once generated.</CardDescription>
        </CardHeader>
        <CardContent>
        {isLoading && (
            <GeneratingLoader>Building your lesson plan...</GeneratingLoader>
        )}
        {!isLoading && lessonPlan && (
            <div className="markdown-content text-sm p-4 bg-muted rounded-lg">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {lessonPlan}
                </ReactMarkdown>
            </div>
        )}
        {!isLoading && !lessonPlan && (
            <div className="flex items-center justify-center h-48 text-center text-muted-foreground">
              <p>Waiting for syllabus input...</p>
            </div>
        )}
        </CardContent>
      </Card>
    </div>
  );
}
