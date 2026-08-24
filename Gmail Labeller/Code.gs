// ======================================================================
// GMAIL AUTO-LABELER & INBOX ANALYZER ENGINE WITH GEMINI AI
// Target: ankurr.era@gmail.com
// ======================================================================

const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
const BATCH_SIZE = 100;
const TRIGGER_MAX_THREADS_PER_RUN = 100; // Cap per trigger run to prevent daily quota exhaustion

/**
 * Ideal Taxonomy Candidates
 */
const DEFAULT_TAXONOMY = [
  "Jobs/Applied",
  "Jobs/Interview",
  "Jobs/Rejected",
  "Jobs/Job Offer",
  "Jobs/Alerts",
  "Social/Notifications",
  "Shopping/Receipts",
  "Shopping/Invoices",
  "Shopping/Shipping",
  "Finance/Banking",
  "Finance/Payments",
  "Security/OTP",
  "Security/Alerts",
  "Subscriptions/Newsletters",
  "Subscriptions/Tech",
  "Subscriptions/Promos",
  "Health/Medical",
  "Housing/Real Estate",
  "Travel/Bookings",
  "Work/General",
  "Personal/General"
];

// In-Memory Cache for Gmail Label Objects across single execution
let labelCacheMap = null;

/**
 * BULK LABEL PRE-FETCHER: Loads all existing user labels once into memory
 */
function initLabelCache() {
  if (labelCacheMap !== null) return;
  labelCacheMap = {};
  try {
    const existing = GmailApp.getUserLabels();
    for (let i = 0; i < existing.length; i++) {
      labelCacheMap[existing[i].getName()] = existing[i];
    }
  } catch (e) {
    console.warn("⚠️ Could not pre-fetch labels: " + e.toString());
  }
}

/**
 * LAZY LABEL CREATOR: Creates parent/child labels ON-DEMAND without redundant API calls
 */
function getCachedLabel(labelName) {
  initLabelCache();
  if (labelCacheMap && labelCacheMap[labelName]) {
    return labelCacheMap[labelName];
  }

  let label = null;
  try {
    label = GmailApp.getUserLabelByName(labelName);
    if (!label) {
      label = GmailApp.createLabel(labelName);
      console.log(` └─ 🏷️ Created Label on demand: [${labelName}]`);
    }
  } catch (e) {
    console.error(`Error fetching/creating label [${labelName}]: ` + e.toString());
  }

  if (labelCacheMap && label) {
    labelCacheMap[labelName] = label;
  }
  return label;
}

/**
 * Safely extracts clean text snippet from a Gmail message
 */
function getMessageSnippet(message) {
  if (!message) return "";
  try {
    const plainBody = message.getPlainBody() || "";
    return plainBody.substring(0, 300).replace(/\s+/g, ' ').trim();
  } catch (e) {
    return "";
  }
}

// ======================================================================
// STEP 1: ANALYZE ALL 4000+ INBOX EMAILS & DISCOVER ACTIVE CATEGORIES
// ======================================================================

/**
 * Scans large inboxes (4000+ emails) using persistent pagination state (PropertiesService).
 * Remembers last analyzed position so subsequent runs resume scanning the rest of the inbox!
 */
function analyzeInboxAndCreateLabels() {
  const userProperties = PropertiesService.getUserProperties();
  let start = Number(userProperties.getProperty("LAST_ANALYZED_INDEX") || 0);

  console.log(`🚀 Starting inbox analysis (Resuming from thread #${start})...`);

  const startTime = new Date().getTime();
  const domainFrequency = {};
  const activeCategoryCounts = {};
  let totalScanned = 0;
  const batchSize = 100;
  const maxEmailsToScan = 10000;
  const maxExecutionMs = 4 * 60 * 1000;

  try {
    while (start < maxEmailsToScan) {
      if (new Date().getTime() - startTime > maxExecutionMs) {
        console.warn(`⏱️ Reached 4-minute safe execution window. Saved progress at thread #${start}. Run analyzeInboxAndCreateLabels again to scan thread #${start} and beyond!`);
        userProperties.setProperty("LAST_ANALYZED_INDEX", start.toString());
        break;
      }

      const threads = GmailApp.search("in:inbox", start, batchSize);
      if (!threads || threads.length === 0) {
        userProperties.deleteProperty("LAST_ANALYZED_INDEX");
        console.log(`🎉 Complete inbox corpus scan finished! Reached end of inbox at thread #${start}.`);
        break;
      }

      for (let i = 0; i < threads.length; i++) {
        const thread = threads[i];
        const messages = thread.getMessages();
        if (!messages || messages.length === 0) continue;

        const firstMsg = messages[0];
        const subject = firstMsg.getSubject() || "";
        const from = firstMsg.getFrom() || "";
        const snippet = getMessageSnippet(firstMsg);

        // Extract sender domain
        const domainMatch = from.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (domainMatch && domainMatch[1]) {
          const domain = domainMatch[1].toLowerCase();
          domainFrequency[domain] = (domainFrequency[domain] || 0) + 1;
        }

        // Categorize using Gemini AI if key is present, else rule engine
        let category = getCategoryForEmail(from, subject, snippet, snippet);

        if (category) {
          activeCategoryCounts[category] = (activeCategoryCounts[category] || 0) + 1;
        }

        totalScanned++;
      }

      start += batchSize;
      userProperties.setProperty("LAST_ANALYZED_INDEX", start.toString());
      console.log(`📊 Analyzed ${totalScanned} threads in this run... (Current reach: thread #${start})`);
    }
  } catch (e) {
    if (e.toString().includes("Service invoked too many times")) {
      console.warn("⚠️ Gmail Daily Quota Exceeded during scan.");
    } else {
      console.error("Scan error: " + e.toString());
    }
  }

  // Ensure all standard Jobs child status labels exist
  const jobStatusLabels = ["Jobs/Applied", "Jobs/Interview", "Jobs/Rejected", "Jobs/Job Offer", "Jobs/Alerts"];
  for (let j = 0; j < jobStatusLabels.length; j++) {
    getCachedLabel(jobStatusLabels[j]);
  }

  // Get Top Sender Domains
  const topDomains = Object.keys(domainFrequency)
    .sort((a, b) => domainFrequency[b] - domainFrequency[a])
    .slice(0, 25);

  const elapsedSec = Math.round((new Date().getTime() - startTime) / 1000);
  console.log(`\n✅ Corpus Analysis Run Complete in ${elapsedSec}s! Analyzed ${totalScanned} inbox threads in this pass.`);
  if (topDomains.length > 0) {
    console.log("Top Sender Domains Found:\n" + topDomains.join(", "));
  }

  // -------------------------------------------------------------------
  // 2. CREATE LABELS THAT HAVE MATCHING CONTENT
  // -------------------------------------------------------------------
  const activeCategories = Object.keys(activeCategoryCounts);
  console.log(`\n⚙️ Active categories detected with email contents:`);

  let createdCount = 0;
  try {
    for (let i = 0; i < activeCategories.length; i++) {
      const cat = activeCategories[i];
      const count = activeCategoryCounts[cat];
      
      if (count > 0) {
        getCachedLabel(cat);
        console.log(` └─ 🏷️ Verified/Created Label [${cat}] -> (${count} emails ready to label)`);
        createdCount++;
      }
    }
    console.log(`\n🎉 Complete Jobs status tree & active label trees verified/created in Gmail.`);
  } catch (err) {
    if (err.toString().includes("Service invoked too many times")) {
      console.warn("⚠️ Label creation paused due to Google daily quota limit.");
    } else {
      console.error("Label creation error: " + err.toString());
    }
  }
}

/**
 * Resets analysis pagination state back to thread #0
 */
function resetAnalysisProgress() {
  PropertiesService.getUserProperties().deleteProperty("LAST_ANALYZED_INDEX");
  console.log("🔄 Reset analysis position back to thread #0.");
}

/**
 * Explicitly sets up complete Jobs child status labels in Gmail
 */
function setupJobStatusLabels() {
  console.log("📁 Ensuring complete Jobs Parent/Child status tree in Gmail...");
  const jobLabels = [
    "Jobs/Applied",
    "Jobs/Interview",
    "Jobs/Rejected",
    "Jobs/Job Offer",
    "Jobs/Alerts"
  ];

  for (let i = 0; i < jobLabels.length; i++) {
    getCachedLabel(jobLabels[i]);
    console.log(` ✅ Verified/Created: [${jobLabels[i]}]`);
  }
  console.log("🎉 Complete Jobs status label tree ready in Gmail!");
}

// ======================================================================
// AUTO-LABELING ENGINE (HIGH PRECISION BATCH PROCESSOR)
// ======================================================================

/**
 * Universal classification retriever: Uses Gemini AI when key is configured,
 * or precision rules as fallback.
 */
function getCategoryForEmail(from, subject, snippet, body) {
  // Fast OTP / Security Check
  const text = (from + " " + subject + " " + (snippet || body || "")).toLowerCase();
  const subjectLower = subject.toLowerCase();

  if (text.includes("verification code") || text.includes("one-time password") || text.includes("your code is") || /\b(otp|2fa code)\b/i.test(subjectLower)) {
    return "Security/OTP";
  }

  // Primary: Gemini AI (if API key is valid)
  if (GEMINI_API_KEY && GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY" && GEMINI_API_KEY.trim() !== "") {
    const aiCategory = categorizeWithGemini(from, subject, snippet);
    if (aiCategory) return aiCategory;
  }

  // Secondary: High-Precision Rules Engine
  return categorizeByRules(from, subject, body || snippet);
}

/**
 * MAIN FUNCTION (Run by 10/15-min trigger): Processes a safe, quota-budgeted batch of inbox threads.
 */
function fixAndLabelInbox() {
  labelAll2000InboxEmails(TRIGGER_MAX_THREADS_PER_RUN);
}

/**
 * FAST MASS LABELER: Directly queries UNLABELED inbox emails (-has:userlabel)
 * Uses batch budgeting and lightweight snippet reads to stay well within daily Gmail quotas!
 *
 * @param {number} maxThreadsToProcess Max threads to process in this execution (default: 100).
 */
function labelAll2000InboxEmails(maxThreadsToProcess) {
  const maxThreads = maxThreadsToProcess || TRIGGER_MAX_THREADS_PER_RUN || 100;
  console.log(`🚀 Starting FAST MASS LABELING of unlabeled inbox emails (Cap: ${maxThreads} threads for this run)...`);

  const startTime = new Date().getTime();
  const maxExecutionMs = 2 * 60 * 1000; // 2-minute safe window per run
  let totalLabeled = 0;
  const batchSize = Math.min(50, maxThreads);

  try {
    while (totalLabeled < maxThreads) {
      if (new Date().getTime() - startTime > maxExecutionMs) {
        console.warn(`⏱️ Reached 2-minute safe execution window. Processed ${totalLabeled} threads in this run.`);
        break;
      }

      const fetchLimit = Math.min(batchSize, maxThreads - totalLabeled);
      // DIRECT UNLABELED QUERY: Gets ONLY unlabeled threads!
      const threads = GmailApp.search("in:inbox -has:userlabel", 0, fetchLimit);
      if (!threads || threads.length === 0) {
        console.log("🎉 ALL inbox emails are completely labeled! No remaining unlabeled emails found.");
        break;
      }

      const categoryMap = {};

      for (let i = 0; i < threads.length; i++) {
        const thread = threads[i];
        const messages = thread.getMessages();
        if (!messages || messages.length === 0) continue;

        const firstMsg = messages[0];
        const subject = firstMsg.getSubject() || "";
        const from = firstMsg.getFrom() || "";
        const snippet = getMessageSnippet(firstMsg);

        const category = getCategoryForEmail(from, subject, snippet, snippet) || "Updates/Notifications";

        if (!categoryMap[category]) categoryMap[category] = [];
        categoryMap[category].push(thread);
      }

      let chunkLabeled = 0;
      // Batch apply labels for this chunk
      for (const catName in categoryMap) {
        const targetThreads = categoryMap[catName];
        if (targetThreads && targetThreads.length > 0) {
          const label = getCachedLabel(catName);
          if (label) {
            label.addToThreads(targetThreads);
            chunkLabeled += targetThreads.length;
          }
        }
      }

      if (chunkLabeled === 0) {
        console.warn("⚠️ No threads were labeled in this chunk. Breaking to prevent infinite retry.");
        break;
      }

      totalLabeled += chunkLabeled;
      console.log(`⚡ Labeled ${chunkLabeled} new threads... (Run progress: ${totalLabeled}/${maxThreads})`);
    }

    // Check remaining count
    let remainingEstimate = 0;
    try {
      const remainingThreads = GmailApp.search("in:inbox -has:userlabel", 0, 1);
      remainingEstimate = remainingThreads ? remainingThreads.length : 0;
    } catch (e) {
      // ignore
    }

    console.log(`\n🎉 MASS LABELING BATCH COMPLETE! Processed and labeled ${totalLabeled} threads in this run.`);
    if (remainingEstimate > 0) {
      console.log(`📌 Unlabeled emails remain in inbox. The next scheduled trigger run will process the next batch!`);
    } else {
      console.log(`✨ Inbox completely labeled!`);
    }

  } catch (err) {
    if (err.toString().includes("Service invoked too many times")) {
      console.warn("⚠️ Gmail daily API quota limit reached. Execution paused safely. Google will reset quota automatically.");
    } else {
      console.error("Error in labelAll2000InboxEmails: " + err.toString());
    }
  }
}

/**
 * RE-LABELING UTILITY: Re-evaluates ALL inbox threads (including already labeled ones)
 */
function relabelInboxThreads() {
  console.log("🔄 Re-evaluating inbox threads to fix misclassifications across 2,000+ emails...");
  const startTime = new Date().getTime();
  const maxExecutionMs = 4 * 60 * 1000;
  let start = 0;
  const batchSize = 100;
  let updatedCount = 0;

  try {
    while (start < 2500) {
      if (new Date().getTime() - startTime > maxExecutionMs) {
        console.warn("⏱️ 4-minute time guard reached. Run relabelInboxThreads again for remaining threads.");
        break;
      }

      const threads = GmailApp.search("in:inbox", start, batchSize);
      if (!threads || threads.length === 0) break;

      for (let i = 0; i < threads.length; i++) {
        const thread = threads[i];
        const messages = thread.getMessages();
        if (!messages || messages.length === 0) continue;

        const firstMsg = messages[0];
        const subject = firstMsg.getSubject() || "";
        const from = firstMsg.getFrom() || "";
        const snippet = getMessageSnippet(firstMsg);

        const correctCategory = getCategoryForEmail(from, subject, snippet, snippet);
        if (!correctCategory) continue;

        const existingLabels = thread.getLabels();
        let currentLabelName = "";
        for (let l = 0; l < existingLabels.length; l++) {
          const name = existingLabels[l].getName();
          if (name.includes("/")) {
            currentLabelName = name;
            break;
          }
        }

        // If label is wrong or missing, update it!
        if (currentLabelName !== correctCategory) {
          if (currentLabelName) {
            const oldLabel = getCachedLabel(currentLabelName);
            if (oldLabel) thread.removeLabel(oldLabel);
          }
          const newLabel = getCachedLabel(correctCategory);
          if (newLabel) {
            thread.addLabel(newLabel);
            updatedCount++;
            console.log(`🔧 Fixed: "${subject.substring(0, 40)}" -> Re-labeled to [${correctCategory}]`);
          }
        }
      }
      start += batchSize;
    }

    console.log(`✅ Relabel complete! Re-categorized ${updatedCount} threads across your inbox.`);
  } catch (err) {
    if (err.toString().includes("Service invoked too many times")) {
      console.warn("⚠️ Gmail daily API quota limit reached. Google will automatically reset quota in ~24 hours.");
    } else {
      console.error("Error in relabelInboxThreads: " + err.toString());
    }
  }
}

// ======================================================================
// HIGH-PRECISION PRIORITY RULE ENGINE (FALLBACK)
// ======================================================================

/**
 * Priority Rule-Based Categorization Engine
 */
function categorizeByRules(from, subject, body) {
  const fromLower = from.toLowerCase();
  const subjectLower = subject.toLowerCase();
  const text = (from + " " + subject + " " + body).toLowerCase();

  const isJobEmail = subjectLower.includes("hiring") ||
                     subjectLower.includes("job") ||
                     subjectLower.includes("apply") ||
                     subjectLower.includes("recruitment") ||
                     subjectLower.includes("vacancy") ||
                     subjectLower.includes("career") ||
                     subjectLower.includes("executive");

  // -------------------------------------------------------------------
  // PRIORITY 1: SECURITY & OTP
  // -------------------------------------------------------------------
  if (text.includes("verification code") ||
      text.includes("one-time password") ||
      text.includes("your code is") ||
      /\b(otp|2fa code)\b/i.test(subjectLower)) {
    return "Security/OTP";
  }

  if (text.includes("security alert") ||
      text.includes("password reset") ||
      text.includes("reset password") ||
      text.includes("login attempt") ||
      text.includes("sign-in from") ||
      fromLower.includes("accounts.google.com")) {
    return "Security/Alerts";
  }

  // -------------------------------------------------------------------
  // PRIORITY 2: INTERVIEW INVITES & INDUCTIONS (micro1, Infosys, Sakshi HR)
  // -------------------------------------------------------------------
  if (subjectLower.includes("interview invite") ||
      subjectLower.includes("interview invitation") ||
      subjectLower.includes("complete your interview") ||
      subjectLower.includes("induction session") ||
      subjectLower.includes("shortlisting confirmation") ||
      subjectLower.includes("rescheduling of exam slot") ||
      subjectLower.includes("infosys recruitment") ||
      subjectLower.includes("exam slot") ||
      text.includes("coding assessment") ||
      text.includes("technical round") ||
      text.includes("calendly.com") ||
      text.includes("hackerrank") ||
      text.includes("codesignal") ||
      text.includes("assessment link") ||
      (text.includes("interview") && text.includes("schedule"))) {
    return "Jobs/Interview";
  }

  // -------------------------------------------------------------------
  // PRIORITY 3: DIRECT JOB APPLICATION CONFIRMATIONS
  // -------------------------------------------------------------------
  if (subjectLower.includes("application was sent") ||
      subjectLower.includes("application received") ||
      subjectLower.includes("thank you for applying") ||
      subjectLower.includes("application submitted") ||
      subjectLower.includes("registration confirmed") ||
      subjectLower.includes("thank you for your interest") ||
      subjectLower.includes("successful application") ||
      subjectLower.includes("we received your application") ||
      subjectLower.includes("your application for") ||
      subjectLower.includes("you applied for")) {
    return "Jobs/Applied";
  }

  // -------------------------------------------------------------------
  // PRIORITY 4: ALL JOB ALERTS, HIRING & RECRUITMENT (MUST EVALUATE BEFORE SOCIAL!)
  // -------------------------------------------------------------------
  const isJobDigest = fromLower.includes("naukri") ||
                      fromLower.includes("indeed") ||
                      fromLower.includes("glassdoor") ||
                      fromLower.includes("freelancer") ||
                      fromLower.includes("ambitionbox") ||
                      fromLower.includes("jushey") ||
                      fromLower.includes("instahyre") ||
                      fromLower.includes("unstop") ||
                      fromLower.includes("hirist") ||
                      fromLower.includes("foundit") ||
                      fromLower.includes("jobs2web");

  if (isJobDigest ||
      subjectLower.includes("we're hiring") ||
      subjectLower.includes("hiring for") ||
      subjectLower.includes("hiring software developer") ||
      subjectLower.includes("placement cell") ||
      subjectLower.includes("campus recruitment") ||
      subjectLower.includes("matching your search") ||
      subjectLower.includes("job alert") ||
      subjectLower.includes("recommended jobs") ||
      subjectLower.includes("jobs for you") ||
      subjectLower.includes("might interest you") ||
      subjectLower.includes("apply to") ||
      subjectLower.includes("top job picks") ||
      subjectLower.includes("executive") ||
      subjectLower.includes("salaries")) {
    
    if (!subjectLower.includes("interview invite") &&
        !subjectLower.includes("coding assessment") &&
        !subjectLower.includes("update on your application") &&
        !subjectLower.includes("your application for") &&
        !subjectLower.includes("application was sent")) {
      return "Jobs/Alerts";
    }
  }

  // -------------------------------------------------------------------
  // PRIORITY 5: SOCIAL MEDIA POSTS & ACTIVITY (LinkedIn, IG, FB, Snapchat, Twitter, Quora)
  // MUST EXCLUDE ANY JOB POSTS / HIRING NOTICES!
  // -------------------------------------------------------------------
  const isSocialMediaSender = fromLower.includes("linkedin.com") ||
                              fromLower.includes("instagram.com") ||
                              fromLower.includes("facebookmail.com") ||
                              fromLower.includes("facebook.com") ||
                              fromLower.includes("snapchat.com") ||
                              fromLower.includes("twitter.com") ||
                              fromLower.includes("x.com") ||
                              fromLower.includes("threads.net") ||
                              fromLower.includes("quora.com") ||
                              fromLower.includes("pinterest.com") ||
                              fromLower.includes("tiktok.com");

  if (isSocialMediaSender && !isJobEmail) {
    if (subjectLower.includes("impressions") ||
        subjectLower.includes("viewed your profile") ||
        subjectLower.includes("appeared in") ||
        subjectLower.includes("weekly performance") ||
        subjectLower.includes("posts got") ||
        subjectLower.includes("connected with you") ||
        subjectLower.includes("sent you a message") ||
        subjectLower.includes("posted") ||
        subjectLower.includes("shared a post") ||
        subjectLower.includes("commented on") ||
        subjectLower.includes("tagged you") ||
        subjectLower.includes("new follower") ||
        subjectLower.includes("snapped you") ||
        subjectLower.includes("tweeted") ||
        subjectLower.includes("upvoted") ||
        fromLower.includes("quora.com") ||
        fromLower.includes("instagram.com") ||
        fromLower.includes("facebookmail.com") ||
        fromLower.includes("snapchat.com")) {
      return "Social/Notifications";
    }
  }

  // -------------------------------------------------------------------
  // PRIORITY 6: UTILITY BILLS & BROADBAND PAYMENTS
  // -------------------------------------------------------------------
  if (fromLower.includes("jiofi") ||
      fromLower.includes("ebill") ||
      subjectLower.includes("jiohome") ||
      subjectLower.includes("jiofixedvoice") ||
      subjectLower.includes("jiofiber") ||
      subjectLower.includes("e-bill") ||
      subjectLower.includes("payment received for jio") ||
      subjectLower.includes("bill payment overdue")) {
    return "Finance/Payments";
  }

  // -------------------------------------------------------------------
  // PRIORITY 7: BIG BRAND SHOPPING & E-COMMERCE (Nykaa, AJIO, Amazon, Zomato, Swiggy)
  // -------------------------------------------------------------------
  const isBigBrandShopping = fromLower.includes("nykaa") ||
                             fromLower.includes("ajio") ||
                             fromLower.includes("zomato") ||
                             fromLower.includes("swiggy") ||
                             fromLower.includes("myntra") ||
                             fromLower.includes("amazon") ||
                             fromLower.includes("flipkart") ||
                             fromLower.includes("tatacliq") ||
                             fromLower.includes("tira") ||
                             fromLower.includes("levi.in") ||
                             fromLower.includes("blinkit") ||
                             fromLower.includes("zepto") ||
                             fromLower.includes("instamart") ||
                             fromLower.includes("bewakoof") ||
                             fromLower.includes("igp.com") ||
                             fromLower.includes("spotify");

  if (isBigBrandShopping) {
    // 7A. Package Shipped / Tracking
    if (subjectLower.startsWith("shipped:") ||
        subjectLower.includes("out for delivery") ||
        subjectLower.includes("dispatched") ||
        subjectLower.includes("tracking number") ||
        (subjectLower.includes("shipped") && (subjectLower.includes("order") || subjectLower.includes("package") || subjectLower.includes("item")))) {
      return "Shopping/Shipping";
    }

    // 7B. Receipts / Invoices / Delivered
    if (subjectLower.includes("order placed") ||
        subjectLower.includes("order confirmed") ||
        subjectLower.includes("tax invoice") ||
        subjectLower.includes("delivered") ||
        subjectLower.includes("payment received")) {
      return "Shopping/Receipts";
    }

    // 7C. Marketing Deals / Promos (Freedom Finds, ₹200 OFF, Bestie gifts, Premium perks)
    return "Subscriptions/Promos";
  }

  // -------------------------------------------------------------------
  // PRIORITY 8: PROMOTIONAL & MARKETING OFFERS (Generic deals, discounts)
  // -------------------------------------------------------------------
  if (!isJobEmail && (
      subjectLower.includes("combo alert") ||
      subjectLower.includes("gifts kids will love") ||
      subjectLower.includes("school reopens soon") ||
      subjectLower.includes("off is waiting") ||
      subjectLower.includes("freedom finds") ||
      subjectLower.includes("bestie wants") ||
      /\b(flash sale|mega sale|discount|promo code|flat \d+% off)\b/i.test(subjectLower))) {
    return "Subscriptions/Promos";
  }

  // -------------------------------------------------------------------
  // PRIORITY 9: SYSTEM NOTIFICATIONS & WEBHOOK ERRORS (GitHub, Make, CloudHQ)
  // -------------------------------------------------------------------
  if (fromLower.includes("make.com") ||
      fromLower.includes("github.com") ||
      fromLower.includes("cloudhq") ||
      fromLower.includes("darwinbox") ||
      subjectLower.includes("integration webhooks") ||
      subjectLower.includes("scenario integration") ||
      subjectLower.includes("request to rebuild") ||
      subjectLower.includes("request received") ||
      subjectLower.includes("thank you for signing up") ||
      subjectLower.includes("buffer scenario")) {
    return "Updates/Notifications";
  }

  // -------------------------------------------------------------------
  // PRIORITY 10: TECH NEWSLETTERS & PRODUCT UPDATES (Notion Wednesday, Substack)
  // -------------------------------------------------------------------
  if (subjectLower.includes("notion wednesday") ||
      subjectLower.includes("shipped 4") ||
      fromLower.includes("substack") ||
      fromLower.includes("medium.com")) {
    return "Subscriptions/Newsletters";
  }

  // -------------------------------------------------------------------
  // PRIORITY 11: HEALTH & MEDICAL
  // -------------------------------------------------------------------
  if (fromLower.includes("1mg.com") ||
      fromLower.includes("strengthlog") ||
      fromLower.includes("apollo") ||
      subjectLower.includes("pharmacy") ||
      subjectLower.includes("lab test") ||
      subjectLower.includes("prescription") ||
      subjectLower.includes("diagnostic report")) {
    return "Health/Medical";
  }

  // -------------------------------------------------------------------
  // PRIORITY 12: HOUSING & REAL ESTATE
  // -------------------------------------------------------------------
  if (fromLower.includes("magicbricks") ||
      fromLower.includes("nobroker") ||
      fromLower.includes("housing.com") ||
      subjectLower.includes("property alert") ||
      subjectLower.includes("rent agreement") ||
      subjectLower.includes("apartment for rent")) {
    return "Housing/Real Estate";
  }

  // -------------------------------------------------------------------
  // PRIORITY 13: JOB REJECTIONS
  // -------------------------------------------------------------------
  const isJobContext = text.includes("application") || text.includes("candidate") || text.includes("position") || text.includes("role");
  if (isJobContext && (
      text.includes("regret to inform") ||
      text.includes("not moving forward") ||
      text.includes("decided to pursue other candidates") ||
      text.includes("proceed with other candidates") ||
      text.includes("not selected for this role") ||
      text.includes("position has been filled") ||
      text.includes("after careful consideration") ||
      subjectLower.includes("update on your application") ||
      subjectLower.includes("update regarding your application"))) {
    return "Jobs/Rejected";
  }

  // -------------------------------------------------------------------
  // PRIORITY 14: JOB OFFERS
  // -------------------------------------------------------------------
  if (subjectLower.includes("job offer") ||
      subjectLower.includes("offer letter") ||
      subjectLower.includes("pleased to offer") ||
      subjectLower.includes("offer of employment") ||
      subjectLower.includes("congratulations on your offer")) {
    return "Jobs/Job Offer";
  }

  // -------------------------------------------------------------------
  // PRIORITY 15: ATS DOMAINS
  // -------------------------------------------------------------------
  const isATS = fromLower.includes("greenhouse.io") ||
                fromLower.includes("lever.co") ||
                fromLower.includes("workday") ||
                fromLower.includes("ashbyhq") ||
                fromLower.includes("smartrecruiters") ||
                fromLower.includes("bamboohr") ||
                fromLower.includes("icims") ||
                fromLower.includes("jobvite");

  if (isATS) {
    return "Jobs/Applied";
  }

  // -------------------------------------------------------------------
  // PRIORITY 16: BANKING & PAYMENTS
  // -------------------------------------------------------------------
  if (fromLower.includes("sbi.bank") ||
      fromLower.includes("razorpay") ||
      fromLower.includes("stripe") ||
      fromLower.includes("paypal") ||
      subjectLower.includes("payment confirmation") ||
      subjectLower.includes("account statement") ||
      subjectLower.includes("neft transaction")) {
    return "Finance/Banking";
  }

  if (subjectLower.includes("invoice") || subjectLower.includes("bill")) {
    return "Shopping/Invoices";
  }

  // -------------------------------------------------------------------
  // PRIORITY 17: TRAVEL & TRANSIT
  // -------------------------------------------------------------------
  if (/\b(flight booking|pnr|ticket confirmed|boarding pass|hotel reservation|irctc booking|uber trip|uber ride)\b/i.test(text)) {
    return "Travel/Bookings";
  }

  // -------------------------------------------------------------------
  // PRIORITY 18: SUBSCRIPTIONS & NEWSLETTERS
  // -------------------------------------------------------------------
  if (fromLower.includes("reddit") ||
      fromLower.includes("medium.com") ||
      fromLower.includes("gumroad") ||
      fromLower.includes("jsmastery") ||
      subjectLower.includes("newsletter") ||
      subjectLower.includes("weekly digest")) {
    return "Subscriptions/Newsletters";
  }

  return null;
}

/**
 * Gemini 2.0 Flash AI Categorization
 */
function categorizeWithGemini(from, subject, snippet) {
  const taxonomyList = DEFAULT_TAXONOMY.join(", ");
  const prompt = `You are an expert email classifier. Categorize this email into EXACTLY ONE of these labels:
${taxonomyList}

Category Definitions:
- Jobs/Applied: Candidate job application confirmations.
- Jobs/Interview: Interview invites, coding test invites, shortlisting updates, exam slot rescheduling (e.g. Infosys Recruitment, exam slot).
- Jobs/Rejected: Job application rejection notices.
- Jobs/Job Offer: Official job offer letters.
- Jobs/Alerts: Job digests, placement cell notifications, open position alerts, hiring announcements.
- Social/Notifications: Social network posts, comments, follower alerts, connections, and activity from LinkedIn, Instagram, Facebook, Snapchat, Twitter/X, Quora. STRICT RULE: Job posts, hiring alerts, and recruitment notices must NEVER be labeled Social/Notifications — put them in Jobs/Alerts or Jobs/Interview!
- Subscriptions/Promos: Shopping deals, promo offers, marketing blasts from brands like Nykaa, AJIO, Zomato, Swiggy, Spotify, Myntra, Levi's, Tira (e.g. "Sakshi, we know exactly what your bestie wants", "Freedom Finds", "Flat ₹200 OFF is waiting!", "Get Premium perks").
- Subscriptions/Newsletters: Tech newsletters, blog updates, feature digests (e.g. "Notion Wednesday", Substack, Medium).
- Finance/Payments: Broadband bills, JioFiber e-bills, utility payments (e.g. "E-Bill for JioFiber", "ALERT! Bill Payment Overdue").
- Shopping/Receipts: Actual order receipts or item delivery confirmations (Amazon, Flipkart, Swiggy order receipts).
- Shopping/Shipping: Physical package tracking or shipment updates (e.g. Amazon "Shipped: Nivia...", "Dispatched").
- Finance/Banking: Bank statements, NEFT transactions, credit card alerts.
- Security/OTP: OTP codes, 2FA verification.
- Security/Alerts: Password reset requests, login attempt alerts, security alerts.

Email to classify:
From: ${from}
Subject: ${subject}
Snippet: ${snippet}

Return ONLY the single exact label string. Do not include quotes or extra text.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };

  try {
    const res = UrlFetchApp.fetch(url, {
      method: "POST",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    const json = JSON.parse(res.getContentText());
    if (json.candidates && json.candidates[0] && json.candidates[0].content) {
      const result = json.candidates[0].content.parts[0].text.trim().replace(/^["']|["']$/g, '');
      if (DEFAULT_TAXONOMY.includes(result)) {
        return result;
      }
    }
  } catch (e) {
    console.log("Gemini AI error: " + e.toString());
  }
  return null;
}
