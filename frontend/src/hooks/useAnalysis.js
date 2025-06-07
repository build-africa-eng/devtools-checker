import { useState } from 'react';

export function useAnalysis() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = async (url) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching:', `${import.meta.env.VITE_API_URL}/analyze`, { url });
      const response = await fetch(`${import.meta.env.VITE_API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData, response.status, response.statusText);
        throw new Error(errorData.error || `Failed to analyze URL (${response.status})`);
      }
      const data = await response.json();
      console.log('API Success:', data);
      setLoading(false);
      return data;
    } catch (err) {
      console.error('Fetch Error:', err);
      setError(err.message);
      setLoading(false);
      return null;
    }
  };

  return { analyze, loading, error };
}