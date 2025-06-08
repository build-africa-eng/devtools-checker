import { useState, useEffect, useCallback } from 'react';
import UrlInput from './components/UrlInput';
import Tab from './components/Tab';
import ConsoleView from './pages/ConsoleView';
import NetworkView from './pages/NetworkView';
import ExportButtons from './components/ExportButtons';
import FiltersPanel from './components/FiltersPanel';
import { useAnalysis } from './hooks/useAnalysis';
import { useFilteredLogs } from './hooks/useFilteredLogs';
import { Moon, Sun } from 'lucide-react';

function App() {
  const { analyze, loading, error, result } = useAnalysis();
  const [activeTab, setActiveTab] = useState('console');
  const [logFilter, setLogFilter] = useState('all');
  const [requestFilter, setRequestFilter] = useState('all');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);

  const { filteredLogs, filteredRequests, warning } = useFilteredLogs(result || { logs: [], requests: [], warning: null }, logFilter, requestFilter);

  const hasData = filteredLogs.length > 0 || filteredRequests.length > 0;

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const newMode = !prev;
      document.documentElement.classList.toggle('dark', newMode);
      return newMode;
    });
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-background text-text flex flex-col">
      <div className="p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">DevTools Checker</h1>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun className="w-5 h-5 text-accent" /> : <Moon className="w-5 h-5 text-accent" />}
        </button>
      </div>
      <div className="p-4">
        <UrlInput analyze={analyze} />
        {error && <p className="text-error mt-2">Error: {error}</p>}
        {warning && <p className="text-accent mt-2">Warning: {warning}</p>}
        {hasData && <ExportButtons data={{ logs: filteredLogs, requests: filteredRequests }} />}
      </div>
      <div className="p-4">
        <FiltersPanel
          filters={{ console: logFilter, network: requestFilter }}
          onChange={(type, value) => {
            if (type === 'console') setLogFilter(value);
            if (type === 'network') setRequestFilter(value);
          }}
          onReset={() => {
            setLogFilter('all');
            setRequestFilter('all');
          }}
        />
      </div>
      <div className="flex border-b border-gray-700">
        <Tab label="Console" isActive={activeTab === 'console'} onClick={() => setActiveTab('console')} />
        <Tab label="Network" isActive={activeTab === 'network'} onClick={() => setActiveTab('network')} />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'console' && (
          <ConsoleView logs={filteredLogs} filter={logFilter} setFilter={setLogFilter} />
        )}
        {activeTab === 'network' && (
          <NetworkView requests={filteredRequests} filter={requestFilter} setFilter={setRequestFilter} />
        )}
      </div>
    </div>
  );
}

export default App;