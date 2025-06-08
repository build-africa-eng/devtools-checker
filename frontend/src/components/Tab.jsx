function Tab({ label, isActive, onClick }) {
  return (
    <button
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onClick={onClick}
      className={`flex-1 p-2 text-center transition-colors duration-200 border-b-2 font-medium
        ${isActive ? 'bg-gray-700 border-blue-500 text-white' : 'bg-gray-800 border-transparent text-gray-400 hover:bg-gray-700'}
      `}
    >
      {label}
    </button>
  );
}

export default Tab;