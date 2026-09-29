import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Radio, Calendar, Activity, Info, Trophy } from 'lucide-react';
import api from '../../lib/axios';
import { socket } from '../../lib/socket';
import PageHeader from '../../components/common/PageHeader';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';
import Skeleton from '../../components/common/Skeleton';

// Subcomponent representing a live match card with flashing score animation
const LiveMatchCard = ({ matchData }) => {
  const navigate = useNavigate();
  const [match, setMatch] = useState(matchData);
  const [flash1, setFlash1] = useState(false);
  const [flash2, setFlash2] = useState(false);

  useEffect(() => {
    setMatch(matchData);
  }, [matchData]);

  // Hook into local score changes to trigger micro-flash animations
  useEffect(() => {
    if (matchData.score1 !== match.score1) {
      setFlash1(true);
      const timer = setTimeout(() => setFlash1(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [matchData.score1]);

  useEffect(() => {
    if (matchData.score2 !== match.score2) {
      setFlash2(true);
      const timer = setTimeout(() => setFlash2(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [matchData.score2]);

  const t1Name = match.team1?.department?.name.split(' ')[0] || 'Team 1';
  const t2Name = match.team2?.department?.name.split(' ')[0] || 'Team 2';

  return (
    <div
      onClick={() => navigate(`/matches/${match._id}`)}
      className="p-6 bg-white border border-slate-205 rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer relative overflow-hidden flex flex-col justify-between"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl" />

      {/* Top details */}
      <div className="flex justify-between items-center mb-4">
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
        </span>
        <Badge variant="danger" className="text-4xs px-2">
          {match.sport?.name}
        </Badge>
      </div>

      {/* Teams vs Score Row */}
      <div className="flex justify-between items-center py-2">
        <div className="space-y-2">
          <p className="text-sm font-extrabold text-slate-850">{t1Name}</p>
          <p className="text-sm font-extrabold text-slate-850">{t2Name}</p>
        </div>

        {/* Scores with flash triggers */}
        <div className="text-right text-lg font-black text-slate-800 bg-slate-100 rounded-xl py-2 px-4 shadow-inner space-y-1">
          <p className={`px-1.5 rounded transition duration-200 ${flash1 ? 'bg-yellow-300 text-yellow-900 scale-105' : ''}`}>
            {match.score1}
          </p>
          <p className={`px-1.5 rounded transition duration-200 ${flash2 ? 'bg-yellow-300 text-yellow-900 scale-105' : ''}`}>
            {match.score2}
          </p>
        </div>
      </div>

    </div>
  );
};

const LiveScoreBoard = () => {
  const navigate = useNavigate();
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = async () => {
    try {
      const [liveRes, upcomingRes] = await Promise.all([
        api.get('/matches/live'),
        api.get('/matches/upcoming')
      ]);

      if (liveRes.data?.data) {
        setLiveMatches(liveRes.data.data);
      }
      if (upcomingRes.data?.data) {
        setUpcomingMatches(upcomingRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load live match data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();

    // Connect to websocket
    socket.connect();

    // Subscribe to all rooms when matches are fetched
    if (liveMatches.length > 0) {
      liveMatches.forEach((m) => {
        socket.emit('match:subscribe', m._id);
      });
    }

    // Socket Event: Score updates
    socket.on('score:update', ({ matchId, score1, score2 }) => {
      setLiveMatches((prev) =>
        prev.map((m) => (m._id === matchId ? { ...m, score1, score2 } : m))
      );
    });

    // Socket Event: Timeline Events
    socket.on('match:event', ({ matchId, event }) => {
      setLiveMatches((prev) =>
        prev.map((m) => {
          if (m._id === matchId) {
            const currentEvents = m.events || [];
            return { ...m, events: [event, ...currentEvents] };
          }
          return m;
        })
      );
    });

    // Socket Event: Status Changes (PAUSE/RESUME/COMPLETE)
    socket.on('match:status', ({ matchId, status }) => {
      if (status === 'completed') {
        // Remove from live array
        setLiveMatches((prev) => prev.filter((m) => m._id !== matchId));
        // Refresh upcoming / landing data
        fetchMatches();
      } else {
        setLiveMatches((prev) =>
          prev.map((m) => (m._id === matchId ? { ...m, status } : m))
        );
      }
    });

    return () => {
      // Cleanup socket listeners
      socket.off('score:update');
      socket.off('match:event');
      socket.off('match:status');
    };
  }, [liveMatches.length]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Live Scoreboard"
        description="Monitor matches and results from all campus courts in real-time."
      >
      </PageHeader>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton type="card" count={2} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Live matches Column */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" /> Live Games
            </h3>

            {liveMatches.length === 0 ? (
              <EmptyState
                icon={Radio}
                title="No live matches"
                description="There are currently no active matches broadcasted. Upcoming schedules are displayed on the sidebar."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {liveMatches.map((m) => (
                  <LiveMatchCard key={m._id} matchData={m} />
                ))}
              </div>
            )}
          </div>

          {/* Upcoming matches Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" /> Upcoming Schedules
            </h3>

            {upcomingMatches.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-white border rounded-2xl">
                No future schedules booked.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingMatches.map((m) => {
                  const t1Name = m.team1?.department?.name.split(' ')[0] || 'Team 1';
                  const t2Name = m.team2?.department?.name.split(' ')[0] || 'Team 2';

                  return (
                    <div
                      key={m._id}
                      onClick={() => navigate(`/matches/${m._id}`)}
                      className="p-4 bg-white border border-slate-205 rounded-xl shadow-2xs space-y-2 cursor-pointer hover:shadow-sm hover:border-slate-300 transition"
                    >
                      <div className="flex justify-between items-center text-4xs font-bold text-slate-400 uppercase">
                        <span>{m.sport?.name}</span>
                        <span>{m.round ? `Round ${m.round}` : ''}</span>
                      </div>
                      
                      <p className="text-xs font-black text-slate-850">
                        {t1Name} vs {t2Name}
                      </p>

                      <div className="border-t border-slate-50 pt-2 flex justify-between text-3xs text-slate-500">
                        <span>🕒 {formatDate(m.scheduledAt).split(',')[1]}</span>
                        <span>📍 {m.venue?.name.split(' ')[0]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default LiveScoreBoard;
