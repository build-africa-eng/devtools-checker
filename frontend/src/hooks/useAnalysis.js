import { useState } from 'react';

/**
 * A custom React hook to call the backend analysis API and manage the associated state.
 * It handles loading, error, and result states for the URL analysis process.
 *
 * @returns {{
 * analyze: (url: string, options?: { includeHtml?: boolean, includeScreenshot?: boolean }) => Promise<object|null>,
 * loading: boolean,
 * error: string|null,
 * result: object|null
 * }} An object containing the analysis function and its corresponding state.
 */
export function useAnalysis() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Translates technical backend errors into more user-friendly messages for the UI.
   * @param {string} msg - The original error message from the fetch catch block or API response.
   * @returns {string} A user-friendly error message.
   */
  const friendlyError = (msg = '') => {
    const lowered = msg.toLowerCase();
    if (lowered.includes('failed to fetch')) {
        return 'Cannot connect to the analysis server. Please check your network or try again later.';
    }
    if (lowered.includes('timeout')) {
        return 'The website took too long to respond and the analysis timed out.';
    }
    // Return the API's own user-friendly message if available
    return msg || 'An unknown error occurred.';
  };

  /**
   * Sends a URL and options to the backend API for analysis.
   * @param {string} url - The URL to be analyzed.
   * @param {object} [options] - Optional settings for the analysis.
   * @param {boolean} [options.includeHtml=false] - Whether to fetch the page's full HTML.
   * @param {boolean} [options.includeScreenshot=false] - Whether to capture a screenshot.
   * @returns {Promise<object|null>} A promise that resolves to the formatted analysis result, or null on failure.
   */
  const analyze = async (url, options = {}) => {
    // Basic frontend validation before sending the request
    if (!url || typeof url !== 'string' || !url.trim().startsWith('http')) {
      setError('Please enter a valid URL, starting with http or https.');
      return null;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // It's common to proxy API requests in development via vite.config.js or webpack.config.js
      // This avoids CORS issues and hides the full backend URL.
      const apiUrl = '/api/analyze'; 

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, options }),
      });

      const data = await response.json();

      // Handle non-successful HTTP responses (e.g., 400, 429, 500)
      if (!response.ok) {
        // The backend should provide a 'message' or 'error' field in the JSON
        throw new Error(data?.message || data?.error || `Request failed with status: ${response.status}`);
      }

      // The backend may still return a JSON object with an 'error' field on success (e.g., Puppeteer error)
      if (data?.error) {
        throw new Error(data.error);
      }

      // Sanitize and format the successful response to ensure the UI doesn't crash
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
      // Use the friendlyError helper to set a user-facing message
      const userMessage = friendlyError(err.message);
      setError(userMessage);
      setResult(null); // Clear any previous results
      return null;

    } finally {
      setLoading(false);
    }
  };

  return { analyze, loading, error, result };
}
