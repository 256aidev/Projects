# Changelog

All notable changes to the BaZi Mobile App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Element Balance Chart
  - Visual bar chart showing elemental composition from Four Pillars
  - Calculates element counts from 8 characters (4 stems + 4 branches)
  - Shows dominant/missing elements with summary description
  - Replaces placeholder on Profile screen
- Family compatibility feature
  - `FamilyMember` type for spouse/child/parent profiles
  - `CompatibilityReading` and `FamilyReading` types
  - Family API functions (`src/api/family.ts`) with local storage fallback
  - `AddFamilyMemberScreen` - form to add family members
  - `FamilyMemberDetailScreen` - view member chart + compatibility
  - `FamilyReadingScreen` - full family analysis
  - `FamilySection` component on Profile screen
  - Quick remove button (×) on each family member card
  - Confirmation dialog before removing members
  - Mock data with AsyncStorage until backend is ready
  - Auto-generated pillars and compatibility readings for testing
- Project management files
  - `PROJECT_PLAN.md` - roadmap and architecture
  - `CHANGELOG.md` - version history
  - `CLAUDE_CONTEXT.md` - AI context for continuity

---

## [1.0.0] - 2025-01-19

### Added
- Initial release
- User authentication (email/password, Google, Apple)
- Birth data collection and storage
- Four Pillars calculation via backend
- Daily reading generation (AI-powered)
- Weekly reading generation
- Profile screen with Four Pillars visualization
- Day Master display with element/polarity
- Calendar screen for browsing past readings
- Settings screen with preferences
  - Reading tone (casual, mystical, practical)
  - Language (English, Chinese)
  - Birth data editing
- Chinese character translations (pinyin, elements, animals)
- Lucky hours chart extracted from readings
- Banner ads integration
- Interstitial ads (every 3rd Calendar visit)
- Pull-to-refresh functionality
- Social onboarding flow for new social users

### Technical
- React Native with Expo v54.0.0
- TypeScript 5.3.0
- React Navigation v6 (Stack + Bottom Tabs)
- JWT authentication with AsyncStorage persistence
- Google Mobile Ads SDK integration
- Google Sign-In and Apple Authentication
