import { useState } from 'react';
import UrlInput from './components/UrlInput';
import Tab from './components/Tab';
import ConsoleView from './pages/ConsoleView';
import NetworkView from './pages/NetworkView';
import ExportButtons from './components/ExportButtons';
import { useAnalysis } from './hooks/useAnalysis'; // Adjust path as needed

function App() {
  const [analysisData, setAnalysisData] = useState(null);
  const [activeTab, setActiveTab] = useState('console');
  const { analyze, loading, error, result } = useAnalysis();

  // Update analysisData with result from useAnalysis
  React.useEffect(() => {
    if (result) setAnalysisData(result);
  }, [result]);

  const handleAnalyze = async (url) => {
    const data = await analyze(url);
    if (data) setAnalysisData(data);
  };

  const hasData = analysisData?.logs?.length || analysisData?.requests?.length;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">DevTools Checker</h1>
        <UrlInput setAnalysisData={handleAnalyze} />
        {error && <p className="text-red-500">{error}</p>}
        {hasData && <ExportButtons data={analysisData} />}
      </div>
      <div className="flex border-b border-gray-700">
        <Tab label="Console" isActive={activeTab === 'console'} onClick={() => setActiveTab('console')} />
        <Tab label="Network" isActive={activeTab === 'network'} onClick={() => setActiveTab('network')} />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'console' && <ConsoleView logs={analysisData?.logs || []} />}
        {activeTab === 'network' && <NetworkView requests={analysisData?.requests || []} />}
      </div>
    </div>
  );
}

export default App;