import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Trash2, ShieldAlert, Check, Eye } from 'lucide-react';
import api from '../../lib/axios';
import { AuthContext } from '../../context/AuthContext';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';

const TeamList = () => {
  const { user } = useContext(AuthContext);

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await api.get('/teams?limit=100');
      if (res.data && res.data.data) {
        setTeams(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load registered teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleApproveTeam = async (teamId) => {
    try {
      const res = await api.post(`/teams/${teamId}/approve`);
      if (res.data && res.data.success) {
        toast.success('Team roster approved successfully');
        setTeams((prev) =>
          prev.map((t) => (t._id === teamId ? { ...t, isApproved: true } : t))
        );
      }
    } catch (err) {
      toast.error('Failed to approve roster');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      const res = await api.delete(`/teams/${deleteId}`);
      if (res.data && res.data.success) {
        toast.success('Team roster deleted successfully');
        setTeams((prev) => prev.filter((t) => t._id !== deleteId));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete team');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <PageHeader
        title="Sports Teams Roster"
        description="View and verify team registrations submitted by department coordinators."
      >
        {['superAdmin', 'coordinator'].includes(user?.role) && (
          <Link
            to="/teams/new"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm gap-2"
          >
            <Plus size={16} /> Register Team
          </Link>
        )}
      </PageHeader>

      {/* Grid of Team Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton type="card" count={6} />
        </div>
      ) : teams.length === 0 ? (
        <EmptyState
          title="No teams registered yet"
          description="Click Register Team above to submit department rosters for active tournaments."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((t) => {
            const logoUrl = t.department?.logo?.startsWith('/uploads') 
              ? `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${t.department.logo}` 
              : (t.department?.logo || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=150&auto=format&fit=crop');

            return (
              <div
                key={t._id}
                className="bg-white border border-slate-205 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between group hover:shadow-md transition duration-200"
              >
                
                <div className="p-5 space-y-4">
                  
                  {/* Card top */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <img
                        src={logoUrl}
                        alt="Department logo"
                        className="w-10 h-10 rounded-lg object-cover border border-slate-105"
                      />
                      <div>
                        <h3 className="text-xs font-black text-slate-905">
                          {t.department?.name.split(' ')[0]} {t.tournament?.sport?.name || 'Sports'} Team
                        </h3>
                        <p className="text-4xs text-slate-400 font-bold uppercase mt-0.5 tracking-wider">
                          Tournament: {t.tournament?.name.slice(0, 20)}...
                        </p>
                      </div>
                    </div>

                    <Badge variant={t.isApproved ? 'success' : 'warning'} className="text-4xs">
                      {t.isApproved ? 'Approved' : 'Pending'}
                    </Badge>
                  </div>

                  {/* Coach & Capt details */}
                  <div className="grid grid-cols-2 gap-2 text-2xs text-slate-500">
                    <p>
                      Coach: <strong className="text-slate-700">{t.coach || 'N/A'}</strong>
                    </p>
                    <p>
                      Captain: <strong className="text-slate-700">{t.captain?.name.split(' ')[0] || 'N/A'}</strong>
                    </p>
                    <p className="col-span-2">
                      Athletes Registered: <strong className="text-slate-700">{t.players?.length || 0} Players</strong>
                    </p>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs">
                  <Link
                    to={`/teams/${t._id}`}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    <Eye size={14} /> View Roster
                  </Link>

                  <div className="flex items-center space-x-2">
                    {/* Approve button for admins */}
                    {!t.isApproved && user?.role === 'superAdmin' && (
                      <button
                        onClick={() => handleApproveTeam(t._id)}
                        className="p-1 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition"
                        aria-label="Approve team roster"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    
                    {/* Delete button */}
                    {user?.role === 'superAdmin' && (
                      <button
                        onClick={() => setDeleteId(t._id)}
                        className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-slate-100"
                        aria-label="Delete team registration"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
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
        title="Remove Team Registration"
        message="Are you sure you want to remove this team registration? Doing so will void their matchups and listings from any brackets."
      />
    </div>
  );
};

export default TeamList;
