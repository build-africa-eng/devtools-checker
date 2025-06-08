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
      const apiUrl = `${import.meta.env.VITE_API_URL}/analyze`;
      console.log('Fetching from:', apiUrl);
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (data.error) {
        throw new Error(data.details || data.error);
      }

      const formattedData = {
        logs: Array.isArray(data.logs) ? data.logs.map(log => ({
          level: log.level || log.type || 'log',
          message: log.message || log.text,
          location: log.location,
        })) : [],
        requests: Array.isArray(data.requests) ? data.requests.map(req => ({
          url: req.url,
          method: req.method,
          type: req.resourceType || req.type,
          status: req.status,
          time: req.time || 0,
        })) : [],
      };
      setResult(formattedData);
      return formattedData;
    } catch (err) {
      console.error('Fetch Error:', err.message);
      setError(`Analysis failed: ${err.message}`);
      setResult(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { analyze, loading, error, result };
}