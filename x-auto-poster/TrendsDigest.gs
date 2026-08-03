// ======================================================================
// X (TWITTER) ENGAGEMENT DIGEST & REPLY SUGGESTER (RAPIDAPI)
// ======================================================================

const SPREADSHEET_ID = "YOUR_GOOGLE_SHEET_ID";
const RAPIDAPI_KEY = "YOUR_RAPIDAPI_KEY";
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";

const TARGET_HANDLES = [
  "levelsio",     // Solopreneur & creator of PhotoAI/NomadList
  "dhh",          // Creator of Ruby on Rails
  "shl",          // Creator of Gumroad
  "Nutlope",      // Creator of RoomGPT / Tech builder
  "rauchg",       // CEO of Vercel (Next.js)
  "leeerob"       // VP of Product at Vercel
];

/**
 * MAIN FUNCTION: Fetches real X posts (Last 48H), drafts replies, and logs to Sheet.
 */
function generateXEngagementReplies() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Date", "Developer Handle", "Tweet Content", "X Link", "AI Drafted Reply", "Status"]);
    sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#F3F3F3");
  }

  const processedLinks = getProcessedLinks(sheet);

  console.log("🔍 Fetching live tweets (Last 48 Hours ONLY) via RapidAPI...");

  TARGET_HANDLES.forEach(handle => {
    const tweet = fetchLatestTweetFromRapidAPI(handle);
    if (!tweet) {
      console.log(`ℹ️ No tweets found within the last 48 hours for @${handle}`);
      return;
    }

    if (processedLinks.indexOf(tweet.link) !== -1) {
      console.log(`ℹ️ Skipping @${handle} - Tweet already logged in Sheet.`);
      return;
    }

    console.log(`🤖 Drafting reply for @${handle} (${tweet.pubDate}): "${tweet.title.substring(0, 40)}..."`);

    const prompt = `You are a helpful, senior developer and creator on X (Twitter).
Draft a high-value, authentic reply to this tweet by @${handle}:

Tweet: "${tweet.title}"

CRITICAL REQUIREMENTS:
1. Tone: Friendly, insightful, supporting their view, or adding a quick value-add technical tip. No hype, no fluff, no AI buzzwords (like 'delve', 'testament').
2. Length: Under 220 characters TOTAL (including tags/emojis) so it fits in the X reply box.
3. Output format: Return ONLY the raw reply text. Do not wrap in quotes.`;

    const suggestedReply = callGeminiForReplies(prompt);

    if (suggestedReply) {
      sheet.appendRow([
        new Date(),
        `@${handle}`,
        tweet.title,
        tweet.link,
        suggestedReply,
        "Pending Review"
      ]);
      console.log(`✅ Added @${handle} tweet & link to Sheet!`);
    }
  });

  console.log("🎉 Done! Check your Google Sheet for fresh X reply opportunities.");
}

/**
 * Fetches latest live tweet via RapidAPI (Strict 48-Hour Filter)
 */
function fetchLatestTweetFromRapidAPI(handle) {
  const url = `https://twitter-api45.p.rapidapi.com/timeline.php?screenname=${handle}`;
  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": RAPIDAPI_KEY,
      "x-rapidapi-host": "twitter-api45.p.rapidapi.com"
    },
    muteHttpExceptions: true
  };

  const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
  const now = Date.now();

  try {
    const res = UrlFetchApp.fetch(url, options);
    if (res.getResponseCode() !== 200) {
      console.log(`RapidAPI Error (${res.getResponseCode()}) for ${handle}: ${res.getContentText().substring(0, 100)}`);
      return null;
    }

    const json = JSON.parse(res.getContentText());
    const timeline = json.timeline || json.data || [];

    for (let item of timeline) {
      const text = item.text || item.full_text;
      const tweetId = item.tweet_id || item.id_str || item.id;
      const pubDateStr = item.created_at;

      if (text && tweetId) {
        if (pubDateStr) {
          const postDate = new Date(pubDateStr).getTime();
          if (now - postDate > FORTY_EIGHT_HOURS_MS) {
            console.log(`⏳ Skipping older tweet for @${handle} (${pubDateStr})`);
            continue; // Skip tweets older than 48 hours
          }
        }

        return {
          title: text,
          link: `https://x.com/${handle}/status/${tweetId}`,
          pubDate: pubDateStr || "Recent"
        };
      }
    }
  } catch (e) {
    console.log(`RapidAPI error for ${handle}: ` + e.toString());
  }
  return null;
}

function getProcessedLinks(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const links = sheet.getRange(2, 4, lastRow - 1, 1).getValues();
  return links.map(row => row[0]);
}

function callGeminiForReplies(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${GEMINI_API_KEY}`;
  const models = ["gemini-3.6-flash", "gemini-flash-latest"];

  for (let m of models) {
    const targetUrl = url.replace("gemini-3.6-flash", m);
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    const options = {
      method: "POST",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    try {
      const res = UrlFetchApp.fetch(targetUrl, options);
      const json = JSON.parse(res.getContentText());

      if (json.candidates && json.candidates[0] && json.candidates[0].content) {
        let text = json.candidates[0].content.parts[0].text.trim();
        if (text.startsWith('"') && text.endsWith('"')) {
          text = text.substring(1, text.length - 1);
        }
        return text;
      }
    } catch (e) {
      console.log(`Reply fallback error: ${e.toString()}`);
    }
  }
  return null;
}
