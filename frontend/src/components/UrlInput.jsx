import React, { useState } from 'react';
import AnalyzeButton from './AnalyzeButton';
import { useAnalysis } from '../hooks/useAnalysis'; // adjust path

function UrlInput({ analyze }) {
  const [url, setUrl] = useState('');
  const [localError, setLocalError] = useState(null);
  const { loading, error } = useAnalysis();

  const isValidUrl = (str) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const normalizeUrl = (str) => {
    try {
      return new URL(str).href;
    } catch {
      return new URL(`https://${str}`).href;
    }
  };

  const handleAnalyze = async () => {
    if (!url) {
      setLocalError('URL is required');
      return;
    }
    if (!isValidUrl(url)) {
      try {
        normalizeUrl(url); // will throw if even with https:// it's invalid
      } catch {
        setLocalError('Please enter a valid URL');
        return;
      }
    }

    setLocalError(null);
    const finalUrl = normalizeUrl(url);
    const data = await analyze(finalUrl);
    if (!data) {
      console.log('Analysis failed, no data returned');
    }
  };

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleAnalyze(); }} className="flex flex-col gap-2">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter website URL (e.g., https://example.com)"
        className={`p-2 rounded bg-gray-800 text-white border ${
          error || localError ? 'border-red-500' : 'border-gray-700'
        } focus:outline-none focus:border-blue-500`}
        disabled={loading}
        aria-label="Website URL input"
        aria-describedby={error || localError ? 'url-error' : undefined}
      />
      <AnalyzeButton onAnalyze={handleAnalyze} loading={loading} disabled={!url || loading} />
      {(error || localError) && (
        <p id="url-error" className="text-red-500 text-sm">
          {error || localError}
        </p>
      )}
    </form>
  );
}

export default UrlInput;