// ======================================================================
// STANDALONE GMAIL INBOX ANALYZER & PARENT/CHILD LABEL CREATOR
// Target: ankurr.era@gmail.com
// ======================================================================

const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";
const BATCH_SIZE = 50;

/**
 * Ideal Taxonomy Candidates (ONLY created if actual emails match!)
 */
const DEFAULT_TAXONOMY = [
  "Jobs/Applied",
  "Jobs/Interview",
  "Jobs/Rejected",
  "Jobs/Job Offer",
  "Jobs/Alerts",
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
  "Travel/Bookings",
  "Work/General",
  "Personal/General"
];

// In-Memory Cache for Gmail Label Objects
const labelCache = {};

/**
 * LAZY LABEL CREATOR: Creates parent/child labels ONLY ON-DEMAND
 * when an actual email needs to be labeled. Zero empty labels created!
 */
function getCachedLabel(labelName) {
  if (labelCache[labelName]) {
    return labelCache[labelName];
  }

  const parts = labelName.split("/");
  const parentGroup = parts[0];

  // Ensure Parent Label exists when assigning
  if (!GmailApp.getUserLabelByName(parentGroup)) {
    GmailApp.createLabel(parentGroup);
    console.log(`📁 Created Parent Label Group on demand: [${parentGroup}]`);
  }

  // Ensure Child Label exists when assigning
  let label = GmailApp.getUserLabelByName(labelName);
  if (!label) {
    label = GmailApp.createLabel(labelName);
    console.log(` └─ 🏷️ Created Child Label on demand: [${labelName}]`);
  }

  labelCache[labelName] = label;
  return label;
}

// ======================================================================
// STEP 1: ANALYZE ALL 2000+ INBOX EMAILS & DISCOVER ACTIVE CATEGORIES
// ======================================================================

/**
 * Scans all inbox emails, identifies ACTIVE categories with real content,
 * and creates ONLY the labels that are actually used by your emails.
 */
function analyzeInboxAndCreateLabels() {
  console.log("🚀 Starting analysis of 2,000+ inbox emails to discover active categories...");

  const domainFrequency = {};
  const activeCategoryCounts = {};
  let totalScanned = 0;
  let start = 0;
  const batchSize = 100;
  const maxEmailsToScan = 2500;

  // -------------------------------------------------------------------
  // 1. SCAN INBOX CORPUS & CLASSIFY IN MEMORY (Zero Label Creation)
  // -------------------------------------------------------------------
  try {
    while (start < maxEmailsToScan) {
      const threads = GmailApp.search("in:inbox", start, batchSize);
      if (!threads || threads.length === 0) break;

      for (let i = 0; i < threads.length; i++) {
        const messages = threads[i].getMessages();
        if (!messages || messages.length === 0) continue;

        const firstMsg = messages[0];
        const lastMsg = messages[messages.length - 1];

        const subject = firstMsg.getSubject() || "";
        const from = firstMsg.getFrom() || "";
        const snippet = firstMsg.getSnippet() || "";
        const body = lastMsg.getPlainBody() || snippet;

        // Extract sender domain
        const domainMatch = from.match(/@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (domainMatch && domainMatch[1]) {
          const domain = domainMatch[1].toLowerCase();
          domainFrequency[domain] = (domainFrequency[domain] || 0) + 1;
        }

        // Categorize in memory to find active categories with contents
        let category = categorizeByRules(from, subject, body);

        if (!category && GEMINI_API_KEY && GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY") {
          category = categorizeWithGemini(from, subject, snippet);
        }

        if (category) {
          activeCategoryCounts[category] = (activeCategoryCounts[category] || 0) + 1;
        }

        totalScanned++;
      }

      start += batchSize;
      console.log(`📊 Analyzed ${totalScanned} threads in memory...`);
    }
  } catch (e) {
    if (e.toString().includes("Service invoked too many times")) {
      console.warn("⚠️ Gmail Daily Quota Exceeded during scan.");
      console.warn("⏰ Daily quota resets at 12:00 AM PST. Please pause any 5-minute triggers until reset.");
    } else {
      console.error("Scan error: " + e.toString());
    }
  }

  // Get Top Sender Domains
  const topDomains = Object.keys(domainFrequency)
    .sort((a, b) => domainFrequency[b] - domainFrequency[a])
    .slice(0, 25);

  console.log(`\n✅ Corpus Analysis Complete! Analyzed ${totalScanned} inbox threads.`);
  if (topDomains.length > 0) {
    console.log("Top Sender Domains Found:\n" + topDomains.join(", "));
  }

  // -------------------------------------------------------------------
  // 2. CREATE ONLY LABELS THAT HAVE MATCHING CONTENT (Zero Empty Labels!)
  // -------------------------------------------------------------------
  const activeCategories = Object.keys(activeCategoryCounts);
  console.log(`\n⚙️ Discovered ${activeCategories.length} active categories with email contents:`);

  if (activeCategories.length === 0) {
    console.log("ℹ️ No active categories found or daily API quota is limit reached. No empty labels created.");
    return;
  }

  let createdCount = 0;
  try {
    for (let i = 0; i < activeCategories.length; i++) {
      const cat = activeCategories[i];
      const count = activeCategoryCounts[cat];
      
      // ONLY create if label has 1 or more emails!
      if (count > 0) {
        getCachedLabel(cat);
        console.log(` └─ 🏷️ Created Label [${cat}] -> (${count} emails ready to label)`);
        createdCount++;
      }
    }
    console.log(`\n🎉 SUCCESS! Created ONLY the ${createdCount} active label trees that have actual email contents.`);
  } catch (err) {
    if (err.toString().includes("Service invoked too many times")) {
      console.warn("⚠️ Label creation paused due to Google daily quota limit.");
    } else {
      console.error("Label creation error: " + err.toString());
    }
  }
}

/**
 * CLEANUP UTILITY: Removes old flat labels
 */
function cleanOldFlatLabels() {
  const flatLabelsToRemove = ["Work", "Newsletter", "Notification", "Receipt", "Marketing"];
  console.log("🧹 Starting cleanup of old flat labels...");

  for (let i = 0; i < flatLabelsToRemove.length; i++) {
    const labelName = flatLabelsToRemove[i];
    const label = GmailApp.getUserLabelByName(labelName);
    if (label) {
      console.log(`Removing old flat label: [${labelName}]...`);
      const threads = label.getThreads(0, 100);
      if (threads && threads.length > 0) {
        label.removeFromThreads(threads);
        console.log(` Removed label [${labelName}] from ${threads.length} threads.`);
      }
    }
  }
  console.log("✅ Cleanup complete! Ready for fresh Parent/Child categorization.");
}

// ======================================================================
// AUTO-LABELING ENGINE (BATCH PROCESSOR)
// ======================================================================

/**
 * Runs auto-labeling on unlabeled inbox threads using batch processing.
 */
function fixAndLabelInbox() {
  try {
    const threads = GmailApp.search("in:inbox -has:userlabel", 0, BATCH_SIZE);
    console.log(`🔍 Found ${threads.length} unlabeled inbox threads to process...`);

    if (threads.length === 0) {
      console.log("🎉 No unlabeled threads found! All inbox emails are up to date.");
      return;
    }

    const categoryMap = {};

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

      let category = categorizeByRules(from, subject, body);

      if (!category && GEMINI_API_KEY && GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY") {
        category = categorizeWithGemini(from, subject, snippet);
      }

      if (!category) {
        category = "Updates/Notifications";
      }

      if (!categoryMap[category]) {
        categoryMap[category] = [];
      }
      categoryMap[category].push(thread);
    }

    let totalLabeled = 0;
    for (const categoryName in categoryMap) {
      const targetThreads = categoryMap[categoryName];
      if (!targetThreads || targetThreads.length === 0) continue;

      // Label is fetched or created ON DEMAND ONLY when threads exist
      const label = getCachedLabel(categoryName);
      label.addToThreads(targetThreads);
      totalLabeled += targetThreads.length;
      console.log(`🏷️ Batch labeled ${targetThreads.length} threads as "${categoryName}".`);
    }

    console.log(`✅ Successfully processed and batch-labeled ${totalLabeled} threads in this run.`);

  } catch (err) {
    if (err.toString().includes("Service invoked too many times")) {
      console.warn("⚠️ Gmail daily API quota reached for today. Will resume automatically once Google resets daily limits.");
    } else {
      console.error("Error in fixAndLabelInbox: " + err.toString());
      throw err;
    }
  }
}

/**
 * Rule-Based Fast Categorization Engine
 */
function categorizeByRules(from, subject, body) {
  const text = (from + " " + subject + " " + body).toLowerCase();
  const senderLower = from.toLowerCase();

  const isJobPlatform = senderLower.includes("greenhouse.io") ||
                        senderLower.includes("lever.co") ||
                        senderLower.includes("workday.com") ||
                        senderLower.includes("myworkday") ||
                        senderLower.includes("ashbyhq.com") ||
                        senderLower.includes("smartrecruiters.com") ||
                        senderLower.includes("bamboohr.com") ||
                        senderLower.includes("icims.com") ||
                        senderLower.includes("jobvite.com") ||
                        senderLower.includes("linkedin.com") ||
                        senderLower.includes("naukri.com") ||
                        senderLower.includes("glassdoor.com") ||
                        senderLower.includes("indeed.com") ||
                        senderLower.includes("hirist") ||
                        senderLower.includes("foundit") ||
                        senderLower.includes("unstop.com");

  // Rejection Emails
  if (text.includes("unfortunately") ||
      text.includes("regret to inform") ||
      text.includes("not moving forward") ||
      text.includes("decided to pursue other candidates") ||
      text.includes("not selected for this role") ||
      text.includes("position has been filled")) {
    return "Jobs/Rejected";
  }

  // Offers
  if (text.includes("job offer") || text.includes("offer letter") || text.includes("pleased to offer you")) {
    return "Jobs/Job Offer";
  }

  // Interview Invites
  if (text.includes("interview") ||
      text.includes("schedule a call") ||
      text.includes("coding assessment") ||
      text.includes("technical round") ||
      text.includes("hiring manager") ||
      text.includes("calendly.com") ||
      text.includes("hackerrank") ||
      text.includes("codesignal")) {
    return "Jobs/Interview";
  }

  // Applied
  if (text.includes("application received") ||
      text.includes("thank you for applying") ||
      text.includes("application submitted") ||
      text.includes("successful application")) {
    return "Jobs/Applied";
  }

  // Alerts
  if (text.includes("matching jobs") || text.includes("job alert") || text.includes("recommended jobs")) {
    return "Jobs/Alerts";
  }

  if (isJobPlatform) {
    return "Jobs/Applied";
  }

  // Shopping & Purchases
  if (text.includes("amazon") || text.includes("flipkart") || text.includes("swiggy") || text.includes("zomato") || text.includes("order placed") || text.includes("order summary")) {
    return "Shopping/Receipts";
  }

  if (text.includes("shipped") || text.includes("out for delivery") || text.includes("tracking number") || text.includes("dispatched")) {
    return "Shopping/Shipping";
  }

  // Finance
  if (text.includes("receipt") || text.includes("payment confirmation") || text.includes("razorpay") || text.includes("stripe") || text.includes("paypal")) {
    return "Shopping/Receipts";
  }

  if (text.includes("invoice") || text.includes("bill due") || text.includes("tax invoice")) {
    return "Shopping/Invoices";
  }

  if (text.includes("bank") || text.includes("account statement") || text.includes("debit card") || text.includes("credit card")) {
    return "Finance/Banking";
  }

  // Security & OTP
  if (text.includes("verification code") || text.includes("one-time password") || text.includes("otp") || text.includes("your code is")) {
    return "Security/OTP";
  }

  if (text.includes("security alert") || text.includes("password reset") || text.includes("login attempt") || text.includes("sign-in from")) {
    return "Security/Alerts";
  }

  // Travel
  if (text.includes("booking confirmed") || text.includes("ticket") || text.includes("irctc") || text.includes("flight") || text.includes("makemytrip") || text.includes("uber")) {
    return "Travel/Bookings";
  }

  // Newsletters
  if (text.includes("newsletter") || text.includes("substack.com") || text.includes("medium.com") || text.includes("unsubscribe")) {
    return "Subscriptions/Newsletters";
  }

  return null;
}

/**
 * Gemini AI Categorization
 */
function categorizeWithGemini(from, subject, snippet) {
  const taxonomyList = DEFAULT_TAXONOMY.join(", ");
  const prompt = `Categorize this email into EXACTLY ONE of these labels: ${taxonomyList}

Email:
From: ${from}
Subject: ${subject}
Snippet: ${snippet}

Return ONLY the single exact label string.`;

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
      return json.candidates[0].content.parts[0].text.trim().replace(/^["']|["']$/g, '');
    }
  } catch (e) {
    console.log("Gemini AI error: " + e.toString());
  }
  return null;
}
