export default function CategoryTabs({ categories, selected, onSelect }) {
  // Always include an 'All' option
  const displayCategories = [
    { id: "all", name: "All", icon: null },
    ...categories
  ];

  return (
    <div className="flex overflow-x-auto gap-4 py-4 px-2 hide-scrollbar">
      {displayCategories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.name)}
          className="flex-shrink-0 flex flex-col items-center justify-center gap-2 group transition-all duration-300 w-[72px] cursor-pointer"
        >
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center overflow-hidden transition-all duration-300 border-[3px] shadow-sm
            ${selected === cat.name 
              ? "border-blue-500 shadow-blue-500/30 shadow-lg scale-110 bg-blue-50" 
              : "border-gray-100 bg-white group-hover:border-gray-300 group-hover:shadow"}`}
          >
            {cat.icon ? (
              <img src={cat.icon} alt={cat.name} className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
            ) : (
              <span className={`text-lg font-black ${selected === cat.name ? "text-blue-500" : "text-gray-400"}`}>
                {cat.name === 'All' ? 'ALL' : cat.name.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <span className={`text-[11px] leading-tight text-center font-bold tracking-wide transition-colors duration-300
            ${selected === cat.name ? "text-blue-700" : "text-gray-500 group-hover:text-gray-800"}`}>
            {cat.name}
          </span>
        </button>
      ))}
    </div>
  );
}
