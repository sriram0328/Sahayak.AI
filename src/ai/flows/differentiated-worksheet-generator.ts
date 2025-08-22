
'use server';
/**
 * @fileOverview AI agent that generates differentiated worksheets from a textbook page image.
 *
 * - generateDifferentiatedWorksheets - A function that handles the worksheet generation process.
 * - GenerateDifferentiatedWorksheetsInput - The input type for the generateDifferentiatedWorksheets function.
 * - GenerateDifferentiatedWorksheetsOutput - The return type for the generateDifferentiatedWorksheets function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDifferentiatedWorksheetsInputSchema = z.object({
  textbookPagePhotoDataUri: z
    .string()
    .describe(
      "A photo of a textbook page, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateDifferentiatedWorksheetsInput = z.infer<typeof GenerateDifferentiatedWorksheetsInputSchema>;

const GenerateDifferentiatedWorksheetsOutputSchema = z.object({
  easyWorksheet: z.string().describe('Worksheet for easy level.'),
  intermediateWorksheet: z.string().describe('Worksheet for intermediate level.'),
  advancedWorksheet: z.string().describe('Worksheet for advanced level.'),
});
export type GenerateDifferentiatedWorksheetsOutput = z.infer<typeof GenerateDifferentiatedWorksheetsOutputSchema>;

export async function generateDifferentiatedWorksheets(
  input: GenerateDifferentiatedWorksheetsInput
): Promise<GenerateDifferentiatedWorksheetsOutput> {
  return differentiatedWorksheetGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'differentiatedWorksheetGeneratorPrompt',
  input: {schema: GenerateDifferentiatedWorksheetsInputSchema},
  output: {schema: GenerateDifferentiatedWorksheetsOutputSchema},
  prompt: `You are an expert educator skilled at creating differentiated worksheets based on a given textbook page.

  Analyze the textbook page and generate three worksheets: one for easy, one for intermediate, and one for advanced learners.
  The worksheets should cover the same concepts but vary in complexity and question types.

  Textbook Page Photo: {{media url=textbookPagePhotoDataUri}}

  Easy Worksheet: Focus on basic recall and understanding of the concepts.
  Intermediate Worksheet: Include questions that require application and analysis of the concepts.
  Advanced Worksheet: Challenge students with synthesis, evaluation, and problem-solving related to the concepts.

  Ensure that the worksheets are age-appropriate and aligned with common educational standards.

  Output the worksheets in a format that can be easily printed or used digitally. Specifically, provide clear instructions, well-structured questions, and appropriate spacing for answers.

  Easy Worksheet:
  {{outputSchema/easyWorksheet}}

  Intermediate Worksheet:
  {{outputSchema/intermediateWorksheet}}

  Advanced Worksheet:
  {{outputSchema/advancedWorksheet}}`,
});

const differentiatedWorksheetGeneratorFlow = ai.defineFlow(
  {
    name: 'differentiatedWorksheetGeneratorFlow',
    inputSchema: GenerateDifferentiatedWorksheetsInputSchema,
    outputSchema: GenerateDifferentiatedWorksheetsOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error('The model failed to generate a response.');
      }
      return output;
    } catch (error) {
      console.error('Worksheet generation flow failed:', error);
      // Check for specific overload-related error messages
      if (
        error instanceof Error &&
        (error.message.includes('503') || error.message.includes('overloaded'))
      ) {
        throw new Error(
          'The AI model is currently busy. Please try again in a moment.'
        );
      }
      // Provide a generic but informative error for other cases
      throw new Error(
        'An unexpected error occurred while generating worksheets. Please try again.'
      );
    }
  }
);
