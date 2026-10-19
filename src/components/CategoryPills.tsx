

import React, { memo } from 'react';
import { FilterState } from '@/lib/types';
import { Zap, Video, Heart, Radio, Flame, Glasses } from 'lucide-react';

interface CategoryPillsProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

const CATEGORIES = [
  { id: 'all', name: 'Todas', icon: Flame },
  { id: 'Latina', name: 'Latina', icon: Flame },
  { id: 'Lovense', name: 'Lovense', icon: Zap },
  { id: 'Cosplay', name: 'Cosplay', icon: Heart },
  { id: 'VR Cams', name: 'VR 3D', icon: Glasses },
  { id: 'HD 1080p', name: 'HD', icon: Video },
  { id: 'Petite', name: 'Petite', icon: Heart },
  { id: 'MILF', name: 'MILF', icon: Heart },
  { id: 'Pareja', name: 'Parejas', icon: Heart },
  { id: 'Tatuajes', name: 'Tatuajes', icon: Radio },
];

export const CategoryPills: React.FC<CategoryPillsProps> = memo(({ filters, setFilters }) => {
  const toggleTag = (tag: string) => {
    if (tag === 'all') {
      setFilters((prev) => ({ ...prev, tags: [], isLovenseOnly: false, isHdOnly: false }));
      return;
    }

    setFilters((prev) => {
      const isCurrentlySelected = prev.tags.includes(tag);
      return {
        ...prev,
        tags: isCurrentlySelected ? [] : [tag], // Direct single category switch
      };
    });
  };

  return (
    <div className="bg-zinc-950/60 border-b border-zinc-900 py-2.5 overflow-x-auto no-scrollbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1.5">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = cat.id === 'all' ? filters.tags.length === 0 : filters.tags.includes(cat.id);

          return (
            <button
              key={cat.id}
              onClick={() => toggleTag(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                isSelected
                  ? 'bg-violet-600 text-white shadow-sm border border-violet-400/30'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 border border-zinc-800/80'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

CategoryPills.displayName = 'CategoryPills';

