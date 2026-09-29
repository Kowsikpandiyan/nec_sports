import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Video, Image as ImageIcon, X, ChevronRight, Play, Loader2 } from 'lucide-react';
import api from '../../lib/axios';

const SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/**
 * Resolves a file URL — handles Cloudinary URLs and local /uploads paths
 */
const resolveUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('/uploads')) return `${SERVER_URL}${url}`;
  return url;
};

/**
 * Lightbox Modal — shows image fullscreen or plays video
 */
const LightboxModal = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition"
          aria-label="Close lightbox"
        >
          <X size={18} />
        </button>

        {/* Media */}
        <div className="w-full max-h-[70vh] bg-black flex items-center justify-center">
          {item.fileType === 'video' ? (
            <video
              src={resolveUrl(item.fileUrl)}
              controls
              autoPlay
              className="w-full max-h-[70vh] object-contain"
            />
          ) : (
            <img
              src={resolveUrl(item.fileUrl)}
              alt={item.title}
              className="w-full max-h-[70vh] object-contain"
            />
          )}
        </div>

        {/* Caption */}
        <div className="px-5 py-4 bg-slate-900 border-t border-white/10">
          <p className="text-white font-bold text-sm">{item.title}</p>
          {item.tournament?.name && (
            <p className="text-slate-400 text-xs mt-0.5">
              🏆 {item.tournament.name}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * GalleryHighlights — reusable component for public pages
 *
 * Props:
 *  - limit      {number}  How many items to display (default: 8)
 *  - tournamentId {string} Filter by tournament (optional)
 *  - title      {string}  Section heading text
 *  - compact    {boolean} Horizontal scroll strip layout (for Live Scoreboard)
 *  - showViewAll {boolean} Show "View All →" link (default: true)
 */
const GalleryHighlights = ({
  limit = 8,
  tournamentId = '',
  title = 'Tournament Highlights',
  compact = false,
  showViewAll = true,
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightboxItem, setLightboxItem] = useState(null);

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit });
      if (tournamentId) params.set('tournamentId', tournamentId);
      const res = await api.get(`/gallery?${params.toString()}`);
      if (res.data?.data) {
        setItems(res.data.data);
      }
    } catch (err) {
      console.error('GalleryHighlights: failed to load media', err);
    } finally {
      setLoading(false);
    }
  }, [limit, tournamentId]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-400 gap-2 text-xs">
        <Loader2 size={16} className="animate-spin" />
        Loading highlights…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 text-xs italic border border-dashed border-slate-200 rounded-xl">
        No media uploaded yet. Check back soon!
      </div>
    );
  }

  /* ── Compact / horizontal strip (used on Live Scoreboard) ── */
  if (compact) {
    return (
      <>
        {lightboxItem && (
          <LightboxModal item={lightboxItem} onClose={() => setLightboxItem(null)} />
        )}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
          {items.map((item) => (
            <div
              key={item._id}
              onClick={() => setLightboxItem(item)}
              className="relative flex-shrink-0 w-44 h-28 rounded-xl overflow-hidden cursor-pointer group border border-slate-100 shadow-sm hover:shadow-md transition"
            >
              {item.fileType === 'video' ? (
                <>
                  <video
                    src={resolveUrl(item.fileUrl)}
                    className="w-full h-full object-cover"
                    preload="metadata"
                    muted
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow">
                      <Play size={14} className="text-slate-800 ml-0.5" />
                    </div>
                  </div>
                </>
              ) : (
                <img
                  src={resolveUrl(item.fileUrl)}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-white text-[10px] font-bold truncate">{item.title}</p>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  /* ── Full grid layout (used on Landing, Points Table, Highlights page) ── */
  return (
    <>
      {lightboxItem && (
        <LightboxModal item={lightboxItem} onClose={() => setLightboxItem(null)} />
      )}

      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <span className="inline-block w-1 h-5 rounded-full bg-blue-500" />
          {title}
        </h2>
        {showViewAll && (
          <Link
            to="/highlights"
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-0.5 transition"
          >
            View All <ChevronRight size={14} />
          </Link>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <div
            key={item._id}
            onClick={() => setLightboxItem(item)}
            className="group relative bg-slate-950 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5 aspect-video"
          >
            {/* Thumbnail */}
            {item.fileType === 'video' ? (
              <>
                <video
                  src={resolveUrl(item.fileUrl)}
                  className="w-full h-full object-cover opacity-90"
                  preload="metadata"
                  muted
                />
                {/* Video badge */}
                <div className="absolute top-2 right-2 bg-slate-900/80 text-white p-1 rounded-full">
                  <Video size={12} />
                </div>
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                    <Play size={20} className="text-slate-800 ml-1" fill="currentColor" />
                  </div>
                </div>
              </>
            ) : (
              <>
                <img
                  src={resolveUrl(item.fileUrl)}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
              <p className="text-white text-xs font-bold truncate">{item.title}</p>
              {item.tournament?.name && (
                <p className="text-slate-300 text-[10px] truncate mt-0.5">
                  🏆 {item.tournament.name}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default GalleryHighlights;
export { LightboxModal, resolveUrl };
