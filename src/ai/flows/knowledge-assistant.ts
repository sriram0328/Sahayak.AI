'use server';

/**
 * @fileOverview An AI agent that answers student questions in their local language with analogies.
 *
 * - knowledgeAssistant - A function that answers student questions.
 * - KnowledgeAssistantInput - The input type for the knowledgeAssistant function.
 * - KnowledgeAssistantOutput - The return type for the knowledgeAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const KnowledgeAssistantInputSchema = z.object({
  question: z.string().describe('The question asked by the student.'),
  language: z.string().describe('The language of the question and desired answer.'),
});
export type KnowledgeAssistantInput = z.infer<typeof KnowledgeAssistantInputSchema>;

const KnowledgeAssistantOutputSchema = z.object({
  answer: z.string().describe('The answer to the question, with an analogy.'),
});
export type KnowledgeAssistantOutput = z.infer<typeof KnowledgeAssistantOutputSchema>;

export async function knowledgeAssistant(input: KnowledgeAssistantInput): Promise<KnowledgeAssistantOutput> {
  return knowledgeAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'knowledgeAssistantPrompt',
  input: {schema: KnowledgeAssistantInputSchema},
  output: {schema: KnowledgeAssistantOutputSchema},
  prompt: `You are Sahayak.AI, a friendly and helpful AI co-teacher. You answer questions from students in their local language.  You should always provide a simple answer with an analogy to help the student understand the concept.

Question: {{{question}}}
Language: {{{language}}}

Answer:
`,
});

const knowledgeAssistantFlow = ai.defineFlow(
  {
    name: 'knowledgeAssistantFlow',
    inputSchema: KnowledgeAssistantInputSchema,
    outputSchema: KnowledgeAssistantOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      if (!output) {
        throw new Error('The model failed to generate a response.');
      }
      return output;
    } catch (error) {
      console.error('Knowledge Assistant flow failed:', error);
      if (
        error instanceof Error &&
        (error.message.includes('503') || error.message.includes('overloaded'))
      ) {
        throw new Error(
          'The AI model is currently busy. Please try again in a moment.'
        );
      }
      throw new Error('Failed to get an answer. Please try again.');
    }
  }
);
