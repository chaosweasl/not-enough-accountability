import React from 'react';
import { useAppStore } from '../../hooks/useAppStore';
import { getStatusDisplay, theme } from '../../utils';

const Header: React.FC = () => {
  const { session } = useAppStore();
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatSessionDuration = () => {
    if (!session.isCheckedIn || !session.checkInTime) return '';
    
    const diff = Math.floor((currentTime.getTime() - session.checkInTime.getTime()) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    return `Session Duration: ${hours}h ${minutes}m ${seconds}s`;
  };

  const statusDisplay = getStatusDisplay(session.status);

  const toggleTheme = () => {
    theme.toggle();
  };

  return (
    <header className="navbar bg-base-100 border-b border-base-300 px-6">
      <div className="navbar-start">
        <h1 className="text-2xl font-bold text-base-content">
          🎯 Accountability Tracker
        </h1>
      </div>

      <div className="navbar-center">
        <div className="flex space-x-2">
          <div className={`badge ${
            session.isCheckedIn ? 'badge-success' : 'badge-ghost'
          }`}>
            {statusDisplay.text}
          </div>
          {session.isMonitoring && (
            <div className="badge badge-primary animate-pulse">
              Monitoring Active
            </div>
          )}
        </div>
      </div>

      <div className="navbar-end">
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-lg font-mono text-base-content">
              {currentTime.toLocaleTimeString()}
            </div>
            {session.isCheckedIn && (
              <div className="text-sm text-base-content opacity-70">
                {formatSessionDuration()}
              </div>
            )}
          </div>
          
          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-circle"
            title="Toggle theme"
          >
            <svg
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;