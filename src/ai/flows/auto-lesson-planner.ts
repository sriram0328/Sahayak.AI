
'use server';
/**
 * @fileOverview Generates lesson plans from a weekly syllabus.
 *
 * - generateLessonPlan - A function that generates a lesson plan.
 * - GenerateLessonPlanInput - The input type for the generateLessonPlan function.
 * - GenerateLessonPlanOutput - The return type for the generateLessonPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLessonPlanInputSchema = z.object({
  weeklySyllabus: z
    .string()
    .describe('The weekly syllabus or topics list for the lesson plan.'),
});
export type GenerateLessonPlanInput = z.infer<typeof GenerateLessonPlanInputSchema>;

// The output is now a simple string.
export type GenerateLessonPlanOutput = string;

export async function generateLessonPlan(input: GenerateLessonPlanInput): Promise<GenerateLessonPlanOutput> {
  return generateLessonPlanFlow(input);
}

const lessonPlanPrompt = ai.definePrompt({
  name: 'generateLessonPlanPrompt',
  input: {schema: GenerateLessonPlanInputSchema},
  // No output schema, so it will return raw text.
  prompt: `You are an experienced teacher. Generate a detailed and time-structured lesson plan, broken down by level, based on the following weekly syllabus:\n\n{{{weeklySyllabus}}}\n\nThe lesson plan should include specific activities, learning objectives, and assessment methods for each level.  Make sure the lesson plan is easy to follow and implement in a classroom setting.`,
});

const generateLessonPlanFlow = ai.defineFlow(
  {
    name: 'generateLessonPlanFlow',
    inputSchema: GenerateLessonPlanInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      const response = await lessonPlanPrompt(input);
      return response.text;
    } catch (error) {
      console.error('Lesson plan generation failed:', error);
      if (
        error instanceof Error &&
        (error.message.includes('503') || error.message.includes('overloaded'))
      ) {
        throw new Error(
          'The AI model is currently busy. Please try again in a moment.'
        );
      }
      throw new Error(
        'An unexpected error occurred while generating the lesson plan. Please try again.'
      );
    }
  }
);
