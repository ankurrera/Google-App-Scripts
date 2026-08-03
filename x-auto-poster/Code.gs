// ======================================================================
// UNIFIED X (TWITTER) AUTOMATION FOR @ankurrera
// Custom Persona: Indie Hacker & Aesthetic Developer (@buildwithsid style)
// ======================================================================

const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
const MAKE_WEBHOOK_URL = "YOUR_MAKE_WEBHOOK_URL";
const GITHUB_USERNAME = "ankurrera";
const GITHUB_TOKEN = "YOUR_GITHUB_PERSONAL_ACCESS_TOKEN";

// Topics inspired by @buildwithsid (Next.js, UI/UX, Framer Motion, Tailwind, Indie Hacking)
const TOPICS = [
  "Next.js App Router performance optimizations and server actions tricks",
  "Building buttery smooth micro-animations using Framer Motion and Tailwind CSS",
  "Indie hacker stack: Next.js + Supabase + Vercel + Tailwind for fast shipping",
  "UI/UX micro-interactions that make web apps feel ultra-premium",
  "Building enterprise AI tools & full-stack SaaS apps from scratch",
  "Clean code architecture and component design for React & TypeScript developers"
];

// ======================================================================
// AUTOMATION 1: MORNING BUILDER TIP (@buildwithsid Style - 9 AM)
// ======================================================================
function generateAndPostAITweet() {
  console.log("🎨 Asking Gemini AI to generate a @buildwithsid style builder post...");

  const randomTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  const randomSeed = Math.floor(Math.random() * 100000);

  const prompt = `You are @ankurrera, a top-tier Full-Stack Developer and Indie Hacker building modern web apps in public (inspired by the aesthetics and shipping style of @buildwithsid).

Write a single viral, highly engaging tweet about: "${randomTopic}". (Variation ID: ${randomSeed}).

STYLE & FORMAT REQUIREMENTS:
1. Hook: Start with a crisp, confident builder statement (e.g., "Shipped a quick optimization today ⚡️" or "Stop overcomplicating [topic] in Next.js.").
2. Body: Share 2-3 clean, bulleted actionable points or code insights. Emphasize speed, aesthetic UI, and clean code.
3. Tone: Casual, builder-focused, passionate about UI/UX and shipping software. NOT corporate, NOT salesy.
4. Closing: End with a quick question to fellow builders (e.g. "What are you shipping today? 👇" or "Thoughts on this stack?").
5. Emojis: Use 2-3 natural tech emojis (⚡️, 🎨, 🚀, 🛠️).
6. Hashtags: Include 2 hashtags from: #buildinpublic #nextjs #webdev #indiehackers #UIUX.
7. STRICT LENGTH: Under 250 characters TOTAL.
8. Output format: Return ONLY the raw tweet text without quotes.`;

  const tweetText = callGeminiAI(prompt);

  if (!tweetText) {
    console.log("❌ Failed to generate tweet from Gemini AI.");
    return;
  }

  console.log("------------------------------------------");
  console.log("✨ Morning Tweet (" + tweetText.length + " chars):");
  console.log(tweetText);
  console.log("------------------------------------------");

  const response = postToWebhook(tweetText);
  console.log("🎉 Result: " + response);
}

// ======================================================================
// AUTOMATION 2: AFTERNOON BUILDER DEBATE (@buildwithsid Style - 1 PM)
// ======================================================================
function generateAndPostInteractiveTweet() {
  console.log("🎨 Asking Gemini AI to generate a builder debate post...");

  const randomSeed = Math.floor(Math.random() * 100000);

  const prompt = `You are @ankurrera, an Indie Hacker and Full-Stack Developer on X.
Write a short, engaging builder debate or tech choice question (inspired by @buildwithsid). (Variation ID: ${randomSeed}).

Themes:
- Next.js App Router vs Pages Router for new SaaS
- Tailwind CSS vs Styled Components for modern UI
- Vercel vs Self-hosting on Hetzner/AWS
- Supabase vs Firebase vs PostgreSQL
- Framer Motion vs pure CSS keyframes

CRITICAL REQUIREMENTS:
1. Format: Start directly with the question or builder choice.
2. Tone: Casual, indie hacker community vibe.
3. Call to Action: Ask builders to share their choice and why in the replies.
4. Length: Short (<180 characters) so it's readable at a glance.
5. Emojis: 1-2 modern emojis (⚡️, ⚔️, 🛠️).
6. Hashtags: #buildinpublic or #webdev.
7. Output format: Return ONLY raw tweet text.`;

  const tweetText = callGeminiAI(prompt);

  if (!tweetText) {
    console.log("❌ Failed to generate interactive tweet.");
    return;
  }

  console.log("------------------------------------------");
  console.log("✨ Afternoon Tweet (" + tweetText.length + " chars):");
  console.log(tweetText);
  console.log("------------------------------------------");

  const response = postToWebhook(tweetText);
  console.log("🎉 Result: " + response);
}

// ======================================================================
// AUTOMATION 3: GITHUB DEV JOURNAL (@buildwithsid Style - 6 PM)
// ======================================================================
function runGitHubDevJournal() {
  console.log("🔍 Fetching authenticated GitHub activity (Private + Public + Orgs)...");

  const activityData = fetchRecentGitHubActivity();

  if (!activityData || activityData.length === 0) {
    console.log("ℹ️ No new significant development activity found in the last 24 hours.");
    return;
  }

  console.log(`📦 Aggregated ${activityData.length} development updates across repositories.`);

  const devJournalTweet = synthesizeDevJournalWithGemini(activityData);

  if (!devJournalTweet) {
    console.log("❌ Failed to synthesize developer journal post.");
    return;
  }

  console.log("------------------------------------------");
  console.log("✨ AI Developer Journal Post (" + devJournalTweet.length + " chars):");
  console.log(devJournalTweet);
  console.log("------------------------------------------");

  const response = postToWebhook(devJournalTweet);
  console.log("🎉 Posted to X! Result: " + response);

  PropertiesService.getUserProperties().setProperty("LAST_GITHUB_CHECK", new Date().toISOString());
}

/**
 * Fetch GitHub events
 */
function fetchRecentGitHubActivity() {
  const props = PropertiesService.getUserProperties();
  const lastCheckStr = props.getProperty("LAST_GITHUB_CHECK");
  const lastCheck = lastCheckStr ? new Date(lastCheckStr) : new Date(Date.now() - 24 * 60 * 60 * 1000);

  const url = `https://api.github.com/users/${GITHUB_USERNAME}/events`;
  const headers = {
    "User-Agent": "AppsScript-DevJournal",
    "Authorization": `token ${GITHUB_TOKEN}`,
    "Accept": "application/vnd.github.v3+json"
  };

  const options = { method: "GET", headers: headers, muteHttpExceptions: true };

  try {
    const res = UrlFetchApp.fetch(url, options);
    if (res.getResponseCode() !== 200) {
      console.log("GitHub API Error (" + res.getResponseCode() + "): " + res.getContentText());
      return [];
    }

    const events = JSON.parse(res.getContentText());
    const meaningfulUpdates = [];

    const TRIVIAL_REGEX = /^(fix typo|typo|format|lint|bump|deps|documentation|update readme|wip|style|chore)/i;

    events.forEach(event => {
      const eventDate = new Date(event.created_at);
      if (eventDate <= lastCheck) return;

      const repoName = event.repo.name.split("/")[1] || event.repo.name;

      if (event.type === "PushEvent" && event.payload.commits) {
        event.payload.commits.forEach(commit => {
          const msg = commit.message.trim();
          if (!TRIVIAL_REGEX.test(msg) && msg.length > 8) {
            meaningfulUpdates.push({
              repo: repoName,
              type: "commit",
              message: msg
            });
          }
        });
      }

      if (event.type === "PullRequestEvent" && event.payload.action === "closed" && event.payload.pull_request.merged) {
        meaningfulUpdates.push({
          repo: repoName,
          type: "pull_request",
          message: event.payload.pull_request.title
        });
      }

      if (event.type === "ReleaseEvent" && event.payload.action === "published") {
        meaningfulUpdates.push({
          repo: repoName,
          type: "release",
          message: `Released ${event.payload.release.tag_name}: ${event.payload.release.name || ''}`
        });
      }
    });

    return meaningfulUpdates;
  } catch (e) {
    console.log("Error fetching GitHub activity: " + e.toString());
    return [];
  }
}

/**
 * Synthesize GitHub activity into @buildwithsid style "Shipped Today" Dev Log
 */
function synthesizeDevJournalWithGemini(activityData) {
  const activitySummary = activityData.map(a => `[Repo: ${a.repo}] (${a.type}): ${a.message}`).join("\n");

  const prompt = `You are @ankurrera, an Indie Hacker & Full-Stack Developer documenting your daily progress (style of @buildwithsid).

Below is raw development activity from my GitHub repositories today:
${activitySummary}

INSTRUCTIONS:
1. Synthesize these code updates into ONE single, natural "Shipped Today" progress log.
2. Style: Start with a crisp shipping hook (e.g. "Shipped a major backend optimization today ⚡️" or "Building out [feature] in Next.js...").
3. Content: Highlight what was built or improved (e.g. UI/UX polish, performance wins, architecture, bug fixes).
4. Tone: Authentic proof of work, technical, builder vibe.
5. Emojis: 1-2 modern emojis (⚡️, 🎨, 🛠️).
6. Hashtags: Include #buildinpublic #webdev at the end.
7. STRICT LENGTH: Under 250 characters TOTAL.
8. Output format: Return ONLY raw tweet text.`;

  return callGeminiAI(prompt);
}

// ======================================================================
// SHARED HELPER FUNCTIONS (Gemini AI + Webhook Poster)
// ======================================================================

function callGeminiAI(prompt) {
  const models = [
    "gemini-flash-latest",
    "gemini-3.5-flash",
    "gemini-2.0-flash",
    "gemini-pro-latest"
  ];

  for (let m of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${GEMINI_API_KEY}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    const options = {
      method: "POST",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    try {
      const res = UrlFetchApp.fetch(url, options);
      const json = JSON.parse(res.getContentText());

      if (json.candidates && json.candidates[0] && json.candidates[0].content) {
        let text = json.candidates[0].content.parts[0].text.trim();
        if (text.startsWith('"') && text.endsWith('"')) {
          text = text.substring(1, text.length - 1);
        }
        console.log(`✅ Generated successfully using Gemini model: ${m}`);
        return text;
      }
    } catch (e) {
      console.log(`Model ${m} temporary error: ${e.toString()}`);
    }
  }

  return null;
}

function postToWebhook(text) {
  const options = {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify({ text: text }),
    muteHttpExceptions: true
  };

  try {
    const res = UrlFetchApp.fetch(MAKE_WEBHOOK_URL, options);
    return res.getContentText();
  } catch (e) {
    return "Error: " + e.toString();
  }
}
