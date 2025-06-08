// src/components/UrlInput.js
import React, { useState } from 'react';
import AnalyzeButton from './AnalyzeButton';

function UrlInput({ onAnalyze, loading, globalError }) {
  const [url, setUrl] = useState('');
  const [localError, setLocalError] = useState('');

  const handleAnalyzeClick = () => {
    if (!url.trim()) {
      setLocalError('Please enter a URL.');
      return;
    }

    // Basic validation for a more user-friendly experience
    let finalUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      finalUrl = `https://${url}`;
    }

    // Reset local error before new analysis
    setLocalError('');
    onAnalyze(finalUrl);
  };

  return (
    <div className="flex flex-col gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAnalyzeClick();
        }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <input
          type="text" // Use text to allow URLs without http prefix
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="example.com"
          className={`flex-grow p-2 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-white border ${
            globalError || localError ? 'border-red-500' : 'border-gray-500'
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          disabled={loading}
          aria-label="Website URL input"
          aria-invalid={!!(globalError || localError)}
          aria-describedby="url-error"
        />
        <AnalyzeButton onAnalyze={handleAnalyzeClick} loading={loading} disabled={!url || loading} />
      </form>
      {(globalError || localError) && (
        <p id="url-error" className="text-red-500 text-sm mt-1">
          {globalError || localError}
        </p>
      )}
    </div>
  );
}

export default UrlInput;