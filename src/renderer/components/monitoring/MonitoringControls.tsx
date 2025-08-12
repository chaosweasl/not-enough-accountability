import React from 'react';
import { useAppStore } from '../../hooks/useAppStore';
import { Button, Card } from '../ui';
import toast from 'react-hot-toast';

const MonitoringControls: React.FC = () => {
  const {
    session,
    isLoading,
    startMonitoring,
    stopMonitoring,
    pauseMonitoring,
  } = useAppStore();

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

  return (
    <Card title="⚙️ Monitoring Controls">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="success"
            onClick={handleStartMonitoring}
            disabled={!session.isCheckedIn || session.isMonitoring || isLoading}
            loading={isLoading}
          >
            {session.isMonitoring ? 'Monitoring Active' : 'Start Monitoring'}
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

        <div className="text-sm text-gray-600 dark:text-gray-400">
          {!session.isCheckedIn && (
            <p>🔒 Check in first to enable monitoring controls</p>
          )}
          {session.isCheckedIn && !session.isMonitoring && (
            <p>📊 Monitoring is paused. Click "Start Monitoring" to resume</p>
          )}
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
  );
};

export default MonitoringControls;