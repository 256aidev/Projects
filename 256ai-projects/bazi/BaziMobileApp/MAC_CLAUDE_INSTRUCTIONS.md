# Mac Claude Instructions - BaZi Mobile App
> Last Updated: 2026-01-30

## Priority Tasks

### Task 1: Sync Files from Windows

Copy these updated files from Windows to Mac. The source is `I:\2026CodeProjects\BaZi\BaziMobileApp\`

**Files to sync:**
```
src/screens/relationships/RelationshipsScreen.tsx
src/screens/main/YouScreen.tsx
src/types/family.ts
src/components/BaZiIntelligenceCard.tsx
src/data/dayMasterIntelligence.ts
src/screens/world/WorldScreen.tsx
src/screens/world/ElementsScreen.tsx
src/screens/world/AnimalsScreen.tsx
src/screens/world/EcosystemScreen.tsx
src/navigation/MainTabs.tsx
src/navigation/YouStack.tsx
src/navigation/RelationshipsStack.tsx
src/navigation/WorldStack.tsx
```

---

### Task 2: Add BaZi Intelligence to YouScreen

The `BaZiIntelligenceCard` component exists but is NOT displayed in YouScreen yet.

**Edit `src/screens/main/YouScreen.tsx`:**

1. **Add import at top** (near other component imports):
```typescript
import { BaZiIntelligenceCard } from '../../components/BaZiIntelligenceCard';
```

2. **Add the component** after the "My Day Master" section, BEFORE the "Forecasts" section.

Find this in the JSX (around line 270-277):
```tsx
        {/* Forecasts */}
        <View style={styles.section}>
```

Insert this BEFORE the Forecasts section:
```tsx
        {/* BaZi Intelligence */}
        {profile?.day_master && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your BaZi Intelligence</Text>
            <Text style={styles.intelligenceSubtitle}>
              How you naturally process, decide, and respond
            </Text>
            <BaZiIntelligenceCard dayMaster={profile.day_master} />
          </View>
        )}
```

3. **Add style** for the subtitle (in the StyleSheet):
```typescript
  intelligenceSubtitle: {
    fontSize: 13,
    color: '#8B7355',
    marginBottom: 12,
    fontStyle: 'italic',
  },
```

---

### Task 3: Verify Relationships Tab

The RelationshipsScreen should now have these buttons:
- Row 1: Partner, Child, Parent
- Row 2: Sibling, Friend

Verify the `getRelationshipLabel` function includes:
- spouse -> 'Partner'
- partner -> 'Partner'
- child -> 'Child'
- parent -> 'Parent'
- sibling -> 'Sibling'
- friend -> 'Friend'

---

### Task 4: Verify You Tab Features

Check that YouScreen has:
1. **Free daily reading** - displayed prominently at top
2. **Day Master display** - shows user's Day Master
3. **BaZi Intelligence section** - (after you add it per Task 2)
4. **Forecast buttons** with:
   - "AD" label badge (when ad-gated)
   - "Watch a short ad to view" description text
5. **Reading History button**

---

### Task 5: Build and Test

```bash
cd ~/BaziMobileApp
# Clear cache and rebuild
npx react-native start --reset-cache

# In another terminal
npx react-native run-ios
```

**Test checklist:**
- [ ] You tab shows BaZi Intelligence below Day Master
- [ ] Relationships tab shows Partner/Child/Parent/Sibling/Friend buttons
- [ ] Forecast buttons show AD label and description
- [ ] World tab shows Elements, Animals, Ecosystem sections
- [ ] Navigation between all tabs works

---

## Backend Note

The Linux backend at 10.0.1.76 needs to be updated to accept 'sibling' and 'friend' relationship types. This is a separate task for Windows Claude to handle via SSH to Linux.

---

## File Locations Reference

| Component | Path |
|-----------|------|
| Main Tabs | `src/navigation/MainTabs.tsx` |
| You Screen | `src/screens/main/YouScreen.tsx` |
| Relationships Screen | `src/screens/relationships/RelationshipsScreen.tsx` |
| World Screen | `src/screens/world/WorldScreen.tsx` |
| BaZi Intelligence Card | `src/components/BaZiIntelligenceCard.tsx` |
| Day Master Intelligence Data | `src/data/dayMasterIntelligence.ts` |
| Family Types | `src/types/family.ts` |
