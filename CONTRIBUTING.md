# 🤝 Contributing to Not Enough Accountability

Thank you for your interest in contributing to the Not Enough Accountability project! This guide will help you get started with contributing to this productivity and accountability tool.

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Issue Guidelines](#issue-guidelines)
- [Feature Requests](#feature-requests)
- [Code of Conduct](#code-of-conduct)

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or pnpm or yarn
- Git
- Basic understanding of Electron, HTML, CSS, and JavaScript
- Familiarity with electron-forge and electron-updater (helpful)

### Development Setup

1. **Fork the repository**

   ```bash
   # Click the "Fork" button on GitHub, then:
   git clone https://github.com/YOUR-USERNAME/not-enough-accountability.git
   cd not-enough-accountability
   ```

2. **Add upstream remote**

   ```bash
   git remote add upstream https://github.com/original-owner/not-enough-accountability.git
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Start development server**

   ```bash
   npm start
   ```

5. **Enable development mode**
   ```bash
   # Set environment variable for development features
   set NODE_ENV=development  # Windows
   export NODE_ENV=development  # macOS/Linux
   npm start
   ```

## 🛠️ How to Contribute

### Types of Contributions We Welcome

1. **🐛 Bug Reports**
   - Found a bug? Please create an issue with detailed information
   - Include steps to reproduce, expected vs actual behavior
   - Add screenshots or logs if helpful

2. **✨ Feature Enhancements**
   - New monitoring capabilities
   - UI/UX improvements
   - Cross-platform compatibility
   - Performance optimizations

3. **📚 Documentation**
   - Improve README or contributing guidelines
   - Add code comments
   - Create tutorials or guides
   - Translate documentation

4. **🧪 Testing**
   - Test the app on different platforms
   - Write automated tests
   - Report compatibility issues

5. **🎨 Design**
   - UI/UX improvements
   - Icon and asset creation
   - Accessibility enhancements

### Contribution Workflow

1. **Check existing issues** to avoid duplicate work
2. **Create an issue** to discuss major changes
3. **Fork the repository** and create a feature branch
4. **Make your changes** following our coding standards
5. **Test thoroughly** on your platform
6. **Submit a pull request** with clear description

## 🔄 Pull Request Process

### Before Submitting

- [ ] Test your changes thoroughly
- [ ] Ensure code follows our style guidelines
- [ ] Update documentation if needed
- [ ] Add appropriate comments to your code
- [ ] Check that the app builds successfully

### PR Description Template

```markdown
## Description

Brief description of what this PR does.

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing

- [ ] Tested on Windows
- [ ] Tested on macOS
- [ ] Tested on Linux
- [ ] Manual testing performed
- [ ] All existing features still work

## Screenshots (if applicable)

Add screenshots to help explain your changes.

## Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] My changes generate no new warnings
- [ ] I have updated the documentation accordingly
```

### Review Process

1. **Automated checks** will run on your PR
2. **Maintainer review** - we'll review code, test functionality
3. **Feedback incorporation** - address any requested changes
4. **Approval and merge** - once approved, we'll merge your PR

## 📝 Coding Standards

### JavaScript Style Guide

```javascript
// Use descriptive variable names
const restrictedApplications = ["steam.exe", "discord.exe"];

// Use async/await for promises
async function checkForViolations() {
  try {
    const violations = await detectRestrictedApps();
    return violations;
  } catch (error) {
    console.error("Error checking violations:", error);
    return [];
  }
}

// Use clear function names
function sendDiscordNotification(message) {
  // Implementation
}

// Add comments for complex logic
// Rate limiting: only send notifications once per minute per violation
const oneMinuteAgo = now - 60 * 1000;
```

### HTML/CSS Guidelines

- Use semantic HTML elements
- Keep CSS organized and commented
- Use consistent indentation (2 spaces)
- Make UI responsive and accessible
- Follow existing design patterns

### File Organization

```
src/
├── index.js          # Main process - app logic, IPC handlers, auto-updater
├── preload.js        # Preload script - secure IPC bridge
├── index.html        # UI structure and frontend logic
└── index.css         # Styles and theming

.github/
└── workflows/
    ├── build-and-release.yml  # Automated builds & releases
    └── test.yml               # Test automation

forge.config.js       # Electron Forge configuration
package.json          # Dependencies, scripts, auto-updater config
```

### Key Technologies

- **Electron** - Desktop app framework
- **electron-forge** - Build and packaging system
- **electron-updater** - Auto-update functionality
- **GitHub Actions** - CI/CD for automated builds
- **Discord Webhooks** - Accountability notifications

### IPC Communication Pattern

```javascript
// Main process (index.js)
ipcMain.handle("action-name", async (event, param) => {
  // Handle the action
  return result;
});

// Preload script (preload.js)
contextBridge.exposeInMainWorld("electronAPI", {
  actionName: (param) => ipcRenderer.invoke("action-name", param),
});

// Renderer process (index.html)
const result = await window.electronAPI.actionName(param);
```

## 🐛 Issue Guidelines

### Bug Reports

**Use this template for bug reports:**

```markdown
## Bug Description

A clear description of what the bug is.

## Steps to Reproduce

1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior

What you expected to happen.

## Actual Behavior

What actually happened.

## Environment

- OS: [e.g., Windows 10, macOS 12.0, Ubuntu 20.04]
- Node.js version: [e.g., 16.14.0]
- App version: [e.g., 1.0.0]

## Screenshots/Logs

Add any relevant screenshots or log output.
```

### Performance Issues

Include:

- System specifications
- Performance metrics (if available)
- Steps that trigger the performance issue
- Suggested improvements

## ✨ Feature Requests

### Before Requesting

- Check if the feature already exists
- Search existing issues for similar requests
- Consider if it fits the app's scope and purpose

### Feature Request Template

```markdown
## Feature Description

Clear description of the feature you'd like to see.

## Use Case

Why would this feature be useful? What problem does it solve?

## Proposed Solution

How do you envision this feature working?

## Alternatives

Any alternative solutions you've considered?

## Additional Context

Screenshots, mockups, or examples that help explain the feature.
```

## 🤝 Code of Conduct

This project is for everyone. Please be kind, respectful, and constructive in all discussions, issues, and pull requests.

- Treat all contributors and users with respect and empathy.
- No harassment, discrimination, or personal attacks will be tolerated.
- Remember: This app is about accountability and helping each other improve.
- Disagreements are okay, but keep conversations civil and focused on solutions.

Let's make this a welcoming and supportive community for all!

## 🔧 Development Tips

### Testing Your Changes

1. **Test all platforms** if possible (Windows, macOS, Linux)
2. **Test edge cases** - what happens when things go wrong?
3. **Test the accountability features** - ensure explanations are still required
4. **Test Discord integration** with a real webhook
5. **Test system tray functionality**

### Common Development Tasks

```bash
# Start with development tools open
NODE_ENV=development npm start

# Package the app for testing
npm run package

# Create distributable builds
npm run make

# Reset settings during development
# Delete: %APPDATA%/not-enough-accountability/ (Windows)
# Delete: ~/Library/Application Support/not-enough-accountability/ (macOS)
```

### Debugging

- Use `console.log()` statements in main process
- Use browser developer tools for renderer process
- Check the activity log in the app for runtime errors
- Use `NODE_ENV=development` for additional debug output

## 🎯 Priority Areas

We're especially looking for contributions in these areas:

1. **Cross-platform compatibility** (macOS, Linux)
2. **Performance optimizations**
3. **Automated testing**
4. **Accessibility improvements**
5. **Documentation and tutorials**
6. **UI/UX enhancements**
7. **Additional monitoring capabilities**

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Code Review**: Submit a draft PR for early feedback

## 🙏 Recognition

All contributors will be:

- Listed in the project's contributors section
- Credited in release notes for significant contributions
- Welcomed as part of the project community

---

Thank you for helping make Not Enough Accountability better for everyone! 🎯

_Remember: The goal is to help people stay accountable and productive. Keep that mission in mind with all contributions._
