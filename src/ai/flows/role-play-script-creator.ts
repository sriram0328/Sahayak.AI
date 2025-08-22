
'use server';
/**
 * @fileOverview Generates role-play scripts for educational purposes, with multi-speaker audio.
 *
 * - generateRolePlayScript - A function that generates a script.
 * - generateAudioForScript - A function that generates audio for a script.
 * - GenerateRolePlayScriptInput - The input type for the script generation function.
 * - GenerateAudioForScriptOutput - The return type for the audio generation function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';
import wav from 'wav';

// Helper to convert PCM to WAV
async function toWav(pcmData: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
        const writer = new wav.Writer({ channels: 1, sampleRate: 24000, bitDepth: 16 });
        const bufs: Buffer[] = [];
        writer.on('error', reject);
        writer.on('data', (d) => bufs.push(d));
        writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));
        writer.write(pcmData);
        writer.end();
    });
}

// Input for Script Generation
const GenerateRolePlayScriptInputSchema = z.object({
  topic: z.string().describe('The main topic or learning objective of the role-play.'),
  characters: z.string().optional().describe('An optional comma-separated list of characters (e.g., "Cashier, Customer").'),
  setting: z.string().optional().describe('The optional context for the role-play (e.g., "At a grocery store").'),
  language: z.string().describe('The language for the script.'),
});
export type GenerateRolePlayScriptInput = z.infer<typeof GenerateRolePlayScriptInputSchema>;

// Output for Audio Generation
const GenerateAudioForScriptOutputSchema = z.object({
    audioDataUri: z.string().optional().describe("A data URI of the generated multi-speaker audio."),
});
export type GenerateAudioForScriptOutput = z.infer<typeof GenerateAudioForScriptOutputSchema>;

// Exported function for generating the script text
export async function generateRolePlayScript(
  input: GenerateRolePlayScriptInput
): Promise<string> {
  return generateRolePlayScriptFlow(input);
}

// Exported function for generating the audio
export async function generateAudioForScript(
    scriptText: string
): Promise<GenerateAudioForScriptOutput> {
    return generateAudioForScriptFlow(scriptText);
}

// Prompt for Script Generation
const scriptPrompt = ai.definePrompt({
  name: 'generateRolePlayScriptPrompt',
  input: {schema: GenerateRolePlayScriptInputSchema},
  prompt: `You are an expert scriptwriter for educational content. Create a short, simple, and clear role-play script for students based on the following details. The script should be easy to perform in a classroom setting.

Topic/Learning Objective: {{{topic}}}
Language: {{{language}}}

{{#if characters}}
Characters: {{{characters}}}
{{/if}}

{{#if setting}}
Context: {{{setting}}}
{{/if}}

{{#unless characters}}
If characters are not provided, invent a simple and relevant set of characters for the topic.
{{/unless}}

{{#unless setting}}
If a context is not provided, create an appropriate context for the topic and characters.
{{/unless}}

The script should have clear dialogue for each character and simple stage directions. Format the output in Markdown.
The format must be:
**Character Name:** Dialogue here.
(Stage direction in parentheses)
`,
});

// Flow for Script Generation
const generateRolePlayScriptFlow = ai.defineFlow(
  {
    name: 'generateRolePlayScriptFlow',
    inputSchema: GenerateRolePlayScriptInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      const response = await scriptPrompt(input);
      return response.text;
    } catch (error) {
      console.error('Role-play script generation failed:', error);
      if (error instanceof Error && (error.message.includes('503') || error.message.includes('overloaded'))) {
        throw new Error('The AI model is currently busy. Please try again in a moment.');
      }
      throw new Error('An unexpected error occurred while generating the script. Please try again.');
    }
  }
);


// Single-speaker TTS fallback function
async function generateSingleSpeakerAudio(text: string): Promise<string | null> {
    try {
        console.log("Falling back to single-speaker TTS.");
        const plainText = text.replace(/\*\*(.*?):\*\*/g, '$1:').replace(/(\r\n|\n|\r)/gm, " ");
        
        const { media } = await ai.generate({
            model: googleAI.model('gemini-2.5-flash-preview-tts'),
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Algenib' } } },
            },
            prompt: plainText,
        });

        if (!media?.url) return null;
        
        const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
        const wavBase64 = await toWav(audioBuffer);
        return 'data:audio/wav;base64,' + wavBase64;

    } catch (fallbackError) {
        console.error("Single-speaker TTS fallback also failed:", fallbackError);
        return null;
    }
}

// Flow for Audio Generation
const generateAudioForScriptFlow = ai.defineFlow(
  {
    name: 'generateAudioForScriptFlow',
    inputSchema: z.string(),
    outputSchema: GenerateAudioForScriptOutputSchema,
  },
  async (scriptText) => {
    try {
      const lines = scriptText.split('\n').filter(line => line.trim() !== '' && !line.trim().startsWith('('));
      const characterDialogues = lines.map(line => line.match(/^\s*\**(.+?)\**\s*:/)).filter(Boolean);
      const characters = [...new Set(characterDialogues.map(match => match![1].trim()))];
      
      if (characters.length < 2 || characters.length > 5) {
        console.warn(`Multi-speaker audio generation skipped: Found ${characters.length} characters. Attempting fallback.`);
        const singleSpeakerAudio = await generateSingleSpeakerAudio(scriptText);
        return { audioDataUri: singleSpeakerAudio || undefined };
      }
      
      const ttsPrompt = scriptText.replace(/(\r\n|\n|\r)/gm, "\n").replace(/\*\*(.*?):\*\*/g, '$1:');

      const prebuiltVoices = ['Algenib', 'Achernar', 'Enif', 'Fomalhaut', 'Hamal'];
      const speakerVoiceConfigs = characters.map((char, index) => ({
        speaker: char,
        voiceConfig: { prebuiltVoiceConfig: { voiceName: prebuiltVoices[index % prebuiltVoices.length] } },
      }));

      const { media } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: { multiSpeakerVoiceConfig: { speakerVoiceConfigs } },
        },
        prompt: ttsPrompt,
      });

      if (!media?.url) {
         console.warn("Multi-speaker TTS returned no media. Attempting fallback.");
         const singleSpeakerAudio = await generateSingleSpeakerAudio(scriptText);
         return { audioDataUri: singleSpeakerAudio || undefined };
      }

      const audioBuffer = Buffer.from(media.url.substring(media.url.indexOf(',') + 1), 'base64');
      const wavBase64 = await toWav(audioBuffer);

      return {
        audioDataUri: 'data:audio/wav;base64,' + wavBase64,
      };

    } catch (error) {
        console.error("Multi-speaker audio generation failed, attempting fallback:", error);
        const singleSpeakerAudio = await generateSingleSpeakerAudio(scriptText);
        return { audioDataUri: singleSpeakerAudio || undefined };
    }
  }
);
