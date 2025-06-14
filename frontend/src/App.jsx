import { useState, useEffect, useCallback } from 'react';
import UrlInput from './components/UrlInput';
import Tab from './components/Tab';
import ConsoleView from './pages/ConsoleView';
import NetworkView from './pages/NetworkView';
import ExportButtons from './components/ExportButtons';
import FiltersPanel from './components/FiltersPanel';
import LogPanel from './components/LogPanel';
import DomView from './components/DomView';
import PerformanceView from './components/PerformanceView';
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
  const { isPolling, pollingUrl } = usePolling(analyze);
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
    <div className="min-h-screen bg-red-500 dark:bg-blue-500 text-gray-400 dark:text-gray-100 flex flex-col font-sans">
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
            <div className="md:flex md:flex-col">
              <div className="md:flex md:items-center md:justify-between mb-4">
                <div className="w-full md:w-auto">
                  <select
                    value={activeTab}
                    onChange={(e) => {
                      const tab = e.target.value;
                      if (tab === 'dom' || tab === 'performance') analyze(pollingUrl || '');
                      setActiveTab(tab);
                    }}
                    className="w-full md:hidden p-2 bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded mb-2"
                  >
                    <option value="console">Console</option>
                    <option value="network">Network</option>
                    <option value="logs">Logs</option>
                    <option value="dom">DOM</option>
                    <option value="performance">Performance</option>
                  </select>
                  <nav className="hidden md:flex gap-4 mb-4">
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
                      onClick={() => {
                        analyze(pollingUrl || '');
                        setActiveTab('dom');
                      }}
                      count={result?.html ? 1 : 0}
                    />
                    <Tab
                      label="Performance"
                      isActive={activeTab === 'performance'}
                      onClick={() => {
                        analyze(pollingUrl || '');
                        setActiveTab('performance');
                      }}
                      count={result?.performance?.load > 0 ? 1 : 0}
                    />
                  </nav>
                </div>
              </div>

              <FiltersPanel
                toggleFilters={toggleFilters}
                logFilter={logFilter}
                requestFilter={requestFilter}
                onToggle={handleToggleFilter}
                onLogFilterChange={setLogFilter}
                onRequestFilterChange={setRequestFilter}
                onReset={resetFilters}
                className="mb-4"
              />

              <ExportButtons data={{ logs: filteredLogs, requests: filteredRequests }} />

              {activeTab === 'console' && <ConsoleView logs={filteredLogs} />}
              {activeTab === 'network' && <NetworkView requests={filteredRequests} />}
              {activeTab === 'logs' && <LogPanel logs={runtimeLogs} />}
              {activeTab === 'dom' && <DomView html={result?.html} css={result?.css || []} />}
              {activeTab === 'performance' && <PerformanceView performance={result?.performance} />}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;