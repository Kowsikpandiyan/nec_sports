import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Trash2, Edit, Trophy, AlertTriangle, ShieldCheck } from 'lucide-react';
import api from '../../lib/axios';
import useDebounce from '../../hooks/useDebounce';
import { AuthContext } from '../../context/AuthContext';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';

const SportList = () => {
  const { user } = useContext(AuthContext);

  const [sports, setSports] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const debouncedSearch = useDebounce(search, 300);

  const fetchSports = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/sports?search=${debouncedSearch}`);
      if (res.data && res.data.data) {
        setSports(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load sports list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSports();
  }, [debouncedSearch]);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      const res = await api.delete(`/sports/${deleteId}`);
      if (res.data && res.data.success) {
        toast.success('Sport deleted successfully');
        setSports((prev) => prev.filter((s) => s._id !== deleteId));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete sport');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <PageHeader
        title="College Sports"
        description="Configure sport event classes and match action types."
      >
        {user?.role === 'superAdmin' && (
          <Link
            to="/sports/new"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm gap-2"
          >
            <Plus size={16} /> Add Sport
          </Link>
        )}
      </PageHeader>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Search by sport name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-205 rounded-lg bg-white outline-none text-slate-800 placeholder-slate-400 focus:border-blue-500 text-sm"
        />
        <Search className="absolute left-3 top-3 text-slate-400" size={16} />
      </div>

      {/* Roster Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton type="card" count={3} />
        </div>
      ) : sports.length === 0 ? (
        <EmptyState
          title="No sports configured"
          description="Click the Add Sport button to register new entries."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sports.map((sport) => (
            <div
              key={sport._id}
              className="bg-white border border-slate-205 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition duration-200"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-55/60 text-blue-600 border border-blue-100 font-bold text-lg uppercase">
                      {sport.name.slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">
                        {sport.name}
                      </h3>
                      <p className="text-3xs text-slate-400">
                        Team cap: {sport.maxPlayersPerTeam} players
                      </p>
                    </div>
                  </div>

                  {user?.role === 'superAdmin' && (
                    <div className="flex items-center space-x-1.5">
                      <Link
                        to={`/sports/${sport._id}/edit`}
                        className="p-1 rounded text-slate-405 hover:text-amber-500 hover:bg-slate-100"
                        aria-label="Edit sport"
                      >
                        <Edit size={14} />
                      </Link>
                      <button
                        onClick={() => setDeleteId(sport._id)}
                        className="p-1 rounded text-slate-405 hover:text-red-500 hover:bg-slate-100"
                        aria-label="Delete sport"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-500 line-clamp-2">
                  {sport.description || 'No description configured.'}
                </p>

                {/* Event Types tags */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-3xs font-bold text-slate-400 uppercase tracking-wider block">
                    Action Event Timeline Types
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sport.eventTypes?.map((ev, evIdx) => (
                      <span
                        key={evIdx}
                        className="px-2 py-0.5 rounded bg-slate-105 text-slate-600 text-4xs font-semibold"
                      >
                        {ev}
                      </span>
                    )) || <span className="text-slate-400 text-2xs">None</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm deletion */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Sport Class"
        message="Are you sure you want to delete this sport category? All associated tournaments and scheduled matches might be deleted. This action is irreversible."
      />
    </div>
  );
};

export default SportList;
