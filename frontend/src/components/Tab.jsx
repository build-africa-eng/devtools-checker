function Tab({ label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 p-2 text-center ${
        isActive ? 'bg-gray-700 border-b-2 border-blue-500' : 'bg-gray-800'
      }`}
    >
      {label}
    </button>
  );
}

export default Tab;