import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Shield, AlertTriangle, CheckSquare } from 'lucide-react';
import api from '../../lib/axios';
import Skeleton from '../../components/common/Skeleton';
import Badge from '../../components/common/Badge';
import PageHeader from '../../components/common/PageHeader';
import Avatar from '../../components/common/Avatar';
import toast from 'react-hot-toast';

const TeamDetail = () => {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTeamDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/teams/${id}`);
      if (res.data && res.data.data) {
        setTeam(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load team details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamDetails();
  }, [id]);

  if (loading) {
    return <Skeleton type="card" count={2} />;
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold">Team profile not found</h3>
        <Link to="/teams" className="text-blue-500 hover:underline mt-2 inline-block">
          Back to Teams List
        </Link>
      </div>
    );
  }

  const teamName = `${team.department?.name || 'Department'} ${team.tournament?.sport?.name || 'Sports'} Team`;
  const teamPhoto = team.photo?.startsWith('/uploads') 
    ? `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${team.photo}` 
    : (team.photo || 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?q=80&w=300&auto=format&fit=crop');

  return (
    <div className="space-y-6">
      
      {/* Back button */}
      <div>
        <Link
          to="/teams"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition gap-1"
        >
          <ArrowLeft size={14} /> Back to Teams List
        </Link>
      </div>

      {/* Overview Block */}
      <div className="bg-white border border-slate-205 rounded-2xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Roster Photo */}
        <div className="h-40 rounded-xl overflow-hidden border border-slate-100">
          <img
            src={teamPhoto}
            alt={`${teamName} Roster Photo`}
            className="w-full h-full object-cover"
          />
        </div>

        {/* details */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-lg md:text-xl font-black text-slate-900">
                {teamName}
              </h2>
              <p className="text-xs text-slate-550 font-semibold mt-0.5">
                Tournament: <span className="text-blue-600">{team.tournament?.name}</span>
              </p>
            </div>
            
            <Badge variant={team.isApproved ? 'success' : 'warning'}>
              {team.isApproved ? 'Approved Roster' : 'Verification Pending'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
            <p>
              Coach: <strong className="text-slate-700">{team.coach || 'N/A'}</strong>
            </p>
            <p>
              Captain: <strong className="text-slate-700">{team.captain?.name || 'N/A'}</strong>
            </p>
            <p>
              Vice-Captain: <strong className="text-slate-700">{team.viceCaptain?.name || 'N/A'}</strong>
            </p>
            {team.isApproved && (
              <p className="flex items-center gap-1">
                <CheckSquare size={12} className="text-blue-500" /> Approved by: {team.approvedBy?.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Roster Athletes Table */}
      <div className="bg-white border border-slate-205 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider mb-4">
          Roster Athlete Listing
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-2xs font-bold">
              <tr>
                <th className="px-5 py-3">Player Name</th>
                <th className="px-5 py-3">Roll Number</th>
                <th className="px-5 py-3">Position</th>
                <th className="px-5 py-3">Jersey</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {team.players?.map((p) => {
                const isCap = p._id === team.captain?._id;
                const isVC = p._id === team.viceCaptain?._id;
                
                return (
                  <tr key={p._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3 flex items-center space-x-3">
                      <Avatar src={p.photo} name={p.name} size="xs" />
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        {p.name}
                        {isCap && <span className="px-1.5 py-0.5 text-4xs font-bold uppercase tracking-wider rounded bg-yellow-500/10 text-yellow-600">Captain</span>}
                        {isVC && <span className="px-1.5 py-0.5 text-4xs font-bold uppercase tracking-wider rounded bg-blue-500/10 text-blue-600">V.Captain</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs font-semibold">{p.rollNumber}</td>
                    <td className="px-5 py-3 text-xs">{p.position || '-'}</td>
                    <td className="px-5 py-3 font-extrabold text-xs">#{p.jerseyNumber}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeamDetail;
