import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Calendar, Activity, CheckCircle2, Trophy, Clock, ChevronRight, UserPlus, FolderPlus, Radio, Award } from 'lucide-react';
import api from '../lib/axios';
import { AuthContext } from '../context/AuthContext';
import { formatDate } from '../lib/utils';
import Skeleton from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import DashboardChatbot from '../components/chat/DashboardChatbot';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    depts: 0,
    tournaments: 0,
    matches: 0,
    champion: 'N/A'
  });

  const [standings, setStandings] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [activities, setActivities] = useState([]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [deptRes, matchRes, completedRes, tourneyRes, standingsRes, notifRes] = await Promise.all([
        api.get('/departments?limit=1'),
        api.get('/matches?limit=1000'),
        api.get('/matches?status=completed&limit=5&sort=-scheduledAt'),
        api.get('/tournaments?limit=100'),
        api.get('/leaderboard/departments'),
        api.get('/notifications?limit=10')
      ]);

      const deptsCount = deptRes.data?.pagination?.total || 0;
      const allMatches = matchRes.data?.data || [];
      const completedMatches = completedRes.data?.data || [];
      const tournamentsList = tourneyRes.data?.data || [];
      const standingsList = standingsRes.data?.data || [];
      const recentNotifications = notifRes.data?.data || [];

      // Identify champion department (first place in standings)
      const championDeptName = standingsList[0]?.department?.name || 'N/A';

      setStats({
        depts: deptsCount,
        tournaments: tournamentsList.length,
        matches: allMatches.length,
        champion: championDeptName
      });

      setStandings(standingsList);
      setRecentMatches(completedMatches);
      setActivities(recentNotifications);
    } catch (error) {
      console.error('Failed to load dashboard statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return <Skeleton type="card" count={3} className="h-64" />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div
        className="rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md"
        style={{ background: 'linear-gradient(135deg, #2756F5 0%, #1E40AF 100%)' }}
      >
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white">
            Welcome back, {user?.name}! 👋
          </h2>
          <p className="text-sm text-white/70 mt-1">
            Role: <span className="font-bold text-white uppercase">{user?.role}</span> · NEC Sports Portal
          </p>
        </div>

        {/* Quick Actions (Role specific) */}
        <div className="flex flex-wrap gap-3">
          {user?.role === 'superAdmin' && (
            <>
              <Link
                to="/tournaments/new"
                className="inline-flex items-center px-4 py-2 text-sm font-bold rounded-lg bg-white text-blue-700 hover:bg-blue-50 transition gap-2 shadow-sm"
              >
                <FolderPlus size={16} /> Create Tournament
              </Link>
              <Link
                to="/settings"
                className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg border border-white/30 text-white hover:bg-white/10 transition"
              >
                Go to Settings
              </Link>
            </>
          )}
          {user?.role === 'coordinator' && (
            <Link
              to="/players/new"
              className="inline-flex items-center px-4 py-2 text-sm font-bold rounded-lg bg-white text-blue-700 hover:bg-blue-50 transition gap-2 shadow-sm"
            >
              <UserPlus size={16} /> Add Athlete Player
            </Link>
          )}
          {['scorer', 'superAdmin'].includes(user?.role) && (
            <Link
              to="/live"
              className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg bg-red-500 hover:bg-red-600 text-white transition gap-2"
            >
              <Radio size={16} className="animate-pulse" /> Go Live Panel
            </Link>
          )}
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Depts */}
        <div className="bg-white border border-gray-200 p-5 rounded-xl flex items-center space-x-4 shadow-sm">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <Building2 size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Departments</p>
            <h4 className="text-2xl font-black text-gray-900">{stats.depts}</h4>
          </div>
        </div>

        {/* Total Tournaments */}
        <div className="bg-white border border-gray-200 p-5 rounded-xl flex items-center space-x-4 shadow-sm">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
            <Trophy size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Tournaments</p>
            <h4 className="text-2xl font-black text-gray-900">{stats.tournaments}</h4>
          </div>
        </div>

        {/* Total Matches */}
        <div className="bg-white border border-gray-200 p-5 rounded-xl flex items-center space-x-4 shadow-sm">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <Calendar size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Matches</p>
            <h4 className="text-2xl font-black text-gray-900">{stats.matches}</h4>
          </div>
        </div>

        {/* Current Champion Department */}
        <div
          className="p-5 rounded-xl flex items-center space-x-4 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #2756F5 0%, #1E40AF 100%)' }}
        >
          <div className="p-3 rounded-xl bg-white/20 text-white">
            <Award size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-white/70 font-semibold uppercase tracking-wider">Rank #1 Champion</p>
            <h4 className="text-sm font-black text-white truncate pr-2">
              {stats.champion}
            </h4>
          </div>
        </div>
      </div>


      {/* Main Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Overall Rankings & Recent Matches */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section: Overall Department Rankings */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider">
                Overall Department Rankings
              </h3>
              <Link to="/points-table" className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-0.5">
                View Full Standings <ChevronRight size={14} />
              </Link>
            </div>

            {standings.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs italic">
                No standings data available yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: '#2756F5' }} className="text-white text-xs font-bold tracking-wider rounded-lg">
                      <th className="py-2.5 px-3 w-12 text-center rounded-tl-lg">Rank</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3 text-center">Played</th>
                      <th className="py-2.5 px-3 text-center">Won</th>
                      <th className="py-2.5 px-3 text-center font-bold rounded-tr-lg">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.slice(0, 5).map((s, idx) => {
                      const rank = idx + 1;
                      let rowBg = '';
                      if (rank === 1) rowBg = 'bg-amber-50';
                      else if (rank === 2) rowBg = 'bg-gray-50';
                      else if (rank === 3) rowBg = 'bg-orange-50';

                      return (
                        <tr key={s._id} className={`border-b border-gray-100 hover:bg-blue-50/50 transition ${rowBg}`}>
                          <td className="py-2.5 px-3 text-center text-xs font-black">
                            {rank === 1 ? '🥇 1' : rank === 2 ? '🥈 2' : rank === 3 ? '🥉 3' : rank}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-gray-900">
                            {s.department?.name}
                          </td>
                          <td className="py-2.5 px-3 text-center text-xs text-gray-600">{s.matchesPlayed}</td>
                          <td className="py-2.5 px-3 text-center text-xs text-green-600 font-medium">
                            {s.matchesWon}
                          </td>
                          <td className="py-2.5 px-3 text-center text-sm font-black text-blue-700">
                            {s.totalPoints}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section: Recent Match Results */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider mb-4">
              Recent Match Results
            </h3>

            {recentMatches.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-xs italic border border-dashed border-gray-200 rounded-xl">
                No matches concluded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {recentMatches.map((m) => {
                  const t1Name = m.team1?.department?.name.split(' ')[0] || 'Team 1';
                  const t2Name = m.team2?.department?.name.split(' ')[0] || 'Team 2';
                  
                  return (
                    <div
                      key={m._id}
                      onClick={() => navigate(`/matches/${m._id}`)}
                      className="p-4 bg-gray-50 hover:bg-blue-50 border border-gray-100 rounded-xl transition flex items-center justify-between cursor-pointer group"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                          {m.sport?.name}
                        </span>
                        <div className="flex items-center space-x-2 text-xs font-bold text-gray-800">
                          <span className={m.winner?.toString() === m.team1?._id?.toString() ? 'text-gray-950 font-extrabold' : 'text-gray-500'}>
                            {t1Name}
                          </span>
                          <span className="text-gray-400 font-normal">vs</span>
                          <span className={m.winner?.toString() === m.team2?._id?.toString() ? 'text-gray-950 font-extrabold' : 'text-gray-500'}>
                            {t2Name}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium">
                          {formatDate(m.scheduledAt).split(',')[0]}
                        </p>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-gray-900 bg-gray-100 py-1 px-3.5 rounded-lg border border-gray-200">
                          {m.score1} - {m.score2}
                        </div>
                        {m.winner ? (
                          <p className="text-[10px] text-blue-600 font-extrabold uppercase mt-1">
                            🏆 {m.winner?.toString() === m.team1?._id?.toString() ? t1Name : t2Name}
                          </p>
                        ) : (
                          <p className="text-[10px] text-gray-400 font-extrabold uppercase mt-1">
                            Draw
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Recent Activity Feed */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider mb-4">
              Recent Activity
            </h3>

            <div className="flow-root">
              <ul className="-mb-8">
                {activities.length === 0 ? (
                  <div className="py-6 text-center text-xs text-gray-400 italic">
                    No recent activities recorded.
                  </div>
                ) : (
                  activities.map((act, actIdx) => (
                    <li key={act._id}>
                      <div className="relative pb-6">
                        {actIdx !== activities.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-100"
                            aria-hidden="true"
                          />
                        ) : null}
                        
                        <div className="relative flex space-x-2.5">
                          <div>
                            <span className="h-7 w-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center ring-4 ring-white">
                              <Activity size={12} />
                            </span>
                          </div>
                          
                          <div className="flex-1 min-w-0 pt-0.5 flex justify-between space-x-2">
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-gray-900">
                                {act.title}
                              </p>
                              <p className="text-[11px] text-gray-500 line-clamp-2">
                                {act.message}
                              </p>
                            </div>
                            
                            <div className="text-right text-[10px] text-gray-400 shrink-0">
                              <time dateTime={act.createdAt}>{formatDate(act.createdAt).split(',')[0]}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* Floating AI Sports Chatbot Widget */}
      <DashboardChatbot />
    </div>
  );
};

export default Dashboard;
