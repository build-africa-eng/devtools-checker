import React, { useState, useCallback } from 'react';

const DomView = ({ html: initialHtml, css: initialCss }) => {
  const [html, setHtml] = useState(initialHtml || '');
  const [css, setCss] = useState(initialCss || []);
  const [editedCss, setEditedCss] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleHtmlChange = useCallback((e) => {
    setHtml(e.target.value);
  }, []);

  const handleCssChange = useCallback((e) => {
    setEditedCss(e.target.value);
  }, []);

  const toggleEdit = useCallback(() => {
    setIsEditing(prev => !prev);
    if (!isEditing) {
      setHtml(initialHtml || '');
      setEditedCss('');
    }
  }, [initialHtml, isEditing]);

  const applyChanges = useCallback(() => {
    console.log('Applying changes:', { html, css: editedCss.split('\n') });
    setCss(editedCss.split('\n'));
    setIsEditing(false);
  }, [html, editedCss]);

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-2">DOM</h2>
      {isEditing ? (
        <textarea
          value={html}
          onChange={handleHtmlChange}
          className="w-full h-40 p-2 bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded mb-4 sm:h-60"
        />
      ) : (
        <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-60 sm:max-h-80">
          {html || 'No DOM data available'}
        </pre>
      )}
      <h2 className="text-lg font-bold mt-4 mb-2">CSS Rules</h2>
      <ul className="list-disc pl-5 mb-4">
        {css.map((rule, i) => (
          <li key={i} className="text-sm break-all">{rule}</li>
        ))}
      </ul>
      {isEditing && (
        <div className="mb-4">
          <textarea
            value={editedCss}
            onChange={handleCssChange}
            className="w-full h-20 p-2 bg-gray-100 dark:bg-gray-800 text-black dark:text-white rounded sm:h-30"
          />
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={toggleEdit}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full sm:w-auto"
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
        {isEditing && (
          <button
            onClick={applyChanges}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 w-full sm:w-auto"
          >
            Apply
          </button>
        )}
      </div>
    </div>
  );
};

export default DomView;