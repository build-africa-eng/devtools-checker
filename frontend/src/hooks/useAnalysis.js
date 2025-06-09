import { useState } from 'react';

export function useAnalysis() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const friendlyError = (msg = '') => {
    const lowered = msg.toLowerCase();
    if (lowered.includes('failed to fetch')) {
      return 'Cannot connect to the analysis server. Please check your network or try again later.';
    }
    if (lowered.includes('timeout')) {
      return 'The website took too long to respond and the analysis timed out.';
    }
    return msg || 'An unknown error occurred.';
  };

  const analyze = async (url, options = {}) => {
    if (!url || typeof url !== 'string' || !url.trim().startsWith('http')) {
      setError('Please enter a valid URL, starting with http or https.');
      return null;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const apiUrl = `${import.meta.env.VITE_API_URL || '[invalid url, do not cite]'}/api/analyze`;
      console.log('Fetching:', apiUrl); // Debug log

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, options }),
      });

      if (!response.ok) {
        const text = await response.text(); // Get raw response
        console.error('Raw response:', text); // Debug
        throw new Error(`HTTP error ${response.status}: ${text || 'No response body'}`);
      }

      const data = await response.json().catch(err => {
        throw new Error(`Invalid JSON response: ${err.message}`);
      });

      if (data?.error) {
        throw new Error(data.error);
      }

      const formattedResult = {
        title: data.title || 'Untitled Page',
        html: data.html,
        screenshot: data.screenshot,
        logs: Array.isArray(data.logs) ? data.logs : [],
        requests: Array.isArray(data.requests) ? data.requests : [],
        warning: data.warning || null,
      };

      setResult(formattedResult);
      return formattedResult;
    } catch (err) {
      const userMessage = friendlyError(err.message);
      setError(userMessage);
      setResult(null);
      console.error('Analysis error:', err); // Debug
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { analyze, loading, error, result };
}