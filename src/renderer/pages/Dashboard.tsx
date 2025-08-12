import React from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { Card, Button } from '../components/ui';
import { isWorkHours, formatRelativeTime } from '../utils';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const {
    session,
    settings,
    violations,
    // stats,
    isLoading,
    checkIn,
    checkOut,
    startMonitoring,
    stopMonitoring,
    pauseMonitoring,
  } = useAppStore();

  const handleCheckIn = async () => {
    try {
      await checkIn();
      toast.success('Checked in successfully!');
    } catch (error) {
      toast.error('Failed to check in');
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut();
      toast.success('Checked out successfully!');
    } catch (error) {
      toast.error('Failed to check out');
    }
  };

  const handleStartMonitoring = async () => {
    try {
      await startMonitoring();
      toast.success('Monitoring started!');
    } catch (error) {
      toast.error('Failed to start monitoring');
    }
  };

  const handleStopMonitoring = async () => {
    const reason = window.prompt('Reason for stopping monitoring:') || 'User requested stop';
    try {
      await stopMonitoring(reason);
      toast.success('Monitoring stopped');
    } catch (error) {
      toast.error('Failed to stop monitoring');
    }
  };

  const handlePauseMonitoring = async () => {
    const reason = window.prompt('Reason for pausing monitoring:') || 'User requested pause';
    const minutesStr = window.prompt('Pause duration (minutes):', '60');
    const minutes = parseInt(minutesStr || '60', 10);
    
    try {
      await pauseMonitoring(reason, minutes);
      toast.success(`Monitoring paused for ${minutes} minutes`);
    } catch (error) {
      toast.error('Failed to pause monitoring');
    }
  };

  const currentWorkHours = isWorkHours(settings.checkInTime, settings.checkOutTime);
  const recentViolations = violations.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {session.isCheckedIn ? 'Checked In' : 'Not Checked In'}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${session.isCheckedIn ? 'bg-green-500' : 'bg-gray-300'}`} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monitoring</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {session.isMonitoring ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${session.isMonitoring ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Violations</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {session.todayViolations}
              </p>
            </div>
            <div className="text-red-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Check-in/Out Controls */}
      <Card title="⏰ Daily Check-in/Out">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Work Hours: {settings.checkInTime} - {settings.checkOutTime}
              </p>
              {currentWorkHours && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  Currently within work hours
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="success"
                onClick={handleCheckIn}
                disabled={session.isCheckedIn || isLoading}
                loading={isLoading}
              >
                Check In
              </Button>
              <Button
                variant="danger"
                onClick={handleCheckOut}
                disabled={!session.isCheckedIn || isLoading}
                loading={isLoading}
              >
                Check Out
              </Button>
            </div>
          </div>

          {session.isCheckedIn && session.checkInTime && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200">
                Checked in at {session.checkInTime.toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Monitoring Controls */}
      <Card title="⚙️ Monitoring Controls">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="success"
              onClick={handleStartMonitoring}
              disabled={!session.isCheckedIn || session.isMonitoring || isLoading}
              loading={isLoading}
            >
              Resume Monitoring
            </Button>
            <Button
              variant="warning"
              onClick={handlePauseMonitoring}
              disabled={!session.isCheckedIn || !session.isMonitoring || isLoading}
              loading={isLoading}
            >
              Pause Monitoring
            </Button>
            <Button
              variant="danger"
              onClick={handleStopMonitoring}
              disabled={!session.isCheckedIn || !session.isMonitoring || isLoading}
              loading={isLoading}
            >
              Stop Monitoring
            </Button>
          </div>

          {session.isMonitoring && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Monitoring active - checking for violations every 5 seconds
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="📊 Today's Summary">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Violations</span>
              <span className="text-sm font-medium">{session.todayViolations}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Restricted Apps</span>
              <span className="text-sm font-medium">{settings.restrictedApps.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Keywords</span>
              <span className="text-sm font-medium">{settings.monitoringKeywords.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Session Status</span>
              <span className={`text-sm font-medium ${session.isCheckedIn ? 'text-green-600' : 'text-gray-500'}`}>
                {session.status}
              </span>
            </div>
          </div>
        </Card>

        <Card title="🚨 Recent Violations">
          {recentViolations.length > 0 ? (
            <div className="space-y-2">
              {recentViolations.map((violation) => (
                <div key={violation.id} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      {violation.trigger}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-300">
                      {violation.type} • {formatRelativeTime(violation.timestamp)}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 rounded">
                    {violation.action}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No violations today 🎉
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;