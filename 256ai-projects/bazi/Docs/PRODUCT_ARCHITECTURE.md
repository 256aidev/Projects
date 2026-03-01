# BaZi App - Product Architecture & Ecosystem Doctrine

> **Status:** APPROVED - Ready for Implementation
> **Last Updated:** 2026-01-30
> **Approved By:** CEO

---

## 1. Product Definition

### 1.1 What BaZi Is

BaZi (Four Pillars) is a **descriptive system** that explains personal and relational patterns based on time of birth.

**Core Principles:**
- BaZi = awareness, not fate
- Patterns = guidance, not verdicts
- Agency always remains with the user
- It highlights where life feels natural and where effort is required
- It does NOT predict outcomes, judge people, or make decisions for users

**Forbidden Language:**
- destiny language
- "good / bad" labeling
- outcome prediction
- relationship judgment

**Core Doctrine (Non-Negotiable):**
> "BaZi describes patterns and effort. Outcomes depend on personal choices."

### 1.2 What BaZi Intelligence Is

BaZi Intelligence describes how a person naturally thinks, processes information, reacts under stress, and makes decisions.

**It IS:**
- A cognitive and behavioral pattern system
- Descriptive
- Pattern-based
- Individualized

**It focuses on:**
- Thinking style
- Decision rhythm
- Stress response
- Internal processing tendencies

**It is NOT:**
- IQ
- Personality tests (like MBTI)
- Body type analysis
- Judgment of potential
- Ability scoring

---

## 2. Tab Architecture

### 4 Tabs (Reorganized)

```
┌─────────────────────────────────────────────────────────────┐
│  TAB 1: You    │  TAB 2: Relationships  │  TAB 3: World  │  TAB 4: Settings  │
│      🧍        │          ❤️            │       ☯        │        ⚙         │
└─────────────────────────────────────────────────────────────┘
```

**Design Principle:** Tabs are organized by WHO the information is about.

### 2.1 TAB 1 — "You" (Individual-Centered)

**Goal:** "This tab explains me."

```
┌─────────────────────────────────┐
│ TODAY'S READING                 │  ← Daily personal reading
│ [Day pillar + content]          │
├─────────────────────────────────┤
│ MY FOUR PILLARS                 │  ← Static chart
│ [Year/Month/Day/Hour pillars]   │
├─────────────────────────────────┤
│ MY DAY MASTER                   │  ← Core self
│ [Element + polarity]            │
├─────────────────────────────────┤
│ MY BAZI INTELLIGENCE            │  ← NEW: Cognitive style
│ "How you naturally process,     │
│  decide, and respond."          │
│ [Thinking/decision/stress]      │
├─────────────────────────────────┤
│ FORECASTS                       │
│ [Weekly | Monthly | Yearly]     │
├─────────────────────────────────┤
│ READING HISTORY                 │  ← Sub-screen via button
│ [Past & upcoming readings]      │
└─────────────────────────────────┘
```

### 2.2 TAB 2 — "Relationships" (Interaction-Centered)

**Goal:** "This tab explains how energies meet."

```
┌─────────────────────────────────┐
│ ADD FAMILY MEMBER [+]           │
├─────────────────────────────────┤
│ FAMILY MEMBER CARDS             │
│ ┌───────────────────────────┐   │
│ │ [Name] - [Relationship]   │   │
│ │ Effort Label Badge        │   │
│ │ Mini Ease×Durability chip │   │
│ └───────────────────────────┘   │
├─────────────────────────────────┤
│ FAMILY DYNAMIC READING          │  ← Whole-family insight
│ [Group reading button]          │
└─────────────────────────────────┘

[Tap member → Detail Screen:]
┌─────────────────────────────────┐
│ EASE × DURABILITY CHART         │  ← Primary visual
│ [Effort label, framing]         │
├─────────────────────────────────┤
│ TODAY'S RELATIONSHIP FOCUS      │  ← Behind ad wall
├─────────────────────────────────┤
│ RELATIONSHIP INSIGHTS           │
│ [Strengths / Areas for Growth]  │
├─────────────────────────────────┤
│ RELATIONSHIP FORECASTS          │
│ [Weekly | Monthly | Yearly]     │
├─────────────────────────────────┤
│ DISCLAIMER                      │
└─────────────────────────────────┘
```

### 2.3 TAB 3 — "The BaZi World" (Educational Atlas)

**Goal:** "I understand the system now."

```
┌─────────────────────────────────┐
│ THE FIVE ELEMENTS (Wu Xing)     │  ← V1 MUST-HAVE
│ [Wood | Fire | Earth |          │
│  Metal | Water]                 │
├─────────────────────────────────┤
│ THE TWELVE ANIMALS              │  ← V1 MUST-HAVE
│ [Earthly Branches explained]    │
├─────────────────────────────────┤
│ THE FOUR PILLARS                │  ← V1 STUB
│ [Coming soon...]                │
├─────────────────────────────────┤
│ RELATIONSHIP PATTERNS           │  ← V1 STUB
│ [Coming soon...]                │
├─────────────────────────────────┤
│ SYMBOLIC INFLUENCES             │  ← V1 STUB
│ [Coming soon...]                │
├─────────────────────────────────┤
│ 256ai ECOSYSTEM                 │  ← App ecosystem section
└─────────────────────────────────┘
```

### 2.4 TAB 4 — Settings

**Subsections (unchanged):**
- Account (email, auth)
- Birth data management
- Preferences (tone, language)
- Notifications
- Premium/Subscriptions
- About

---

## 3. Ecosystem Page

### Placement: Inside "The BaZi World" Tab

```
┌─────────────────────────────────┐
│ 256ai ECOSYSTEM                 │
│                                 │
│ "This app focuses on internal   │
│  patterns (BaZi). Other apps    │
│  in the ecosystem explore       │
│  complementary systems."        │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 🏠 Feng Shui (Coming Soon)  │ │
│ │ Environmental alignment     │ │
│ │ [App Store →]               │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 🏛️ Eight Mansions (Planned) │ │
│ │ Space and direction harmony │ │
│ │ [App Store →]               │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

## 4. Changes from Current State

```
CURRENT (4 tabs):               NEW (4 tabs):
┌──────┬──────┬──────┬──────┐   ┌──────┬──────┬──────┬──────┐
│Read- │Pro-  │Calen-│Sett- │   │ You  │Rela- │World │Sett- │
│ings  │file  │dar   │ings  │ → │ 🧍   │tions │  ☯   │ings  │
│  ☯   │  命  │  曆  │  ⚙   │   │      │  ❤️  │      │  ⚙   │
└──────┴──────┴──────┴──────┘   └──────┴──────┴──────┴──────┘
```

**Key Moves:**
1. **Readings + Profile + Calendar** → Combined into **"You"** tab
2. **Family/Relationships** (nested in Profile) → Elevated to **"Relationships"** tab
3. **NEW** → **"The BaZi World"** educational tab with Ecosystem section

---

## 5. V1 Scope Boundaries

### In Scope (V1 Launch)
- Tab restructure (You, Relationships, World, Settings)
- Merge Calendar into "You" tab (as sub-screen)
- Elevate Relationships to dedicated tab
- Create "The BaZi World" educational tab
- BaZi Intelligence section
- Ecosystem page (link-only, inside World tab)
- Forbidden terms audit pass

### Out of Scope (Post-Launch)
- Feng Shui logic/calculations
- Eight Mansions logic/calculations
- Cross-app deep linking
- Luck pillar timelines
- Advanced symbolic influences (Shen Sha)

---

## 6. Implementation Files

### Files to Create
- `src/screens/world/WorldScreen.tsx`
- `src/screens/world/ElementsScreen.tsx`
- `src/screens/world/AnimalsScreen.tsx`
- `src/screens/world/EcosystemScreen.tsx`
- `src/components/BaZiIntelligenceCard.tsx`
- `src/data/dayMasterIntelligence.ts`
- `src/navigation/RelationshipsStack.tsx`
- `src/navigation/WorldStack.tsx`

### Files to Modify
- `src/navigation/MainTabs.tsx`
- `src/navigation/ProfileStack.tsx` → `YouStack.tsx`
- `src/screens/main/ProfileScreen.tsx` → `YouScreen.tsx`

### Files to Deprecate
- `src/screens/main/CalendarScreen.tsx` (merge into You)

---

## 7. Content Drafts Needed

1. **BaZi Intelligence** - 10 Day Master cognitive profiles
2. **Daily Relationship Reading** - 30+ templates
3. **Five Elements** - Educational content
4. **Twelve Animals** - Educational content

---

## 8. Decisions Made

| Decision | Choice |
|----------|--------|
| Tab Icons | Emoji: 🧍 ❤️ ☯ ⚙ |
| Calendar | Sub-screen via button |
| World Content | Elements + Animals full, others stubs |
| BaZi Intelligence Content | Claude drafts for CEO review |
| Numeric Scores | De-emphasized inline (v1) |
