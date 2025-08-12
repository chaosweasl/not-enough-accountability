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
- **Linux**: Download the `.AppImage` file

### Installation Steps

1. **Download** the appropriate file for your operating system
2. **Install/Run** the application:
   - **Windows**: Double-click the `.exe` file and follow the installer
   - **macOS**: Open the `.dmg` file and drag the app to Applications
   - **Linux**: Make the `.AppImage` executable and run it
3. **First launch**: The app will open with a setup wizard

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

- **Tray Icon**: May not display on some systems (functionality still works)
- **Window Title Detection**: Some applications may not report window titles
- **macOS/Linux**: Limited testing on non-Windows platforms

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

## ⚠️ Disclaimer

This app is designed to help with self-accountability and should not be considered a security tool. Determined users can always disable or bypass the monitoring. The effectiveness depends on your commitment to using it honestly.

---

**Stay accountable, stay productive! 🎯**
