# 🎯 Not Enough Accountability

A desktop accountability system that monitors your computer usage during work hours and sends notifications to Discord when you use restricted apps or visit restricted websites. Keep yourself accountable to your productivity goals!

## ✨ Features

### 🔍 **Real-time Monitoring**

- Monitors running applications every 5 seconds
- Detects restricted keywords in window titles (YouTube, Netflix, etc.)
- Rate-limited notifications (once per minute per violation)
- Works with any browser and desktop application

### 💬 **Discord Integration**

- Sends violation alerts to your Discord server/group chat
- Notifications include timestamps and detailed violation info
- Test webhook functionality built-in

### ⏰ **Work Schedule Management**

- Configurable check-in/check-out times (default: 8 AM - 4 PM)
- Automatic monitoring during work hours
- Manual check-in/check-out with Discord notifications

### 🚫 **Restriction Management**

- Add/remove restricted applications (Steam, games, etc.)
- Add/remove monitoring keywords (YouTube, social media, etc.)
- Persistent settings storage

### 🛡️ **Accountability Features**

- **Required explanations** for all monitoring actions:
  - Stopping monitoring
  - Pausing monitoring
  - Temporarily disabling
  - Quitting the application
- All actions logged and sent to Discord with reasons
- System tray integration - runs in background

### 📊 **Activity Logging**

- Local activity log with timestamps
- Export logs to text files
- Clear logging history

## 🚀 Download & Installation

### Quick Download

Get the latest version from our [Releases page](https://github.com/chaosweasl/not-enough-accountability/releases):

- **Windows**: Download `Not-Enough-Accountability-Setup.exe`
- **macOS**: Download `Not-Enough-Accountability.dmg`

### Installation Steps

1. **Download** the appropriate file for your operating system
2. **Install/Run** the application:
   - **Windows**: Double-click the `.exe` file and follow the installer
   - **macOS**: Open the `.dmg` file and drag the app to Applications
3. **First launch**: The app will open with a setup wizard

### ⚠️ Security Warning

**Important:** This application is not code-signed, which means your operating system may display security warnings:

- **Windows**: Windows Defender or antivirus software may flag the app as "potentially unwanted" or block installation
  - Click "More info" → "Run anyway" if Windows SmartScreen blocks it
  - You may need to temporarily disable real-time protection in Windows Defender
  - Add the app folder to your antivirus exclusions if needed

- **macOS**: macOS Gatekeeper may prevent opening the app
  - Right-click the app → "Open" → "Open" to bypass Gatekeeper
  - Or go to System Preferences → Security & Privacy → "Open Anyway"

- **Why this happens**: Code signing certificates are expensive ($400+/year) for open-source projects
- **Is it safe?**: Yes! The source code is fully open and auditable on GitHub
- **Alternative**: Build from source if you prefer (see CONTRIBUTING.md)

### First Time Setup

1. **Configure Discord Webhook** (Recommended)
   - Create a Discord webhook in your server/channel
   - Paste the webhook URL in the app settings
   - Test the connection

2. **Set Work Hours**
   - Configure your check-in time (default: 08:00)
   - Configure your check-out time (default: 16:00)

3. **Add Restricted Items**
   - Add applications you want to avoid (e.g., `steam.exe`, `chrome.exe`)
   - Add keywords to monitor (e.g., `youtube`, `netflix`, `reddit`)

4. **Save Settings** and start monitoring!

### Auto-Updates

The app includes automatic update functionality:

- **Automatic Check**: Checks for updates on startup
- **Manual Check**: Use the "Check for Updates" button in settings
- **Background Download**: Updates download in the background
- **Install Prompt**: You'll be prompted when an update is ready to install

## 🔧 Configuration

### Discord Webhook Setup

1. Go to your Discord server settings
2. Navigate to Integrations → Webhooks
3. Create a new webhook
4. Copy the webhook URL
5. Paste it into the app's Discord Webhook URL field

### Adding Restricted Applications

- Use the executable name (e.g., `steam.exe`, `discord.exe`)
- On Windows, you can find process names in Task Manager
- The app will detect partial matches (e.g., `steam` will match `steam.exe`)

### Adding Monitoring Keywords

- Keywords are detected in window titles
- Works great for browser tabs (YouTube, Netflix, Reddit, etc.)
- Case-insensitive matching
- Detects keywords in any application window title

## 🖥️ System Tray

The app runs in the system tray with these options:

- **Show App** - Bring the main window to front
- **Check In/Out** - Quick check-in or check-out
- **Start/Stop Monitoring** - Toggle monitoring state
- **Quit** - Exit the app (requires explanation)

## 📋 How It Works

### Monitoring Process

1. **Every 5 seconds**: Checks running processes and active window titles
2. **Violation Detection**: Compares against your restricted apps and keywords
3. **Rate Limiting**: Only sends notifications once per minute per violation
4. **Discord Notification**: Sends detailed violation info to your Discord channel

### Accountability System

- All control actions require written explanations
- Explanations are logged locally and sent to Discord
- Creates an audit trail of when and why monitoring was disabled
- Prevents impulsive disabling of monitoring

### Work Hour Integration

- Automatically starts monitoring during configured work hours
- Auto check-in/check-out at scheduled times
- Pausing monitoring automatically resumes during work hours

## 🔒 Privacy & Security

- **Local Storage**: All settings and logs stored locally on your computer
- **No Data Collection**: The app doesn't send any data except Discord notifications
- **Open Source**: Full source code available for inspection
- **No External Dependencies**: Uses only essential, trusted packages

## 🤝 Contributing

Interested in contributing to the project? Check out our [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, guidelines, and how to get started with the codebase.

## 🐛 Known Issues

- **No code certification**: The app will be marked as a potential virus
- **Tray Icon**: May not display on some systems (functionality still works)
- **Window Title Detection**: Some applications may not report window titles
- **macOS**: Limited testing on non-Windows platforms

## 💡 Future Enhancements

- [ ] Auto-start on system boot
- [ ] Screenshot capture on violations
- [ ] Usage statistics and reports
- [ ] Website blocking functionality
- [ ] Mobile companion app
- [ ] Custom notification sounds
- [ ] Multiple Discord webhook support

## 🆘 Support

If you encounter issues:

1. Check the [Issues](https://github.com/chaosweasl/not-enough-accountability/issues) page
2. Enable developer tools in the app for debugging
3. Check the activity log for error messages
4. Create a new issue with detailed information

## 🛠️ Development Setup

### Prerequisites

- **Node.js**: v18+ recommended (v16.14+ minimum for stable ESM support)
- **npm**: v8+ (comes with Node.js)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/chaosweasl/not-enough-accountability.git
cd not-enough-accountability

# Install dependencies
npm install

# Start development (runs both renderer and Electron)
npm run dev
```

### Available Scripts

- `npm run dev` - Start both Vite dev server and Electron app
- `npm run dev:renderer` - Start only the Vite dev server (browser mode)
- `npm run dev:electron` - Start only Electron (requires renderer running)
- `npm run build` - Build production version
- `npm run build:main` - Build main process only
- `npm run build:renderer` - Build renderer only
- `npm run package` - Package the app for distribution

### Architecture

This app uses:

- **Frontend**: React + TypeScript + Tailwind CSS v4
- **Backend**: Electron main process (Node.js)
- **Build Tools**: Vite + PostCSS
- **Styling**: Tailwind CSS via PostCSS plugin (avoids ESM/CJS conflicts)

### Tailwind CSS Setup

The project uses Tailwind CSS v4 with PostCSS integration:

- **Configuration**: `postcss.config.js` + `tailwind.config.js`
- **Import**: Tailwind is imported via `@import 'tailwindcss';` in CSS files
- **Plugin**: Uses `@tailwindcss/postcss` (not `@tailwindcss/vite`) for broader compatibility
- **Custom Colors**: Defines `primary-*` color palette in `tailwind.config.js`

If you encounter Tailwind-related issues:
1. Ensure Node.js v18+ for best ESM support
2. Check that PostCSS config exists and includes `@tailwindcss/postcss`
3. Verify `@import 'tailwindcss';` is in your CSS entry point
4. Run `npm run dev:renderer` to test Vite compilation only

### Electron + Vite Integration

The setup separates concerns:
- **Renderer Process**: Built with Vite (ESM-friendly)
- **Main Process**: Built with TypeScript compiler (CommonJS compatible)
- **Development**: Hot reloading for renderer, restart for main process

### Testing Tailwind

To verify Tailwind is working, you can import the test component:
```typescript
import TailwindTest from './components/TailwindTest';
```

---

## ⚠️ Disclaimer

This app is designed to help with self-accountability and should not be considered a security tool. Determined users can always disable or bypass the monitoring. The effectiveness depends on your commitment to using it honestly.

---

**Stay accountable, stay productive! 🎯**
