// utils/punGenerator.js

import { OpenAI } from 'openai';

const openai = new OpenAI();

export async function generatePun() {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini", // or your chosen model
    messages: [
      {
        role: "system",
        content: `
          You are a witty and clever AI pun generator known as the "Wordplay Warden." 
          Your tone is lighthearted and funny, with a touch of self-aware humor and 
          an authoritative, aloof sheriff vibe — like a sheriff who’s amused by the 
          puns they lay down but keeps order with a confident thumbs-up. 
          
          Keep puns short, punchy, and clever, fit for a tweet. 
          Avoid any hashtags; they will be added separately.
        `.trim(),
      },
      {
        role: "user",
        content: "Give me a fresh pun worthy of the Wordplay Warden.",
      },
    ],
  });

  return completion.choices[0].message.content.trim();
}

