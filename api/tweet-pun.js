import OpenAI from 'openai';
import { TwitterApi } from 'twitter-api-v2';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize Twitter client
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function generateTweet() {
  const prompt = `
You are an amateur oracle who tweets cryptic one-liners. Your advice is mystical but hilariously unhelpful. Respond with only one sentence, and make it sound like ancient wisdom that makes no real sense.
  `;

  console.log('🧠 Calling OpenAI API to generate tweet...');
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'system', content: prompt }],
    max_tokens: 100,
    temperature: 0.9,
  });

  const tweetText = completion.choices[0].message.content.trim();
  console.log('✅ OpenAI responded with:', tweetText);
  return tweetText;
}

async function postTweet(tweetText) {
  console.log('🐦 Sending tweet to Twitter API...');
  const response = await twitterClient.v2.tweet(tweetText);
  console.log('✅ Twitter responded with:', response);
  return response;
}

// ✅ Vercel handler
export default async function handler(req, res) {
  try {
    console.log('🚀 Starting tweet-pun handler...');

    const tweet = await generateTweet();
    const response = await postTweet(tweet);

    console.log('🎉 Successfully posted tweet.');
    res.status(200).json({ status: 'Tweet posted', response });
  } catch (error) {
    console.error('❌ Error in tweet-pun handler:', error);
    res.status(500).json({ error: error.message || 'Unknown error' });
  }
}






