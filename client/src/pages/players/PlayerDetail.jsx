import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Calendar, Shield, BadgeCheck } from 'lucide-react';
import api from '../../lib/axios';
import Skeleton from '../../components/common/Skeleton';
import Badge from '../../components/common/Badge';
import PageHeader from '../../components/common/PageHeader';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

const PlayerDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPlayerDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/players/${id}`);
      if (res.data && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load player details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayerDetails();
  }, [id]);

  if (loading) {
    return <Skeleton type="card" count={2} />;
  }

  if (!data || !data.player) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold">Player profile not found</h3>
        <Link to="/players" className="text-blue-500 hover:underline mt-2 inline-block">
          Back to Players
        </Link>
      </div>
    );
  }

  const { player, matches } = data;
  const photoUrl = player.photo?.startsWith('/uploads') 
    ? `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${player.photo}` 
    : (player.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120&auto=format&fit=crop');

  return (
    <div className="space-y-8">
      
      {/* Back button */}
      <div>
        <Link
          to="/players"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition gap-1"
        >
          <ArrowLeft size={14} /> Back to Athletes Roster
        </Link>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Avatar block */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <img
            src={photoUrl}
            alt={player.name}
            className="w-32 h-32 md:w-36 md:h-36 rounded-2xl object-cover border border-slate-100"
          />
          <Badge variant={player.isActive ? 'success' : 'danger'}>
            {player.isActive ? 'Active Athlete' : 'Inactive'}
          </Badge>
        </div>

        {/* Bio Details */}
        <div className="md:col-span-2 space-y-4 text-center md:text-left">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-905 flex items-center justify-center md:justify-start gap-2">
              {player.name}
              {player.isActive && <BadgeCheck className="text-blue-500" size={20} />}
            </h2>
            <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mt-0.5">
              Department of {player.department?.name}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-505">
            <p className="flex items-center gap-1.5 justify-center md:justify-start">
              <Mail size={14} /> {player.email || 'No email provided'}
            </p>
            <p className="flex items-center gap-1.5 justify-center md:justify-start">
              <Phone size={14} /> {player.phone || 'No phone provided'}
            </p>
            <p className="flex items-center gap-1.5 justify-center md:justify-start">
              <User size={14} /> Age: <strong className="text-slate-700">{player.age} Years</strong>
            </p>
            <p className="flex items-center gap-1.5 justify-center md:justify-start">
              <Shield size={14} /> Jersey: <strong className="text-slate-700">#{player.jerseyNumber}</strong>
            </p>
          </div>

          <div className="space-y-1.5 pt-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Enrolled sports
            </span>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              {player.sports?.map((s) => (
                <Badge key={s._id} variant="primary">
                  {s.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Match History Table */}
      <div className="bg-white border border-slate-205 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-extrabold text-slate-705 uppercase tracking-wider mb-4">
          Match History (Department Roster)
        </h3>

        {matches.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No matches scheduled or completed for this player's department yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-2xs font-bold">
                <tr>
                  <th className="px-5 py-3">Tournament</th>
                  <th className="px-5 py-3">Matchup</th>
                  <th className="px-5 py-3">Score</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Winner</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {matches.map((m) => {
                  const t1Name = m.team1?.department?.name.split(' ')[0] || 'TBD';
                  const t2Name = m.team2?.department?.name.split(' ')[0] || 'TBD';
                  const winnerName = m.winner && m.winner.department ? m.winner.department.name.split(' ')[0] : (m.status === 'completed' ? 'Draw' : '-');

                  return (
                    <tr key={m._id} className="hover:bg-slate-55/50 transition">
                      <td className="px-5 py-3 font-semibold text-slate-900 max-w-xs truncate">
                        {m.tournament?.name}
                      </td>
                      <td className="px-5 py-3">
                        {t1Name} vs {t2Name}
                      </td>
                      <td className="px-5 py-3 font-bold">
                        {m.status === 'scheduled' ? '-' : `${m.score1} - ${m.score2}`}
                      </td>
                      <td className="px-5 py-3 text-xs">{formatDate(m.scheduledAt).split(',')[0]}</td>
                      <td className="px-5 py-3 text-xs font-semibold">{winnerName}</td>
                      <td className="px-5 py-3">
                        <Badge variant={m.status === 'live' ? 'ongoing' : m.status === 'completed' ? 'success' : 'default'} className="text-3xs">
                          {m.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerDetail;
