# Gmail Auto-Labeler & Inbox Corpus Analyzer Engine

An automated Google Apps Script project for **ankurr.era@gmail.com** that analyzes 2,000+ inbox emails, generates personalized parent-child label structures, and labels your entire inbox using a hybrid rule-matching engine + Gemini 2.0 Flash AI fallback.

---

## 🚀 Features

- **Inbox Corpus Analysis (`analyzeInboxAndSuggestTaxonomy`)**: Scans 2,000+ inbox email threads, extracts top sender domains and subject patterns, and uses Gemini AI to analyze your corpus and propose a customized Parent/Child label hierarchy.
- **Parent/Child Nested Label Hierarchy (`setupTaxonomyLabels`)**: Automatically creates nested label structures in Gmail (`Jobs/Applied`, `Jobs/Interview`, `Jobs/Rejected`, `Finance/Receipts`, `Finance/Invoices`, `Updates/Security`, `Subscriptions/Newsletters`).
- **Missing Emails Fix**: Replaces index offset pagination with query-based processing (`in:inbox -has:userlabel`) so **100% of inbox emails** are categorized without skipping moved/labeled threads.
- **Hybrid Rule + AI Engine**: Instant domain-based, regex-based, and keyword classification with Gemini 2.0 Flash fallback for complex or uncategorized emails.

---

## ⚙️ Setup & Workflow Guide

### Step 1: Add Script & Configure Gemini Key
1. Copy the updated code from [Code.gs](file:///Users/zen/Documents/GitHub/google-apps-script-automations/gmail-auto-labeler/Code.gs) into your Google Apps Script editor ([script.google.com](https://script.google.com)).
2. Replace `"YOUR_GEMINI_API_KEY"` at the top of `Code.gs` with your Gemini API key.

---

### Step 2: Analyze Your Inbox Corpus
1. In the Apps Script dropdown, select `analyzeInboxAndSuggestTaxonomy` and click **Run**.
2. Open **Execution Log** (`Ctrl + Enter` or `Cmd + Enter`).
3. Review your **Top Sender Domains**, **Subject Clusters**, and **Gemini AI Recommended Taxonomy**.

---

### Step 3: Setup Gmail Parent/Child Labels
1. Select `setupTaxonomyLabels` and click **Run**.
2. This creates all parent and child label trees directly in your Gmail account.

---

### Step 4: Run Auto-Labeler & Set 5-Minute Trigger
1. Select `fixAndLabelInbox` and click **Run** to test a batch of 50 inbox emails.
2. Set up a **Time-Driven Trigger** to auto-process all 2,000+ emails in the background:
   - Click the ⏰ **Triggers** icon in the left sidebar.
   - Click **+ Add Trigger**.
   - Select function: `fixAndLabelInbox`.
   - Select event source: **Time-driven**.
   - Type of time based trigger: **Minutes timer**.
   - Select minute interval: **Every 5 minutes**.
