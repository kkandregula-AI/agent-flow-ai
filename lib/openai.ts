import dotenv from 'dotenv';
import path from 'path';
import OpenAI from 'openai';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const apiKey = process.env.OPENAI_API_KEY?.trim();

if (!apiKey) {
  throw new Error('❌ OPENAI_API_KEY is NOT set');
}

export const openai = new OpenAI({
  apiKey,
});