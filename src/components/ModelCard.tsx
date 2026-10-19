

import React, { useState, useRef, useEffect, memo } from 'react';
import { Model } from '@/lib/types';
import { Eye, Heart, Zap, Play, Volume2, VolumeX } from 'lucide-react';
import { hlsManager } from '@/lib/hlsManager';

interface ModelCardProps {
  model: Model;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, model: Model) => void;
  onSelectModel: (model: Model) => void;
}

export const ModelCard: React.FC<ModelCardProps> = memo(({
  model,
  isFavorite,
  onToggleFavorite,
  onSelectModel,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasVideoError, setHasVideoError] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Suscripción al Singleton global para saber si este video debe estar activo
  useEffect(() => {
    return hlsManager.subscribe((activeId) => {
      const active = activeId === model.id;
      setIsActive(active);
      if (!active && videoRef.current) {
        // Cleanup visual inmediato cuando otro toma el control
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
    });
  }, [model.id]);

  // Manejo visual de HLS delegando al Singleton
  useEffect(() => {
    if (isActive && videoRef.current && model.videoUrl && !hasVideoError) {
      hlsManager.play(videoRef.current, model.videoUrl, () => {
        setHasVideoError(true);
      });
    }
  }, [isActive, model.videoUrl, hasVideoError]);

  // IntersectionObserver para Móviles (Auto-Play al hacer scroll)
  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile || !cardRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // Si la tarjeta está 70% visible en pantalla, toma el Singleton
        if (entry.isIntersecting && entry.intersectionRatio >= 0.7) {
          hlsManager.setActiveId(model.id);
        } else if (!entry.isIntersecting && hlsManager.getActiveId() === model.id) {
          hlsManager.setActiveId(null);
        }
      });
    }, {
      threshold: [0, 0.7]
    });

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [model.id]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (window.matchMedia('(max-width: 768px)').matches) return; // Móvil usa scroll
    
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      hlsManager.setActiveId(model.id);
    }, 120);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    
    if (hlsManager.getActiveId() === model.id) {
      hlsManager.setActiveId(null);
    }
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const goalPercent = model.goalTarget
    ? Math.min(100, Math.round(((model.goalCurrent || 0) / model.goalTarget) * 100))
    : 0;

  return (
    <div
      ref={cardRef}
      onClick={() => onSelectModel(model)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group bg-zinc-950 border border-zinc-850 hover:border-violet-500/50 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-violet-950/20 transition-all duration-200 cursor-pointer flex flex-col relative transform-gpu"
    >
      {/* Top Media Area (100% clear visibility) */}
      <div className="relative aspect-[4/3] bg-zinc-950 overflow-hidden">
        {/* Snapshot Image */}
        <img
          src={model.snapshotUrl}
          alt={model.displayName}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            isActive && !hasVideoError ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* Video Stream Preview */}
        {isActive && model.videoUrl && !hasVideoError && (
          <video
            ref={videoRef}
            muted={isMuted}
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        )}

        {/* Minimal Gradient for Contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 via-transparent to-black/30 pointer-events-none" />

        {/* Top Minimal Live Dot (Top Left) */}
        <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
          <span className="bg-red-600/90 text-white font-black text-[10px] uppercase px-2 py-0.5 rounded flex items-center gap-1 shadow-sm backdrop-blur-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            LIVE
          </span>
          {model.isHd && (
            <span className="text-[9px] font-bold text-amber-400 bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded border border-amber-500/30">
              HD
            </span>
          )}
        </div>

        {/* Top Right: Viewers Count & Discreet Favorite */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
          <span className="bg-black/60 backdrop-blur-md text-zinc-200 text-[11px] font-bold px-2 py-0.5 rounded border border-white/10 flex items-center gap-1">
            <Eye className="w-3 h-3 text-violet-400" />
            {model.viewersCount > 999 ? `${(model.viewersCount / 1000).toFixed(1)}k` : model.viewersCount}
          </span>

          <button
            onClick={(e) => onToggleFavorite(e, model)}
            className={`w-7 h-7 flex items-center justify-center rounded backdrop-blur-md transition ${
              isFavorite
                ? 'bg-violet-600 text-white'
                : 'bg-black/50 text-zinc-300 hover:text-white hover:bg-black/80'
            }`}
            title="Favorito"
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Audio Toggle when active */}
        {(isHovered || isActive) && model.videoUrl && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
            className="absolute bottom-2.5 right-2.5 p-1.5 rounded bg-black/70 backdrop-blur-md text-zinc-300 hover:text-white z-10 border border-white/10"
            title={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-violet-400" />}
          </button>
        )}
      </div>

      {/* Clean Uncluttered Info Body (below thumbnail, leaving image 100% visible) */}
      <div className="p-3 bg-zinc-950/95 flex items-start gap-2.5 border-t border-zinc-900">
        <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-zinc-800">
          <img
            src={model.avatarUrl}
            alt={model.displayName}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="font-bold text-sm text-white truncate group-hover:text-violet-400 transition-colors">
              {model.displayName}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {model.isLovense && (
                <span className="text-amber-400 text-xs" title="Lovense Interactivo">
                  <Zap className="w-3 h-3 fill-amber-400" />
                </span>
              )}
              <span className="text-[11px] text-zinc-500 font-medium">({model.age})</span>
            </div>
          </div>

          <p className="text-xs text-zinc-400 truncate mt-0.5">
            {model.topic || `${model.country} · ${model.tokensPerMin} TK/m`}
          </p>
        </div>
      </div>
    </div>
  );
});

ModelCard.displayName = 'ModelCard';

