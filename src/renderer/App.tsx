import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAppStore } from './hooks/useAppStore';
import { Header, Sidebar } from './components/layout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import ActivityLog from './pages/ActivityLog';
import { theme } from './utils';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { loadSettings, isLoading, error } = useAppStore();

  useEffect(() => {
    // Initialize theme
    theme.init();
    
    // Load initial data
    loadSettings();
  }, [loadSettings]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'settings':
        return <Settings />;
      case 'activity':
        return <ActivityLog />;
      default:
        return <Dashboard />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <div className="text-error mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="card-title text-error mb-2">
              Something went wrong
            </h1>
            <p className="text-base-content opacity-70 mb-4">{error}</p>
            <div className="card-actions justify-center">
              <button
                onClick={() => window.location.reload()}
                className="btn btn-primary"
              >
                Reload App
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(var(--b1))',
            color: 'hsl(var(--bc))',
          },
          success: {
            iconTheme: {
              primary: 'hsl(var(--su))',
              secondary: 'hsl(var(--suc))',
            },
          },
          error: {
            iconTheme: {
              primary: 'hsl(var(--er))',
              secondary: 'hsl(var(--erc))',
            },
          },
        }}
      />
    </div>
  );
};

export default App;