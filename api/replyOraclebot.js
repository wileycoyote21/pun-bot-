import dotenv from "dotenv";
import { TwitterApi } from "twitter-api-v2";
import OpenAI from "openai";
import fs from "fs";

dotenv.config();

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_DAILY_REPLIES = 5;
const REPLIED_LOG = "./reply-bot/replied_tweet_ids.json";
const CATEGORIES = ["what_should_i_do", "sarcasm"];

const categoryQueries = {
  what_should_i_do: `"what should I do?" -is:retweet -is:reply lang:en`,
  sarcasm: `"oh great" OR "just what I needed" OR "perfect timing" OR "thanks a lot" -is:retweet -is:reply lang:en`,
};

function loadReplyLog() {
  if (!fs.existsSync(REPLIED_LOG)) {
    return { what_should_i_do: [], sarcasm: [] };
  }
  return JSON.parse(fs.readFileSync(REPLIED_LOG));
}

function saveReplyLog(log) {
  fs.writeFileSync(REPLIED_LOG, JSON.stringify(log, null, 2));
}

function shouldFilterOut(text) {
  const blocklist = [
    /politic/i,
    /republican/i,
    /democrat/i,
    /biden/i,
    /trump/i,
    /election/i,
    /gender/i,
    /race/i,
    /religion/i,
    /pray/i,
    /depress/i,
    /anxious/i,
    /mental health/i,
    /suicid/i,
    /kill myself/i,
    /sad/i,
  ];
  return blocklist.some((regex) => regex.test(text));
}

async function searchTweets(category) {
  const query = categoryQueries[category];
  const response = await twitterClient.v2.search(query, {
    max_results: 10,
    "tweet.fields": ["author_id", "conversation_id"],
  });
  return response.data?.data || [];
}

async function generateReply(tweetText) {
  const prompt = `You're an amateur oracle who gives mystical but hilariously unhelpful advice. Reply to this tweet with a short, dry, cryptic one-liner: "${tweetText}"`;
  const res = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "gpt-4",
    temperature: 0.9,
  });
  return res.choices[0].message.content.trim();
}

async function replyToTweet(tweet, replyText) {
  await twitterClient.v2.reply(replyText, tweet.id);
}

// This is the new export handler function Vercel requires:
export default async function handler(req, res) {
  try {
    const replyLog = loadReplyLog();
    const now = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    for (const category of CATEGORIES) {
      const repliesToday = replyLog[category]?.filter((entry) =>
        entry.startsWith(now)
      ) || [];

      if (repliesToday.length >= MAX_DAILY_REPLIES) {
        console.log(`Max replies reached for ${category}`);
        continue;
      }

      const tweets = await searchTweets(category);

      for (const tweet of tweets) {
        if (
          shouldFilterOut(tweet.text) ||
          repliesToday.includes(`${now}_${tweet.id}`)
        ) {
          continue;
        }

        const replyText = await generateReply(tweet.text);
        await replyToTweet(tweet, replyText);

        // Log it
        replyLog[category] = replyLog[category] || [];
        replyLog[category].push(`${now}_${tweet.id}`);
        saveReplyLog(replyLog);
        console.log(`Replied to tweet ID ${tweet.id}`);

        res.status(200).json({ success: true, message: `Replied to tweet ID ${tweet.id}` });
        return; // Stop after one reply and respond
      }
    }

    console.log("No eligible tweets to reply to.");
    res.status(200).json({ success: true, message: "No eligible tweets to reply to." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}



