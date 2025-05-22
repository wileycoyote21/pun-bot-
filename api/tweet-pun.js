import OpenAI from 'openai';
import { TwitterApi } from 'twitter-api-v2';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function generateTweet() {
  const prompt = `
You are an amateur oracle who tweets cryptic one-liners...
<your full prompt here>
  `;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'system', content: prompt }],
    max_tokens: 100,
    temperature: 0.9,
  });

  return completion.choices[0].message.content.trim();
}

async function postTweet(tweetText) {
  return await twitterClient.v2.tweet(tweetText);
}

// ✅ THIS IS REQUIRED FOR VERCEL
export default async function handler(req, res) {
  try {
    const tweet = await generateTweet();
    const response = await postTweet(tweet);
    res.status(200).json({ status: 'Tweet posted', response });
  } catch (error) {
    console.error('Error in tweet-pun handler:', error);
    res.status(500).json({ error: error.message || 'Unknown error' });
  }
}





