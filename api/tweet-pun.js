import OpenAI from 'openai';
import dotenv from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function generateTweet() {
  const prompt = `
You are an amateur oracle who tweets cryptic one-liners that sound wise or satirical.
Each tweet should sound clever at first glance, but fall apart under scrutiny.
Keep the tone dry, witty, and lightly absurd. Avoid hashtags or emojis inside the text.

Output format: just the quote as a one-liner followed by either #wisdom or #satire based on the tone.
Examples:
- “Don’t follow your dreams. They tend to wander off cliffs. #wisdom”
- “The first step to self-awareness is loudly interrupting someone else’s. #satire”
- “You can’t fail if you never define success. #wisdom”
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: prompt }
      ],
      max_tokens: 100,
      temperature: 0.9
    });

    const tweet = completion.choices[0].message.content.trim();
    return tweet;
  } catch (error) {
    console.error('Error generating tweet:', error);
    return null;
  }
}

async function postTweet(tweetText) {
  try {
    const tweet = await twitterClient.v2.tweet(tweetText);
    console.log('Tweet posted:', tweet);
  } catch (error) {
    console.error('Error posting tweet:', error);
  }
}

(async () => {
  const tweet = await generateTweet();
  if (tweet) {
    await postTweet(tweet);
  }
})();




