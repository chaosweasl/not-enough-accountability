# QA Review for NEU v1.0.0 Release

**Review Date:** November 11, 2025  
**Reviewer:** GitHub Copilot  
**Target Version:** 1.0.0

---

## Executive Summary

The application is **MOSTLY READY** for v1.0.0 release with **CRITICAL SECURITY ISSUES** that must be addressed and several important improvements recommended. The core functionality is solid, but security hardening is essential before public release.

### Overall Grade: B- (Functional but needs security hardening)

**Critical Issues Found:** 2  
**High Priority Issues:** 5  
**Medium Priority Issues:** 8  
**Low Priority Issues:** 6

---

## 🚨 CRITICAL ISSUES (Must Fix Before v1.0.0)

### 1. **MD5 Hash Still Present in Codebase**

**Severity:** CRITICAL  
**Location:** `src-tauri/Cargo.toml`, `src-tauri/src/lib.rs`

**Issue:**

- MD5 dependency still included in `Cargo.toml` line 33: `md5 = "0.7"`
- Backward compatibility code exists for MD5 hashes (lines 624-627 in `lib.rs`)
- MD5 is cryptographically broken and should not be used for password hashing

**Impact:**

- If users somehow still have MD5 hashes, they're vulnerable to rainbow table attacks
- Having MD5 in the codebase creates security audit concerns

**Recommendation:**

```toml
# REMOVE from Cargo.toml:
md5 = "0.7"
```

```rust
// REMOVE backward compatibility code from verify_pin():
if stored_hash.len() == 32 && stored_hash.chars().all(|c| c.is_ascii_hexdigit()) {
    // Legacy MD5 verification for backward compatibility
    let input_hash = format!("{:x}", md5::compute(input_pin.as_bytes()));
    return Ok(input_hash == stored_hash);
}
```

**Migration Strategy:**

- Add a migration dialog on first launch if MD5 hash detected
- Force users to create a new PIN with Argon2
- Clear old MD5 hash after migration

---

### 2. **No Rate Limiting on Process Killing**

**Severity:** CRITICAL  
**Location:** `src/hooks/useBlocker.ts`

**Issue:**

- Process enforcement loop runs every 2 seconds without any throttling
- A rapidly respawning process could cause CPU spikes
- No cooldown between kill attempts on the same process
- Could potentially be used as a DoS attack vector against the system

**Impact:**

- High CPU usage if malicious user creates a script that respawns blocked processes
- System performance degradation
- Battery drain on laptops

**Current Code:**

```typescript
const interval = setInterval(async () => {
  // No throttling or cooldown between kill attempts
  for (const process of matchingProcesses) {
    await invoke("kill_process", { pid: process.pid });
  }
}, 2000); // Fixed 2-second interval
```

**Recommendation:**
Implement per-process cooldown similar to website blocker:

```typescript
const lastKillTime = useRef<Map<string, number>>(new Map());
const KILL_COOLDOWN = 5000; // 5 seconds

// In enforcement loop:
const lastKill = lastKillTime.current.get(process.path) || 0;
const timeSinceLastKill = now - lastKill;

if (timeSinceLastKill < KILL_COOLDOWN) {
  continue; // Skip recently killed process
}

await invoke("kill_process", { pid: process.pid });
lastKillTime.current.set(process.path, now);
```

---

## ⚠️ HIGH PRIORITY ISSUES

### 3. **No Input Validation on PIN Length**

**Severity:** HIGH  
**Location:** `src/components/SetupWizard.tsx`, `src/components/Settings.tsx`

**Issue:**

- PIN validation only checks `pin.length < 4`
- No maximum length enforcement before hashing
- No check for numeric-only input (allows alphabetic characters)

**Current Code:**

```typescript
if (pin.length < 4) {
  setError("PIN must be at least 4 digits");
  return;
}
```

**Recommendation:**

```typescript
// Add comprehensive validation:
if (pin.length < 4 || pin.length > 8) {
  setError("PIN must be 4-8 digits");
  return;
}
if (!/^\d+$/.test(pin)) {
  setError("PIN must contain only numbers");
  return;
}
```

---

### 4. **Discord Webhook Rate Limiting Issues**

**Severity:** HIGH  
**Location:** `src-tauri/src/lib.rs` (lines 520-545)

**Issue:**

- Rate limiting is per-webhook URL, stored in memory
- State is lost on app restart, allowing rate limit bypass
- Discord's actual rate limits are more complex (per channel, per second)
- 5-second cooldown may not be enough for Discord's actual limits

**Discord's Actual Limits:**

- 5 webhooks per second per channel
- 30 webhooks per minute per webhook URL
- Exceeding limits results in HTTP 429 (rate limit) responses

**Recommendation:**

```rust
// Increase minimum interval to match Discord's limits
const MIN_INTERVAL: Duration = Duration::from_secs(2); // 30 per minute = 2s min

// Handle HTTP 429 responses gracefully
match response {
    Ok(res) => {
        if res.status() == 429 {
            // Parse Retry-After header
            let retry_after = res.headers()
                .get("Retry-After")
                .and_then(|h| h.to_str().ok())
                .and_then(|s| s.parse::<u64>().ok())
                .unwrap_or(60);
            return Err(format!("Rate limited. Try again in {} seconds", retry_after));
        }
        // ... rest of code
    }
}
```

---

### 5. **Process Cache Never Invalidates**

**Severity:** HIGH  
**Location:** `src-tauri/src/lib.rs` (lines 29-57)

**Issue:**

- Process cache TTL is set but never actually invalidates
- Cache could become stale if processes change between refreshes
- No mechanism to force cache refresh

**Current Implementation:**

```rust
fn new(ttl_seconds: u64) -> Self {
    Self {
        cache: Arc::new(Mutex::new(None)),
        ttl: std::time::Duration::from_secs(ttl_seconds),
    }
}
```

**Problem:**

- `ProcessCache` is created but `get_or_refresh()` checks TTL correctly
- However, there's no way to manually invalidate cache when needed

**Recommendation:**
Add manual invalidation method:

```rust
impl ProcessCache {
    fn invalidate(&self) {
        let mut cache = self.cache.lock().unwrap();
        *cache = None;
    }
}
```

---

### 6. **No Error Boundaries in React**

**Severity:** HIGH  
**Location:** `src/App.tsx`, all components

**Issue:**

- No React Error Boundaries implemented
- A single component crash could break the entire app
- No graceful error recovery

**Recommendation:**
Create an ErrorBoundary component:

```typescript
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error:", error, errorInfo);
    storage.addEvent({
      id: generateId(),
      type: "violation",
      target: "Application",
      timestamp: Date.now(),
      message: `App error: ${error.message}`,
    });
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please restart the app.</div>;
    }
    return this.props.children;
  }
}
```

---

### 7. **Website Blocker Kills ALL Browsers Aggressively**

**Severity:** HIGH  
**Location:** `src/hooks/useWebsiteBlocker.ts`

**Issue:**

- Kills ALL browser instances when ANY website rule is active
- 30-second warning is buried in console logs
- No visible UI warning to users
- Could cause data loss if users have important tabs open

**Current Behavior:**

```typescript
// Kills ALL browsers when websites are blocked
for (const browser of browsers) {
  await invoke("kill_process", { pid: browser.pid });
}
```

**Recommendation:**

1. Add prominent UI warning in Dashboard when website rules are active
2. Add pre-enforcement countdown notification
3. Consider allowing users to whitelist specific browsers
4. Save browser session state before killing (if possible)

```tsx
// In Dashboard.tsx:
{
  activeWebsiteRulesCount > 0 && settings.websiteBlockingEnabled && (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Website Blocking Active</AlertTitle>
      <AlertDescription>
        {activeWebsiteRulesCount} website rule(s) active. All browsers will be
        closed in 30 seconds.
      </AlertDescription>
    </Alert>
  );
}
```

---

## ⚠️ MEDIUM PRIORITY ISSUES

### 8. **No Validation on Discord Webhook URL Format**

**Severity:** MEDIUM  
**Location:** `src/components/Settings.tsx`, `src/components/SetupWizard.tsx`

**Issue:**

- Accepts any string as webhook URL
- No regex validation for Discord webhook format
- Could lead to confusing error messages

**Recommendation:**

```typescript
const DISCORD_WEBHOOK_REGEX =
  /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/;

function isValidDiscordWebhook(url: string): boolean {
  return DISCORD_WEBHOOK_REGEX.test(url);
}

// In handleSaveWebhook:
if (webhookUrl && !isValidDiscordWebhook(webhookUrl)) {
  setWebhookTestResult("Invalid Discord webhook URL format");
  return;
}
```

---

### 9. **LocalStorage Size Limits Not Considered**

**Severity:** MEDIUM  
**Location:** `src/lib/storage.ts`

**Issue:**

- Events limited to 100, but could still hit localStorage quota (5-10MB typical)
- No error handling for `QuotaExceededError`
- Block rules and website rules have no size limits

**Recommendation:**

```typescript
// Add try-catch for quota errors:
saveBlockRules(rules: BlockRule[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BLOCK_RULES, JSON.stringify(rules));
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      // Clear old events to free space
      this.clearEvents();
      // Try again
      localStorage.setItem(STORAGE_KEYS.BLOCK_RULES, JSON.stringify(rules));
    } else {
      throw error;
    }
  }
}
```

---

### 10. **No Logging/Telemetry for Debugging**

**Severity:** MEDIUM  
**Location:** Throughout codebase

**Issue:**

- Only `console.log/error` statements for debugging
- No structured logging
- No way to export logs for troubleshooting
- Production builds should remove console logs

**Recommendation:**

1. Implement proper logging library (e.g., `tauri-plugin-log`)
2. Add log export feature in Settings
3. Remove console.logs in production build

```typescript
// vite.config.ts
export default defineConfig({
  esbuild: {
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
});
```

---

### 11. **No Backup/Export Feature for Rules**

**Severity:** MEDIUM  
**Location:** `src/lib/storage.ts`

**Issue:**

- Users can't backup their configuration
- No export/import functionality
- Reinstalling app loses all data

**Recommendation:**
Add export/import in Settings:

```typescript
async function exportConfig() {
  const config = {
    rules: storage.getBlockRules(),
    websiteRules: storage.getWebsiteRules(),
    settings: { ...storage.getSettings(), pinHash: undefined }, // Don't export PIN
    version: "1.0.0",
  };

  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `neu-config-${Date.now()}.json`;
  a.click();
}
```

---

### 12. **Schedule Rules Don't Handle Timezone Changes**

**Severity:** MEDIUM  
**Location:** `src/lib/helpers.ts`

**Issue:**

- Schedule rules use local time without timezone awareness
- Daylight Saving Time changes could cause unexpected behavior
- No indication of timezone in UI

**Impact:**

- Traveling users will see incorrect blocking times
- DST transitions could cause 1-hour offset

**Recommendation:**

- Document timezone behavior in UI
- Consider storing schedules in UTC
- Add timezone indicator in schedule display

---

### 13. **No Confirmation for Killswitch**

**Severity:** MEDIUM  
**Location:** `src/components/KillswitchDialog.tsx`

**Issue:**

- Killswitch deletes all rules immediately
- Could be triggered accidentally
- No undo functionality

**Current Flow:**

1. User clicks Killswitch button
2. PIN dialog appears
3. On verification, all rules deleted immediately

**Recommendation:**
Add explicit confirmation step:

```tsx
<DialogContent>
  <DialogTitle>⚠️ Confirm Killswitch</DialogTitle>
  <DialogDescription>
    This will permanently delete ALL {rules.length + websiteRules.length}{" "}
    blocking rules. This action CANNOT be undone.
  </DialogDescription>
  <div className="flex gap-2">
    <Button variant="outline">Cancel</Button>
    <Button variant="destructive">Delete All Rules</Button>
  </div>
</DialogContent>
```

---

### 14. **Process Matching Could Be More Robust**

**Severity:** MEDIUM  
**Location:** `src/hooks/useBlocker.ts` (lines 177-218)

**Issue:**

- Path normalization uses string replacement
- Case-sensitive path comparison on Linux/Mac (if ever ported)
- Multiple fallback matches could cause false positives

**Current Matching Logic:**

1. Exact path match
2. Executable filename match
3. Process name match (without .exe)

**Edge Cases:**

- `chrome.exe` in different paths could match incorrectly
- Portable apps with non-standard paths
- Processes with similar names (e.g., `notepad.exe` vs `notepad++.exe`)

**Recommendation:**

- Use `path.normalize()` instead of string replacement
- Add process verification step (check file size, hash)
- Allow users to view matched processes before adding rule

---

### 15. **No Update Mechanism**

**Severity:** MEDIUM  
**Location:** N/A

**Issue:**

- No auto-update functionality
- Users won't know when new versions are available
- No in-app update notifications

**Recommendation:**

- Implement `tauri-plugin-updater` for auto-updates
- Add update check on startup
- Add "Check for Updates" button in Settings

---

## ℹ️ LOW PRIORITY ISSUES

### 16. **Accessibility Issues**

**Severity:** LOW  
**Location:** Various components

**Issues:**

- No ARIA labels on interactive elements
- No keyboard navigation testing
- Focus management not optimized
- No screen reader testing

**Recommendations:**

- Add `aria-label` to icon buttons
- Test keyboard-only navigation
- Add focus trap in dialogs
- Test with screen readers (NVDA, JAWS)

---

### 17. **No Dark Mode Persistence**

**Severity:** LOW  
**Location:** `src/components/ThemeProvider.tsx`

**Issue:**

- Theme preference not saved to localStorage
- Resets to system default on restart

**Recommendation:**
Already using `next-themes` which handles this, but verify it's working:

```typescript
// Verify storageKey is set:
<ThemeProvider defaultTheme="system" storageKey="neu-theme">
```

---

### 18. **Inconsistent Error Messages**

**Severity:** LOW  
**Location:** Throughout UI

**Issues:**

- Some errors show in console only
- Others show in UI
- No consistent error display pattern
- No error codes for troubleshooting

**Recommendation:**
Create unified error handling:

```typescript
// src/lib/errors.ts
export const ERROR_CODES = {
  PIN_INCORRECT: "E001",
  WEBHOOK_FAILED: "E002",
  PROCESS_KILL_FAILED: "E003",
  // ...
};

export function showError(code: string, message: string) {
  // Centralized error display
}
```

---

### 19. **No Loading States for Async Operations**

**Severity:** LOW  
**Location:** Various components

**Issue:**

- Getting installed apps shows no loading indicator
- Could appear frozen on slow systems
- No progress indication

**Recommendation:**
Add loading states:

```tsx
{
  isLoadingApps && (
    <div className="flex items-center gap-2">
      <Loader2 className="animate-spin" />
      <span>Scanning installed applications...</span>
    </div>
  );
}
```

---

### 20. **Performance: Unnecessary Re-renders**

**Severity:** LOW  
**Location:** `src/hooks/useBlocker.ts`

**Issue:**

- `cleanupExpiredTimers` re-runs on every render
- Could use `useMemo` for expensive computations
- Context updates could be optimized

**Recommendation:**

```typescript
const activeRulesCount = useMemo(
  () => rules.filter(isRuleActive).length,
  [rules]
);
```

---

### 21. **UI: Long App Names Overflow**

**Severity:** LOW  
**Location:** `src/components/BlockRuleCard.tsx`

**Issue:**

- Very long app names might overflow card boundaries
- No text truncation or ellipsis

**Recommendation:**

```tsx
<h3 className="font-semibold text-lg truncate" title={rule.appName}>
  {rule.appName}
</h3>
```

---

## ✅ POSITIVE FINDINGS

### Security Strengths

1. ✅ **Argon2 password hashing** - Industry standard, properly implemented
2. ✅ **PIN session management** - 10-minute timeout is reasonable
3. ✅ **Webhook rate limiting** - Basic rate limiting exists
4. ✅ **Process termination permissions** - Uses proper Windows API

### Performance Strengths

1. ✅ **Process caching** - Reduces redundant system calls
2. ✅ **Event log limiting** - Caps at 100 events prevents memory bloat
3. ✅ **Efficient React hooks** - Good use of `useCallback` and `useMemo`

### UX Strengths

1. ✅ **Setup wizard** - Smooth onboarding experience
2. ✅ **PIN protection** - Well-integrated throughout app
3. ✅ **Multiple rule types** - Timer, schedule, permanent options
4. ✅ **Discord notifications** - Useful accountability feature
5. ✅ **Event logging** - Good audit trail

### Code Quality Strengths

1. ✅ **Type safety** - Comprehensive TypeScript types
2. ✅ **Component structure** - Well-organized, modular
3. ✅ **Context API usage** - Proper state management
4. ✅ **Error handling** - Most critical paths have error handling

---

## 🎯 RECOMMENDED RELEASE CHECKLIST

### Must Fix Before v1.0.0 (Critical)

- [ ] Remove MD5 dependency and backward compatibility code
- [ ] Implement per-process kill cooldown (5 seconds)
- [ ] Add prominent UI warning for website blocking
- [ ] Add React Error Boundary
- [ ] Add PIN validation (numeric only, 4-8 digits)

### Should Fix Before v1.0.0 (High Priority)

- [ ] Improve Discord webhook rate limit handling (HTTP 429)
- [ ] Add Discord webhook URL validation regex
- [ ] Add localStorage quota error handling
- [ ] Add configuration export/import feature
- [ ] Add killswitch confirmation dialog

### Nice to Have for v1.0.0 (Medium Priority)

- [ ] Remove console.log statements in production build
- [ ] Add structured logging with export feature
- [ ] Implement auto-updater
- [ ] Add timezone indicator for schedules
- [ ] Improve process matching robustness

### Post v1.0.0 (Low Priority)

- [ ] Accessibility improvements (ARIA labels, keyboard nav)
- [ ] Add loading states for async operations
- [ ] Fix text overflow in cards
- [ ] Performance optimizations (React.memo, useMemo)
- [ ] Consistent error messaging system

---

## 📊 TESTING RECOMMENDATIONS

### Security Testing

1. **PIN Brute Force Testing**

   - Verify Argon2 is slow enough to prevent brute force
   - Test with automated PIN attempts
   - Ensure no timing attacks possible

2. **Process Injection Testing**

   - Try to spawn blocked processes as child processes
   - Test with different process creation methods
   - Verify no bypass methods exist

3. **Webhook Injection Testing**
   - Test with malicious webhook URLs
   - Verify no SSRF vulnerabilities
   - Test rate limiting thoroughly

### Performance Testing

1. **Stress Testing**

   - Run with 100+ blocking rules
   - Test with 1000+ installed apps
   - Monitor CPU/memory usage over 24 hours

2. **Edge Cases**
   - Test with rapidly respawning processes
   - Test with 10+ browsers running simultaneously
   - Test during system sleep/wake cycles

### UX Testing

1. **User Flows**

   - Complete first-time setup
   - Add/remove rules of all types
   - Test PIN timeout behavior
   - Verify killswitch functionality

2. **Error Recovery**
   - Test with invalid webhook URLs
   - Test with corrupted localStorage
   - Test with insufficient permissions

---

## 🔐 SECURITY AUDIT SUMMARY

### Vulnerabilities Found

1. **HIGH:** MD5 still in codebase (backward compatibility)
2. **MEDIUM:** No rate limiting on process killing
3. **MEDIUM:** Discord webhook URL not validated
4. **LOW:** PIN allows non-numeric input

### Security Score: 7/10

- Good: Argon2 hashing, process permissions, PIN sessions
- Needs Work: Remove MD5, add rate limiting, input validation

---

## 🚀 PERFORMANCE AUDIT SUMMARY

### Bottlenecks Identified

1. Process enumeration every 2 seconds (minor)
2. No debouncing on rapid rule changes (minor)
3. LocalStorage I/O on every state change (acceptable)

### Performance Score: 8/10

- Generally efficient implementation
- Process caching is well-designed
- React hooks optimized with useCallback

---

## 💡 UI/UX AUDIT SUMMARY

### Strengths

- Clean, modern interface
- Good use of shadcn/ui components
- Intuitive setup wizard
- Clear status indicators

### Weaknesses

- No visible warning for website blocking countdown
- Killswitch too easy to trigger (just PIN, no confirmation)
- No loading states for slow operations
- Long app names can overflow

### UX Score: 7.5/10

---

## 📝 FINAL RECOMMENDATIONS

### For v1.0.0 Release

**MUST FIX (2-3 days work):**

1. Remove MD5 completely
2. Add process kill cooldown
3. Add website blocking UI warning
4. Add PIN input validation

**SHOULD FIX (2-3 days work):** 5. Add error boundaries 6. Improve webhook rate limiting 7. Add config export/import 8. Add killswitch confirmation

### For v1.1.0 Release

- Auto-updater implementation
- Structured logging system
- Comprehensive accessibility improvements
- Advanced process matching algorithms

### For Future Releases

- Cross-platform support (macOS, Linux)
- Cloud sync for rules
- Mobile companion app
- Advanced scheduling (holidays, exceptions)
- Usage statistics and reports

---

## 🎬 CONCLUSION

**Overall Readiness: 75%**

The application demonstrates solid engineering with good architecture, proper state management, and a clean UI. The core functionality works well, and the use of Tauri + React is appropriate for this use case.

**However, the critical security issues (MD5 remnants) and UX concerns (aggressive website blocking, no confirmations) must be addressed before v1.0.0 release.**

With 4-6 days of focused work addressing the MUST and SHOULD FIX items, this application will be ready for a stable v1.0.0 release.

**Recommended Timeline:**

- Week 1: Fix all CRITICAL and HIGH priority issues
- Week 2: Testing, bug fixes, documentation
- Week 3: Beta release to small group
- Week 4: v1.0.0 public release

---

**Review Completed:** November 11, 2025  
**Next Review Recommended:** After critical fixes implemented
