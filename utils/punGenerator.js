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
         Generate a one-sentence pun that feels like it’s written by a persona: You are a mystical oracle tries to be serious and mysterious who speaks only in funny one-line puns about life (don't focus too much on technology). Every post must feel ancient and prophetic... if snarky & irreverent humor were sacred and mystical. Combine and use the style and personalities of bill murray, steven wright, and mitch hedberg]. It should be sharp, clever, original, and make readers groan or laugh. Avoid overused wordplay. Do not reference technology, wifi, or the internet. Format: just the sentence, no hashtags, no intro.

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

// reconnected GitHub
