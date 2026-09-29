import React, { useState, useEffect, useCallback } from 'react';
import { Camera, Filter, Video, Image as ImageIcon, X, Play } from 'lucide-react';
import api from '../../lib/axios';
import PageHeader from '../../components/common/PageHeader';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { LightboxModal, resolveUrl } from '../../components/common/GalleryHighlights';

const PublicGallery = () => {
  const [media, setMedia] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState('');
  const [activeType, setActiveType] = useState('all'); // 'all' | 'image' | 'video'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [lightboxItem, setLightboxItem] = useState(null);
  const limit = 12;

  const fetchTournaments = async () => {
    try {
      const res = await api.get('/tournaments?limit=100');
      if (res.data?.data) setTournaments(res.data.data);
    } catch { /* ignore */ }
  };

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit });
      if (selectedTournament) params.set('tournamentId', selectedTournament);
      const res = await api.get(`/gallery?${params.toString()}`);
      if (res.data?.data) {
        let items = res.data.data;
        if (activeType !== 'all') {
          items = items.filter((i) => i.fileType === activeType);
        }
        setMedia(items);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.pages || 1);
        }
      }
    } catch (err) {
      console.error('Failed to load gallery', err);
    } finally {
      setLoading(false);
    }
  }, [page, selectedTournament, activeType]);

  useEffect(() => { fetchTournaments(); }, []);
  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  return (
    <div className="space-y-6">
      {lightboxItem && (
        <LightboxModal item={lightboxItem} onClose={() => setLightboxItem(null)} />
      )}

      {/* Header */}
      <PageHeader
        title="Tournament Highlights"
        subtitle="Browse all photos and videos from our inter-department sports events"
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-500 shrink-0">
          <Filter size={16} />
          <span className="font-semibold">Filter:</span>
        </div>

        {/* Tournament filter */}
        <select
          value={selectedTournament}
          onChange={(e) => { setSelectedTournament(e.target.value); setPage(1); }}
          className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Tournaments</option>
          {tournaments.map((t) => (
            <option key={t._id} value={t._id}>{t.name}</option>
          ))}
        </select>

        {/* Type filter pills */}
        <div className="flex items-center gap-2">
          {[
            { key: 'all', label: 'All', icon: null },
            { key: 'image', label: 'Images', icon: ImageIcon },
            { key: 'video', label: 'Videos', icon: Video },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setActiveType(key); setPage(1); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeType === key
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {Icon && <Icon size={13} />}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-200 rounded-xl aspect-video" />
          ))}
        </div>
      ) : media.length === 0 ? (
        <EmptyState
          title="No Media Found"
          description="There are no images or videos uploaded for this filter."
          icon={Camera}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {media.map((item) => (
              <div
                key={item._id}
                onClick={() => setLightboxItem(item)}
                className="group relative bg-slate-950 rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all hover:-translate-y-0.5 aspect-video"
              >
                {item.fileType === 'video' ? (
                  <>
                    <video
                      src={resolveUrl(item.fileUrl)}
                      className="w-full h-full object-cover opacity-90"
                      preload="metadata"
                      muted
                    />
                    <div className="absolute top-2 right-2 bg-slate-900/80 text-white p-1 rounded-full">
                      <Video size={12} />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                        <Play size={20} className="text-slate-800 ml-1" fill="currentColor" />
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

          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PublicGallery;
