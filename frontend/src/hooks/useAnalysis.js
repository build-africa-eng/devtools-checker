import { useState, useCallback } from 'react';

export function useAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const analyze = useCallback(async (url) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'; // Fallback for local dev
    try {
      const response = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to analyze URL (${response.status})`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      // Ensure compatibility with ConsoleView and NetworkView
      const processed = {
        logs: data.logs || [], // Unfiltered logs for all data
        requests: data.requests || [], // Unfiltered requests for all data
        importantLogs: data.logs?.filter(log => log.important) || [], // Filtered for importance
        importantRequests: data.requests?.filter(req => req.important) || [], // Filtered for importance
      };

      setResult(processed);
      return processed;
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { analyze, loading, error, result };
}