import { Utensils } from "lucide-react";

export default function MenuCard({ item, onAdd }) {
  const hasVariants = !!item.halfPrice;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-transform transform hover:scale-[1.01]">
      <div className="flex p-3 gap-4">
        {/* Image Section */}
        <div className="w-28 h-28 rounded-xl bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100 relative">
          {item.image ? (
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
               <Utensils size={32} />
             </div>
          )}
          {!item.isAvailable && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="bg-red-500 text-white text-[10px] uppercase font-black px-2 py-1 rounded shadow-lg transform -rotate-12">Sold Out</span>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <h3 className="font-bold text-gray-900 leading-tight mb-1">{item.name}</h3>
            {hasVariants ? (
              <div className="flex items-center gap-3 text-sm">
                <p className="text-gray-500 font-semibold"><span className="text-xs">Half:</span> ₹{item.halfPrice}</p>
                <div className="w-px h-3 bg-gray-300"></div>
                <p className="text-gray-900 font-bold"><span className="text-xs text-gray-500 font-semibold">Full:</span> ₹{item.price}</p>
              </div>
            ) : (
              <p className="text-green-600 font-bold text-lg">₹{item.price}</p>
            )}
          </div>

          <div className="mt-3">
            {hasVariants ? (
              <div className="flex gap-2">
                <button
                  onClick={() => onAdd({ ...item, price: item.halfPrice, size: 'Half' })}
                  disabled={!item.isAvailable}
                  className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all border ${
                    item.isAvailable
                      ? "bg-white text-blue-600 border-blue-200 hover:bg-blue-50 active:scale-95"
                      : "bg-gray-100 text-gray-400 border-transparent cursor-not-allowed"
                  }`}
                >
                  ADD HALF
                </button>
                <button
                  onClick={() => onAdd({ ...item, size: 'Full' })}
                  disabled={!item.isAvailable}
                  className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${
                    item.isAvailable
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 active:scale-95"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  ADD FULL
                </button>
              </div>
            ) : (
              <button
                onClick={() => onAdd({ ...item, size: 'Full' })}
                disabled={!item.isAvailable}
                className={`w-full text-sm font-bold py-2 rounded-lg transition-all ${
                  item.isAvailable
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 active:scale-[0.98]"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                ADD TO CART
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
