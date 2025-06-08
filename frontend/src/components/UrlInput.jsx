import { useState } from 'react';
import { useAnalysis } from '../hooks/useAnalysis';
import AnalyzeButton from './AnalyzeButton';

function UrlInput({ setAnalysisData }) {
  const [url, setUrl] = useState('');
  const { analyze, loading, error } = useAnalysis();

  const handleAnalyze = async () => {
    if (!url) {
      console.warn('No URL provided');
      return;
    }
    console.log('Analyzing URL:', url);
    const data = await analyze(url);
    if (data) {
      console.log('Analysis result:', data);
      setAnalysisData(data);
    } else {
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
        required
      />
      <AnalyzeButton onAnalyze={handleAnalyze} loading={loading} disabled={!url} />
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}

export default UrlInput;