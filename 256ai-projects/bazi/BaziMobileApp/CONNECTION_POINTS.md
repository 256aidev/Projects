# BaZi Astrology App - Connection Points & Configuration Guide

This document lists all API keys, secrets, and configuration points that need to be set up for the app to function properly in production.

---

## Quick Reference: Files Requiring Configuration

| File | Configuration Needed | Status |
|------|---------------------|--------|
| `src/purchases/purchaseService.ts` | RevenueCat API Keys | Placeholder |
| `src/components/ads/AdBanner.tsx` | Google AdMob Banner Ad Unit IDs | Placeholder |
| `src/components/ads/InterstitialManager.ts` | Google AdMob Interstitial Ad Unit IDs | Placeholder |
| `app.json` | Google AdMob App IDs | Test IDs |
| `src/api/client.ts` | Backend API URL | https://256ai.xyz |
| `src/api/forecasts.ts` | Mock Data Toggle | Mock enabled |

---

## CREDENTIALS & ACCOUNTS (TEMPLATE)

> **SECURITY WARNING**: Never commit actual credentials to version control. Store production credentials in a secure password manager or secrets management system.

### Service Accounts

| Service | URL | Email/Username | Notes |
|---------|-----|----------------|-------|
| RevenueCat | https://app.revenuecat.com | `_______________` | In-app purchases |
| Google AdMob | https://admob.google.com | `_______________` | Advertisement platform |
| App Store Connect | https://appstoreconnect.apple.com | `_______________` | iOS app distribution |
| Google Play Console | https://play.google.com/console | `_______________` | Android app distribution |
| Apple Developer | https://developer.apple.com | `_______________` | iOS development |
| Google Cloud Console | https://console.cloud.google.com | `_______________` | Google Sign-In OAuth |
| Backend API | https://256ai.xyz | `_______________` | BaZi API server |

### API Keys (KEEP SECURE)

| Service | Key Type | Value | File Location |
|---------|----------|-------|---------------|
| RevenueCat iOS | Public API Key | `appl_____________` | `purchaseService.ts:15` |
| RevenueCat Android | Public API Key | `goog_____________` | `purchaseService.ts:16` |
| AdMob iOS App ID | App ID | `ca-app-pub-____~____` | `app.json` |
| AdMob Android App ID | App ID | `ca-app-pub-____~____` | `app.json` |
| AdMob iOS Banner | Ad Unit ID | `ca-app-pub-____/____` | `AdBanner.tsx:20` |
| AdMob Android Banner | Ad Unit ID | `ca-app-pub-____/____` | `AdBanner.tsx:21` |
| AdMob iOS Interstitial | Ad Unit ID | `ca-app-pub-____/____` | `InterstitialManager.ts:18` |
| AdMob Android Interstitial | Ad Unit ID | `ca-app-pub-____/____` | `InterstitialManager.ts:19` |

### Shared Secrets

| Service | Secret Type | Notes |
|---------|-------------|-------|
| App Store Connect | App-Specific Shared Secret | Upload to RevenueCat |
| Google Play | Service Account JSON | Upload to RevenueCat |

### Test Accounts

| Platform | Email | Password | Notes |
|----------|-------|----------|-------|
| iOS Sandbox Tester | `_______________` | `________` | App Store Connect → Sandbox |
| Android License Tester | `_______________` | N/A | Google Play Console → License Testing |

---

## 1. RevenueCat (In-App Purchases)

### File: `src/purchases/purchaseService.ts`
**Lines 15-16**

```typescript
// REPLACE THESE WITH YOUR ACTUAL REVENUECAT API KEYS
const REVENUECAT_API_KEY_IOS = 'appl_YOUR_REVENUECAT_IOS_KEY';
const REVENUECAT_API_KEY_ANDROID = 'goog_YOUR_REVENUECAT_ANDROID_KEY';
```

### How to Get Keys:
1. Create account at https://www.revenuecat.com
2. Create project "BaZi Astrology"
3. Add iOS app with bundle ID: `com.baziastrology.app`
4. Add Android app with package name: `com.baziastrology.app`
5. Go to Project Settings → API Keys
6. Copy the **Public App-Specific API Keys** (NOT the secret key)

### RevenueCat Dashboard Configuration Required:

#### Entitlements (Create these in dashboard):
| Entitlement ID | Description |
|----------------|-------------|
| `future_7_day` | Unlock 7-day future readings |
| `weekly_forecast` | Unlock weekly forecast (basic) |
| `monthly_forecast` | Unlock monthly forecast |
| `yearly_forecast` | Unlock yearly forecast |
| `remove_ads` | Remove all advertisements |
| `premium_annual` | **BEST VALUE** - Unlocks ALL features above + Four Pillars weekly analysis |

#### Products (Link to store products):
| Product ID | Price | Type | Billing | Notes |
|------------|-------|------|---------|-------|
| `com.baziastrology.future7day` | $0.99 | Non-Consumable | One-time | 7-day future readings |
| `com.baziastrology.weekly` | $0.99 | **Auto-Renewable Subscription** | Per week | Weekly forecast - $51.48/year |
| `com.baziastrology.monthly` | $0.99 | **Auto-Renewable Subscription** | Per month | Monthly forecast - $11.88/year |
| `com.baziastrology.yearly` | $0.99 | **Auto-Renewable Subscription** | Per year | Yearly forecast - $0.99/year |
| `com.baziastrology.removeads` | $1.99 | Non-Consumable | One-time | Remove ads only |
| `com.baziastrology.premium` | $4.99 | **Auto-Renewable Subscription** | Per year | **Best Value** - Unlocks everything (92%+ savings) |

**Subscription Value Proposition:**
- Weekly alone: $51.48/year
- Monthly alone: $11.88/year
- Weekly + Monthly: $63.36/year
- **Premium Annual: $4.99/year** = 92%+ savings vs individual subscriptions

#### Offerings:
- Create a "default" offering containing all 6 products
- Consider creating a "premium" offering highlighting the annual subscription

---

## 2. Google AdMob (Advertisements)

### File: `app.json` (Expo Plugin Config)
**Lines 29-36** - App-level IDs (currently using test IDs)

```json
"plugins": [
  [
    "react-native-google-mobile-ads",
    {
      "androidAppId": "ca-app-pub-XXXXX~YYYYY",  // Replace with production ID
      "iosAppId": "ca-app-pub-XXXXX~YYYYY"       // Replace with production ID
    }
  ]
]
```

### File: `src/components/ads/AdBanner.tsx`
**Lines 17-22** - Banner Ad Unit IDs

```typescript
// REPLACE WITH YOUR PRODUCTION BANNER AD UNIT IDs
const BANNER_AD_UNIT_ID = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : Platform.select({
      ios: 'ca-app-pub-XXXXX/YYYYY',     // Replace with production ID
      android: 'ca-app-pub-XXXXX/YYYYY', // Replace with production ID
    }) || TestIds.ADAPTIVE_BANNER;
```

### File: `src/components/ads/InterstitialManager.ts`
**Lines 14-20** - Interstitial Ad Unit IDs

```typescript
// REPLACE WITH YOUR PRODUCTION INTERSTITIAL AD UNIT IDs
const INTERSTITIAL_AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : Platform.select({
      ios: 'ca-app-pub-XXXXX/YYYYY',     // Replace with production ID
      android: 'ca-app-pub-XXXXX/YYYYY', // Replace with production ID
    }) || TestIds.INTERSTITIAL;
```

### How to Get AdMob IDs:
1. Create account at https://admob.google.com
2. Add iOS and Android apps
3. Create ad units:
   - Banner ad unit (for AdBanner.tsx)
   - Interstitial ad unit (for InterstitialManager.ts)
4. Copy the App IDs to app.json
5. Copy the Ad Unit IDs to the respective files

---

## 3. Backend API

### File: `src/api/client.ts`
**Line 8** (approximate)

```typescript
const API_BASE_URL = 'https://your-api-domain.com/api';  // Update for production
```

### Endpoints Used:
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | User login |
| `/auth/register` | POST | User registration |
| `/auth/google` | POST | Google Sign-In |
| `/auth/apple` | POST | Apple Sign-In |
| `/daily/{userId}` | GET | Today's reading |
| `/daily/{userId}/{date}` | GET | Specific date reading |
| `/users/{userId}` | GET/PUT | User profile |
| `/users/{userId}/preferences` | PUT | User preferences |
| `/family/{userId}` | GET/POST | Family members |
| `/family/{userId}/{memberId}` | GET/PUT/DELETE | Specific member |
| `/forecasts/monthly/{userId}` | GET | Monthly forecast |
| `/forecasts/yearly/{userId}` | GET | Yearly forecast |

---

## 4. Mock Data Toggle

### File: `src/api/forecasts.ts`
**Line 9**

```typescript
// Set to false when backend endpoints are ready
const USE_MOCK_DATA = true;
```

When set to `true`, monthly and yearly forecasts use mock data.
Set to `false` when backend `/forecasts/monthly` and `/forecasts/yearly` endpoints are implemented.

---

## 5. App Store Configuration

### Apple App Store Connect

#### In-App Purchases to Create:
| Reference Name | Product ID | Type | Price | Duration |
|----------------|------------|------|-------|----------|
| Future 7 Day | `com.baziastrology.future7day` | Non-Consumable | $0.99 | One-time |
| Weekly Forecast | `com.baziastrology.weekly` | Auto-Renewable Subscription | $0.99 | 1 week |
| Monthly Forecast | `com.baziastrology.monthly` | Auto-Renewable Subscription | $0.99 | 1 month |
| Yearly Forecast | `com.baziastrology.yearly` | Auto-Renewable Subscription | $0.99 | 1 year |
| Remove Ads | `com.baziastrology.removeads` | Non-Consumable | $1.99 | One-time |
| Premium Annual | `com.baziastrology.premium` | Auto-Renewable Subscription | $4.99 | 1 year |

**Subscription Group:** Create a single subscription group called "Forecasts" for all subscription products.

#### Shared Secret:
1. App Store Connect → Your App → App Information
2. Generate App-Specific Shared Secret
3. Paste into RevenueCat dashboard

#### Sandbox Testing:
1. App Store Connect → Users and Access → Sandbox Testers
2. Create sandbox test accounts

### Google Play Console

#### In-App Products to Create:
Same product IDs as iOS (listed above)

#### Service Account:
1. Google Cloud Console → Create Service Account
2. Grant "Pub/Sub Admin" and "Play Android Developer" roles
3. Download JSON key file
4. Upload to RevenueCat dashboard

#### License Testing:
1. Google Play Console → Setup → License Testing
2. Add test email addresses

---

## 6. Social Authentication

### File: `app.json` (iOS plist config - if using native modules)

#### Google Sign-In:
- Requires: `GOOGLE_CLIENT_ID` (iOS URL scheme)
- Configure in Google Cloud Console → APIs & Credentials

#### Apple Sign-In:
- Requires: Apple Developer account membership
- Enable Sign In with Apple capability in Xcode
- Configure in Apple Developer Portal

---

## 7. Connection Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              APP STARTUP                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  App.tsx                                                                     │
│  └─ AuthProvider (src/auth/AuthContext.tsx)                                 │
│      └─ PurchaseProvider (src/purchases/PurchaseContext.tsx)                │
│          └─ RootNavigator                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
              ┌─────────────────────┴─────────────────────┐
              ▼                                           ▼
┌──────────────────────────┐                ┌──────────────────────────┐
│    NOT AUTHENTICATED     │                │      AUTHENTICATED        │
│    AuthNavigator         │                │      MainTabs             │
│    ├─ LoginScreen        │                │      ├─ Readings          │
│    └─ RegisterScreen     │                │      ├─ Profile           │
└──────────────────────────┘                │      ├─ Calendar          │
                                            │      └─ Settings          │
                                            └──────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         PURCHASE FLOW                                        │
└─────────────────────────────────────────────────────────────────────────────┘

User Action                  Component                      Service
─────────────────────────────────────────────────────────────────────────────
Tap "Unlock 7 Days"    →    ReadingsScreen.tsx       →
                                   │
                                   ▼
                            usePurchases() hook      →    PurchaseContext.tsx
                                   │
                                   ▼
                            purchaseProduct()        →    purchaseService.ts
                                   │
                                   ▼
                            RevenueCat SDK           →    App Store / Play Store
                                   │
                                   ▼
                            CustomerInfo updated     ←    (Purchase completed)
                                   │
                                   ▼
                            parsePurchaseState()     →    Updates state flags
                                   │
                                   ▼
                            UI re-renders with       →    Content unlocked
                            hasFuture7Day = true

┌─────────────────────────────────────────────────────────────────────────────┐
│                           AD FLOW                                            │
└─────────────────────────────────────────────────────────────────────────────┘

Purchase State               Component                      Action
─────────────────────────────────────────────────────────────────────────────
hasRemoveAds = false   →    AdBanner.tsx             →    Shows banner ad
hasRemoveAds = true    →    AdBanner.tsx             →    Returns null (no ad)

hasRemoveAds change    →    PurchaseContext.tsx      →    interstitialManager
                                   │                        .setAdsRemoved(true)
                                   ▼
                            InterstitialManager.ts    →    Stops loading/showing ads
```

---

## 8. File Dependencies Map

### Purchase System
```
App.tsx
└── src/purchases/PurchaseContext.tsx
    ├── src/purchases/purchaseService.ts (RevenueCat SDK)
    │   └── src/types/purchases.ts (PRODUCT_IDS, types)
    ├── src/auth/AuthContext.tsx (user ID for RevenueCat)
    └── src/components/ads/InterstitialManager.ts (ad removal sync)
```

### Screens Using Purchases
```
src/screens/readings/ReadingsScreen.tsx
├── usePurchases() → hasFuture7Day, hasMonthlyForecast, hasYearlyForecast
├── purchaseProduct() → trigger purchases
└── AdBanner → respects hasRemoveAds

src/screens/main/SettingsScreen.tsx
├── usePurchases() → hasRemoveAds
├── purchaseProduct(REMOVE_ADS) → buy ad removal
└── restorePurchases() → restore previous purchases
```

### Ad Components
```
src/components/ads/AdBanner.tsx
├── usePurchases() → hasRemoveAds
└── BannerAd (react-native-google-mobile-ads)

src/components/ads/InterstitialManager.ts
├── adsRemoved flag (synced from PurchaseContext)
└── InterstitialAd (react-native-google-mobile-ads)

Usage:
└── src/navigation/MainTabs.tsx → interstitialManager.show() on Calendar
```

---

## 9. Environment Variables Template

Create a `.env` file (not committed to git) for development:

```bash
# RevenueCat
REVENUECAT_API_KEY_IOS=appl_xxxxxxxxxxxx
REVENUECAT_API_KEY_ANDROID=goog_xxxxxxxxxxxx

# Google AdMob
ADMOB_APP_ID_IOS=ca-app-pub-xxxxxxxxxx~yyyyyyyyyy
ADMOB_APP_ID_ANDROID=ca-app-pub-xxxxxxxxxx~yyyyyyyyyy
ADMOB_BANNER_ID_IOS=ca-app-pub-xxxxxxxxxx/yyyyyyyyyy
ADMOB_BANNER_ID_ANDROID=ca-app-pub-xxxxxxxxxx/yyyyyyyyyy
ADMOB_INTERSTITIAL_ID_IOS=ca-app-pub-xxxxxxxxxx/yyyyyyyyyy
ADMOB_INTERSTITIAL_ID_ANDROID=ca-app-pub-xxxxxxxxxx/yyyyyyyyyy

# Backend API
API_BASE_URL=https://api.baziastrology.com
```

**Note**: You would need to add a package like `react-native-dotenv` and update the code to read from environment variables for this to work.

---

## 10. Checklist Before Production

- [ ] RevenueCat iOS API key configured
- [ ] RevenueCat Android API key configured
- [ ] RevenueCat entitlements created (4)
- [ ] RevenueCat products created (4)
- [ ] RevenueCat default offering created
- [ ] App Store in-app purchases created and approved
- [ ] App Store shared secret added to RevenueCat
- [ ] Google Play in-app products created
- [ ] Google Play service account JSON uploaded to RevenueCat
- [ ] AdMob iOS app ID in app.json
- [ ] AdMob Android app ID in app.json
- [ ] AdMob banner ad unit IDs in AdBanner.tsx
- [ ] AdMob interstitial ad unit IDs in InterstitialManager.ts
- [ ] Backend API URL updated for production
- [ ] `USE_MOCK_DATA` set to `false` in forecasts.ts (when backend ready)
- [ ] Sandbox testing completed on iOS
- [ ] License testing completed on Android
- [ ] Test purchases verified end-to-end

---

## Quick Links

- RevenueCat Dashboard: https://app.revenuecat.com
- AdMob Console: https://admob.google.com
- App Store Connect: https://appstoreconnect.apple.com
- Google Play Console: https://play.google.com/console
- RevenueCat Docs: https://docs.revenuecat.com
- Google Mobile Ads RN: https://docs.page/invertase/react-native-google-mobile-ads
