import { useState } from 'react';

export function useAnalysis() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const friendlyError = (msg) => {
    if (msg.includes('timeout')) return 'Site timed out while loading.';
    if (msg.includes('net::ERR')) return 'Network error occurred.';
    if (msg.includes('Navigation')) return 'Failed to load the page.';
    return msg;
  };

  const analyze = async (url) => {
    if (!url) {
      setError('URL is required');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/analyze`;
      console.log('🔍 Fetching from:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
      }

      const { data } = await response.json();
      console.log('✅ API Raw Response:', data);

      if (data.error) {
        throw new Error(data.message || data.error);
      }

      // Warn if expected data keys are missing or malformed
      if (!Array.isArray(data.logs)) {
        console.warn('⚠️ "logs" is missing or not an array:', data.logs);
      }
      if (!Array.isArray(data.requests)) {
        console.warn('⚠️ "requests" is missing or not an array:', data.requests);
      }

      const formattedData = {
        logs: Array.isArray(data.logs)
          ? data.logs.map((log) => ({
              level: log.level || 'log',
              message: log.message || '',
              location: log.location || {},
              timestamp: log.timestamp || '',
            }))
          : [],
        requests: Array.isArray(data.requests)
          ? data.requests.map((req) => ({
              url: req.url,
              method: req.method || '',
              type: req.type || req.resourceType || '',
              status: req.status ?? null,
              time: req.time ?? -1,
            }))
          : [],
        warning: data.warning || null,
      };

      setResult(formattedData);
      return formattedData;
    } catch (err) {
      const userError = friendlyError(err.message);
      console.error('❌ Fetch Error:', err.message);
      setError(`Analysis failed: ${userError}`);
      setResult(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { analyze, loading, error, result };
}