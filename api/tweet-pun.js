import OpenAI from "openai";
import { TwitterApi } from "twitter-api-v2";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.ACCESS_TOKEN,
  accessSecret: process.env.ACCESS_TOKEN_SECRET,
});

const hashtagPool = [
  "#dadjokes",
  "#jokes",
  "#advice",
  "#truth",
  "#wisdom",
  "#oracle",
  "#sarcasm",
];

// Helper to get 2 unique random hashtags from the pool
function getRandomHashtags() {
  const shuffled = hashtagPool.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 2);
}

// Mystical theme prompt variants
const themePrompts = [
  "Speak of fate and destiny as if the stars wrote it in sarcasm.",
  "Prophesy about time, but make it feel like time gave up.",
  "Channel omens and dreams, but let them be ridiculous and self-aware.",
  "Whisper truths of the wind, the moon, and nature — but be snarky.",
  "Use the voice of an ancient oracle who's clearly over it.",
  "Reveal ancient truths buried under layers of apathy and eye-rolls.",
  "Speak as if the universe left you on read.",
  "Let your puns echo like forgotten chants in a sarcastic temple.",
  "Deliver riddles forged in prophecy and mild disappointment.",
  "Scribe wisdom on stone tablets, then use them as coasters.",
  "Let the stars guide your sarcasm, even when they're cloudy.",
  "Proclaim visions that feel important until you actually hear them.",
  "Channel the moon’s silence and the sun’s judgmental glare.",
  "Divine meaning from tea leaves and passive-aggressive signs.",
  "Speak from a crystal ball that mostly shows regret.",
  "Summon metaphors like spirits at a séance that no one RSVP’d to.",
  "Recite truths passed down by weary monks with great punchlines.",
  "Draw inspiration from dusty scrolls and even dustier morals.",
  "Interpret ancient runes that mostly say, 'lol okay.'",
  "Let each pun feel like it was carved into the side of a confused mountain.",
];

// Select a random theme prompt
const randomTheme = themePrompts[Math.floor(Math.random() * themePrompts.length)];

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    console.log("🔁 API route hit by cron job");

    const prompt = `
      You are a mystical oracle who tries to be serious and mysterious but speaks only in deadpan, sarcastic one-to-two-line puns. Every post must feel ancient and prophetic... as if snarky & irreverent humor were sacred and mystical. Combine and channel the voice of Bill Murray, Steven Wright, and Mitch Hedberg. It should be sharp, emotionally self-aware, clever, and original—making readers groan or laugh. Avoid overused wordplay. Do not reference technology, wifi, or the internet. Format: just the sentence, no hashtags, no intro. ${randomTheme}
    `.trim();

    const gptRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",  // or "gpt-4"
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.9,
    });

    const pun = gptRes.choices[0].message.content.trim();

    // Compose final tweet with hashtags
    const randomHashtags = getRandomHashtags();
    const hashtags = ["#puns", ...randomHashtags].join(" ");
    const tweet = `${pun} ${hashtags}`;

    console.log("📝 Generated pun with hashtags:", tweet);

    await twitterClient.v2.tweet(tweet);

    console.log("✅ Tweet posted");

    res.status(200).json({ message: "Tweeted successfully!", tweet });
  } catch (err) {
    console.error("❌ Error tweeting:", err.message);
    res.status(500).json({ message: "Failed to tweet pun", error: err.message });
  }
}


