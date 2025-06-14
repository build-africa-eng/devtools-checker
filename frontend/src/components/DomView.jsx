import React, { useState, useCallback } from 'react';

const DomView = ({ html: initialHtml, css: initialCss }) => {
  const [html, setHtml] = useState(initialHtml || '');
  const [css, setCss] = useState(initialCss || []);
  const [editedCss, setEditedCss] = useState('');

  const handleHtmlChange = useCallback((e) => {
    setHtml(e.target.value);
  }, []);

  const handleCssChange = useCallback((e) => {
    setEditedCss(e.target.value);
  }, []);

  const applyChanges = useCallback(async () => {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, css: editedCss.split('\n') }),
    });
    if (response.ok) {
      const data = await response.json();
      setHtml(data.html);
      setCss(data.css);
    }
  }, [html, editedCss]);

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">DOM</h2>
      <textarea
        value={html}
        onChange={handleHtmlChange}
        className="w-full h-40 p-2 bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded mb-4"
        placeholder="DOM content"
      />
      <h2 className="text-lg font-bold mb-2">CSS Rules</h2>
      <ul className="list-disc pl-5 mb-4">
        {css.map((rule, i) => (
          <li key={i} className="text-sm">{rule}</li>
        ))}
      </ul>
      <textarea
        value={editedCss}
        onChange={handleCssChange}
        className="w-full h-20 p-2 bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded mb-4"
        placeholder="Edit CSS here"
      />
      <button
        onClick={applyChanges}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Apply Changes
      </button>
    </div>
  );
};

export default DomView;