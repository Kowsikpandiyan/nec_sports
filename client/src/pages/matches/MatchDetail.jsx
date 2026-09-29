import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/axios';
import { socket, connectSocket } from '../../lib/socket';
import { AuthContext } from '../../context/AuthContext';
import PageHeader from '../../components/common/PageHeader';
import Skeleton from '../../components/common/Skeleton';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';
import { Calendar, MapPin, User, ArrowLeft, Radio, Clock, ShieldAlert, Award, FileText } from 'lucide-react';
import { formatDate } from '../../lib/utils';

const MatchDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' or 'lineups'

  const fetchMatchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/matches/${id}`);
      if (res.data && res.data.data) {
        setMatch(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load match details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchDetail();
  }, [id]);

  useEffect(() => {
    // Make sure socket is connected
    connectSocket();

    // Subscribe to match room updates
    socket.emit('match:subscribe', id);

    // Socket listeners
    const handleScoreUpdate = (data) => {
      if (data.matchId === id) {
        setMatch(prev => prev ? { ...prev, score1: data.score1, score2: data.score2 } : null);
      }
    };

    const handleStatusUpdate = (data) => {
      if (data.matchId === id) {
        setMatch(prev => prev ? { ...prev, status: data.status, winner: data.winner } : null);
        toast.info(`Match status updated: ${data.status}`);
      }
    };

    const handleNewEvent = (data) => {
      if (data.matchId === id) {
        setMatch(prev => {
          if (!prev) return null;
          // Avoid duplicate events if any
          const exists = prev.events?.some(e => e._id === data.event._id);
          if (exists) return prev;
          return {
            ...prev,
            events: [...(prev.events || []), data.event]
          };
        });
      }
    };

    socket.on('score:update', handleScoreUpdate);
    socket.on('match:status', handleStatusUpdate);
    socket.on('match:event', handleNewEvent);

    return () => {
      socket.emit('match:unsubscribe', id);
      socket.off('score:update', handleScoreUpdate);
      socket.off('match:status', handleStatusUpdate);
      socket.off('match:event', handleNewEvent);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-80 md:col-span-2 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-4xl mx-auto p-4 text-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-slate-400 mx-auto" />
        <h3 className="text-xl font-bold text-slate-800 font-sans">Match Not Found</h3>
        <p className="text-slate-600">
          The requested match details are unavailable. It might have been deleted.
        </p>
        <Link to="/dashboard" className="inline-flex items-center text-blue-500 hover:underline">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  const team1Name = match.team1?.department?.name || 'TBD (Home)';
  const team2Name = match.team2?.department?.name || 'TBD (Away)';
  const sportName = match.sport?.name || 'Sport';
  const tournamentName = match.tournament?.name || 'Tournament';

  const isScorerOrAdmin = user && ['scorer', 'superAdmin'].includes(user.role);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back button and quick actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link 
          to={user?.role === 'superAdmin' ? '/matches' : '/dashboard'} 
          className="inline-flex items-center text-slate-600 hover:text-blue-500 font-semibold transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-1.5" />
          {user?.role === 'superAdmin' ? 'Back to Fixtures' : 'Back to Dashboard'}
        </Link>

        {isScorerOrAdmin && match.status !== 'completed' && (
          <Link
            to={`/scorer/match/${match._id}`}
            className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:shadow transition-colors gap-2 cursor-pointer"
          >
            <Radio className="h-4.5 w-4.5 animate-pulse" />
            Enter Scorer Panel
          </Link>
        )}
      </div>

      {/* Large Hero Score Board */}
      <div className="relative bg-slate-900 text-white rounded-2xl overflow-hidden shadow-xl p-6 md:p-8 flex flex-col items-center">
        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="relative z-10 flex flex-col items-center space-y-1 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
            {tournamentName}
          </span>
          <h2 className="text-sm font-semibold text-slate-300">
            {sportName} • Round {match.round}
          </h2>
          {match.status === 'live' && (
            <div className="inline-flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full mt-2 animate-pulse">
              <Radio className="h-3.5 w-3.5" />
              Live Play
            </div>
          )}
        </div>

        {/* Head-to-Head Counter */}
        <div className="relative z-10 w-full grid grid-cols-3 items-center mt-6 md:mt-10 max-w-3xl">
          {/* Team 1 */}
          <div className="text-center space-y-2 flex flex-col items-center">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-slate-800 border border-slate-700 p-3.5 flex items-center justify-center shadow">
              <span className="text-2xl font-bold text-white uppercase select-none">
                {team1Name.substring(0, 2)}
              </span>
            </div>
            <h3 className="text-sm md:text-lg font-bold truncate max-w-full font-sans">
              {team1Name}
            </h3>
          </div>

          {/* Score Counter */}
          <div className="text-center flex flex-col justify-center items-center">
            <div className="flex items-center gap-3">
              <span className="text-4xl md:text-6xl font-black font-mono tracking-tighter text-blue-400 select-none">
                {match.status === 'scheduled' ? '0' : match.score1}
              </span>
              <span className="text-xl md:text-2xl text-slate-500 font-bold select-none">-</span>
              <span className="text-4xl md:text-6xl font-black font-mono tracking-tighter text-blue-400 select-none">
                {match.status === 'scheduled' ? '0' : match.score2}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-2 capitalize bg-slate-800/50 border border-slate-700 px-3 py-1 rounded-full inline-block">
              {match.status}
            </div>
          </div>

          {/* Team 2 */}
          <div className="text-center space-y-2 flex flex-col items-center">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-slate-800 border border-slate-700 p-3.5 flex items-center justify-center shadow">
              <span className="text-2xl font-bold text-white uppercase select-none">
                {team2Name.substring(0, 2)}
              </span>
            </div>
            <h3 className="text-sm md:text-lg font-bold truncate max-w-full font-sans">
              {team2Name}
            </h3>
          </div>
        </div>
      </div>


      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left pane: Tabs (Timeline / Lineups) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">            {/* Roster list header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
                Lineups & Rosters
              </h3>
            </div>

            {/* Tab content */}
            <div className="p-6">
              {/* Lineups View */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Home Lineup */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-700 pb-1.5 border-b border-slate-200">
                    {team1Name} Squad
                  </h4>
                  {!match.team1?.players || match.team1.players.length === 0 ? (
                    <p className="text-xs text-slate-400">No players registered under this roster.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {match.team1.players.map((p) => (
                        <li key={p._id} className="py-2.5 flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-800">{p.name}</span>
                          <span className="text-xs text-slate-500 font-mono">
                            {p.position || 'Player'} {p.jerseyNumber && `#${p.jerseyNumber}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Away Lineup */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-700 pb-1.5 border-b border-slate-200">
                    {team2Name} Squad
                  </h4>
                  {!match.team2?.players || match.team2.players.length === 0 ? (
                    <p className="text-xs text-slate-400">No players registered under this roster.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {match.team2.players.map((p) => (
                        <li key={p._id} className="py-2.5 flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-800">{p.name}</span>
                          <span className="text-xs text-slate-500 font-mono">
                            {p.position || 'Player'} {p.jerseyNumber && `#${p.jerseyNumber}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right pane: Match Metadata Details */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-200">
              Match Details
            </h3>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="text-xs text-slate-400 font-semibold">Scheduled Date</h5>
                  <p className="text-sm font-bold text-slate-800">
                    {formatDate(match.scheduledAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="text-xs text-slate-400 font-semibold">Venue Arena</h5>
                  <p className="text-sm font-bold text-slate-800">
                    {match.venue?.name || 'Unassigned'}
                  </p>
                  {match.venue?.location && (
                    <p className="text-xs text-slate-500">{match.venue.location}</p>
                  )}
                </div>
              </div>

              {match.referee && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-xs text-slate-400 font-semibold">Match Official (Referee)</h5>
                    <p className="text-sm font-bold text-slate-800">{match.referee}</p>
                  </div>
                </div>
              )}

              {match.scorer && (
                <div className="flex items-start gap-3">
                  <Award className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-xs text-slate-400 font-semibold">Assigned Scorer</h5>
                    <p className="text-sm font-bold text-slate-800">
                      {match.scorer.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Winner announcement if match is completed */}
          {match.status === 'completed' && (
            <div className="bg-gradient-to-br from-blue-500 to-teal-600 text-white p-6 rounded-2xl shadow-md text-center space-y-3 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
              
              <Award className="h-12 w-12 mx-auto relative z-10 drop-shadow" />
              <div className="relative z-10 space-y-1">
                <h4 className="text-xs uppercase font-extrabold tracking-widest text-blue-200">Tournament Winner</h4>
                <p className="text-lg font-black font-sans leading-tight">
                  {match.winner ? (match.winner.department?.name || match.winner.name) : 'Draw Match'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchDetail;
