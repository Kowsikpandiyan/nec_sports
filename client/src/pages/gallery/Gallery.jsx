import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../lib/axios';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';
import { Upload, Trash, Image as ImageIcon, Video, Filter, Plus, Calendar, User } from 'lucide-react';
import { formatDate } from '../../lib/utils';

const Gallery = () => {
  const { user } = useContext(AuthContext);
  
  // Gallery data states
  const [media, setMedia] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(12);

  // Upload modal states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadTournament, setUploadTournament] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Fullscreen view modal states
  const [viewItem, setViewItem] = useState(null);

  const fetchTournaments = async () => {
    try {
      const res = await api.get('/tournaments?limit=100');
      if (res.data && res.data.data) {
        setTournaments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load tournaments list', err);
    }
  };

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const url = `/gallery?page=${page}&limit=${limit}${
        selectedTournament ? `&tournamentId=${selectedTournament}` : ''
      }`;
      const res = await api.get(url);
      if (res.data && res.data.data) {
        setMedia(res.data.data);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.pages || 1);
        }
      }
    } catch (err) {
      toast.error('Failed to load gallery items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [page, selectedTournament]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }
    if (!uploadTournament) {
      toast.error('Please assign this media to a tournament');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('title', uploadTitle);
      formData.append('tournament', uploadTournament);
      formData.append('file', uploadFile);

      const res = await api.post('/gallery', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data && res.data.success) {
        toast.success('Media uploaded successfully');
        setUploadTitle('');
        setUploadTournament('');
        setUploadFile(null);
        setShowUploadModal(false);
        fetchMedia(); // reload gallery
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload media');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMedia = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this media item?')) return;
    try {
      const res = await api.delete(`/gallery/${itemId}`);
      if (res.data && res.data.success) {
        toast.success('Media removed successfully');
        setViewItem(null);
        fetchMedia();
      }
    } catch (err) {
      toast.error('Failed to delete media item');
    }
  };

  // Can the current user manage/upload gallery items?
  const canManage = user?.role === 'superAdmin' || user?.role === 'coordinator';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="Tournament Gallery" 
          subtitle="Explore action shots, highlight reels, and media updates from recent fixtures"
        />

        {canManage && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:shadow transition-colors gap-2 cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            Upload Media
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-2 text-sm text-slate-500 self-start sm:self-auto">
          <Filter className="h-4 w-4" />
          <span className="font-semibold">Filter by Tournament:</span>
        </div>
        <select
          value={selectedTournament}
          onChange={(e) => {
            setSelectedTournament(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-64 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Tournaments</option>
          {tournaments.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-200 rounded-xl aspect-square" />
          ))}
        </div>
      ) : media.length === 0 ? (
        <EmptyState 
          title="No Media Found" 
          description="There are no images or videos uploaded for this filter. Check back later!"
          icon={ImageIcon}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {media.map((item) => (
              <div 
                key={item._id}
                onClick={() => setViewItem(item)}
                className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all hover:-translate-y-0.5"
              >
                {/* Media Container */}
                <div className="relative aspect-video sm:aspect-square bg-slate-950 flex items-center justify-center overflow-hidden">
                  {item.fileType === 'video' ? (
                    <div className="relative w-full h-full">
                      <video src={item.fileUrl} className="w-full h-full object-cover" preload="metadata" />
                      <div className="absolute top-3 right-3 bg-slate-900/80 text-white p-1.5 rounded-full">
                        <Video className="h-4 w-4" />
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={item.fileUrl} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <p className="text-white font-bold truncate">{item.title}</p>
                    <p className="text-slate-300 text-xs truncate mt-0.5">{item.tournament?.name}</p>
                  </div>
                </div>

                {/* Footer text for static layouts */}
                <div className="p-3">
                  <h4 className="text-sm font-bold text-slate-800 truncate">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{item.tournament?.name}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </>
      )}

      {/* Upload Media Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Tournament Media"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Title / Caption
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Final Goal, Opening Ceremony"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 bg-white rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Associated Tournament
            </label>
            <select
              required
              value={uploadTournament}
              onChange={(e) => setUploadTournament(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 bg-white rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Tournament...</option>
              {tournaments.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Select File (Image or Video)
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-600">
                    {uploadFile ? uploadFile.name : 'Click to select or drag & drop'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    PNG, JPG, MP4, WebM up to 50MB
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Fullscreen View Modal */}
      {viewItem && (
        <Modal
          isOpen={!!viewItem}
          onClose={() => setViewItem(null)}
          title={viewItem.title}
        >
          <div className="space-y-4">
            <div className="bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center max-h-[60vh]">
              {viewItem.fileType === 'video' ? (
                <video src={viewItem.fileUrl} controls autoPlay className="w-full max-h-[60vh] object-contain" />
              ) : (
                <img src={viewItem.fileUrl} alt={viewItem.title} className="w-full max-h-[60vh] object-contain" />
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-slate-200">
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">
                  Tournament: {viewItem.tournament?.name}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    Uploaded by: {viewItem.uploadedBy?.name || 'Staff'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Date: {formatDate(viewItem.createdAt)}
                  </span>
                </div>
              </div>

              {(user?.role === 'superAdmin' || user?._id === viewItem.uploadedBy?._id) && (
                <button
                  onClick={() => handleDeleteMedia(viewItem._id)}
                  className="px-3.5 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash className="h-4 w-4" />
                  Delete Media
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Gallery;
