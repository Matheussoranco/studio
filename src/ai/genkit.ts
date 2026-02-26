
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {anthropic} from '@genkit-ai/anthropic';

export const ai = genkit({
  plugins: [
    googleAI(),
    anthropic()
  ],
  model: 'googleai/gemini-2.5-flash',
});
