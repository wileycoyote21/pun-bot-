import { TwitterApi } from "twitter-api-v2";

export default async function handler(req, res) {
  try {
    // Initialize with full user context OAuth 1.0a tokens
    const twitterClient = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });

    // Try fetching your own user details as a basic auth test
    const user = await twitterClient.v2.me();

    res.status(200).json({
      success: true,
      message: "Authentication successful!",
      user: {
        id: user.data.id,
        username: user.data.username,
        name: user.data.name,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
      details: error,
    });
  }
}
