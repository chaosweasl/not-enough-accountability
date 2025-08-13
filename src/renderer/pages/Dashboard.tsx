import React from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { Card, Button } from '../components/ui';
import { MonitoringControls } from '../components/monitoring';
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
  } = useAppStore();

  const handleCheckIn = async () => {
    try {
      await checkIn();
      toast.success('Checked in successfully!');
    } catch (error) {
      toast.error('Failed to check in');
      console.log(error);
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut();
      toast.success('Checked out successfully!');
    } catch (error) {
      toast.error('Failed to check out');
      console.log(error);
    }
  };

  const currentWorkHours = isWorkHours(
    settings.checkInTime,
    settings.checkOutTime
  );
  const recentViolations = violations.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Status</div>
            <div className="stat-value text-lg">
              {session.isCheckedIn ? 'Checked In' : 'Not Checked In'}
            </div>
            <div className="stat-desc">
              <div className={`badge ${session.isCheckedIn ? 'badge-success' : 'badge-ghost'}`}>
                {session.isCheckedIn ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Monitoring</div>
            <div className="stat-value text-lg">
              {session.isMonitoring ? 'Active' : 'Inactive'}
            </div>
            <div className="stat-desc">
              <div className={`badge ${session.isMonitoring ? 'badge-primary animate-pulse' : 'badge-ghost'}`}>
                {session.isMonitoring ? 'Running' : 'Stopped'}
              </div>
            </div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Today's Violations</div>
            <div className="stat-value text-error">{session.todayViolations}</div>
            <div className="stat-desc">
              <div className="stat-figure text-error">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Check-in/Out Controls */}
      <Card title="⏰ Daily Check-in/Out">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base-content opacity-70">
                Work Hours: {settings.checkInTime} - {settings.checkOutTime}
              </p>
              {currentWorkHours && (
                <div className="badge badge-success badge-sm mt-1">
                  Currently within work hours
                </div>
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
            <div className="alert alert-success">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>Checked in at {session.checkInTime.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Monitoring Controls */}
      <MonitoringControls />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="📊 Today's Summary">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-base-content opacity-70">Violations</span>
              <span className="font-medium">{session.todayViolations}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-content opacity-70">Restricted Apps</span>
              <span className="font-medium">{settings.restrictedApps.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-content opacity-70">Keywords</span>
              <span className="font-medium">{settings.monitoringKeywords.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-base-content opacity-70">Session Status</span>
              <div className={`badge ${session.isCheckedIn ? 'badge-success' : 'badge-ghost'}`}>
                {session.status}
              </div>
            </div>
          </div>
        </Card>

        <Card title="🚨 Recent Violations">
          {recentViolations.length > 0 ? (
            <div className="space-y-2">
              {recentViolations.map((violation) => (
                <div key={violation.id} className="alert alert-error">
                  <div className="flex-1">
                    <p className="font-medium">{violation.trigger}</p>
                    <p className="text-xs opacity-70">
                      {violation.type} • {formatRelativeTime(violation.timestamp)}
                    </p>
                  </div>
                  <div className="badge badge-error badge-outline">
                    {violation.action}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-6xl mb-2">🎉</div>
              <p className="text-base-content opacity-70">No violations today</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
