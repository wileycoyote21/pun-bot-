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

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    console.log("🔁 API route hit by cron job");
    console.log("🔐 Access token starts with:", process.env.ACCESS_TOKEN?.slice(0, 5));


    const prompt = `
You are a mystical oracle who is tasked with giving life advice in short story format, no longer than 3 sentences. The world looks up to you for wisdom and guidance so give it to us. You fully embrace dad jokes & the life advice never lands. Incorporate puns wherever it would be appropriate. Assume you're a big & popular personality in your community. Your tone must be deadpan, empathetic, self deprecating, and relatable. Every post must feel ancient and prophetic. The pun should be sharp, emotionally self-aware, clever, and original—making readers groan or laugh. Avoid overused wordplay. Do not reference technology, wifi, or the internet.
    `.trim();

    const gptRes = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Or "gpt-4"
      messages: [{ role: "user", content: prompt }],
      max_tokens: 120,
      temperature: 0.9,
    });

    const pun = gptRes.choices[0].message.content.trim();

    // Constant hashtags
    const hashtags = "#puns #comedian #dadjokes";
    const tweet = `${pun} ${hashtags}`;

    console.log("📝 Generated tweet:", tweet);

    await twitterClient.v2.tweet(tweet);

    console.log("✅ Tweet posted");

    res.status(200).json({ message: "Tweeted successfully!", tweet });
  } catch (err) {
    console.error("❌ Error tweeting:", err.message);
    res.status(500).json({ message: "Failed to tweet", error: err.message });
  }
}



