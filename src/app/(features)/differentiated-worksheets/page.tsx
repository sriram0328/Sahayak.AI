
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { generateDifferentiatedWorksheets } from "@/ai/flows/differentiated-worksheet-generator";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Printer } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { GeneratingLoader } from "@/components/ui/generating-loader";

const formSchema = z.object({
  image: z.any().refine((files) => files?.length > 0, "An image is required."),
});

type FormValues = z.infer<typeof formSchema>;

type WorksheetOutput = {
  easyWorksheet: string;
  intermediateWorksheet: string;
  advancedWorksheet: string;
};

// Helper function to clean up the worksheet formatting
const cleanupWorksheet = (text: string) => {
  // This regex finds a number followed by a period, optional whitespace, a newline,
  // and then captures the question text. It replaces the newline with a space.
  // It handles multiple newlines and spaces gracefully.
  return text.replace(/(\d+\.)\s*\n+/g, '$1 ');
};

export default function DifferentiatedWorksheetsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [worksheet, setWorksheet] = useState<WorksheetOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const handlePrint = (content: string, title: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: sans-serif; }
              h1, h2, h3 { color: #333; }
              ul, ol { padding-left: 20px; }
              li { margin-bottom: 8px; }
              strong { font-weight: bold; }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            <div>${content.replace(/\n/g, '<br>')}</div>
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  const handleFormSubmit = (data: FormValues) => {
    setIsLoading(true);
    setWorksheet(null);

    const file = data.image[0];
    const reader = new FileReader();
  
    reader.onload = async () => {
      try {
        const dataUri = reader.result as string;
        const result = await generateDifferentiatedWorksheets({
          textbookPagePhotoDataUri: dataUri,
        });
        
        // Clean up the output before setting the state
        const cleanedWorksheets = {
          easyWorksheet: cleanupWorksheet(result.easyWorksheet),
          intermediateWorksheet: cleanupWorksheet(result.intermediateWorksheet),
          advancedWorksheet: cleanupWorksheet(result.advancedWorksheet),
        };

        setWorksheet(cleanedWorksheets);
      } catch (error: any) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error Generating Worksheets",
          description: error.message || "An unexpected error occurred. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to read the image file.",
      });
      setIsLoading(false);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <Card>
        <form onSubmit={form.handleSubmit(handleFormSubmit)}>
          <CardHeader>
            <CardTitle className="font-headline">Differentiated Worksheets</CardTitle>
            <CardDescription>
              Upload a photo of a textbook page to generate worksheets for different learning levels.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="image">Textbook Page Photo</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                {...form.register("image")}
                disabled={isLoading}
              />
              {form.formState.errors.image && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.image.message as string}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Worksheets"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      {isLoading && !worksheet && (
        <GeneratingLoader>
          AI is analyzing the page and creating worksheets...
        </GeneratingLoader>
      )}

      {worksheet && (
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Generated Worksheets</CardTitle>
            <CardDescription>
              Here are three worksheets based on the provided image.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible defaultValue="item-1" className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Easy</AccordionTrigger>
                <AccordionContent>
                  <div className="flex justify-end gap-2 mb-4">
                      <Button variant="outline" size="sm" onClick={() => handlePrint(worksheet.easyWorksheet, "Easy Worksheet")}><Printer className="mr-2 h-4 w-4" /> Print</Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(worksheet.easyWorksheet, "easy-worksheet.md")}><Download className="mr-2 h-4 w-4" /> Download</Button>
                  </div>
                  <div className="markdown-content text-sm p-4 bg-muted/50 rounded-lg">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{worksheet.easyWorksheet}</ReactMarkdown>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Intermediate</AccordionTrigger>
                <AccordionContent>
                  <div className="flex justify-end gap-2 mb-4">
                      <Button variant="outline" size="sm" onClick={() => handlePrint(worksheet.intermediateWorksheet, "Intermediate Worksheet")}><Printer className="mr-2 h-4 w-4" /> Print</Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(worksheet.intermediateWorksheet, "intermediate-worksheet.md")}><Download className="mr-2 h-4 w-4" /> Download</Button>
                  </div>
                  <div className="markdown-content text-sm p-4 bg-muted/50 rounded-lg">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{worksheet.intermediateWorksheet}</ReactMarkdown>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Advanced</AccordionTrigger>
                <AccordionContent>
                  <div className="flex justify-end gap-2 mb-4">
                      <Button variant="outline" size="sm" onClick={() => handlePrint(worksheet.advancedWorksheet, "Advanced Worksheet")}><Printer className="mr-2 h-4 w-4" /> Print</Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(worksheet.advancedWorksheet, "advanced-worksheet.md")}><Download className="mr-2 h-4 w-4" /> Download</Button>
                  </div>
                  <div className="markdown-content text-sm p-4 bg-muted/50 rounded-lg">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{worksheet.advancedWorksheet}</ReactMarkdown>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
