# BaZi Mobile App - Project Plan

## Vision

A personalized daily astrology app using Chinese BaZi (Four Pillars of Destiny) to provide users with actionable insights based on their unique birth chart. The app delivers AI-generated daily readings, tracks auspicious timing, and helps users understand their elemental composition.

---

## Technical Architecture

### Tech Stack
- **Frontend**: React Native with Expo (v54.0.0)
- **Language**: TypeScript 5.3.0
- **Navigation**: React Navigation v6 (Stack + Bottom Tabs)
- **State Management**: React Context (AuthContext)
- **Authentication**: JWT tokens via AsyncStorage
- **Monetization**: Google Mobile Ads (Banner + Interstitial)
- **Social Auth**: Google Sign-In, Apple Authentication

### Backend API
- **Base URL**: https://256ai.xyz
- **Auth**: Bearer JWT tokens
- **Endpoints**:
  - `/register`, `/login`, `/token/social` - Authentication
  - `/users/{id}` - User profile CRUD
  - `/daily/{userId}`, `/weekly/{userId}` - Readings
  - `/users/{userId}/family` - Family members (planned)
  - `/compatibility/{userId}/{memberId}` - Compatibility readings (planned)

### Project Structure
```
src/
├── api/              # HTTP client & API functions
├── auth/             # AuthContext for global auth state
├── components/       # Reusable UI components
│   ├── ads/          # AdBanner, InterstitialManager
│   ├── bazi/         # BaZi-specific components (planned)
│   └── common/       # Shared UI components (planned)
├── navigation/       # React Navigation setup
├── screens/          # Screen components
│   ├── auth/         # Login, Register
│   ├── main/         # Home, Profile, Calendar, Settings
│   ├── onboarding/   # SocialOnboardingScreen
│   └── family/       # Family member screens (planned)
├── types/            # TypeScript interfaces
└── utils/            # Helper functions
```

---

## Feature Roadmap

### Completed Features
- [x] User registration with email/password
- [x] Social login (Google, Apple)
- [x] Birth data collection & storage
- [x] Four Pillars calculation (backend)
- [x] Daily reading generation (AI-powered)
- [x] Weekly reading generation
- [x] Profile screen with pillar visualization
- [x] Calendar screen for browsing readings
- [x] Settings screen with preferences
- [x] Chinese character translations (pinyin, elements)
- [x] Lucky hours display from readings
- [x] Banner ads integration
- [x] Interstitial ads (every 3rd Calendar visit)
- [x] Pull-to-refresh on readings

### In Progress
- [x] Family compatibility feature (UI complete, using mock data)
  - [x] Add spouse/child/parent profiles
  - [x] Remove family members with confirmation
  - [x] Compatibility readings between family members (mock)
  - [x] Full family analysis reading (mock)
  - [ ] Backend API integration (toggle USE_MOCK_DATA in src/api/family.ts)

### Recently Completed
- [x] Element Balance Chart - visual bar chart on Profile screen

### Planned Features
- [ ] Ten Gods analysis display
- [ ] Yearly forecast readings
- [ ] Push notifications for daily readings
- [ ] Offline caching of readings
- [ ] Premium subscription tier
- [ ] Multiple languages (currently English/Chinese)

---

## Color Scheme

| Use Case | Color | Hex |
|----------|-------|-----|
| Primary (headers, buttons) | Saddle Brown | #8B4513 |
| Background | Cream | #FDF5E6 |
| Accent | Gold | #D4A574 |
| Dark text | Dark Brown | #5D3A1A |
| Secondary text | Medium Brown | #8B7355 |
| Inactive | Gray | #A0A0A0 |

### Element Colors
| Element | Color |
|---------|-------|
| Wood | #228B22 |
| Fire | #DC143C |
| Earth | #DAA520 |
| Metal | #C0C0C0 |
| Water | #4169E1 |

---

## Development Guidelines

1. Use TypeScript with strict mode
2. Follow existing color scheme
3. Use `@/` import aliases
4. Add types to `src/types/`
5. Create API functions in `src/api/`
6. Use `useAuth()` hook for authentication
7. Handle `ApiError` exceptions
8. Show loading indicators with `ActivityIndicator`
9. Include error fallbacks
10. Add banner ads to scrollable screens
