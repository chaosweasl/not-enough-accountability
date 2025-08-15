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
    } catch {
      toast.error('Failed to start monitoring');
    }
  };

  const handleStopMonitoring = async () => {
    const reason = window.prompt('Reason for stopping monitoring:') || 'User requested stop';
    try {
      await stopMonitoring(reason);
      toast.success('Monitoring stopped');
    } catch {
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
    } catch {
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

        <div className="text-base-content opacity-70">
          {!session.isCheckedIn && (
            <p>🔒 Check in first to enable monitoring controls</p>
          )}
          {session.isCheckedIn && !session.isMonitoring && (
            <p>📊 Monitoring is paused. Click "Start Monitoring" to resume</p>
          )}
        </div>

        {session.isMonitoring && (
          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span>Monitoring active - checking for violations every 5 seconds</span>
            <div className="loading loading-dots loading-sm"></div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MonitoringControls;