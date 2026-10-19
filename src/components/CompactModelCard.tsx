

import React, { memo } from 'react';
import { Model } from '@/lib/types';
import { Eye, Heart, Zap, Play } from 'lucide-react';

interface CompactModelCardProps {
  model: Model;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, model: Model) => void;
  onSelectModel: (model: Model) => void;
}

export const CompactModelCard: React.FC<CompactModelCardProps> = memo(({
  model,
  isFavorite,
  onToggleFavorite,
  onSelectModel,
}) => {
  return (
    <div
      onClick={() => onSelectModel(model)}
      className="group bg-zinc-950 border border-zinc-850 hover:border-violet-500/50 rounded-xl overflow-hidden hover:shadow-lg hover:shadow-violet-950/20 transition-all duration-200 cursor-pointer flex flex-col relative transform-gpu"
    >
      {/* Media Snapshot (Unobstructed) */}
      <div className="relative aspect-[4/3] bg-zinc-950 overflow-hidden">
        <img
          src={model.snapshotUrl}
          alt={model.displayName}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Minimal Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 via-transparent to-black/20 pointer-events-none" />

        {/* Top Minimal Live Dot */}
        <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
          <span className="bg-red-600/90 text-white font-black text-[9px] uppercase px-1.5 py-0.5 rounded flex items-center gap-1 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
        </div>

        {/* Viewers & Fav (Top Right) */}
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
          <span className="bg-black/60 backdrop-blur-xs text-zinc-200 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
            <Eye className="w-2.5 h-2.5 text-violet-400" />
            {model.viewersCount > 999 ? `${(model.viewersCount / 1000).toFixed(1)}k` : model.viewersCount}
          </span>

          <button
            onClick={(e) => onToggleFavorite(e, model)}
            className={`w-6 h-6 flex items-center justify-center rounded backdrop-blur-xs transition ${
              isFavorite
                ? 'bg-violet-600 text-white'
                : 'bg-black/50 text-zinc-300 hover:text-white hover:bg-black/80'
            }`}
            title="Favorito"
          >
            <Heart className={`w-3 h-3 ${isFavorite ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Quick Play Hover Indicator */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 pointer-events-none z-10">
          <div className="w-8 h-8 rounded-full bg-violet-600/90 text-white flex items-center justify-center shadow-md transform scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Clean Compact Footer */}
      <div className="p-2.5 bg-zinc-950 flex flex-col gap-0.5 border-t border-zinc-900">
        <div className="flex items-center justify-between gap-1">
          <span className="font-bold text-xs text-white truncate group-hover:text-violet-400 transition-colors">
            {model.displayName}
          </span>
          {model.isLovense && (
            <span className="text-amber-400 shrink-0" title="Lovense">
              <Zap className="w-3 h-3 fill-amber-400" />
            </span>
          )}
        </div>
        <div className="text-[10px] text-zinc-400 truncate flex items-center gap-1">
          <span>{model.countryCode ? model.countryCode.toUpperCase() : model.country}</span>
          <span className="text-zinc-600">·</span>
          <span>{model.tokensPerMin} TK/m</span>
        </div>
      </div>
    </div>
  );
});

CompactModelCard.displayName = 'CompactModelCard';
