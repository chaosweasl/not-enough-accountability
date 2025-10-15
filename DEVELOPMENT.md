# Accountability - Development Guide

## ✅ Completed Features

### Core Functionality
- [x] Tauri + React + TypeScript setup with Tailwind CSS v4 + shadcn/ui
- [x] Setup wizard with PIN creation and Discord webhook integration
- [x] Application blocking (timer, schedule, permanent modes)
- [x] PIN-protected settings and actions
- [x] Emergency killswitch with Discord notifications
- [x] Modern, clean UI design
- [x] Real-time blocking enforcement (2-second check interval)
- [x] Block rule management (add, remove, toggle)

### Technical Implementation
- [x] Rust backend with process management (sysinfo)
- [x] Windows process termination via Win32 API
- [x] TypeScript types and interfaces
- [x] Local storage persistence
- [x] Discord webhook notifications

## 🚀 Running the App

```bash
# Development mode
pnpm tauri dev

# Build for production
pnpm tauri build

# Frontend only (without Tauri)
pnpm dev
```

## 📋 Future Enhancements

### High Priority
- [ ] macOS support (different process management APIs)
- [ ] Linux support (different process management APIs)
- [ ] Better website blocking (hosts file modification)
- [ ] System tray integration (minimize to tray)
- [ ] Auto-start on system boot option

### Medium Priority
- [ ] Statistics dashboard (apps blocked, time saved)
- [ ] Import/Export block rules
- [ ] Multiple profiles (work, study, etc.)
- [ ] Scheduled killswitch (auto-disable at certain times)
- [ ] Block rule templates

### Low Priority
- [ ] Custom notification sounds
- [ ] Daily/weekly reports
- [ ] Integration with other services (Slack, Telegram)
- [ ] Browser extension for better website blocking

## 🐛 Known Issues & Limitations

1. **Windows Only**: Currently only supports Windows
2. **Browser Tab Blocking**: Can only kill entire browser processes
3. **System Processes**: Some protected processes cannot be terminated
4. **PIN Security**: Uses MD5 hashing (sufficient for self-accountability)

## 🔧 Key Files

- `src/App.tsx` - Main application component
- `src/components/Dashboard.tsx` - Main dashboard view
- `src/components/SetupWizard.tsx` - Initial setup flow
- `src-tauri/src/lib.rs` - Rust backend commands
- `src/hooks/useBlocker.ts` - Blocking enforcement logic
- `src/lib/storage.ts` - LocalStorage persistence

## 💡 Testing

### Test Process Blocking
1. Open a test app (Notepad, Calculator)
2. Add a permanent block rule
3. Enable blocking - app should close within 2 seconds

### Test Discord Webhooks
1. Create a Discord webhook
2. Add URL in Settings
3. Use "Test Webhook" button

---

Made with ❤️ for students and productivity enthusiasts
