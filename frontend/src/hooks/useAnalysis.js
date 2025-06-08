import { useState } from 'react';

export function useAnalysis() {
  const [analysisData, setAnalysisData] = useState({ logs: [], requests: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = async (url) => {
    if (!url) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      // Ensure data matches expected format
      setAnalysisData({
        logs: Array.isArray(data.logs) ? data.logs : [],
        requests: Array.isArray(data.requests) ? data.requests : [],
      });
    } catch (err) {
      console.error('Fetch Error:', err.message);
      setError(err.message);
      setAnalysisData({ logs: [], requests: [] });
    } finally {
      setIsLoading(false);
    }
  };

  return { analysisData, isLoading, error, analyze };
}