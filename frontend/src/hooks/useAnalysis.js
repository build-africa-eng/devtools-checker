import { useState } from 'react';

export function useAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const analyze = async (url) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to analyze URL (${response.status})`);
      }

      const data = await response.json();
      console.log('API Success:', data);

      const importantLogs = data.logs.filter(log => log.important);
      const importantRequests = data.requests.filter(req => req.important);

      const processed = {
        ...data,
        importantLogs,
        importantRequests,
      };

      setResult(processed);
      setLoading(false);
      return processed;
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(err.message);
      setLoading(false);
      return null;
    }
  };

  return { analyze, loading, error, result };
}