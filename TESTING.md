# MVP Testing Guide

## Quick Test Checklist

Use this guide to quickly verify all functionality before release.

---

## ✅ 1. Initial Setup (5 minutes)

### Test Fresh Installation

1. **Delete existing data**

   - Open DevTools (F12)
   - Application tab → Local Storage → Clear All
   - Refresh page

2. **Setup Wizard**

   - [ ] Wizard appears on first launch
   - [ ] Can skip PIN setup
   - [ ] Can create PIN
   - [ ] Can configure Discord webhook
   - [ ] Can skip Discord webhook
   - [ ] Dashboard appears after completion

3. **New PIN Hashing**
   - [ ] Create a new PIN (uses Argon2)
   - [ ] Verify PIN works
   - [ ] Check localStorage: `neu_settings` → `pinHash` starts with `$argon2`

---

## ✅ 2. App Blocking (10 minutes)

### Create Rules

1. **Permanent Rule**

   - [ ] Click "Add App Rule"
   - [ ] Search for "notepad" or similar
   - [ ] Select app
   - [ ] Choose "Permanent" rule type
   - [ ] Add rule
   - [ ] Rule appears in dashboard

2. **Timer Rule**

   - [ ] Add another app rule
   - [ ] Choose "Timer" rule type
   - [ ] Set 5 minutes
   - [ ] Verify countdown timer starts
   - [ ] Rule shows active status

3. **Schedule Rule**
   - [ ] Add third app rule
   - [ ] Choose "Schedule" rule type
   - [ ] Select current day
   - [ ] Set current time ± 1 hour range
   - [ ] Verify rule shows active/inactive correctly

### Test Blocking

1. **Launch Blocked App**

   - [ ] Launch notepad.exe (or your blocked app)
   - [ ] Enable blocking toggle
   - [ ] App should be killed within 2 seconds
   - [ ] Try launching again
   - [ ] Should be killed repeatedly

2. **Verify Real-time Status**

   - [ ] Launch blocked app
   - [ ] Check Dashboard for "Currently Blocking" card
   - [ ] Should show app name
   - [ ] Should update in real-time

3. **Check Events Log**
   - [ ] Go to "Events" tab
   - [ ] Should see block events
   - [ ] Should show timestamps
   - [ ] Should show app names

---

## ✅ 3. Website Blocking (10 minutes)

### Create Website Rules

1. **Category-based**

   - [ ] Click "Add Website Rule"
   - [ ] Select "Social Media" category
   - [ ] Choose rule type
   - [ ] Add rules
   - [ ] Should see multiple domains added

2. **Custom Domain**
   - [ ] Add website rule
   - [ ] Enter custom domain (e.g., "youtube.com")
   - [ ] Add rule
   - [ ] Verify rule appears

### Test Website Blocking

1. **Launch Browser**

   - [ ] Enable blocking
   - [ ] Add website rule for current time
   - [ ] Open Chrome/Edge/Firefox
   - [ ] Browser should be killed after 30 seconds
   - [ ] Check "Currently Blocking" shows browser

2. **Cooldown Period**
   - [ ] Immediately relaunch browser
   - [ ] Should not be killed again for 30 seconds
   - [ ] Verify cooldown working

---

## ✅ 4. Duplicate Prevention (5 minutes)

### Test App Duplicates

1. [ ] Create rule for "notepad.exe"
2. [ ] Try to add same app again
3. [ ] Should see alert: "A blocking rule already exists"
4. [ ] Rule should NOT be added

### Test Website Duplicates

1. [ ] Create rule for "facebook.com"
2. [ ] Try to add "Social Media" category (includes Facebook)
3. [ ] Should see alert listing duplicates
4. [ ] Only new domains should be added

---

## ✅ 5. Security Features (10 minutes)

### PIN Protection

1. **Disable Blocking**

   - [ ] Try to toggle blocking off
   - [ ] Should prompt for PIN
   - [ ] Enter wrong PIN → should fail
   - [ ] Enter correct PIN → should disable

2. **Delete Rule**

   - [ ] Try to delete a rule
   - [ ] Should prompt for PIN
   - [ ] Verify PIN required

3. **PIN Session**
   - [ ] Verify PIN once
   - [ ] Check dashboard for "PIN session active" badge
   - [ ] Try another protected action
   - [ ] Should NOT prompt for PIN again (10-minute session)

### Killswitch

1. [ ] Click "Killswitch" button
2. [ ] Should show warning
3. [ ] Click continue
4. [ ] Should show confirmation
5. [ ] Activate killswitch
6. [ ] Blocking should disable immediately (NO PIN required)
7. [ ] Check events log for killswitch event

---

## ✅ 6. Discord Webhooks (5 minutes)

### Setup Webhook

1. [ ] Go to Settings
2. [ ] Enable webhook
3. [ ] Enter Discord webhook URL
4. [ ] Configure notification types

### Test Notifications

1. **Rate Limiting**

   - [ ] Enable blocking
   - [ ] Quickly add 3 rules
   - [ ] Should see rate limit errors in console (5-second minimum)
   - [ ] Only first webhook should send immediately

2. **Notification Types**
   - [ ] Enable blocking → check Discord
   - [ ] Disable blocking → check Discord
   - [ ] Delete rule → check Discord
   - [ ] Activate killswitch → check Discord
   - [ ] Block app → check Discord

---

## ✅ 7. Edge Cases (10 minutes)

### Timer Rules

1. [ ] Create 1-minute timer rule
2. [ ] Wait 1 minute
3. [ ] Click "Clean Expired"
4. [ ] Rule should be removed automatically

### Schedule Rules

1. **Overnight Schedule**

   - [ ] Create rule: 10 PM - 6 AM
   - [ ] Should show "(overnight)" indicator
   - [ ] Test at appropriate times

2. **Day Selection**
   - [ ] Create rule for specific days only
   - [ ] Verify only active on selected days

### No Rules

1. [ ] Delete all rules
2. [ ] Enable blocking toggle
3. [ ] Should not crash
4. [ ] Should show "No rules" message

### Empty States

1. [ ] Go to Apps tab with no rules → see empty state
2. [ ] Go to Websites tab with no rules → see empty state
3. [ ] Go to Events tab with no events → see empty state

---

## ✅ 8. Performance Check (5 minutes)

### CPU Usage

1. [ ] Open Task Manager
2. [ ] Enable blocking with 5+ rules
3. [ ] Launch blocked apps repeatedly
4. [ ] CPU should stay reasonable (<5% average)

### Memory Usage

1. [ ] Check app memory usage
2. [ ] Should be < 200 MB
3. [ ] No memory leaks after extended use

### Responsiveness

1. [ ] UI should remain responsive
2. [ ] No lag when switching tabs
3. [ ] Events update smoothly
4. [ ] Status updates in real-time

---

## ✅ 9. Production Build Test (10 minutes)

### Build Application

```bash
pnpm tauri build
```

### Test Installer

1. [ ] Run installer from `src-tauri/target/release/bundle/`
2. [ ] Install application
3. [ ] Launch installed version
4. [ ] Repeat critical tests:
   - [ ] Setup wizard
   - [ ] Create rules
   - [ ] Test blocking
   - [ ] Verify PIN works
   - [ ] Check events log

### Uninstall Test

1. [ ] Uninstall application
2. [ ] Reinstall
3. [ ] Data should be cleared (fresh start)

---

## ✅ 10. Cross-platform Check

### Windows

- [ ] Test on Windows 10
- [ ] Test on Windows 11
- [ ] Process killing works
- [ ] Browser detection works

### macOS (if available)

- [ ] Test on macOS
- [ ] Process killing works
- [ ] Browser detection works

### Linux (if available)

- [ ] Test on Ubuntu/Debian
- [ ] Process killing works
- [ ] Browser detection works

---

## 🐛 Bug Reporting Template

If you find issues, document:

```markdown
**Bug Description**:

**Steps to Reproduce**:

1.
2.
3.

**Expected Behavior**:

**Actual Behavior**:

**Environment**:

- OS:
- Version:
- Browser (if applicable):

**Console Errors**:
```

---

## ✅ Final Verification

Before releasing:

- [ ] All tests above passed
- [ ] No console errors
- [ ] No visual glitches
- [ ] Performance acceptable
- [ ] Production build works
- [ ] Installer works
- [ ] Uninstaller works
- [ ] README updated
- [ ] Version number bumped
- [ ] Release notes created
- [ ] Git tagged

---

## 🎉 Ready to Release!

If all tests pass, the app is ready for MVP release as **v0.1.0**.

**Estimated Total Testing Time**: ~60-70 minutes

**Priority**: Focus on items marked with ⚠️ if short on time:

- ⚠️ App blocking functionality
- ⚠️ PIN protection
- ⚠️ Duplicate prevention
- ⚠️ Killswitch
- ⚠️ Production build
