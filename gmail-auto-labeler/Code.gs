// ======================================================================
// GMAIL AUTO-LABELER & INBOX CLEANER ENGINE WITH GEMINI AI
// Target: ankurr.era@gmail.com
// ======================================================================

const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
const BATCH_SIZE = 50;

/**
 * MAIN FUNCTION: Called by 5-minute time-driven trigger.
 * Auto-pages through all 2,000+ historical inbox emails using PropertiesService index.
 */
function fixAndLabelInbox() {
  const props = PropertiesService.getUserProperties();
  let currentIndex = parseInt(props.getProperty("INDEX") || "0", 10);

  const threads = GmailApp.search("in:inbox", currentIndex, BATCH_SIZE);
  console.log(`🔍 Processing inbox threads ${currentIndex} to ${currentIndex + threads.length}...`);

  if (threads.length === 0) {
    console.log("🎉 Reached end of inbox! Resetting index to 0.");
    props.setProperty("INDEX", "0");
    return;
  }

  let processedCount = 0;

  for (let i = 0; i < threads.length; i++) {
    const thread = threads[i];
    const messages = thread.getMessages();
    if (!messages || messages.length === 0) continue;

    const firstMsg = messages[0];
    const lastMsg = messages[messages.length - 1];

    const subject = firstMsg.getSubject() || "";
    const from = firstMsg.getFrom() || "";
    const snippet = firstMsg.getSnippet() || "";
    const body = lastMsg.getPlainBody() || snippet;

    // Rule-Based Classification First (Fast & Free)
    const ruleCategory = categorizeByRules(from, subject, body);

    if (ruleCategory) {
      applyCategoryLabel(thread, ruleCategory);
      processedCount++;
    } else {
      // Fallback to Gemini AI for complex/uncategorized emails
      const aiCategory = categorizeWithGemini(from, subject, snippet);
      if (aiCategory) {
        applyCategoryLabel(thread, aiCategory);
        processedCount++;
      }
    }
  }

  const nextIndex = currentIndex + BATCH_SIZE;
  props.setProperty("INDEX", nextIndex.toString());
  console.log(`✅ Processed ${processedCount} threads. Next index set to ${nextIndex}.`);
}

/**
 * Rule-Based Fast Categorization Logic
 */
function categorizeByRules(from, subject, body) {
  const text = (from + " " + subject + " " + body).toLowerCase();

  // 1. Rejection Emails (High Priority)
  if (text.includes("unfortunately") || text.includes("regret to inform") || text.includes("not moving forward") || text.includes("decided to pursue other candidates")) {
    return "Jobs/Rejected";
  }

  // 2. Interview Invites
  if (text.includes("interview") || text.includes("schedule a call") || text.includes("coding assessment") || text.includes("technical round") || text.includes("hiring manager")) {
    return "Jobs/Interview";
  }

  // 3. Submitted Applications / Confirmation
  if (text.includes("application received") || text.includes("thank you for applying") || text.includes("application submitted") || text.includes("successful application")) {
    return "Jobs/Applied";
  }

  // 4. Job Alerts & Digests (LinkedIn, Indeed, Glassdoor, Naukri, hirist.tech, etc.)
  if (text.includes("matching jobs") || text.includes("job alert") || text.includes("recommended jobs") || text.includes("hirist") || text.includes("freelancer") || text.includes("jobs2web") || text.includes("smartbridge") || text.includes("naukri")) {
    return "Jobs/Applied";
  }

  // 5. Newsletters & Marketing
  if (text.includes("unsubscribe") || text.includes("view in browser") || text.includes("newsletter") || text.includes("digest")) {
    return "Newsletter";
  }

  // 6. Notifications & Receipts
  if (text.includes("receipt") || text.includes("invoice") || text.includes("payment confirmation")) {
    return "Receipt";
  }

  if (text.includes("security alert") || text.includes("notification") || text.includes("verification code") || text.includes("otp")) {
    return "Notification";
  }

  return null;
}

/**
 * Gemini AI Fallback Categorization
 */
function categorizeWithGemini(from, subject, snippet) {
  const prompt = `Categorize this email into EXACTLY ONE of the following category names:
- Jobs/Applied
- Jobs/Interview
- Jobs/Rejected
- Jobs/Job Offer
- Work
- Newsletter
- Marketing
- Notification
- Receipt
- Personal

Email Details:
From: ${from}
Subject: ${subject}
Snippet: ${snippet}

Return ONLY the single label string from the list above, nothing else.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
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
      let label = json.candidates[0].content.parts[0].text.trim();
      return label;
    }
  } catch (e) {
    console.log("Gemini categorization error: " + e.toString());
  }
  return null;
}

/**
 * Apply Label to Gmail Thread
 */
function applyCategoryLabel(thread, categoryName) {
  let label = GmailApp.getUserLabelByName(categoryName);
  if (!label) {
    label = GmailApp.createLabel(categoryName);
  }
  thread.addLabel(label);
}
