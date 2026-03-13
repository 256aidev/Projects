# 256AI Marketing Engine — Plan

## Overview

Full-funnel marketing engine for 256AI apps, starting with **BaZi Astrology** (live on App Store). Budget: $500+/mo on Google Ads, scaling to future apps (MyEmpire, ChoreQuest, etc.).

## Architecture

```
Wife's PC (Marketing Station)
    ├── Claude Code (for iterating on campaigns)
    ├── Marketing Dashboard (local web UI)
    └── Google Ads API scripts
            │
            ▼
    256ai.xyz (Cloudflare Pages)
    ├── / (256ai home — with GA4)
    ├── /bazi/ (BaZi landing page)
    ├── /bazi/download (redirect → App Store)
    └── /api/ (Cloudflare Worker for email capture)
            │
            ▼
    Google Ads Account (256ai)
    ├── Search campaigns (BaZi keywords)
    ├── App campaigns (iOS installs)
    └── Display campaigns (retargeting)
```

## Phase 1: Landing Pages + Analytics ✅ IN PROGRESS

### 1.1 BaZi Landing Page (`256ai-site/bazi/index.html`) ✅ DONE
- Hero with value prop + "Download Free" CTA
- Feature highlights (Four Pillars, Daily Forecasts, AI-Powered, Feng Shui)
- Social proof section (testimonials)
- Email capture form
- App Store links with UTM parameters (`utm_source=website&utm_medium=landing&utm_campaign=bazi_main`)
- Apple Smart App Banner meta tag
- Mobile-optimized responsive design

### 1.2 Analytics Setup — NEEDS USER INPUT
- Add Google Analytics 4 (GA4) to all 256ai.xyz pages
- GA4 property ID needed (create at analytics.google.com)
- Conversion events: `app_store_click`, `email_signup`
- Link GA4 to Google Ads for conversion tracking
- Google Ads conversion tracking pixel

### 1.3 Email Capture Backend — TODO
- Cloudflare Worker function at `/api/subscribe`
- Store emails in Cloudflare KV (free tier)
- Simple POST endpoint, JSON body `{ email, source }`
- Cloudflare API token needed

### 1.4 App Store Smart Banner ✅ DONE
- Apple Smart App Banner meta tag added to BaZi landing page
- Auto-shows "Open in App Store" on iOS Safari

## Phase 2: Google Ads Campaigns — TODO

### 2.1 Campaign Structure
- **Search Campaign**: Keywords — "chinese astrology app", "bazi calculator", "daily horoscope", "feng shui app"
- **App Campaign (UAC)**: Let Google optimize for iOS installs
- **Display/Discovery**: Retarget landing page visitors
- Daily budget: ~$17/day ($500/mo)

### 2.2 Ad Copy Generator (`marketing-engine/ad-generator/`)
- Python script using Claude API to generate ad variations
- Input: app description, target audience, USPs
- Output: Google Ads responsive search ad components (headlines, descriptions)
- A/B test tracking

### 2.3 Google Ads API Integration (`marketing-engine/ads-api/`)
- Python scripts using `google-ads` library
- Functions: create campaigns, update budgets, pause/resume, pull reports
- Daily report: spend, impressions, clicks, installs, CPA
- Alert if CPA exceeds threshold
- Needs: Google Ads account ID, API developer token (apply at ads.google.com/aw/apicenter)

## Phase 3: Dashboard + A/B Testing — TODO

### 3.1 Marketing Dashboard
- Simple local web UI (HTML + JS or React)
- Shows: daily spend, clicks, conversions, CPA, ROAS
- Pulls from Google Ads API + GA4
- Campaign controls (pause, budget adjust)

### 3.2 A/B Testing
- Landing page variants via URL params (?v=a, ?v=b)
- Track conversion rate per variant in GA4
- Ad copy rotation managed by Google Ads (built-in)

## File Structure

```
C:\Projects\256ai-site/                    (Cloudflare Pages)
├── index.html                              (home — add GA4)
├── bazi/
│   └── index.html                          ✅ BaZi landing page
├── api/
│   └── subscribe.js                        TODO: Cloudflare Worker
└── styles.css                              (shared styles)

C:\Projects\256ai-projects\marketing-engine/
├── PLAN.md                                 ✅ This file
├── requirements.txt                        TODO
├── .env                                    TODO (API keys — git ignored)
├── ad-generator/
│   ├── generate_ads.py                     TODO
│   └── templates/                          TODO
├── ads-api/
│   ├── setup_campaign.py                   TODO
│   ├── reports.py                          TODO
│   └── manage.py                           TODO
└── dashboard/
    ├── index.html                          TODO
    └── app.py                              TODO
```

## Prerequisites (Need from User)

- [ ] Google Ads account ID (from existing 256ai account)
- [ ] Google Ads API developer token (apply at ads.google.com/aw/apicenter)
- [ ] GA4 property ID (create at analytics.google.com)
- [ ] Cloudflare API token (for Worker deployment)
- [ ] Wife's PC info (hostname/IP for setup)

## Wife's PC Setup (Phase 4)

1. Install Node.js + Claude Code
2. Clone Projects repo via SSH
3. Set up Python venv for marketing-engine scripts
4. Configure Google Ads API credentials (OAuth2)
5. Train on basic Claude Code usage for campaign management

## Implementation Order

1. ✅ BaZi landing page — static HTML, deploy via git push
2. ⏳ GA4 + conversion tracking — waiting for GA4 property ID
3. ⬜ Email capture — Cloudflare Worker
4. ⬜ Google Ads API setup — OAuth2 credentials
5. ⬜ Ad copy generator — Python + Claude API
6. ⬜ First campaign — Search + App campaign, ~$17/day
7. ⬜ Dashboard — local web UI
8. ⬜ Wife's PC setup — Claude Code + repo access
9. ⬜ A/B testing — landing page variants
