# Not Enough Accountability - Modern React Architecture

This document outlines the modernized architecture and development workflow for the accountability app.

## Architecture Overview

### Technology Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Build Tool**: Vite (fast development + production builds)
- **State Management**: Zustand with TypeScript
- **UI Components**: Custom component library
- **Styling**: Tailwind CSS with dark/light theme support
- **Backend**: Electron main process (unchanged)

### Project Structure

```
src/
├── renderer/                    # React frontend
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Toggle.tsx
│   │   ├── layout/             # Layout components
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   └── monitoring/         # Feature-specific components
│   │       └── MonitoringControls.tsx
│   ├── pages/                  # Main application pages
│   │   ├── Dashboard.tsx
│   │   ├── Settings.tsx
│   │   └── ActivityLog.tsx
│   ├── hooks/                  # Custom hooks
│   │   └── useAppStore.ts      # Zustand state management
│   ├── types/                  # TypeScript definitions
│   │   └── index.ts
│   ├── utils/                  # Utility functions
│   │   └── index.ts
│   ├── App.tsx                 # Main App component
│   ├── main.tsx               # React entry point
│   ├── index.html             # HTML template
│   └── styles.css             # Global styles + Tailwind
├── index.js                    # Electron main process
└── preload.js                 # Electron preload script
```

## Development Workflow

### Available Scripts

```bash
# Development (starts Vite dev server + Electron)
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting (basic setup)
npm run lint

# Individual commands
npm run dev:renderer      # Start Vite dev server only
npm run dev:electron      # Start Electron only (requires renderer)
npm run build:renderer    # Build React app only
npm run build:electron    # Package Electron app
```

### Development Process

1. **Start development server**: `npm run dev`
   - Starts Vite dev server on `http://localhost:5173`
   - Automatically opens Electron window
   - Hot reload for React components

2. **Make changes**: Edit files in `src/renderer/`
   - Components update instantly with hot reload
   - TypeScript errors show in terminal and browser

3. **Build for production**: `npm run build`
   - Builds optimized React app to `dist/renderer/`
   - Packages Electron app with `electron-forge`

## State Management

### Zustand Store (`useAppStore`)

The app uses Zustand for state management with the following structure:

```typescript
interface AppState {
  session: SessionInfo;      // Check-in status, monitoring state
  settings: AppSettings;     // User configuration
  violations: ViolationEvent[]; // Activity log
  stats: ActivityStats;      // Analytics data
  isLoading: boolean;
  error?: string;
}
```

### Key Actions
- `loadSettings()` - Load configuration from Electron
- `saveSettings()` - Save configuration to Electron
- `checkIn()/checkOut()` - Session management
- `startMonitoring()/stopMonitoring()` - Monitoring controls
- `testDiscordWebhook()` - Test Discord integration

## Component Architecture

### UI Components (`src/renderer/components/ui/`)

Reusable, accessible components with consistent styling:

- **Button**: Multiple variants (primary, secondary, success, warning, danger)
- **Card**: Container component with optional title and padding
- **Input**: Form input with label, error states, and validation
- **Modal**: Accessible modal with backdrop and keyboard navigation
- **Toggle**: Switch component for boolean settings

### Layout Components (`src/renderer/components/layout/`)

- **Header**: Top bar with status indicators, time, and theme toggle
- **Sidebar**: Navigation with active state and descriptions

### Feature Components (`src/renderer/components/monitoring/`)

- **MonitoringControls**: Dedicated component for monitoring actions

## TypeScript Integration

### Strong Typing Throughout
- Complete TypeScript interfaces for all data structures
- Type-safe state management
- Electron API types
- Component prop interfaces

### Key Type Definitions
- `AppSettings` - User configuration
- `SessionInfo` - Current session state
- `ViolationEvent` - Activity log entries
- `ElectronAPI` - Electron bridge interface

## Styling System

### Tailwind CSS
- Utility-first CSS framework
- Custom color palette with semantic naming
- Dark/light theme support
- Responsive design utilities

### Theme System
- Automatic dark/light mode detection
- Manual theme toggle in header
- Persistent theme preferences
- CSS custom properties for theme colors

### Custom Utilities
- Focus ring utilities
- Animation classes
- Scrollbar styling
- Loading states

## Electron Integration

### Main Process (`src/index.js`)
- Unchanged core monitoring logic
- System tray integration
- Discord notifications
- File system operations

### Preload Script (`src/preload.js`)
- Extensive API surface for renderer
- Type-safe IPC communication
- Event listeners for main process events
- Backward compatibility layer

### Communication
- IPC between main and renderer processes
- Event-driven updates (violations, status changes)
- Async action handling with error management

## Build System

### Vite Configuration
- Fast development builds with hot reload
- Optimized production builds
- TypeScript support
- Tailwind CSS processing
- Path aliases for clean imports

### Electron Forge
- Packaging and distribution
- Auto-updater integration
- Platform-specific builds
- Development automation

## Future Enhancements

### Planned Features
1. **Enhanced Executable Detection**
   - System app scanning
   - Visual app selector with icons
   - Category-based restrictions

2. **Keyword Database**
   - Predefined keyword categories
   - Severity levels
   - Usage analytics

3. **Advanced Analytics**
   - Productivity scoring
   - Violation trends
   - Time-based insights
   - Goal tracking

4. **Reliability Improvements**
   - Auto-updater fixes
   - Error boundaries
   - Offline handling
   - Performance monitoring

### Development Principles
- Maintain backward compatibility
- Progressive enhancement
- Accessibility first
- Performance optimization
- Type safety everywhere