# NEU (Not Enough Accountability) - AI Agent Instructions

## Project Overview

Desktop application blocker and accountability tool built with **Tauri 2** (Rust backend) + **React 19 + TypeScript** frontend. Blocks distracting applications using OS-level process termination with optional Discord webhook notifications.

## Architecture

### Frontend-Backend Communication

- **Frontend → Backend**: TypeScript calls Rust via `invoke("command_name", { params })` from `@tauri-apps/api/core`
- **Backend → Frontend**: Rust commands marked with the tauri::command attribute macro in `src-tauri/src/lib.rs`
- **All Tauri commands** registered in `invoke_handler` at bottom of `lib.rs` (lines 649+)

### Key Tauri Commands (src-tauri/src/lib.rs)

- `get_running_processes()` - Returns all running processes with executable paths
- `get_installed_apps()` - Scans Program Files, AppData, and Steam libraries for .exe files
- `kill_process(pid)` - Terminates process using Windows API (`TerminateProcess`) or Unix `kill -9`
- `send_discord_webhook(webhook_url, message)` - Posts notifications via reqwest
- `verify_pin(pin, hash)` / `hash_pin(pin)` - MD5-based PIN authentication

### State Management

- **React Context**: `BlockerContext` (src/contexts/BlockerContext.tsx) wraps entire app
  - Provides `rules`, `addRule`, `removeRule`, `updateRule`, `isEnforcing`, `setIsEnforcing`
  - Consumed via `useBlockerContext()` hook
- **Persistent Storage**: All data stored in browser localStorage via `src/lib/storage.ts`
  - Keys: `neu_settings`, `neu_block_rules`, `neu_website_rules`, `neu_events`
  - No backend persistence - purely local

### Process Blocking Logic (src/hooks/useBlocker.ts)

```typescript
// Core enforcement loop runs every 2 seconds when isEnforcing=true
// 1. Filter active rules using isRuleActive() helper (checks timer/schedule/permanent)
// 2. Get running processes via invoke("get_running_processes")
// 3. Match processes against rules by:
//    - Primary: Exact executable path match (normalized, case-insensitive)
//    - Secondary: Executable filename match (last part of path)
//    - Tertiary: Process name match (without .exe extension)
// 4. Kill matching processes via invoke("kill_process", { pid })
```

### TypeScript Types (src/types/index.ts)

- `BlockRule`: Represents a blocking rule with `type: "timer" | "schedule" | "permanent"`
  - Timer: `duration` (minutes), `startTime` (epoch ms)
  - Schedule: `days[]` (0-6), `startHour/Minute`, `endHour/Minute`
  - Permanent: Always active when `isActive: true`
- `AppSettings`: PIN hash, Discord webhook config, notification preferences
- `AppInfo`: Process metadata from Rust (name, path, pid)

## Development Workflow

### Running the App

```bash
pnpm tauri dev          # Development mode with hot reload (Vite on :1420)
pnpm tauri build        # Production build (outputs to src-tauri/target/release)
```

### Building Just Rust Backend

```bash
cargo build --manifest-path=src-tauri/Cargo.toml          # Debug build
cargo build --release --manifest-path=src-tauri/Cargo.toml # Release build
```

### Frontend Only (without Tauri)

```bash
pnpm dev                # Vite dev server only (invoke() calls will fail)
```

## Project-Specific Patterns

### Adding New Tauri Commands

1. Define function in `src-tauri/src/lib.rs` with the tauri::command attribute macro
2. Add function name to `invoke_handler` in `tauri::generate_handler![...]` (line 649)
3. Call from TypeScript: `invoke("your_command_name", { param: value })`
4. **Critical**: Command names use snake_case in Rust, same in TypeScript invoke()

### PIN Protection Pattern

All sensitive actions (disable blocking, remove rules) use this pattern:

```typescript
// In component:
setPendingAction(() => async () => {
  /* actual action */
});
setShowPinDialog(true);

// PinDialog calls onVerified callback which executes pendingAction
```

### Discord Webhook Notifications

Sent for: block enabled, block disabled, rule deleted, killswitch activated

- Check `settings.webhookEnabled && settings.webhookUrl && settings.send[Type]Notifications`
- Use `invoke("send_discord_webhook", { webhookUrl, message })`
- Message format: Emoji + bold title + details

### Rule Active Logic (src/lib/helpers.ts - isRuleActive)

- **Permanent**: Always active if `isActive: true`
- **Timer**: Active if `now >= startTime && now <= startTime + duration`
- **Schedule**: Active if current day in `days[]` AND current time in hour/minute range

### Component Structure

- **Dashboard**: Main view, shows blocking toggle + rule list + killswitch button
- **Settings**: PIN creation, Discord webhook config, notification preferences
- **BlockRuleDialog**: Multi-step dialog for adding rules (search app → select type → configure)
- **SetupWizard**: First-run experience, appears when `settings.isSetupComplete === false`

### shadcn/ui Components

Uses Radix UI primitives styled with Tailwind v4. All components in `src/components/ui/`:

- Import from `@/components/ui/[component-name]`
- Theming via `next-themes` (light/dark/system) in `ThemeProvider.tsx`

## Windows-Specific Considerations

### Process Termination

Uses `windows` crate (v0.58) with Win32 API:

```rust
use windows::Win32::System::Threading::{OpenProcess, TerminateProcess, PROCESS_TERMINATE};
```

Requires `PROCESS_TERMINATE` permission. May fail for system/protected processes.

### Steam Game Discovery

Parses `C:\Program Files (x86)\Steam\steamapps\libraryfolders.vdf` to find additional Steam library paths beyond default installation.

### Path Normalization

Always normalize Windows paths for matching:

```typescript
.toLowerCase().replace(/\\/g, "/")  // Backslash → forward slash, case-insensitive
```

## Critical Files Reference

- **Backend entry**: `src-tauri/src/lib.rs` (667 lines) - all Tauri commands + app initialization
- **Frontend entry**: `src/App.tsx` - handles setup wizard vs main app routing
- **Blocking engine**: `src/hooks/useBlocker.ts` - 2-second enforcement loop
- **Storage layer**: `src/lib/storage.ts` - localStorage wrapper with typed getters/setters
- **Type definitions**: `src/types/index.ts` - shared TypeScript interfaces
- **Rule activation logic**: `src/lib/helpers.ts` - isRuleActive() determines if rule should block now

## Testing Patterns

**No automated tests currently exist.** Manual testing workflow:

1. Add block rule for an app (e.g., notepad.exe)
2. Launch that app
3. Enable blocking toggle
4. Verify app terminates within 2 seconds
5. Check Discord webhook received (if configured)

## Common Pitfalls

- **Path matching failures**: Ensure paths are normalized (lowercase, forward slashes) on both sides
- **Blocking not working**: Check `isEnforcing` state and `settings.blockingEnabled` both true
- **Tauri command not found**: Must be registered in `invoke_handler` in lib.rs
- **Pin dialog not showing**: Verify `settings.pinHash` exists (setup completed)
- **Rule not activating**: Debug with `isRuleActive()` - check timer not expired, schedule days/times correct
