
'use server';
/**
 * @fileOverview An AI agent that captures student questions and generates answers later.
 *
 * - generateAnswerForLater - A function that generates a comprehensive answer for a queued question.
 * - GenerateAnswerForLaterInput - The input type for the function.
 * - GenerateAnswerForLaterOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import wav from 'wav';

// Input Schema
const GenerateAnswerForLaterInputSchema = z.object({
  question: z.string().describe('The student question to be answered.'),
  language: z.string().optional().default('English').describe('The language for the answer.'),
});
export type GenerateAnswerForLaterInput = z.infer<typeof GenerateAnswerForLaterInputSchema>;

// Output Schema
const GenerateAnswerForLaterOutputSchema = z.object({
  answer: z.string().describe('The generated text answer.'),
  imageUrl: z.string().describe('A data URI of a visual aid for the answer.'),
  audioDataUri: z.string().describe('A data URI of the spoken answer.'),
});
export type GenerateAnswerForLaterOutput = z.infer<typeof GenerateAnswerForLaterOutputSchema>;

// The exported function that the UI will call
export async function generateAnswerForLater(
  input: GenerateAnswerForLaterInput
): Promise<GenerateAnswerForLaterOutput> {
  return generateAnswerForLaterFlow(input);
}

// Helper function to convert PCM audio to WAV format
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({ channels, sampleRate: rate, bitDepth: sampleWidth * 8 });
    const bufs: Buffer[] = [];
    writer.on('error', reject);
    writer.on('data', (d) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));
    writer.write(pcmData);
    writer.end();
  });
}

// Genkit Flow
const generateAnswerForLaterFlow = ai.defineFlow(
  {
    name: 'generateAnswerForLaterFlow',
    inputSchema: GenerateAnswerForLaterInputSchema,
    outputSchema: GenerateAnswerForLaterOutputSchema,
  },
  async ({ question, language }) => {
    let answer: string;
    try {
      // 1. Generate the text answer
      const answerPrompt = ai.definePrompt({
          name: 'askLaterAnswerPrompt',
          input: { schema: z.object({ question: z.string(), language: z.string() }) },
          output: { schema: z.object({ answer: z.string() }) },
          prompt: `You are Sahayak.AI, a friendly AI co-teacher. Answer the student's question in a simple, age-appropriate way with an analogy.
          Language: {{{language}}}
          Question: {{{question}}}
          Answer:`
      });
      const { output: answerOutput } = await answerPrompt({ question, language: language! });
      answer = answerOutput?.answer ?? '';
      if (!answer) {
        throw new Error('Failed to generate a text answer.');
      }
    } catch (error) {
      console.error('Ask Later text generation failed:', error);
      if (error instanceof Error && (error.message.includes('503') || error.message.includes('overloaded'))) {
        throw new Error("The AI text model is currently busy. Please try again in a moment.");
      }
      throw new Error("Failed to generate an answer for the question.");
    }

    // 2. Generate audio and image in parallel
    const [imageResult, audioResult] = await Promise.allSettled([
      // Image Generation
      (async () => {
        const sketchPrompt = `A high-quality, realistic photo that helps explain the answer to the question: '${question}'. The style should be clear and engaging for a child.`;
        const { media } = await ai.generate({
          model: 'googleai/gemini-2.0-flash-preview-image-generation',
          prompt: sketchPrompt,
          config: { responseModalities: ['TEXT', 'IMAGE'] },
        });
        return media?.url;
      })(),

      // Audio Generation (TTS)
      (async () => {
        const { media } = await ai.generate({
            model: googleAI.model('gemini-2.5-flash-preview-tts'),
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Algenib' } } },
            },
            prompt: answer,
        });
        if (!media) return null;
        const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
        const wavBase64 = await toWav(audioBuffer);
        return 'data:audio/wav;base64,' + wavBase64;
      })(),
    ]);

    // 3. Consolidate results
    const imageUrl = imageResult.status === 'fulfilled' && imageResult.value 
        ? imageResult.value
        : 'https://placehold.co/512x288.png'; // Fallback image

    const audioDataUri = audioResult.status === 'fulfilled' && audioResult.value
        ? audioResult.value
        : ''; // Fallback empty string

    if (imageResult.status === 'rejected') console.error("Image generation failed:", imageResult.reason);
    if (audioResult.status === 'rejected') console.error("Audio generation failed:", audioResult.reason);

    return {
      answer,
      imageUrl,
      audioDataUri,
    };
  }
);
