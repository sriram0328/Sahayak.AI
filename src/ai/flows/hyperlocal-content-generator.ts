
'use server';
/**
 * @fileOverview Generates culturally relevant stories in the local language, with a matching illustration.
 *
 * - generateHyperlocalContent - A function that handles the content generation process.
 * - GenerateHyperlocalContentInput - The input type for the generateHyperlocalContent function.
 * - GenerateHyperlocalContentOutput - The return type for the generateHyperlocalContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHyperlocalContentInputSchema = z.object({
  prompt: z.string().describe('The prompt for the story in the local language.'),
  language: z.string().describe('The local language of the prompt.'),
});
export type GenerateHyperlocalContentInput = z.infer<typeof GenerateHyperlocalContentInputSchema>;

const GenerateHyperlocalContentOutputSchema = z.object({
  story: z.string().describe('The generated story in the local language.'),
  imageUrl: z.string().describe('A data URI of an illustration for the story.'),
});
export type GenerateHyperlocalContentOutput = z.infer<typeof GenerateHyperlocalContentOutputSchema>;

export async function generateHyperlocalContent(
  input: GenerateHyperlocalContentInput
): Promise<GenerateHyperlocalContentOutput> {
  return generateHyperlocalContentFlow(input);
}

const storyPrompt = ai.definePrompt({
  name: 'generateHyperlocalContentPrompt',
  input: {schema: GenerateHyperlocalContentInputSchema},
  output: {schema: z.object({ story: z.string().describe('The generated story in the local language.') })},
  prompt: `You are a storyteller specializing in creating culturally relevant stories for children in India.

  Please generate a story in the following language: {{{language}}}.
  The story should be based on the following prompt:
  {{{prompt}}}
  `,
});

const generateHyperlocalContentFlow = ai.defineFlow(
  {
    name: 'generateHyperlocalContentFlow',
    inputSchema: GenerateHyperlocalContentInputSchema,
    outputSchema: GenerateHyperlocalContentOutputSchema,
  },
  async input => {
    let story: string;
    // 1. Generate story text
    try {
      const { output: storyOutput } = await storyPrompt(input);
      if (!storyOutput?.story) {
          throw new Error('Failed to generate a story.');
      }
      story = storyOutput.story;
    } catch (error) {
        console.error("Story generation failed:", error);
        if (error instanceof Error && (error.message.includes('503') || error.message.includes('overloaded'))) {
            throw new Error("The AI model is currently busy. Please try again in a moment.");
        }
        throw new Error('Failed to generate a story. Please try again.');
    }

    // 2. Generate a purely visual prompt from the story.
    let imageGenerationPrompt: string;
    try {
        const visualPromptGenerator = ai.definePrompt({
            name: 'visualPromptGenerator',
            input: { schema: z.object({ story: z.string() }) },
            output: { schema: z.object({ visualPrompt: z.string() })},
            prompt: `Read the following children's story. Based on the story, create a short, descriptive, and accurate visual prompt for an AI image generator. The prompt should describe the main characters and the key scene in a simple, visual way suitable for creating a relevant illustration.
            
            Story:
            {{{story}}}
            
            Visual Prompt:`
        });
        const { output: visualPromptOutput } = await visualPromptGenerator({ story });
        if (!visualPromptOutput?.visualPrompt) {
            throw new Error("Could not derive a visual prompt from the story.");
        }
        imageGenerationPrompt = visualPromptOutput.visualPrompt;
    } catch (error) {
        console.warn("Visual prompt generation failed. Using fallback.", error);
        // Fallback to a simpler prompt if the visual prompt generation fails
        imageGenerationPrompt = `A beautiful and vibrant illustration for a children's story, in a culturally relevant style.`;
    }

    // 3. Generate image using the new, clean visual prompt.
    // This prompt explicitly forbids text.
    const finalImagePrompt = `
    ${imageGenerationPrompt}. 
    The style should be a high-quality, photorealistic image that vividly illustrates a children's story. The image should be vibrant, clear, and engaging for kids.
    IMPORTANT: Do not include any text, words, or letters in the image. The image must be purely visual.`;
    
    try {
        const { media } = await ai.generate({
            model: 'googleai/gemini-2.0-flash-preview-image-generation',
            prompt: finalImagePrompt,
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
            },
        });

        if (media?.url) {
             return {
                story: story,
                imageUrl: media.url,
            };
        }
    } catch (imageError) {
        console.warn("Image generation failed, using placeholder.", imageError);
    }
    
    // Fallback for image generation failure
    return {
      story: story,
      imageUrl: 'https://placehold.co/512x288.png',
    }
  }
);
