
'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/differentiated-worksheet-generator.ts';
import '@/ai/flows/hyperlocal-content-generator.ts';
import '@/ai/flows/auto-lesson-planner.ts';
import '@/ai/flows/visual-aid-generator.ts';
import '@/ai/flows/knowledge-assistant.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/ai/flows/ask-later-generator.ts';
import '@/ai/flows/role-play-script-creator.ts';
