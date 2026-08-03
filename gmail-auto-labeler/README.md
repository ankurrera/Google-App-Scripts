# Gmail Auto-Labeler & Inbox Cleaner Engine

An automated Google Apps Script project for **ankurr.era@gmail.com** that categorizes, labels, and cleans 2,000+ inbox emails using a hybrid rule-matching engine + Gemini AI fallback.

## 🚀 Features

- **Hybrid Classification**: Instant rule-based categorizer for rejections, interview invites, job applications, digests, receipts, and notifications + Gemini 2.0 Flash AI fallback for complex emails.
- **PropertiesService Auto-Paging**: Pages through 50 threads per run, saving the progress offset in `INDEX` so triggers scan through thousands of historical emails automatically.
- **Nested Labels**: Supports nested labels like `Jobs/Applied`, `Jobs/Interview`, `Jobs/Rejected`, `Jobs/Job Offer`.

## ⚙️ Setup & Deployment

1. Go to [script.google.com](https://script.google.com) and paste `Code.gs`.
2. Save the script (💾).
3. Set a **Time-driven trigger** on `fixAndLabelInbox`:
   - Event Source: Time-driven
   - Type: Minutes timer $\rightarrow$ Every 5 minutes.
