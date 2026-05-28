export default function Navbar({ tableNumber, restaurantName, restaurantLogo }) {
  return (
    <nav className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md shadow-sm z-30 px-5 py-3 border-b border-gray-100 flex justify-between items-center transition-all duration-300">
      <div className="flex items-center gap-3">
        {/* Logo: agar logo hai to sirf image dikhao, warna gradient icon */}
        <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 shadow-md">
          {restaurantLogo ? (
            <img
              src={restaurantLogo}
              alt={restaurantName || "Restaurant"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
                <path d="M7 2v20"/>
                <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
              </svg>
            </div>
          )}
        </div>

        {/* Restaurant name: hamesha dikhao */}
        <div>
          <h1 className="font-bold text-gray-900 text-xl leading-none line-clamp-1">
            {restaurantName || "MenuHub"}
          </h1>
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Restaurant</p>
        </div>
      </div>

      {tableNumber && (
        <div className="bg-orange-100 text-orange-700 font-bold px-3 py-1.5 rounded-lg border border-orange-200 shadow-sm flex items-center gap-1.5 animate-pulse-slow">
          <span className="text-xs uppercase tracking-wide opacity-80">Table</span>
          <span className="text-lg">{tableNumber}</span>
        </div>
      )}
    </nav>
  );
}
