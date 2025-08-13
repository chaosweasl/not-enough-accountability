import React, { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { Card, Button, Input, Toggle } from '../components/ui';
import { isValidUrl } from '../utils';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { settings, saveSettings, testDiscordWebhook, isLoading } = useAppStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [newApp, setNewApp] = useState('');
  const [newKeyword, setNewKeyword] = useState('');

  const handleSaveSettings = async () => {
    try {
      await saveSettings(localSettings);
      toast.success('Settings saved successfully!');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const handleTestDiscord = async () => {
    try {
      const success = await testDiscordWebhook();
      if (success) {
        toast.success('Discord notification test successful!');
      }
    } catch {
      // Error already handled in the store
    }
  };

  const handleAddApp = () => {
    if (!newApp.trim()) return;
    
    const apps = [...localSettings.restrictedApps];
    if (!apps.includes(newApp.trim())) {
      apps.push(newApp.trim());
      setLocalSettings({ ...localSettings, restrictedApps: apps });
      setNewApp('');
      toast.success(`Added ${newApp.trim()} to restricted apps`);
    } else {
      toast.error('App already in the list');
    }
  };

  const handleRemoveApp = (appToRemove: string) => {
    const apps = localSettings.restrictedApps.filter(app => app !== appToRemove);
    setLocalSettings({ ...localSettings, restrictedApps: apps });
    toast.success(`Removed ${appToRemove} from restricted apps`);
  };

  const handleAddKeyword = () => {
    if (!newKeyword.trim()) return;
    
    const keywords = [...localSettings.monitoringKeywords];
    const keyword = newKeyword.trim().toLowerCase();
    if (!keywords.includes(keyword)) {
      keywords.push(keyword);
      setLocalSettings({ ...localSettings, monitoringKeywords: keywords });
      setNewKeyword('');
      toast.success(`Added "${keyword}" to monitoring keywords`);
    } else {
      toast.error('Keyword already in the list');
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    const keywords = localSettings.monitoringKeywords.filter(keyword => keyword !== keywordToRemove);
    setLocalSettings({ ...localSettings, monitoringKeywords: keywords });
    toast.success(`Removed "${keywordToRemove}" from monitoring keywords`);
  };

  const discordUrlError = localSettings.discordWebhook && !isValidUrl(localSettings.discordWebhook) 
    ? 'Please enter a valid Discord webhook URL' 
    : undefined;

  return (
    <div className="space-y-6">
      {/* Discord Settings */}
      <Card title="💬 Discord Notifications">
        <div className="space-y-4">
          <Input
            label="Discord Webhook URL"
            type="url"
            value={localSettings.discordWebhook}
            onChange={(value) => setLocalSettings({ ...localSettings, discordWebhook: value })}
            placeholder="https://discord.com/api/webhooks/..."
            error={discordUrlError}
          />
          <div className="flex space-x-2">
            <Button
              variant="primary"
              onClick={handleTestDiscord}
              disabled={!localSettings.discordWebhook || !!discordUrlError || isLoading}
              loading={isLoading}
            >
              Test Notification
            </Button>
            <Button
              variant="warning"
              onClick={handleSaveSettings}
              disabled={isLoading}
              loading={isLoading}
            >
              Save Settings
            </Button>
          </div>
        </div>
      </Card>

      {/* Work Schedule */}
      <Card title="⏰ Work Schedule">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Check-in Time (24h format)"
              type="time"
              value={localSettings.checkInTime}
              onChange={(value) => setLocalSettings({ ...localSettings, checkInTime: value })}
            />
            <Input
              label="Check-out Time (24h format)"
              type="time"
              value={localSettings.checkOutTime}
              onChange={(value) => setLocalSettings({ ...localSettings, checkOutTime: value })}
            />
          </div>
          <p className="text-base-content opacity-70">
            Monitoring will automatically start when you check in during these hours.
          </p>
        </div>
      </Card>

      {/* Restricted Applications */}
      <Card title="🚫 Restricted Applications">
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={newApp}
              onChange={setNewApp}
              placeholder="Enter application name (e.g., chrome.exe, steam.exe)"
              className="flex-1"
            />
            <Button
              variant="primary"
              onClick={handleAddApp}
              disabled={!newApp.trim()}
            >
              Add App
            </Button>
          </div>

          {localSettings.restrictedApps.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-base-content">
                Current Restricted Apps:
              </h4>
              <div className="flex flex-wrap gap-2">
                {localSettings.restrictedApps.map((app) => (
                  <div key={app} className="badge badge-error gap-2">
                    <span>{app}</span>
                    <button
                      onClick={() => handleRemoveApp(app)}
                      className="btn btn-ghost btn-xs hover:btn-error"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <strong>Tip:</strong> Add executable names like "chrome.exe", "steam.exe", "discord.exe". 
              The app will detect when these applications are running and send notifications.
            </div>
          </div>
        </div>
      </Card>

      {/* Monitoring Keywords */}
      <Card title="🔍 Monitoring Keywords">
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={newKeyword}
              onChange={setNewKeyword}
              placeholder="Enter keyword (e.g., youtube, netflix, reddit)"
              className="flex-1"
            />
            <Button
              variant="primary"
              onClick={handleAddKeyword}
              disabled={!newKeyword.trim()}
            >
              Add Keyword
            </Button>
          </div>

          {localSettings.monitoringKeywords.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-base-content">
                Current Keywords:
              </h4>
              <div className="flex flex-wrap gap-2">
                {localSettings.monitoringKeywords.map((keyword) => (
                  <div key={keyword} className="badge badge-warning gap-2">
                    <span>{keyword}</span>
                    <button
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="btn btn-ghost btn-xs hover:btn-warning"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <strong>Tip:</strong> Add keywords that appear in window titles of distracting content. 
              Examples: youtube, netflix, facebook, twitter, reddit, games, memes.
            </div>
          </div>
        </div>
      </Card>

      {/* Application Preferences */}
      <Card title="⚙️ Application Preferences">
        <div className="space-y-4">
          <Toggle
            checked={localSettings.minimizeToTray || false}
            onChange={(checked) => setLocalSettings({ ...localSettings, minimizeToTray: checked })}
            label="Minimize to system tray instead of closing"
          />
          
          <Toggle
            checked={localSettings.autoStart || false}
            onChange={(checked) => setLocalSettings({ ...localSettings, autoStart: checked })}
            label="Start with system (launch at login)"
          />

          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium">Theme Preference</span>
            </label>
            <select
              value={localSettings.theme || 'auto'}
              onChange={(e) => setLocalSettings({ ...localSettings, theme: e.target.value as 'light' | 'dark' | 'auto' })}
              className="select select-bordered w-full"
            >
              <option value="auto">Auto (follow system)</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={handleSaveSettings}
          disabled={isLoading}
          loading={isLoading}
          size="lg"
        >
          Save All Settings
        </Button>
      </div>
    </div>
  );
};

export default Settings;