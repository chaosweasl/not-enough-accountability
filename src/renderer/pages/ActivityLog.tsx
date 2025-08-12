import React, { useEffect, useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { Card, Button, Modal } from '../components/ui';
import { formatRelativeTime, getViolationSeverityDisplay } from '../utils';
import toast from 'react-hot-toast';

interface FilterOptions {
  type: 'all' | 'app' | 'keyword';
  dateRange: 'today' | 'week' | 'month' | 'all';
  searchTerm: string;
}

const ActivityLog: React.FC = () => {
  const { violations, isLoading, loadActivityLog, exportActivityLog } = useAppStore();
  const [showExportModal, setShowExportModal] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    type: 'all',
    dateRange: 'today',
    searchTerm: '',
  });

  useEffect(() => {
    loadActivityLog();
  }, [loadActivityLog]);

  const handleExport = async () => {
    try {
      await exportActivityLog();
      toast.success('Activity log exported successfully!');
      setShowExportModal(false);
    } catch (error) {
      toast.error('Failed to export activity log');
    }
  };

  const handleClearLog = async () => {
    if (window.confirm('Are you sure you want to clear the activity log? This action cannot be undone.')) {
      try {
        if (window.electronAPI?.clearActivityLog) {
          await window.electronAPI.clearActivityLog();
          await loadActivityLog();
          toast.success('Activity log cleared successfully!');
        }
      } catch (error) {
        toast.error('Failed to clear activity log');
      }
    }
  };

  // Filter violations based on current filters
  const filteredViolations = violations.filter((violation) => {
    // Type filter
    if (filters.type !== 'all' && violation.type !== filters.type) {
      return false;
    }

    // Date range filter
    const now = new Date();
    const violationDate = violation.timestamp;
    
    switch (filters.dateRange) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (violationDate < today) return false;
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (violationDate < weekAgo) return false;
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (violationDate < monthAgo) return false;
        break;
      case 'all':
      default:
        break;
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      const matchesTrigger = violation.trigger.toLowerCase().includes(searchLower);
      const matchesWindowTitle = violation.windowTitle?.toLowerCase().includes(searchLower);
      if (!matchesTrigger && !matchesWindowTitle) {
        return false;
      }
    }

    return true;
  });

  // Group violations by date
  const groupedViolations = filteredViolations.reduce((groups, violation) => {
    const date = violation.timestamp.toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(violation);
    return groups;
  }, {} as Record<string, typeof violations>);

  const violationStats = {
    total: violations.length,
    today: violations.filter(v => {
      const today = new Date();
      const violationDate = v.timestamp;
      return violationDate.toDateString() === today.toDateString();
    }).length,
    apps: violations.filter(v => v.type === 'app').length,
    keywords: violations.filter(v => v.type === 'keyword').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {violationStats.total}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Violations
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {violationStats.today}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Today
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {violationStats.apps}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              App Violations
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {violationStats.keywords}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Keyword Violations
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card title="📊 Activity Log">
        <div className="space-y-4">
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Type:
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value as FilterOptions['type'] })}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="all">All</option>
                <option value="app">Apps</option>
                <option value="keyword">Keywords</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Period:
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as FilterOptions['dateRange'] })}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="today">Today</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="all">All Time</option>
              </select>
            </div>

            <div className="flex-1 min-w-48">
              <input
                type="text"
                placeholder="Search violations..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button
              variant="primary"
              onClick={() => setShowExportModal(true)}
              disabled={isLoading || violations.length === 0}
            >
              Export Log
            </Button>
            <Button
              variant="danger"
              onClick={handleClearLog}
              disabled={isLoading || violations.length === 0}
            >
              Clear Log
            </Button>
            <Button
              variant="secondary"
              onClick={loadActivityLog}
              disabled={isLoading}
              loading={isLoading}
            >
              Refresh
            </Button>
          </div>

          {/* Results Summary */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredViolations.length} of {violations.length} violations
          </div>
        </div>
      </Card>

      {/* Violations List */}
      {filteredViolations.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No violations found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {violations.length === 0 
                ? "You're doing great! No violations have been recorded yet." 
                : "No violations match your current filters. Try adjusting the filters above."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedViolations).map(([date, dayViolations]) => (
            <Card key={date}>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  {date} ({dayViolations.length} violation{dayViolations.length !== 1 ? 's' : ''})
                </h3>
                
                <div className="space-y-2">
                  {dayViolations.map((violation) => {
                    const severityDisplay = getViolationSeverityDisplay(violation.severity || 'medium');
                    
                    return (
                      <div
                        key={violation.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              violation.type === 'app' 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {violation.type === 'app' ? '📱 App' : '🔍 Keyword'}
                            </div>
                            
                            <span className={`px-2 py-1 rounded text-xs font-medium ${severityDisplay.color}`}>
                              {severityDisplay.text}
                            </span>
                            
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatRelativeTime(violation.timestamp)}
                            </span>
                          </div>
                          
                          <div className="mt-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {violation.trigger}
                            </p>
                            {violation.windowTitle && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Window: {violation.windowTitle}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-mono text-gray-600 dark:text-gray-400">
                            {violation.timestamp.toLocaleTimeString()}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded mt-1 ${
                            violation.action === 'warned' 
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {violation.action}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Activity Log"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            This will export all {violations.length} violations to a JSON file that you can save to your computer.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Export includes:
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Violation timestamps and types</li>
              <li>• Triggered applications and keywords</li>
              <li>• Window titles and actions taken</li>
              <li>• Severity levels and metadata</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="secondary"
              onClick={() => setShowExportModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleExport}
              loading={isLoading}
            >
              Export Log
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ActivityLog;