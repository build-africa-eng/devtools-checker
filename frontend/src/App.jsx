import { useState, useEffect, useCallback } from 'react';
import UrlInput from './components/UrlInput';
import Tab from './components/Tab';
import ConsoleView from './pages/ConsoleView';
import NetworkView from './pages/NetworkView';
import ExportButtons from './components/ExportButtons';
import FiltersPanel from './components/FiltersPanel';
import LogPanel from './components/LogPanel';
import DomView from './components/DomView'; // Assuming this is created
import PerformanceView from './components/PerformanceView'; // New component for performance
import { useAnalysis } from './hooks/useAnalysis';
import { useFilteredLogs } from './hooks/useFilteredLogs';
import { useDarkMode } from './hooks/useDarkMode';
import { usePolling } from './hooks/usePolling';
import { useRuntimeLogs } from './hooks/useRuntimeLogs';
import { formatErrorLog } from './utils/formatErrorLog';
import { Moon, Sun, Loader2 } from 'lucide-react';

function App() {
  const { analyze, cancel, loading, error, result, startPolling, stopPolling } = useAnalysis();
  const [activeTab, setActiveTab] = useState('console');
  const [logFilter, setLogFilter] = useState('all');
  const [requestFilter, setRequestFilter] = useState('all');
  const [toggleFilters, setToggleFilters] = useState({
    errors: false,
    warnings: false,
    failedRequests: false,
  });
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const { isPolling, pollingUrl } = usePolling(analyze); // Simplified usage
  const { logs: runtimeLogs, log } = useRuntimeLogs();

  const { filteredLogs, filteredRequests, warning } = useFilteredLogs(
    result,
    toggleFilters,
    logFilter,
    requestFilter
  );

  const hasData = filteredLogs.length > 0 || filteredRequests.length > 0 || result?.html || result?.performance;

  useEffect(() => {
    const handleError = (event) => {
      log(formatErrorLog(event));
      if (error) log(formatErrorLog({ message: error.message || 'Unknown error' }));
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [error, log]);

  const handleToggleFilter = useCallback(
    (filterName) => {
      setToggleFilters(prev => ({ ...prev, [filterName]: !prev[filterName] }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setLogFilter('all');
    setRequestFilter('all');
    setToggleFilters({ errors: false, warnings: false, failedRequests: false });
  }, []);

  const handleAnalyze = useCallback((normalizedUrl) => {
    log(`Analyzing URL: ${normalizedUrl}`);
    if (isPolling) {
      stopPolling();
      startPolling(normalizedUrl);
    } else {
      analyze(normalizedUrl);
    }
  }, [analyze, isPolling, startPolling, stopPolling, log]);

  useEffect(() => {
    if (result) {
      log(`Analysis Result: ${result.logs?.length || 0} logs, ${result.requests?.length || 0} requests`);
    }
  }, [result, log]);

  useEffect(() => {
    if (filteredLogs.length > 0 || filteredRequests.length > 0) {
      log(`Filtered Data: ${filteredLogs.length} logs, ${filteredRequests.length} requests`);
    }
  }, [filteredLogs, filteredRequests, log]);

  return (
    <div className="min-h-screen bg-red-200 dark:bg-blue-200 text-gray-800 dark:text-gray-900 flex flex-col font-sans">
      <header className="p-4 flex justify-between items-center border-b border-gray-300 dark:border-gray-700 sticky top-0 bg-gray-100 dark:bg-gray-800 z-10">
        <h1 className="text-2xl font-bold">DevTools Checker</h1>
        <div className="flex items-center gap-3">
          {pollingUrl && (
            <button
              onClick={() => (isPolling ? stopPolling() : startPolling(pollingUrl))}
              className="text-sm px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition"
            >
              {isPolling ? 'Stop Polling' : 'Start Polling'}
            </button>
          )}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={cancel}
            className="text-sm px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition"
            disabled={!loading}
          >
            Cancel
          </button>
        </div>
      </header>

      <main className="flex-grow p-4 max-w-7xl mx-auto w-full">
        <section className="mb-6">
          <UrlInput onAnalyze={handleAnalyze} loading={loading} globalError={error} />
          {warning && (
            <p className="text-yellow-600 dark:text-yellow-400 mt-2 text-sm" role="alert">
              {warning}
            </p>
          )}
        </section>

        {loading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {hasData && (
          <>
            <nav className="flex gap-4 mb-4">
              <Tab
                label="Console"
                isActive={activeTab === 'console'}
                onClick={() => setActiveTab('console')}
                count={filteredLogs.length}
              />
              <Tab
                label="Network"
                isActive={activeTab === 'network'}
                onClick={() => setActiveTab('network')}
                count={filteredRequests.length}
              />
              <Tab
                label="Logs"
                isActive={activeTab === 'logs'}
                onClick={() => setActiveTab('logs')}
                count={runtimeLogs.length}
              />
              <Tab
                label="DOM"
                isActive={activeTab === 'dom'}
                onClick={() => setActiveTab('dom')}
                count={result?.html ? 1 : 0}
              />
              <Tab
                label="Performance"
                isActive={activeTab === 'performance'}
                onClick={() => setActiveTab('performance')}
                count={result?.performance?.load > 0 ? 1 : 0}
              />
            </nav>

            <FiltersPanel
              toggleFilters={toggleFilters}
              logFilter={logFilter}
              requestFilter={requestFilter}
              onToggle={handleToggleFilter}
              onLogFilterChange={setLogFilter}
              onRequestFilterChange={setRequestFilter}
              onReset={resetFilters}
            />

            <ExportButtons data={{ logs: filteredLogs, requests: filteredRequests }} />

            {activeTab === 'console' && <ConsoleView logs={filteredLogs} />}
            {activeTab === 'network' && <NetworkView requests={filteredRequests} />}
            {activeTab === 'logs' && <LogPanel logs={runtimeLogs} />}
            {activeTab === 'dom' && <DomView html={result?.html} css={result?.css || []} />}
            {activeTab === 'performance' && <PerformanceView performance={result?.performance} />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;