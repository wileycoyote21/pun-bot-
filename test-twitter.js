import 'dotenv/config';
import { TwitterApi } from 'twitter-api-v2';

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

async function test() {
  try {
    const me = await twitterClient.v2.me();
    console.log('Twitter auth success, user:', me);
  } catch (e) {
    console.error('Twitter auth failed:', e);
  }
}

test();
