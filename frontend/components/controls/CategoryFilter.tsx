"use client";

import { useMapStore } from "@/store/mapStore";
import type { ComplaintCategory } from "@/types/map";

const CATEGORY_CONFIG: { cat: ComplaintCategory; icon: string; color: string }[] = [
  { cat: "Water Supply",        icon: "💧", color: "from-blue-500 to-cyan-400" },
  { cat: "Roads",               icon: "🛣️",  color: "from-amber-500 to-yellow-400" },
  { cat: "Digital Connectivity",icon: "📡", color: "from-violet-500 to-purple-400" },
  { cat: "Sanitation",          icon: "🚰", color: "from-emerald-500 to-green-400" },
  { cat: "Energy",              icon: "⚡", color: "from-orange-500 to-red-400" },
];

export default function CategoryFilter() {
  const { selectedCategories, toggleCategory, setAllCategories, clearCategories } = useMapStore();

  return (
    <div className="bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white text-sm font-semibold">Categories</h2>
        <div className="flex gap-1">
          <button
            onClick={setAllCategories}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors px-1"
          >
            All
          </button>
          <span className="text-gray-600">|</span>
          <button
            onClick={clearCategories}
            className="text-xs text-gray-500 hover:text-gray-400 transition-colors px-1"
          >
            None
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {CATEGORY_CONFIG.map(({ cat, icon, color }) => {
          const active = selectedCategories.includes(cat);
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium
                border transition-all duration-200
                ${active
                  ? `bg-gradient-to-r ${color} bg-opacity-20 border-white/20 text-white shadow-md`
                  : "bg-gray-800/50 border-gray-700/50 text-gray-500 hover:text-gray-400"
                }
              `}
            >
              <span className="text-base">{icon}</span>
              <span className="flex-1 text-left">{cat}</span>
              {active && (
                <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
