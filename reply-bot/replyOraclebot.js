import fs from 'fs';
import path from 'path';
import minimist from 'minimist';
import { TwitterApi } from 'twitter-api-v2';
import { Configuration, OpenAIApi } from 'openai';

// Load environment variables from .env (make sure to run with NODE_ENV or use dotenv in your real setup)
const {
  TWITTER_BEARER_TOKEN,
  TWITTER_API_KEY,
  TWITTER_API_SECRET,
  TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_SECRET,
  OPENAI_API_KEY,
} = process.env;

// Initialize Twitter clients
const readClient = new TwitterApi(TWITTER_BEARER_TOKEN);
const writeClient = new TwitterApi({
  appKey: TWITTER_API_KEY,
  appSecret: TWITTER_API_SECRET,
  accessToken: TWITTER_ACCESS_TOKEN,
  accessSecret: TWITTER_ACCESS_SECRET,
});

// Initialize OpenAI
const openai = new OpenAIApi(new Configuration({ apiKey: OPENAI_API_KEY }));

// File to store replied user IDs to avoid repeats within 7 days
const repliedUsersFile = path.resolve('./replyBot/repliedUsers.json');

let repliedUsers = {};
try {
  repliedUsers = JSON.parse(fs.readFileSync(repliedUsersFile));
} catch {
  repliedUsers = {};
}

// Clean up users older than 7 days
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const now = Date.now();
for (const userId in repliedUsers) {
  if (now - repliedUsers[userId] > SEVEN_DAYS_MS) {
    delete repliedUsers[userId];
  }
}

// Save function
function saveRepliedUsers() {
  fs.writeFileSync(repliedUsersFile, JSON.stringify(repliedUsers, null, 2));
}

// CLI args
const argv = minimist(process.argv.slice(2));
const maxReplies = argv.maxReplies ? parseInt(argv.maxReplies, 10) : 1;

// Helper: Check if tweet text contains disallowed topics
function containsDisallowedTopics(text) {
  const forbidden = [
    'politic', 'religion', 'race', 'gender',
    // variations to catch (case insensitive)
  ];
  const lowerText = text.toLowerCase();
  return forbidden.some(word => lowerText.includes(word));
}

// Helper: Check if tweet tone indicates sadness, depression, or serious distress
async function isTweetSensitive(tweetText) {
  const prompt = `
Detect if the following tweet indicates sadness, depression, serious distress, or seeking urgent help. Reply only with "YES" or "NO".

Tweet: """${tweetText}"""
Answer:
`.trim();

  try {
    const completion = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      max_tokens: 3,
      temperature: 0,
    });
    const answer = completion.data.choices[0].text.trim().toUpperCase();
    return answer === 'YES';
  } catch (e) {
    console.error('OpenAI error:', e);
    // On error, err on safe side and treat as sensitive
    return true;
  }
}

// Generate amateur oracle style reply using OpenAI
async function generateOracleReply(tweetText) {
  const prompt = `
You are an amateur oracle who gives hilariously bad, unsolicited advice with a tone that is lighthearted and slightly aloof.

Generate one witty, humorous, and unsolicited advice reply to this tweet:

"${tweetText}"

Reply only with the short advice.
  `.trim();

  const response = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt,
    max_tokens: 50,
    temperature: 0.8,
  });
  return response.data.choices[0].text.trim();
}

// Main function
async function run() {
  console.log(`Starting replyOracleBot - maxReplies: ${maxReplies}`);

  // Search parameters:
  // - query for “what should I do” or similar (adjust as needed)
  // - filter out retweets and replies to avoid spam
  // - limit to recent 48 hours
  // - min 1000 views using Twitter’s "public_metrics.view_count" (Twitter API v2 only exposes impressions via elevated access, so we’ll filter for minimum likes+retweets as proxy)
  // - exclude tweets mentioning politics, religion, race, or gender
  // - exclude tweets from users we replied to in last 7 days

  const nowISO = new Date().toISOString();
  const sinceDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const query = `"what should I do" -is:retweet -is:reply lang:en`; // basic example query

  try {
    const searchResponse = await readClient.v2.search(query, {
      max_results: 100,
      'tweet.fields': 'author_id,created_at,public_metrics',
      start_time: sinceDate,
      expansions: 'author_id',
      user.fields: 'verified',
    });

    const tweets = [];

    for await (const tweet of searchResponse) {
      // Filter out tweets from users replied to recently
      if (repliedUsers[tweet.author_id]) continue;

      // Filter out disallowed topics in text
      if (containsDisallowedTopics(tweet.text)) continue;

      // Filter tweets without enough engagement as proxy for view count
      const { public_metrics } = tweet;
      const engagementCount = (public_metrics?.like_count || 0) + (public_metrics?.retweet_count || 0);
      if (engagementCount < 50) continue; // adjust threshold as you want

      // Check for sensitive content
      const sensitive = await isTweetSensitive(tweet.text);
      if (sensitive) continue;

      // Passed all filters
      tweets.push(tweet);
    }

    if (tweets.length === 0) {
      console.log('No eligible tweets found to reply to.');
      return;
    }

    // Reply to at most maxReplies tweets
    let repliesSent = 0;

    for (const tweet of tweets) {
      if (repliesSent >= maxReplies) break;

      // Generate oracle reply text
      const replyText = await generateOracleReply(tweet.text);

      // Post reply
      try {
        await writeClient.v2.reply(replyText, tweet.id);
        console.log(`Replied to tweet ${tweet.id} by user ${tweet.author_id}: "${replyText}"`);

        // Mark user as replied with current timestamp
        repliedUsers[tweet.author_id] = Date.now();
        saveRepliedUsers();

        repliesSent++;
      } catch (e) {
        console.error('Error posting reply:', e);
      }
    }
  } catch (e) {
    console.error('Error fetching tweets:', e);
  }
}

// Run the bot
run();

