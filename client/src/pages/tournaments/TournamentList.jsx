import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Calendar, MapPin, Award, Trash2, Edit } from 'lucide-react';
import api from '../../lib/axios';
import useDebounce from '../../hooks/useDebounce';
import { AuthContext } from '../../context/AuthContext';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';

// Countdown Timer Component
const Countdown = ({ startDate }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const difference = +new Date(startDate) - +new Date();
      if (difference <= 0) {
        setTimeLeft('Started');
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);

      setTimeLeft(`${days}d ${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [startDate]);

  return (
    <span className="text-3xs font-bold text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-md flex items-center shrink-0 uppercase tracking-wide">
      🕒 Starts in: {timeLeft}
    </span>
  );
};

const TournamentList = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [tournaments, setTournaments] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'upcoming' | 'ongoing' | 'completed'
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      let query = `/tournaments?search=${debouncedSearch}`;
      if (statusFilter !== 'all') {
        query += `&status=${statusFilter}`;
      }

      const res = await api.get(query);
      if (res.data && res.data.data) {
        setTournaments(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load tournaments list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, [debouncedSearch, statusFilter]);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      const res = await api.delete(`/tournaments/${deleteId}`);
      if (res.data && res.data.success) {
        toast.success('Tournament removed successfully');
        setTournaments((prev) => prev.filter((t) => t._id !== deleteId));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete tournament');
    } finally {
      setDeleteId(null);
    }
  };

  const getFullBannerUrl = (banner) => {
    if (!banner) return 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop';
    if (banner.startsWith('/uploads')) {
      return `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${banner}`;
    }
    return banner;
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <PageHeader
        title="College Tournaments"
        description="View brackets, scheduling, and live point outcomes."
      >
        {user?.role === 'superAdmin' && (
          <Link
            to="/tournaments/new"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm gap-2"
          >
            <Plus size={16} /> Create Tournament
          </Link>
        )}
      </PageHeader>

      {/* Tabs & Search Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status filter tabs */}
        <div className="flex space-x-2 border-b border-slate-200 pb-px">
          {['all', 'upcoming', 'ongoing', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`pb-2.5 px-3 text-xs font-bold capitalize border-b-2 transition ${
                statusFilter === status
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <input
            type="text"
            placeholder="Search by tournament name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-205 rounded-lg bg-white outline-none text-slate-800 placeholder-slate-400 focus:border-blue-500 text-xs"
          />
          <Search className="absolute left-3 top-3 text-slate-400" size={14} />
        </div>
      </div>

      {/* Roster Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton type="card" count={3} />
        </div>
      ) : tournaments.length === 0 ? (
        <EmptyState
          title="No tournaments registered"
          description="Check another filter category or configure a new tournament block."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((t) => {
            const isUpcoming = t.status === 'upcoming';
            return (
              <div
                key={t._id}
                className="bg-white border border-slate-205 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between group hover:shadow-md transition duration-200"
              >
                
                {/* Banner Block */}
                <div className="relative h-40">
                  <img
                    src={getFullBannerUrl(t.banner)}
                    alt={`${t.name} banner`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Status Overlay Badge */}
                  <span className="absolute top-4 left-4">
                    <Badge variant={t.status === 'ongoing' ? 'ongoing' : t.status === 'completed' ? 'success' : 'default'} className="text-3xs">
                      {t.status}
                    </Badge>
                  </span>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <Link
                        to={`/tournaments/${t._id}`}
                        className="text-base font-extrabold text-slate-900 hover:text-blue-500 transition line-clamp-1"
                      >
                        {t.name}
                      </Link>
                      
                      {user?.role === 'superAdmin' && (
                        <div className="flex items-center space-x-1 shrink-0">
                          <Link
                            to={`/tournaments/${t._id}/edit`}
                            className="p-1 rounded text-slate-400 hover:text-amber-500 hover:bg-slate-100"
                            aria-label="Edit tournament"
                          >
                            <Edit size={14} />
                          </Link>
                          <button
                            onClick={() => setDeleteId(t._id)}
                            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-slate-100"
                            aria-label="Delete tournament"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center text-xs text-slate-500 space-x-3">
                      <span className="flex items-center gap-1">
                        <Award size={14} className="text-blue-600" /> {t.sport?.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {t.venue?.name.split(' ')[0]}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-3xs text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Calendar size={12} /> {new Date(t.startDate).toLocaleDateString()}
                    </span>

                    {/* Countdown */}
                    {isUpcoming && <Countdown startDate={t.startDate} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Deletion */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Tournament"
        message="Are you sure you want to delete this tournament? This will void all matches, rosters and brackets scheduled under it."
      />
    </div>
  );
};

export default TournamentList;
