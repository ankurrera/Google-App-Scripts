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
  "Next.js Server Actions vs traditional REST APIs for fast full-stack shipping",
  "Building 60fps micro-animations with Framer Motion and Tailwind CSS",
  "The $0 to $10k/mo indie hacker stack: Next.js + Supabase + Vercel + Tailwind",
  "UI/UX micro-details: 1px border highlights, spring physics, dynamic sub-menus, and glassmorphism",
  "Replacing heavy npm dependencies with clean native Web APIs (Web Crypto, URLSearchParams, native fetch)",
  "React & TypeScript patterns that eliminate 50% of boilerplate code",
  "Database architecture for solo founders: SQLite/Postgres vs complex ORM abstractions",
  "Why optimistic UI updates and skeleton states make web apps feel instant"
];

// ======================================================================
// AUTOMATION 1: MORNING BUILDER TIP (@buildwithsid Style - 9 AM)
// ======================================================================
function generateAndPostAITweet() {
  console.log("🎨 Asking Gemini AI to generate a @buildwithsid style builder post...");

  const randomTopic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
  const randomSeed = Math.floor(Math.random() * 100000);

  const prompt = `You are @ankurrera, a senior Full-Stack Engineer & Indie Hacker building aesthetic web apps in public.
Write a single viral, highly engaging X (Twitter) post about: "${randomTopic}". (Seed: ${randomSeed}).

HUMAN & VIRAL VOICE INSTRUCTIONS:
1. Write like a real developer tweeting from their IDE, NOT an AI social media bot.
2. HOOK FIRST: Start with a powerful, scroll-stopping first line (a hot take, a counter-intuitive truth, a sharp observation, or a real engineering win).
3. BODY: 2-3 short, punchy lines sharing genuine technical substance, speed hacks, or UI polish details. Keep line spacing clean.
4. TONE: Authentic, technical, confident builder vibe.
5. STRICTLY BANNED:
   ❌ NO HASHTAGS AT ALL (hashtags look like automated spam on X).
   ❌ NO EMOJI BULLET LIST DUMPS (e.g. no "• ⚡️ ... \\n • 🎨 ...").
   ❌ NO AI BUZZWORDS ("game-changer", "delve", "elevate", "superpower", "seamless", "stop overcomplicating").
   ❌ NO FORCED CTA QUESTIONS ("What are you building today? 👇"). End naturally or with a provocative developer thought.
6. LENGTH: 180 to 240 characters TOTAL.
7. OUTPUT FORMAT: Return ONLY raw post text without quotes or markdown code blocks.`;

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

  const prompt = `You are @ankurrera, an Indie Hacker & Full-Stack Developer on X.
Write a short, punchy developer debate or controversial tech choice question that makes devs immediately want to reply in the comments. (Seed: ${randomSeed}).

Debate angles:
- Next.js Server Actions vs traditional REST/tRPC APIs
- Tailwind CSS vs CSS Modules / Styled Components for long-term scalability
- Vercel serverless vs $40/mo self-hosted Hetzner VPS for production apps
- Supabase / raw Postgres vs ORM abstractions (Prisma / Drizzle)
- Framer Motion vs pure CSS keyframes / spring physics for 60fps UI
- Monorepo vs separate repos for fast MVP shipping

HUMAN & VIRAL VOICE INSTRUCTIONS:
1. Sound like a real developer asking their peers on X or Discord, not an automated poll.
2. Frame it around real trade-offs (e.g., dev velocity vs maintenance cost).
3. Ask directly and authentically.
4. STRICTLY BANNED:
   ❌ NO HASHTAGS.
   ❌ NO AI BUZZWORDS.
   ❌ NO BOT-LIKE DUMPS.
5. LENGTH: Under 180 characters TOTAL.
6. OUTPUT FORMAT: Return ONLY raw tweet text without quotes or markdown code blocks.`;

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
    prompt = `You are @ankurrera, an Indie Hacker & Full-Stack Developer sharing daily proof-of-work on X. (Seed: ${randomSeed}).

GitHub Activity Today:
${activitySummary}

INSTRUCTIONS:
1. Synthesize these code updates into a crisp, natural "Shipped today" tweet.
2. HOOK: Start with a strong shipping hook (e.g. "Shipped a major backend refactor today" or "Optimized dynamic routes & trimmed 40kb off client bundle").
3. CONTENT: Share 2 specific technical wins (e.g., UI polish, state optimization, data fetching speed, bug fixes).
4. TONE: Casual, technical, authentic builder proof-of-work.
5. STRICTLY BANNED:
   ❌ NO HASHTAGS.
   ❌ NO AI BUZZWORDS ("game-changer", "delve", "superpower", etc.).
   ❌ NO GENERIC EMOJI BULLET LISTS.
6. LENGTH: Under 240 characters TOTAL.
7. OUTPUT FORMAT: Return ONLY raw post text without quotes or markdown code blocks.`;
  } else {
    // High-value fallback dev journal when 0 commits pushed today
    prompt = `You are @ankurrera, an Indie Hacker & Full-Stack Developer sharing daily proof-of-work on X. (Seed: ${randomSeed}).

Today was a deep focus refactoring and system architecture day across Next.js and full-stack web projects.

INSTRUCTIONS:
1. Write an authentic, human "Shipped today" / "Deep work log" tweet.
2. Highlight real dev details (e.g., refactoring auth flows, optimizing dynamic routes, polishing UI component tokens, or database indexing).
3. Sound like a real dev closing their IDE after a solid coding session.
4. STRICTLY BANNED:
   ❌ NO HASHTAGS.
   ❌ NO AI BUZZWORDS.
   ❌ NO GENERIC EMOJI BULLET LISTS.
5. LENGTH: Under 240 characters TOTAL.
6. OUTPUT FORMAT: Return ONLY raw post text without quotes or markdown code blocks.`;
  }

  return callGeminiAI(prompt);
}

// ======================================================================
// SHARED HELPER FUNCTIONS (Gemini AI + Rate Limit Retry + Webhook Poster)
// ======================================================================

function callGeminiAI(prompt) {
  const models = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-flash-latest",
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
    `Unpopular opinion: Most web app speed issues aren't framework bugs.\n\nThey're unoptimized images, unindexed SQL queries, and blocking waterfall fetches.\n\nFix those three and your Next.js app feels instant.`,
    `The difference between an amateur side project and a $50k SaaS UI:\n\n1px border highlights over heavy shadows, spring physics on micro-interactions, and instant optimistic updates.`,
    `Replaced 3 heavy npm packages with 25 lines of native Javascript today.\n\nSmaller client bundle, zero supply chain risk, faster page loads.\n\nDefaulting to web standards always wins.`
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}

function generateFallbackDebateTweet() {
  const debates = [
    `Next.js Server Actions vs traditional REST / tRPC APIs for a new SaaS?\n\nServer Actions speed up shipping by 2x, but REST feels cleaner for mobile apps.\n\nWhich path are you choosing?`,
    `Tailwind CSS vs pure CSS Modules for scalable design systems?\n\nTailwind gives insane shipping velocity, but CSS modules keep styles fully scoped.\n\nWhat's your production stack?`,
    `Vercel serverless vs $40/mo self-hosted Hetzner server for early SaaS?\n\nConvenience vs raw compute power.\n\nWhere do you host your side projects?`
  ];
  return debates[Math.floor(Math.random() * debates.length)];
}

function generateFallbackDevJournal(activityData) {
  if (activityData && activityData.length > 0) {
    const topRepo = activityData[0].repo || "core apps";
    return `Shipped a major round of updates to ${topRepo} today.\n\nRefactored core state logic, eliminated unnecessary re-renders, and polished component loading states.\n\nBack to building.`;
  }
  return `Deep focus day in the IDE.\n\nSpent today refactoring data-fetching flows and trimming down client bundle size across full-stack Next.js routes.\n\nClean code feels so good.`;
}

/**
 * Sanitizes generated text for X: strips markdown code fences, backticks, outer quotes, and leftover hashtags.
 */
function sanitizeTextForX(text) {
  if (!text) return "";
  let clean = text.trim();

  // Strip wrapping double quotes or single quotes
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.substring(1, clean.length - 1);
  }

  // Remove triple backtick code fences (e.g. ```tsx ... ```)
  clean = clean.replace(/```[a-zA-Z]*\n?/g, "");
  clean = clean.replace(/```/g, "");

  // Remove single inline backticks (e.g. `code` -> code)
  clean = clean.replace(/`([^`]+)`/g, "$1");

  // Remove markdown bold/italic markers (**text** -> text, *text* -> text)
  clean = clean.replace(/\*\*([^*]+)\*\*/g, "$1");
  clean = clean.replace(/\*([^*]+)\*/g, "$1");

  // Remove trailing hashtags if any were generated (e.g. #buildinpublic)
  clean = clean.replace(/#[a-zA-Z0-9_]+/g, "").trim();

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
