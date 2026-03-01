# BaZi App - iOS Testing Log

## Test Environment

- **Mac**: 10.0.0.143 (mark lombardi)
- **iPhone**: Connected via USB/WiFi
- **API Server**: https://256ai.xyz (Bazi server 10.0.1.76)
- **Xcode Project**: ~/Documents/BaziMobileApp/ios/BaZiAstrology.xcworkspace

---

## Build & Deploy Commands (Mac)

### Initial Setup
```bash
cd ~/Documents/BaziMobileApp
npm install
cd ios
pod install
cd ..
```

### Open in Xcode
```bash
open ios/BaZiAstrology.xcworkspace
```

### Build & Run
- In Xcode: Select iPhone target → Cmd+R

### Clean Build (if needed)
```bash
cd ~/Documents/BaziMobileApp/ios
rm -rf build Pods Podfile.lock
pod install
```

---

## Testing Sessions

### Session 1: 2026-01-20

**Build Status**: Connected to iPhone

**API URL**: `https://256ai.xyz`

**Test Results**:

| Test | Status | Notes |
|------|--------|-------|
| App launches | | |
| Login screen loads | | |
| Register new user | | |
| Login existing user | | |
| Home screen loads | | |
| Daily reading displays | | |
| Weekly reading displays | | |
| Calendar navigation | | |
| Profile screen | | |
| AdMob banner shows | | |
| AdMob interstitial shows | | |

**Errors Encountered**:
- (Document errors here)

**Notes**:
-

---

## Common Issues & Fixes

### Issue: "RNGoogleMobileAdsModule could not be found"
**Cause**: Running in Expo Go instead of development build
**Fix**: Build native app via Xcode (`npx expo run:ios` or Xcode)

### Issue: Network error on login
**Cause**: Wrong API URL or server not running
**Fix**:
1. Check `src/api/client.ts` has correct URL
2. Test API: `curl https://256ai.xyz/`
3. Check server: `ssh nazmin@10.0.1.76` then `sudo systemctl status bazi-app`

### Issue: Certificate/SSL errors
**Cause**: Cloudflare SSL not configured
**Fix**: Verify Cloudflare SSL is set to "Flexible"

### Issue: Build fails with signing error
**Cause**: Apple Developer account not configured
**Fix**: In Xcode → Signing & Capabilities → Select team

---

## Server Health Checks

### Quick API Test (from Mac)
```bash
curl https://256ai.xyz/
```
Expected: `{"message":"Bazi Four Pillars App","version":"1.0.0","status":"running"}`

### Check Server Status (SSH to Bazi server)
```bash
ssh nazmin@10.0.1.76
sudo systemctl status bazi-app
sudo journalctl -u bazi-app -f  # Live logs
```

### Check Ollama (AI Server)
```bash
curl http://10.0.1.147:11434/api/tags
```

---

## App Store Submission Checklist

- [ ] All features tested and working
- [ ] AdMob ads displaying correctly
- [ ] No console errors/warnings
- [ ] App icon and splash screen correct
- [ ] Bundle ID matches App Store Connect
- [ ] Version number updated
- [ ] Archive build created
- [ ] Uploaded to App Store Connect
- [ ] App Store metadata filled in
- [ ] Screenshots uploaded
- [ ] Privacy policy URL added
- [ ] Submitted for review

---

## Copy Updated Code to Mac

From Win11:
```cmd
I:\2026CodeProjects\BaZi\copy-to-mac.bat
```

Or manually:
```cmd
scp -r "I:\2026CodeProjects\BaZi\BaziMobileApp" "mark lombardi"@10.0.0.143:~/Documents/
```

---

Last Updated: 2026-01-20
