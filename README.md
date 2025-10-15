# NEU (Not Enough Accountability)

A free, open-source application blocker and accountability tool to help you stay focused and productive. Built with Tauri, React, TypeScript, Tailwind CSS, and shadcn/ui.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- **🚫 Application Blocking** - Block distracting apps based on:

  - **Timer** - Block for a specific duration (e.g., 30 minutes, 2 hours)
  - **Schedule** - Block on certain days and times (e.g., weekdays 9am-5pm)
  - **Permanent** - Block until manually removed

- **🔒 PIN Protection** - Set a PIN to prevent easy bypassing of blocks

- **💬 Discord Integration** - Optional webhook notifications for accountability partners:

  - Get notified when apps are blocked
  - Get notified when apps are unblocked
  - Killswitch alerts

- **🚨 Emergency Killswitch** - Instantly disable all blocking for safety situations

- **🎨 Modern UI** - Clean, intuitive interface built with shadcn/ui and featuring ON/OFF indicators for switches

- **🔐 Privacy First** - All data stays on your device, no accounts required

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (recommended) or npm
- [Rust](https://www.rust-lang.org/) (for building from source)

### Installation

#### From Source

```bash
# Clone the repository
git clone https://github.com/yourusername/not-enough-accountability.git
cd not-enough-accountability

# Install dependencies
pnpm install

# Run in development mode
pnpm tauri dev

# Build for production
pnpm tauri build
```

## 📖 Usage

### Initial Setup

1. **Create a PIN** - Set up a 4+ digit PIN for protection
2. **Configure Discord Webhook (Optional)** - Add a Discord webhook URL for notifications
3. **Start Blocking** - Begin adding block rules

### Creating Block Rules

1. Click **"Add Block Rule"** from the dashboard
2. Search and select an application from the list of running processes
3. Choose your blocking type:
   - **Permanent** - Blocks indefinitely
   - **Timer** - Blocks for X minutes
   - **Schedule** - Blocks on specific days/times
4. Click **"Add Rule"**

### Discord Integration

To enable Discord notifications:

1. Create a webhook in your Discord server:

   - Go to Server Settings → Integrations → Webhooks
   - Click "New Webhook"
   - Copy the webhook URL

2. In Accountability:
   - Go to Settings
   - Enable "Discord Notifications"
   - Paste your webhook URL
   - Click "Test Webhook" to verify
   - Configure notification preferences

### Emergency Killswitch

If you need to disable all blocking immediately:

1. Click the **"Killswitch"** button in the dashboard
2. Confirm the action (no PIN required)
3. All blocking will be disabled and your accountability partner will be notified (if configured)

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript
- **UI**: Tailwind CSS v4, shadcn/ui
- **Backend**: Rust, Tauri 2
- **Process Management**: sysinfo
- **HTTP**: reqwest (for Discord webhooks)

## 🔒 Privacy & Security

- ✅ **100% Free & Open Source** - No premium features, no paywalls
- ✅ **No Data Collection** - Everything stays on your device
- ✅ **No Accounts** - Just download and use
- ✅ **Local Storage Only** - Settings stored in localStorage
- ✅ **Optional Webhooks** - Discord integration is completely optional

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 Roadmap

- [ ] macOS support
- [ ] Linux support
- [ ] Website blocking via hosts file modification
- [ ] Statistics and usage reports
- [ ] Import/Export block rules

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

---

Made with ❤️ for students and anyone seeking accountability
