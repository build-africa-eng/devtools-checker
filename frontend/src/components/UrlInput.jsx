import { useState } from 'react';
import { useAnalysis } from '../hooks/useAnalysis';

function UrlInput({ setAnalysisData }) {
  const [url, setUrl] = useState('');
  const { analyze, loading, error } = useAnalysis();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = await analyze(url);
    if (data) setAnalysisData(data);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter website URL"
        className="p-2 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="p-2 bg-blue-600 rounded disabled:opacity-50"
      >
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </form>
  );
}

export default UrlInput;