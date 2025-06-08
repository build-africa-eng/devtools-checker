import { useState, useEffect } from 'react';
import UrlInput from './components/UrlInput';
import Tab from './components/Tab';
import ConsoleView from './pages/ConsoleView';
import NetworkView from './pages/NetworkView';
import ExportButtons from './components/ExportButtons';
import FiltersPanel from './components/FiltersPanel'; 
import { useAnalysis } from './hooks/useAnalysis';

function App() {
  const [analysisData, setAnalysisData] = useState(null);
  const [activeTab, setActiveTab] = useState('console');
  const [filters, setFilters] = useState({ errors: false, failedRequests: false, warnings: false });
  const { analyze, loading, error, result } = useAnalysis();

  useEffect(() => {
    if (result) {
      console.log('Setting analysisData from result:', result);
      setAnalysisData(result);
    }
  }, [result]);

  const handleToggleFilter = (filter) => {
    setFilters((prev) => ({ ...prev, [filter]: !prev[filter] }));
  };

  const hasData = analysisData?.logs?.length || analysisData?.requests?.length;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">DevTools Checker</h1>
        <UrlInput setAnalysisData={(url) => analyze(url).then(data => data && setAnalysisData(data))} />
        {error && <p className="text-red-500">{error}</p>}
        {hasData && <ExportButtons data={analysisData} />}
      </div>
      <div className="p-4">
        <FiltersPanel filters={filters} onToggle={handleToggleFilter} />
      </div>
      <div className="flex border-b border-gray-700">
        <Tab label="Console" isActive={activeTab === 'console'} onClick={() => setActiveTab('console')} />
        <Tab label="Network" isActive={activeTab === 'network'} onClick={() => setActiveTab('network')} />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'console' && <ConsoleView logs={analysisData?.logs || []} filters={filters} />}
        {activeTab === 'network' && <NetworkView requests={analysisData?.requests || []} filters={filters} />}
      </div>
    </div>
  );
}

export default App;