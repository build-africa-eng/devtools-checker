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
    if (lowered.includes('networkerror') || lowered.includes('dns')) {
      return 'Network issue: Please check your internet connection or try a different URL.';
    }
    return msg || 'An unknown error occurred.';
  };

  const analyze = async (url, options = {}) => {
    const trimmedUrl = url?.trim();
    if (!trimmedUrl || !/^https?:\/\//i.test(trimmedUrl)) {
      setError('Please enter a valid URL starting with http:// or https://');
      return null;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const baseApi = import.meta.env.VITE_API_URL;
      if (!baseApi || baseApi.startsWith('[invalid')) {
        throw new Error('API URL is not configured. Check VITE_API_URL.');
      }

      const apiUrl = `${baseApi}/api/analyze`;
      const body = JSON.stringify({
        url: trimmedUrl,
        options: { ...options, onlyImportantLogs: true },
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text || 'No response body'}`);
      }

      const data = await response.json().catch((err) => {
        throw new Error(`Invalid JSON response: ${err.message}`);
      });

      if (data?.error) throw new Error(data.error);

      const {
        title = 'Untitled Page',
        html = '',
        screenshot = '',
        logs = [],
        requests = [],
        performance = { domContentLoaded: -1, load: -1 },
        warning = null,
      } = data;

      const formattedResult = { title, html, screenshot, logs, requests, performance, warning };
      setResult(formattedResult);
      return formattedResult;
    } catch (err) {
      const userMessage = friendlyError(err.message);
      setError(userMessage);
      setResult(null);
      console.error('Analysis error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { analyze, loading, error, result };
}