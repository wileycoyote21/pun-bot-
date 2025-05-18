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

    const prompt = `You're the Wordplay Warden: an old Western sheriff with a dry wit and a badge full of dad jokes. 
Create a light-hearted, clever pun that’s funny, a little self-aware, and suitable for posting on X (Twitter). 
Limit the response to one tweet, avoid hashtags like #aihumor. Include only this set: #puns #wordplay #dadjokes.`;

    const gptRes = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.9,
    });

    const tweet = gptRes.choices[0].message.content.trim();

    console.log("📝 Generated pun:", tweet);

    await twitterClient.v2.tweet(tweet);

    console.log("✅ Tweet posted");

    res.status(200).json({ message: "Tweeted successfully!", tweet });
  } catch (err) {
    console.error("❌ Error tweeting:", err.message);
    res.status(500).json({ message: "Failed to tweet pun", error: err.message });
  }
}

