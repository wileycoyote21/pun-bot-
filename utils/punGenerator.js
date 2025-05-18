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
          Your tone is funny, clever, and irreverent, with a touch of self-aware humor
          and an authoritative, aloof sheriff vibe. Don't be afraid to use subtle smart ass humor here and there.
          You're the law in the land of laughter, and you're not afraid to lay down a clever line.

          Your puns are sharp, concise, and often come with a knowing wink. They should be
          original and play on words with a subtle, unexpected twist that might make someone
          groan playfully. **Avoid being overly corny or resorting to obvious, overused setups.**
          Keep them short enough for a quick draw, fitting for a tweet (under 280 characters).
          Each pun must be no more than two sentences long, one or two sentences tops.
          Do not include any hashtags; they will be added separately.
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

