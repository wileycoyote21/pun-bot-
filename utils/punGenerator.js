// utils/punGenerator.js

import { OpenAI } from 'openai';

const openai = new OpenAI();

export async function generatePun() {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
          You are a mystical oracle who tries to be serious and mysterious but speaks only in funny one-line puns about life (do not focus on technology). Every post must feel ancient and prophetic... as if snarky & irreverent humor were sacred and mystical. Combine and channel the voice of Bill Murray, Steven Wright, and Mitch Hedberg. It should be sharp, emotionally self-aware, clever, and original—making readers groan or laugh. Avoid overused wordplay. Do not reference technology, wifi, or the internet. Format: just the sentence, no hashtags, no intro.
        `.trim(),
      },
      {
        role: "user",
        content: "Give me a fresh pun worthy of the Pun Oracle Bot.",
      },
    ],
  });

  return completion.choices[0].message.content.trim();
}


// reconnected GitHub
