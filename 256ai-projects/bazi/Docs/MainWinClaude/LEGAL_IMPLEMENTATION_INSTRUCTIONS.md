# Legal Compliance Implementation Instructions

## Overview
This document contains instructions for implementing legal compliance features for the BaZi app.

**Contact Email:** 256ai.dev@gmail.com
**Legal Version:** 2026-01
**Monetization:** AdMob only (no subscriptions)

---

# PART 1: BACKEND INSTRUCTIONS (ChatGPT)

## Task Summary
Add legal acceptance tracking and age verification to the FastAPI backend.

## Files to Modify

### 1. User Model (`models/user.py`)
Add these fields to the User class:

```python
# Legal acceptance tracking (add after updated_at field)
legal_accepted_at = Column(DateTime, nullable=True)
legal_version = Column(String(20), nullable=True)
```

### 2. Auth Router (`routers/auth_router.py`)

#### A. Add age validation helper function:
```python
from datetime import date

CURRENT_LEGAL_VERSION = "2026-01"
MINIMUM_AGE = 13

def calculate_age(birth_date: date) -> int:
    """Calculate age from birth date."""
    today = date.today()
    age = today.year - birth_date.year
    if (today.month, today.day) < (birth_date.month, birth_date.day):
        age -= 1
    return age

def validate_age(birth_date: date) -> bool:
    """Return True if user is 13 or older."""
    return calculate_age(birth_date) >= MINIMUM_AGE
```

#### B. Modify registration endpoint (`POST /auth/register`):
Before saving any birth data, check age:
```python
# BEFORE saving user to database:
if not validate_age(request.birth_date):
    raise HTTPException(
        status_code=403,
        detail="This app is not intended for children under 13."
    )
```

#### C. Modify social auth endpoint (`POST /auth/social`):
Same age check when birth_date is provided.

#### D. Add legal acceptance endpoint:
```python
@router.post("/auth/accept-legal")
async def accept_legal(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record user's acceptance of legal terms."""
    current_user.legal_accepted_at = datetime.utcnow()
    current_user.legal_version = CURRENT_LEGAL_VERSION
    db.commit()

    logger.info(f"Legal acceptance stored for user {current_user.id}")

    return {
        "message": "Legal terms accepted",
        "legal_version": CURRENT_LEGAL_VERSION,
        "accepted_at": current_user.legal_accepted_at.isoformat()
    }
```

#### E. Add endpoint to check legal status:
```python
@router.get("/auth/legal-status")
async def get_legal_status(
    current_user: User = Depends(get_current_user)
):
    """Check if user needs to accept legal terms."""
    needs_acceptance = (
        current_user.legal_accepted_at is None or
        current_user.legal_version != CURRENT_LEGAL_VERSION
    )

    return {
        "needs_acceptance": needs_acceptance,
        "current_version": CURRENT_LEGAL_VERSION,
        "user_version": current_user.legal_version,
        "accepted_at": current_user.legal_accepted_at.isoformat() if current_user.legal_accepted_at else None
    }
```

### 3. Add User Deletion Endpoint (`routers/auth_router.py` or new router)

```python
@router.delete("/auth/delete-account")
async def delete_user_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user account and all associated data."""
    user_id = current_user.id
    user_email = current_user.email

    # Delete all related readings
    db.query(DailyReading).filter(DailyReading.user_id == user_id).delete()
    db.query(WeeklyReading).filter(WeeklyReading.user_id == user_id).delete()
    db.query(MonthlyReading).filter(MonthlyReading.user_id == user_id).delete()
    db.query(YearlyReading).filter(YearlyReading.user_id == user_id).delete()

    # Delete user
    db.delete(current_user)
    db.commit()

    logger.info(f"User account deleted: id={user_id}, email={user_email}")

    return {"message": "Account and all associated data deleted"}
```

### 4. Under-13 User Cleanup
If a user somehow gets created before age check (edge case), add cleanup:

```python
async def delete_underage_user(user_id: int, db: Session):
    """Delete a user who is under 13. Called when age gate is triggered."""
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        # Delete all data
        db.query(DailyReading).filter(DailyReading.user_id == user_id).delete()
        db.query(WeeklyReading).filter(WeeklyReading.user_id == user_id).delete()
        db.delete(user)
        db.commit()
        logger.info(f"Underage user deleted: id={user_id}")
```

## Logging Requirements
Log these events (NO sensitive data in logs):
- `"Legal acceptance stored for user {user_id}"`
- `"Age gate triggered for user {user_id}"`
- `"User account deleted: id={user_id}"`
- `"Underage user deleted: id={user_id}"`

---

# PART 2: MOBILE APP INSTRUCTIONS (Mac Claude)

## Task Summary
Add Legal UI, first-launch modal, age verification, and data deletion flow.

## Files to Create/Modify

### 1. Create Legal Content Constants (`src/constants/legal.ts`)
See LEGAL_TEXTS section below for full content.

```typescript
export const CURRENT_LEGAL_VERSION = "2026-01";
export const CONTACT_EMAIL = "256ai.dev@gmail.com";
export const MINIMUM_AGE = 13;

export const PRIVACY_POLICY = `...`; // Full text below
export const TERMS_OF_USE = `...`;   // Full text below
export const DISCLAIMER = `...`;      // Full text below
```

### 2. Create Legal Screen (`src/screens/LegalScreen.tsx`)
- Display scrollable text with title and "Last updated: January 2026"
- Tab or stack navigation for Privacy Policy, Terms, Disclaimer
- Contact email at bottom (tappable to open email app)

### 3. Create Legal Modal (`src/components/LegalAcceptanceModal.tsx`)
First-launch modal:
```
"By using this app, you agree to our Terms and acknowledge our Privacy Policy and Disclaimer."

[View Legal]  [Continue]
```

- "Continue" calls `POST /auth/accept-legal` and stores local flag
- "View Legal" opens LegalScreen
- Block app usage until accepted

### 4. Add to Settings Screen
Under "Legal" section:
- Privacy Policy
- Terms of Use
- Disclaimer
- Request Data Deletion

### 5. Data Deletion Flow (`src/screens/RequestDataDeletionScreen.tsx`)
- Opens email composer with:
  - To: 256ai.dev@gmail.com
  - Subject: "Data Deletion Request"
  - Body: "Please delete my account and associated data. Account email: {user_email}"
- If email can't open, show instructions and email address

### 6. Age Gate Implementation

#### In Registration/Onboarding Flow:
```typescript
const calculateAge = (birthDate: Date): number => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const validateAge = (birthDate: Date): boolean => {
  return calculateAge(birthDate) >= MINIMUM_AGE;
};
```

#### Before submitting birth data:
```typescript
if (!validateAge(birthDate)) {
  // Show alert
  Alert.alert(
    "Age Restriction",
    "This app is not intended for children under 13.",
    [{ text: "OK", onPress: () => signOut() }]
  );
  // Do NOT save birth data
  // Sign user out
  // If account was created, call delete endpoint
  return;
}
```

### 7. AdMob Age Check
Do NOT show ads if user is under 13:
```typescript
// In ad component
if (user && user.birthDate && calculateAge(new Date(user.birthDate)) < 13) {
  return null; // Don't render ads
}
```

### 8. Legal Status Check on App Load
```typescript
// In AuthContext or App.tsx
useEffect(() => {
  const checkLegalStatus = async () => {
    if (user) {
      const response = await api.get('/auth/legal-status');
      if (response.data.needs_acceptance) {
        setShowLegalModal(true);
      }
    }
  };
  checkLegalStatus();
}, [user]);
```

---

# LEGAL TEXTS (Exact Content)

## PRIVACY POLICY
```
Last updated: January 2026

This Privacy Policy explains how we collect, use, and protect your information when you use our application.

Information We Collect
We may collect the following information:

Information You Provide
- Name
- Email address (used for account login and identification)
- Birth information, including:
  - Birth date
  - Birth time
  - Birth location
  - Birth year and month

This information is used to generate personalized content within the app.

Automatically Collected Information
- Device information
- Usage data
- App interaction data

Advertising Data
We use Google AdMob to display ads. AdMob may collect and use data in accordance with Google's privacy practices, including device identifiers and usage data, to serve relevant advertisements.

How We Use Your Information
We use your information to:
- Provide and personalize app features
- Associate user accounts with generated content
- Improve app functionality and performance
- Display advertisements
- Communicate with users regarding app-related issues

Data Sharing
We do not sell your personal information.
We may share data with:
- Service providers (such as Google AdMob and analytics tools)
- Legal authorities if required by law

Data Retention
We retain user data only as long as necessary to operate the app and provide services. Users may request deletion of their data by contacting us.

Children's Privacy
This app is intended for a general audience and is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13.

Your Choices
You may:
- Request access to or deletion of your data
- Stop using the app at any time

Contact Us
If you have questions about this Privacy Policy or your data, contact us at:
256ai.dev@gmail.com
```

## TERMS OF USE
```
Last updated: January 2026

By using this app, you agree to the following Terms of Use.

Use of the App
You may use this app for personal, non-commercial purposes only. You agree not to misuse the app, attempt to disrupt its operation, or access it in unauthorized ways.

Account Responsibility
You are responsible for maintaining the confidentiality of your account credentials and for all activity associated with your account.

Content and Outputs
All content provided by the app is generated for informational and reflective purposes only. We make no guarantees regarding accuracy, completeness, or outcomes.

Intellectual Property
All app content, branding, and features are owned by the app creators and may not be copied, redistributed, or resold without permission.

Limitation of Liability
To the maximum extent permitted by law:
- We are not liable for decisions, actions, or outcomes resulting from use of the app
- The app is provided "as is" without warranties of any kind

Termination
We reserve the right to suspend or terminate access to the app at our discretion, including for misuse or violation of these terms.

Changes
We may update these Terms from time to time. Continued use of the app constitutes acceptance of any changes.

Contact
Questions about these Terms may be sent to:
256ai.dev@gmail.com
```

## DISCLAIMER
```
Important Notice

This app provides informational, reflective, and entertainment-based content only.
- It is not medical, psychological, legal, or financial advice
- It does not replace professional judgment or consultation
- No guarantees are made regarding outcomes, predictions, or results

You are solely responsible for how you interpret and use the content provided by the app.
The app creators are not responsible for decisions, actions, or consequences arising from use of this app.
```

---

# IMPLEMENTATION CHECKLIST

## Backend (ChatGPT)
- [ ] Add `legal_accepted_at` and `legal_version` fields to User model
- [ ] Add age validation (13+) to registration endpoint
- [ ] Add age validation to social auth endpoint
- [ ] Add `POST /auth/accept-legal` endpoint
- [ ] Add `GET /auth/legal-status` endpoint
- [ ] Add `DELETE /auth/delete-account` endpoint
- [ ] Add underage user cleanup function
- [ ] Add logging for legal/age events
- [ ] Test age gate blocks under-13 users
- [ ] Test legal acceptance is stored server-side

## Mobile App (Mac Claude)
- [ ] Create legal constants file with all text
- [ ] Create LegalScreen with Privacy Policy, Terms, Disclaimer tabs
- [ ] Create LegalAcceptanceModal for first launch
- [ ] Add Legal section to Settings screen
- [ ] Add Request Data Deletion flow
- [ ] Implement age validation before saving birth data
- [ ] Block AdMob for under-13 users
- [ ] Check legal status on app load
- [ ] Store local legal acceptance flag
- [ ] Test age gate shows alert and signs out
- [ ] Test legal modal appears for new/updated terms

---

# API ENDPOINTS SUMMARY

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /auth/accept-legal | Record legal acceptance |
| GET | /auth/legal-status | Check if acceptance needed |
| DELETE | /auth/delete-account | Delete user and all data |

---

# NOTES

1. **Age check happens BEFORE saving birth data** - never persist under-13 data
2. **Legal version "2026-01"** - increment when legal docs change
3. **Server-side is canonical** - local flag is just for session caching
4. **No ads for under-13** - don't render AdMob components
5. **Deletion is idempotent** - safe to call multiple times
