import React, { useEffect, useState, useCallback } from 'react';
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
  const { violations, isLoading, loadActivityLog, exportActivityLog } =
    useAppStore();
  const [showExportModal, setShowExportModal] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    type: 'all',
    dateRange: 'today',
    searchTerm: '',
  });

  // Memoize the load function to prevent infinite re-renders
  const memoizedLoadActivityLog = useCallback(() => {
    loadActivityLog();
  }, [loadActivityLog]);

  useEffect(() => {
    memoizedLoadActivityLog();
  }, [memoizedLoadActivityLog]);

  const handleExport = async () => {
    try {
      await exportActivityLog();
      toast.success('Activity log exported successfully!');
      setShowExportModal(false);
    } catch (error) {
      toast.error('Failed to export activity log');
      console.log(error);
    }
  };

  const handleClearLog = async () => {
    if (
      window.confirm(
        'Are you sure you want to clear the activity log? This action cannot be undone.'
      )
    ) {
      try {
        if (window.electronAPI?.clearActivityLog) {
          await window.electronAPI.clearActivityLog();
          await loadActivityLog();
          toast.success('Activity log cleared successfully!');
        }
      } catch (error) {
        toast.error('Failed to clear activity log');
        console.log(error);
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
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
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
      const matchesTrigger = violation.trigger
        .toLowerCase()
        .includes(searchLower);
      const matchesWindowTitle = violation.windowTitle
        ?.toLowerCase()
        .includes(searchLower);
      if (!matchesTrigger && !matchesWindowTitle) {
        return false;
      }
    }

    return true;
  });

  // Group violations by date
  const groupedViolations = filteredViolations.reduce(
    (groups, violation) => {
      const date = violation.timestamp.toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(violation);
      return groups;
    },
    {} as Record<string, typeof violations>
  );

  const violationStats = {
    total: violations.length,
    today: violations.filter((v) => {
      const today = new Date();
      const violationDate = v.timestamp;
      return violationDate.toDateString() === today.toDateString();
    }).length,
    apps: violations.filter((v) => v.type === 'app').length,
    keywords: violations.filter((v) => v.type === 'keyword').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Total Violations</div>
            <div className="stat-value text-primary">{violationStats.total}</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Today</div>
            <div className="stat-value text-error">{violationStats.today}</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">App Violations</div>
            <div className="stat-value text-info">{violationStats.apps}</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Keyword Violations</div>
            <div className="stat-value text-warning">{violationStats.keywords}</div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <Card title="📊 Activity Log">
        <div className="space-y-4">
          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <label className="label">
                <span className="label-text font-medium">Type:</span>
              </label>
              <select
                value={filters.type}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    type: e.target.value as FilterOptions['type'],
                  })
                }
                className="select select-bordered select-sm"
              >
                <option value="all">All</option>
                <option value="app">Apps</option>
                <option value="keyword">Keywords</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="label">
                <span className="label-text font-medium">Period:</span>
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    dateRange: e.target.value as FilterOptions['dateRange'],
                  })
                }
                className="select select-bordered select-sm"
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
                onChange={(e) =>
                  setFilters({ ...filters, searchTerm: e.target.value })
                }
                className="input input-bordered input-sm w-full"
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
          <div className="text-sm text-base-content opacity-70">
            Showing {filteredViolations.length} of {violations.length}{' '}
            violations
          </div>
        </div>
      </Card>

      {/* Violations List */}
      {filteredViolations.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="h-12 w-12 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No violations found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {violations.length === 0
                ? "You're doing great! No violations have been recorded yet."
                : 'No violations match your current filters. Try adjusting the filters above.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedViolations).map(([date, dayViolations]) => (
            <Card key={date}>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-base-content border-b border-base-300 pb-2">
                  {date} ({dayViolations.length} violation
                  {dayViolations.length !== 1 ? 's' : ''})
                </h3>

                <div className="space-y-2">
                  {dayViolations.map((violation) => {
                    const severityDisplay = getViolationSeverityDisplay(
                      violation.severity || 'medium'
                    );

                    return (
                      <div
                        key={violation.id}
                        className="card bg-base-100 border border-base-300 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div
                                className={`badge ${
                                  violation.type === 'app'
                                    ? 'badge-info'
                                    : 'badge-warning'
                                }`}
                              >
                                {violation.type === 'app'
                                  ? '📱 App'
                                  : '🔍 Keyword'}
                              </div>

                              <span
                                className={`badge ${severityDisplay.color}`}
                              >
                                {severityDisplay.text}
                              </span>

                              <span className="text-sm opacity-60">
                                {formatRelativeTime(violation.timestamp)}
                              </span>
                            </div>

                            <div>
                              <p className="font-medium text-base-content">
                                {violation.trigger}
                              </p>
                              {violation.windowTitle && (
                                <p className="text-sm opacity-70">
                                  Window: {violation.windowTitle}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-mono opacity-70">
                              {violation.timestamp.toLocaleTimeString()}
                            </div>
                            <div
                              className={`badge mt-1 ${
                                violation.action === 'warned'
                                  ? 'badge-warning'
                                  : 'badge-ghost'
                              }`}
                            >
                              {violation.action}
                            </div>
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
          <p className="text-base-content opacity-70">
            This will export all {violations.length} violations to a JSON file
            that you can save to your computer.
          </p>

          <div className="alert alert-info">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <div>
              <h4 className="font-medium">Export includes:</h4>
              <ul className="text-sm space-y-1 mt-1">
                <li>• Violation timestamps and types</li>
                <li>• Triggered applications and keywords</li>
                <li>• Window titles and actions taken</li>
                <li>• Severity levels and metadata</li>
              </ul>
            </div>
          </div>

          <div className="modal-action">
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
