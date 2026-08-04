// ======================================================================
// UNIFIED X (TWITTER) AUTOMATION FOR @ankurrera
// Custom Persona: Indie Hacker & Aesthetic Developer (@buildwithsid style)
// ======================================================================

const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
const MAKE_WEBHOOK_URL = "YOUR_MAKE_WEBHOOK_URL";
const GITHUB_USERNAME = "ankurrera";
const GITHUB_TOKEN = "YOUR_GITHUB_PERSONAL_ACCESS_TOKEN";

/**
 * OPTIONAL CONVENIENCE UTILITY: Save your secret credentials into UserProperties
 * Run setupCredentials("ghp_your_token") once in Apps Script to bypass GitHub IP rate limits!
 */
function setupCredentials(githubToken, geminiApiKey, makeWebhookUrl) {
  const props = PropertiesService.getUserProperties();
  if (githubToken) props.setProperty("GITHUB_TOKEN", githubToken.trim());
  if (geminiApiKey) props.setProperty("GEMINI_API_KEY", geminiApiKey.trim());
  if (makeWebhookUrl) props.setProperty("MAKE_WEBHOOK_URL", makeWebhookUrl.trim());
  console.log("✅ Credentials updated in UserProperties!");
}

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
8. Output format: Return ONLY raw tweet text without quotes or markdown code blocks.`;

  let tweetText = callGeminiAI(prompt);

  if (!tweetText) {
    console.log("⚠️ Gemini API unavailable/quota exceeded. Using fallback builder tip generator...");
    tweetText = generateFallbackMorningTip(randomTopic);
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
7. Output format: Return ONLY raw tweet text without quotes or markdown backticks.`;

  let tweetText = callGeminiAI(prompt);

  if (!tweetText) {
    console.log("⚠️ Gemini API unavailable/quota exceeded. Using fallback debate generator...");
    tweetText = generateFallbackDebateTweet();
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
  console.log("🔍 Fetching GitHub activity (Private + Public + Orgs)...");

  let activityData = fetchRecentGitHubActivity();

  if (!activityData || activityData.length === 0) {
    console.log("ℹ️ No new raw commit activity found in the last 24 hours. Generating a Deep Work / Refactoring progress update fallback...");
  } else {
    console.log(`📦 Aggregated ${activityData.length} development updates across repositories.`);
  }

  let devJournalTweet = synthesizeDevJournalWithGemini(activityData);

  if (!devJournalTweet) {
    console.log("⚠️ Gemini API unavailable/quota exceeded. Using fallback dev journal generator...");
    devJournalTweet = generateFallbackDevJournal(activityData);
  }

  console.log("------------------------------------------");
  console.log("✨ AI Developer Journal Post (" + devJournalTweet.length + " chars):");
  console.log(devJournalTweet);
  console.log("------------------------------------------");

  const response = postToWebhook(devJournalTweet);
  console.log("🎉 Posted to X! Result: " + response);

  if (response && !response.toString().startsWith("Error")) {
    PropertiesService.getUserProperties().setProperty("LAST_GITHUB_CHECK", new Date().toISOString());
  }
}

/**
 * Fetch GitHub events (authenticated endpoint for private/org repos + clean public fallback)
 */
function fetchRecentGitHubActivity() {
  const props = PropertiesService.getUserProperties();
  // Look back over the last 24 hours for recent commit activity
  const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
  const cutoffTime = new Date(Date.now() - TWENTY_FOUR_HOURS_MS);

  // Check script property or user property for GITHUB_TOKEN fallback
  const effectiveToken = props.getProperty("GITHUB_TOKEN") || GITHUB_TOKEN;
  const isRealToken = effectiveToken && effectiveToken !== "YOUR_GITHUB_PERSONAL_ACCESS_TOKEN" && effectiveToken.trim() !== "";

  let res = null;

  // 1. Try authenticated /user/events endpoint if valid token provided
  if (isRealToken) {
    const authHeaders = {
      "User-Agent": "AppsScript-DevJournal",
      "Authorization": effectiveToken.startsWith("github_pat_") || effectiveToken.startsWith("ghp_") ? `Bearer ${effectiveToken}` : `token ${effectiveToken}`,
      "Accept": "application/vnd.github.v3+json"
    };
    const authOptions = { method: "GET", headers: authHeaders, muteHttpExceptions: true };
    res = UrlFetchApp.fetch(`https://api.github.com/user/events`, authOptions);
    if (res.getResponseCode() === 200) {
      console.log("✅ Successfully fetched authenticated GitHub activity from /user/events.");
    } else {
      console.log(`Authenticated /user/events returned (${res.getResponseCode()}). Falling back to public /users/${GITHUB_USERNAME}/events...`);
      res = null;
    }
  }

  // 2. Public events fallback with clean headers (NO invalid Authorization header)
  if (!res) {
    const publicHeaders = {
      "User-Agent": "AppsScript-DevJournal",
      "Accept": "application/vnd.github.v3+json"
    };
    const publicOptions = { method: "GET", headers: publicHeaders, muteHttpExceptions: true };
    res = UrlFetchApp.fetch(`https://api.github.com/users/${GITHUB_USERNAME}/events`, publicOptions);
  }

  try {
    if (res.getResponseCode() === 403) {
      console.log("⚠️ GitHub Unauthenticated IP Rate Limit Exceeded (403). Set GITHUB_TOKEN or run setupCredentials('ghp_xxx') to enable 5,000 req/hr authenticated access.");
      return [];
    }

    if (res.getResponseCode() !== 200) {
      console.log("GitHub API Error (" + res.getResponseCode() + "): " + res.getContentText());
      return [];
    }

    const events = JSON.parse(res.getContentText());
    console.log(`📡 GitHub events API returned ${events.length} raw events.`);
    const meaningfulUpdates = [];
    const processedShas = {};

    const TRIVIAL_REGEX = /^(fix typo|typo|format|lint|bump|deps|documentation|update readme|wip|style|chore)/i;

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const eventDate = new Date(event.created_at);
      if (eventDate <= cutoffTime) continue;

      const fullRepo = (event.repo && event.repo.name) ? event.repo.name : "";
      const repoName = fullRepo ? (fullRepo.split("/")[1] || fullRepo) : "repo";

      if (event.type === "PushEvent" && event.payload) {
        // Case A: payload.commits array is provided
        if (event.payload.commits && event.payload.commits.length > 0) {
          event.payload.commits.forEach(commit => {
            const msg = (commit.message || "").trim().split("\n")[0];
            if (!TRIVIAL_REGEX.test(msg) && msg.length > 5) {
              meaningfulUpdates.push({
                repo: repoName,
                type: "commit",
                message: msg
              });
            }
          });
        } 
        // Case B: payload.commits is missing (standard GitHub Events API format), fetch commit detail using payload.head
        else if (event.payload.head && fullRepo && !processedShas[event.payload.head]) {
          processedShas[event.payload.head] = true;
          const commitMsg = fetchCommitMessageFromHead(fullRepo, event.payload.head, effectiveToken, isRealToken);
          if (commitMsg && !TRIVIAL_REGEX.test(commitMsg) && commitMsg.length > 5) {
            meaningfulUpdates.push({
              repo: repoName,
              type: "commit",
              message: commitMsg
            });
          }
        }
      }

      if (event.type === "PullRequestEvent" && event.payload && event.payload.action === "closed" && event.payload.pull_request && event.payload.pull_request.merged) {
        meaningfulUpdates.push({
          repo: repoName,
          type: "pull_request",
          message: event.payload.pull_request.title
        });
      }

      if (event.type === "ReleaseEvent" && event.payload && event.payload.action === "published") {
        meaningfulUpdates.push({
          repo: repoName,
          type: "release",
          message: `Released ${event.payload.release.tag_name}: ${event.payload.release.name || ''}`
        });
      }

      if (event.type === "CreateEvent" && event.payload && event.payload.ref_type === "repository") {
        meaningfulUpdates.push({
          repo: repoName,
          type: "new_repo",
          message: `Created new project repository ${repoName}`
        });
      }
    }

    console.log(`📦 Extracted ${meaningfulUpdates.length} meaningful commit/activity updates from GitHub.`);
    return meaningfulUpdates;
  } catch (e) {
    console.log("Error fetching GitHub activity: " + e.toString());
    return [];
  }
}

/**
 * Fetches the first-line commit message for a specific commit head SHA
 */
function fetchCommitMessageFromHead(fullRepo, sha, token, isRealToken) {
  const url = `https://api.github.com/repos/${fullRepo}/commits/${sha}`;
  const headers = {
    "User-Agent": "AppsScript-DevJournal",
    "Accept": "application/vnd.github.v3+json"
  };
  if (isRealToken) {
    headers["Authorization"] = token.startsWith("github_pat_") || token.startsWith("ghp_") ? `Bearer ${token}` : `token ${token}`;
  }

  try {
    const res = UrlFetchApp.fetch(url, { method: "GET", headers: headers, muteHttpExceptions: true });
    if (res.getResponseCode() === 200) {
      const json = JSON.parse(res.getContentText());
      if (json.commit && json.commit.message) {
        return json.commit.message.trim().split("\n")[0];
      }
    }
  } catch (e) {
    console.log(`Error fetching commit ${sha} from ${fullRepo}: ${e.toString()}`);
  }
  return null;
}

/**
 * Synthesize GitHub activity into @buildwithsid style "Shipped Today" Dev Log
 */
function synthesizeDevJournalWithGemini(activityData) {
  let prompt = "";
  const randomSeed = Math.floor(Math.random() * 100000);

  if (activityData && activityData.length > 0) {
    const activitySummary = activityData.map(a => `[Repo: ${a.repo}] (${a.type}): ${a.message}`).join("\n");
    prompt = `You are @ankurrera, an Indie Hacker & Full-Stack Developer documenting your daily progress (style of @buildwithsid). (Seed: ${randomSeed}).

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
8. Output format: Return ONLY raw tweet text without quotes or code blocks.`;
  } else {
    // High-value fallback dev journal when 0 commits pushed today
    prompt = `You are @ankurrera, an Indie Hacker & Full-Stack Developer documenting daily deep work and engineering progress on X (inspired by @buildwithsid). (Seed: ${randomSeed}).

Today was a deep focus refactoring and system architecture day across Next.js and full-stack web projects.

INSTRUCTIONS:
1. Write a single "Shipped Today" / "Deep Work Log" tweet about modern web app engineering (e.g., refactoring state management, optimizing server actions, polishing UI component library, or database queries).
2. Style: Start with a crisp builder hook (e.g. "Deep work day: refactoring core architecture ⚡️" or "Focused on UI micro-interactions & code cleanup today 🛠️").
3. Content: Mention 2 key technical focus areas in a clean, aesthetic builder style.
4. Tone: Authentic proof of work, passionate about engineering quality.
5. Emojis: 1-2 modern emojis (⚡️, 🎨, 🛠️).
6. Hashtags: Include #buildinpublic #webdev at the end.
7. STRICT LENGTH: Under 250 characters TOTAL.
8. Output format: Return ONLY raw tweet text without quotes or markdown code blocks.`;
  }

  return callGeminiAI(prompt);
}

// ======================================================================
// SHARED HELPER FUNCTIONS (Gemini AI + Rate Limit Retry + Webhook Poster)
// ======================================================================

function callGeminiAI(prompt) {
  const models = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-flash-latest",
    "gemini-1.5-flash-latest",
    "gemini-pro-latest"
  ];

  const effectiveKey = PropertiesService.getUserProperties().getProperty("GEMINI_API_KEY") || GEMINI_API_KEY;

  for (let m of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${effectiveKey}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    const options = {
      method: "POST",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    try {
      let res = UrlFetchApp.fetch(url, options);

      // Handle Rate Limit / Quota Exceeded (HTTP 429) gracefully with 1 retry
      if (res.getResponseCode() === 429) {
        console.log(`⏳ Quota rate limit hit for ${m} (429). Retrying in 2.5s...`);
        Utilities.sleep(2500);
        res = UrlFetchApp.fetch(url, options);
      }

      if (res.getResponseCode() === 200) {
        const json = JSON.parse(res.getContentText());
        if (json.candidates && json.candidates[0] && json.candidates[0].content) {
          let text = json.candidates[0].content.parts[0].text.trim();
          text = sanitizeTextForX(text);
          if (text && text.length > 0) {
            console.log(`✅ Generated successfully using Gemini model: ${m}`);
            return text;
          }
        }
      } else {
        const json = JSON.parse(res.getContentText());
        const errMsg = (json.error && json.error.message) ? json.error.message : res.getContentText().substring(0, 120);
        console.log(`Gemini API HTTP ${res.getResponseCode()} for model ${m}: ${errMsg}`);
      }
    } catch (e) {
      console.log(`Model ${m} temporary error: ${e.toString()}`);
    }
  }

  return null;
}

// ======================================================================
// OFFLINE FALLBACK GENERATORS (Guarantees zero-failure posts even on quota exhaustion)
// ======================================================================

function generateFallbackMorningTip(topic) {
  const tips = [
    `Shipped a major UI polish today ⚡️\n\n• Next.js Server Actions for instant updates\n• Framer Motion micro-interactions for feel\n• Tailwind CSS container queries for responsive layout\n\nSpeed + clean UI is the indie hacker superpower. What are you building today? 👇 #buildinpublic #nextjs`,
    `Stop overcomplicating state management in React 🚀\n\n• Use URL searchParams for shareable view state\n• Server components for initial payload\n• Optimistic UI updates for instant feedback\n\nKeep your component tree lightweight. #buildinpublic #webdev`,
    `Indie Hacker UI tip 🎨\n\n• Backdrop blur + subtle 1px borders > heavy drop shadows\n• Monospace fonts for numbers and code tags\n• Smooth 150ms transitions on interactive elements\n\nMicro-details make web apps feel ultra-premium. #UIUX #buildinpublic`
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}

function generateFallbackDebateTweet() {
  const debates = [
    `Next.js App Router vs Pages Router for a new full-stack SaaS in 2026? ⚡️\n\nApp Router Server Actions speed up shipping, but Pages Router is battle-tested.\n\nWhich one are you reaching for first? 👇 #buildinpublic #webdev`,
    `Tailwind CSS vs pure CSS Modules for scalable design systems? ⚔️\n\nTailwind gives insane dev velocity, but CSS modules keep styles fully isolated.\n\nWhat's your go-to stack? 👇 #webdev #buildinpublic`,
    `Supabase vs Firebase vs raw PostgreSQL for fast MVP launches? 🛠️\n\nSupabase gives real-time + Postgres power out of the box.\n\nWhat are you shipping on today? 👇 #indiehackers #buildinpublic`
  ];
  return debates[Math.floor(Math.random() * debates.length)];
}

function generateFallbackDevJournal(activityData) {
  if (activityData && activityData.length > 0) {
    const topRepo = activityData[0].repo || "core apps";
    return `Shipped a major round of updates to ${topRepo} today ⚡️\n\n• Pushed code refactoring and architecture polish\n• Fixed edge cases & optimized data flows\n• Cleaned up component exports\n\nProof of work > talk. Back to building 🚀 #buildinpublic #webdev`;
  }
  return `Deep focus engineering day 🛠️\n\nSpent today refactoring core app architecture & polishing UI component state across full-stack Next.js projects.\n\nClean code & buttery smooth performance. Back to shipping ⚡️ #buildinpublic #webdev`;
}

/**
 * Sanitizes generated text for X: strips markdown code fences, backticks, and outer quotes.
 */
function sanitizeTextForX(text) {
  if (!text) return "";
  let clean = text.trim();

  // Strip wrapping double quotes
  if (clean.startsWith('"') && clean.endsWith('"')) {
    clean = clean.substring(1, clean.length - 1);
  }

  // Remove triple backtick code fences (e.g. ```tsx ... ```)
  clean = clean.replace(/```[a-zA-Z]*\n?/g, "");
  clean = clean.replace(/```/g, "");

  // Remove single inline backticks (e.g. `code` -> code)
  clean = clean.replace(/`([^`]+)`/g, "$1");

  // Remove markdown bold markers (**text** -> text)
  clean = clean.replace(/\*\*([^*]+)\*\*/g, "$1");

  return clean.trim();
}

function postToWebhook(text) {
  if (!text || typeof text !== "string" || text.trim() === "") {
    console.log("❌ Cannot post to webhook: text payload is empty or null.");
    return "Error: Empty or null text payload";
  }

  const cleanText = sanitizeTextForX(text);

  const effectiveWebhookUrl = PropertiesService.getUserProperties().getProperty("MAKE_WEBHOOK_URL") || MAKE_WEBHOOK_URL;

  // Send multiple field aliases for seamless Make.com / Buffer / Zapier parameter mapping
  const payload = {
    text: cleanText,
    content: cleanText,
    status: cleanText,
    tweet: cleanText,
    message: cleanText
  };

  const options = {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const res = UrlFetchApp.fetch(effectiveWebhookUrl, options);
    console.log("📡 Webhook Response (" + res.getResponseCode() + "): " + res.getContentText());
    return res.getContentText();
  } catch (e) {
    console.log("❌ Webhook error: " + e.toString());
    return "Error: " + e.toString();
  }
}
