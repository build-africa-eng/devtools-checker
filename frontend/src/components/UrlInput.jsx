import { useState } from 'react';
import { useAnalysis } from '../hooks/useAnalysis';
import AnalyzeButton from './AnalyzeButton';

function UrlInput({ setAnalysisData }) {
  const [url, setUrl] = useState('');
  const { loading, error } = useAnalysis();

  const handleAnalyze = async () => {
    if (!url) return;
    const data = await setAnalysisData(url);
    if (!data) {
      console.log('Analysis failed, no data returned');
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter website URL"
        className="p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none"
        disabled={loading}
      />
      <AnalyzeButton onAnalyze={handleAnalyze} loading={loading} disabled={!url || loading} />
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}

export default UrlInput;