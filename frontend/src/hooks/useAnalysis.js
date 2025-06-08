import { useState } from 'react';

export function useAnalysis() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = async (url) => {
    if (!url) {
      setError('URL is required');
      return null;
    }
    setLoading(true);
    setError(null);

    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/analyze`; // Changed to /analyze
      console.log('Fetching from:', apiUrl);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      const formattedData = {
        logs: Array.isArray(data.logs) ? data.logs : [],
        requests: Array.isArray(data.requests) ? data.requests : [],
      };
      setResult(formattedData);
      return formattedData;
    } catch (err) {
      console.error('Fetch Error:', err.message);
      setError(`Failed to fetch data: ${err.message}`);
      setResult(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { analyze, loading, error, result };
}