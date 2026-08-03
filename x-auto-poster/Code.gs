// ======================================================================
// UNIFIED X (TWITTER) AUTOMATION FOR @ankurrera
// Custom Persona: Indie Hacker & Aesthetic Developer (@buildwithsid style)
// ======================================================================

const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
const MAKE_WEBHOOK_URL = "YOUR_MAKE_WEBHOOK_URL";
const GITHUB_USERNAME = "ankurrera";
const GITHUB_TOKEN = "YOUR_GITHUB_PERSONAL_ACCESS_TOKEN";

// Topics focused on actionable code, high-value visual tricks, and indie hacker architecture
const TOPIC_CATEGORIES = [
  {
    category: "Next.js & React Performance Hacks",
    topics: [
      "Replacing expensive useEffect hooks with derived state & server actions in Next.js",
      "Optimizing dynamic imports & bundle size for sub-100ms page loads in React",
      "Using React 19 useOptimistic for instant UI feedback without waiting for server responses",
      "Preventing layout shifts (CLS) when loading asynchronous UI elements in Next.js"
    ]
  },
  {
    category: "Aesthetic UI & Framer Motion Tricks",
    topics: [
      "Creating smooth glassmorphism dialogs with backdrop-filter and Tailwind CSS",
      "Building butter-smooth hover animations using Framer Motion layoutId",
      "Designing responsive micro-interactions that make web apps feel like native software",
      "Clean CSS grid trick for auto-fit cards with zero media queries"
    ]
  },
  {
    category: "Indie Hacker Stack & Architecture",
    topics: [
      "The ultimate 2026 indie stack: Next.js + Supabase + Vercel + Tailwind for fast shipping",
      "How to set up database RLS policies in Supabase to secure user data in 5 minutes",
      "Handling webhook retries cleanly using edge functions and background jobs",
      "Structuring full-stack TypeScript projects for maximum code reuse and scalability"
    ]
  }
];

// ======================================================================
// AUTOMATION 1: MORNING BUILDER TIP (@buildwithsid Style - 9 AM)
// High-Bookmark Code & UI Hacks
// ======================================================================
function generateAndPostAITweet() {
  console.log("🎨 Asking Gemini AI to generate a high-bookmark builder post...");

  const categoryObj = TOPIC_CATEGORIES[Math.floor(Math.random() * TOPIC_CATEGORIES.length)];
  const randomTopic = categoryObj.topics[Math.floor(Math.random() * categoryObj.topics.length)];
  const randomSeed = Math.floor(Math.random() * 100000);

  const prompt = `You are @ankurrera, a senior Full-Stack Developer & Indie Hacker known for ultra-clean UI/UX and high-performance web apps (style of @buildwithsid).

Write ONE viral, highly bookmarkable X post about: "${randomTopic}". (Variation ID: ${randomSeed}).

CRITICAL ALGORITHM & ENGAGEMENT RULES:
1. HOOK: Start with a powerful, non-obvious hook (e.g. "Most devs overcomplicate X in React. Here is the 5-line fix:" or "Cleanest way to build X in Next.js:").
2. CONTENT: Provide an EXACT copyable code snippet, CSS pattern, or step-by-step tech solution. High technical density = high bookmarks.
3. BOOKMARK CTA: End with a subtle save trigger (e.g. "Bookmark this for your next project 🔖" or "Save this code pattern 👇").
4. NO HASHTAGS: Do NOT include hashtags. Generic hashtags reduce algorithmic reach on X.
5. NO CORPORATE BUZZWORDS: Avoid "game-changer", "delve", "testament", "revolutionize", "seamless". Write like a passionate indie dev.
6. LENGTH: STRICTLY under 275 characters TOTAL so it displays cleanly without truncation.
7. OUTPUT FORMAT: Return ONLY the raw tweet text.`;

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
// High Reply-Volume Tech Choice
// ======================================================================
function generateAndPostInteractiveTweet() {
  console.log("🎨 Asking Gemini AI to generate a builder debate post...");

  const randomSeed = Math.floor(Math.random() * 100000);

  const prompt = `You are @ankurrera, an Indie Hacker and Full-Stack Developer on X.
Write a short, highly engaging technical debate or stack decision question that drives high reply volume. (Variation ID: ${randomSeed}).

DEBATE THEMES:
- Next.js Server Actions vs traditional REST/TRPC API routes for SaaS
- Tailwind CSS vs CSS Modules / Styled-Components for long-term scalability
- Supabase (Postgres) vs Firebase (NoSQL) for launching a startup in 2026
- Vercel vs self-hosting on Hetzner/VPS to save infrastructure costs
- Framer Motion vs CSS keyframe animations for high-frequency UI interactions

CRITICAL REQUIREMENTS:
1. HOOK: Frame a clear choice or controversial dev trade-off.
2. TONE: Authentic builder community vibe.
3. CALL TO ACTION: Explicitly ask devs: "Which one are you using in production and why? 👇"
4. NO HASHTAGS: Do NOT include hashtags (they hurt organic reply metrics).
5. LENGTH: Short & punchy (<190 characters).
6. OUTPUT FORMAT: Return ONLY raw tweet text.`;

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
// Proof-of-Work Dev Log
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

  const prompt = `You are @ankurrera, an Indie Hacker & Full-Stack Developer documenting daily proof of work (style of @buildwithsid).

Below is raw development activity from my GitHub repositories today:
${activitySummary}

INSTRUCTIONS:
1. Synthesize these updates into ONE high-value "Shipped Today" dev post.
2. Hook: Start with a crisp, authentic builder hook (e.g. "Shipped a major performance win today ⚡️" or "Building out [feature] for my SaaS...").
3. Proof of Work: Focus on technical details (e.g., UI responsiveness, query optimization, clean architecture).
4. Bookmark/Reply trigger: Ask a quick builder question or bookmark CTA at the end.
5. NO HASHTAGS: Do NOT include hashtags.
6. STRICT LENGTH: Under 260 characters TOTAL.
7. Output format: Return ONLY raw tweet text.`;

  return callGeminiAI(prompt);
}

// ======================================================================
// SHARED HELPER FUNCTIONS (Gemini AI + Webhook Poster)
// ======================================================================

function callGeminiAI(prompt) {
  const models = [
    "gemini-3.6-flash",
    "gemini-flash-latest",
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
