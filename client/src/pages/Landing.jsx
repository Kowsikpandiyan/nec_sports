import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Calendar, Users, Award, ShieldAlert, ChevronRight, Activity, Clock, Trophy } from 'lucide-react';
import api from '../lib/axios';
import { formatDate } from '../lib/utils';

const Landing = () => {
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [completedMatches, setCompletedMatches] = useState([]);
  const [stats, setStats] = useState({ depts: 5, players: 40, tournaments: 2 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchLandingData = async () => {
    try {
      // 1. Fetch live matches
      const liveRes = await api.get('/matches/live');
      if (liveRes.data && liveRes.data.data) {
        setLiveMatches(liveRes.data.data);
      }

      // 2. Fetch upcoming matches
      const upcomingRes = await api.get('/matches/upcoming');
      if (upcomingRes.data && upcomingRes.data.data) {
        setUpcomingMatches(upcomingRes.data.data);
      }

      // 3. Fetch completed matches
      const completedRes = await api.get('/matches?status=completed&limit=5');
      if (completedRes.data && completedRes.data.data) {
        setCompletedMatches(completedRes.data.data);
      }

      // 4. Fetch dynamic totals
      const [deptRes, playerRes, tourneyRes] = await Promise.all([
        api.get('/departments?limit=1'),
        api.get('/players?limit=1'),
        api.get('/tournaments?limit=1')
      ]);

      setStats({
        depts: deptRes.data?.pagination?.total || 5,
        players: playerRes.data?.pagination?.total || 40,
        tournaments: tourneyRes.data?.pagination?.total || 2
      });
    } catch (error) {
      console.error('Error fetching landing page data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLandingData();
    // Poll live matches every 30s
    const timer = setInterval(fetchLandingData, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero section */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-900 via-teal-900 to-slate-900 text-white p-8 md:p-12 lg:p-16 shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent)] pointer-events-none" />
        
        <div className="relative max-w-2xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            <span>NEC Campus Athletics</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            NEC College Sports Tournament Management
          </h1>
          
          <p className="text-sm md:text-base text-slate-350 leading-relaxed">
            Track real-time scores, standings, brackets, player profiles, and event schedules for all inter-department athletics championships.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              to="/live"
              className="inline-flex items-center justify-center px-5 py-3 text-sm font-semibold rounded-xl bg-blue-500 hover:bg-blue-600 text-white transition shadow-lg shadow-blue-500/10 gap-2"
            >
              <Play size={16} fill="white" />
              <span>View Live Scores</span>
            </Link>
            
            <Link
              to="/points-table"
              className="inline-flex items-center justify-center px-5 py-3 text-sm font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-205 transition gap-2"
            >
              <Calendar size={16} />
              <span>View Standings</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="grid grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 hidden sm:block">
            <Users size={20} />
          </div>
          <div>
            <p className="text-2xs sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Departments
            </p>
            <h3 className="text-lg md:text-2xl font-black text-slate-905">
              {stats.depts}
            </h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 hidden sm:block">
            <Trophy size={20} />
          </div>
          <div>
            <p className="text-2xs sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Athletes
            </p>
            <h3 className="text-lg md:text-2xl font-black text-slate-905">
              {stats.players}
            </h3>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600 hidden sm:block">
            <Award size={20} />
          </div>
          <div>
            <p className="text-2xs sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tournaments
            </p>
            <h3 className="text-lg md:text-2xl font-black text-slate-905">
              {stats.tournaments}
            </h3>
          </div>
        </div>
      </section>

      {/* Main Grid: Live & Upcoming Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Live Matches & Upcoming */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Live matches segment */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <h2 className="text-xl font-extrabold text-slate-900">
                Live Coverage
              </h2>
            </div>

            {liveMatches.length === 0 ? (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-500">
                No matches are live right now. Check upcoming events below.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {liveMatches.map((m) => (
                  <div
                    key={m._id}
                    onClick={() => navigate(`/matches/${m._id}`)}
                    className="p-5 bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl hover:border-red-500 transition cursor-pointer shadow-xs relative"
                  >
                    <span className="absolute top-4 right-4 px-2 py-0.5 rounded bg-red-550 text-white text-3xs font-extrabold uppercase animate-pulse">
                      Live
                    </span>
                    <p className="text-3xs text-blue-600 font-bold uppercase tracking-wider">
                      {m.sport?.name}
                    </p>
                    
                    <div className="flex justify-between items-center mt-3">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-905">
                          {m.team1?.department?.name.split(' ')[0]}
                        </p>
                        <p className="text-sm font-bold text-slate-905">
                          {m.team2?.department?.name.split(' ')[0]}
                        </p>
                      </div>
                      
                      <div className="text-right text-lg font-black text-slate-800 px-3 bg-slate-100 rounded-lg py-1">
                        <p>{m.score1}</p>
                        <p>{m.score2}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Matches */}
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Clock size={20} className="text-blue-500" /> Scheduled Fixtures
            </h2>

            {upcomingMatches.length === 0 ? (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-500">
                No upcoming matches scheduled.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                {upcomingMatches.map((m) => (
                  <div
                    key={m._id}
                    onClick={() => navigate(`/matches/${m._id}`)}
                    className="flex justify-between items-center p-4 hover:bg-slate-50 cursor-pointer transition"
                  >
                    <div className="space-y-1">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-4xs font-bold uppercase">
                        {m.sport?.name}
                      </span>
                      <p className="text-sm font-extrabold text-slate-850">
                        {m.team1?.department?.name.split(' ')[0]} vs {m.team2?.department?.name.split(' ')[0]}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-900">
                        {formatDate(m.scheduledAt)}
                      </p>
                      <p className="text-3xs text-slate-400">
                        {m.venue?.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Results & Footer */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Activity size={20} className="text-blue-500" /> Recent Results
            </h2>

            {completedMatches.length === 0 ? (
              <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-500">
                No completed match results found.
              </div>
            ) : (
              <div className="space-y-3">
                {completedMatches.map((m) => {
                  const t1Name = m.team1?.department?.name.split(' ')[0] || 'TBD';
                  const t2Name = m.team2?.department?.name.split(' ')[0] || 'TBD';
                  
                  return (
                    <div
                      key={m._id}
                      onClick={() => navigate(`/matches/${m._id}`)}
                      className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-500 transition cursor-pointer shadow-xs"
                    >
                      <div className="flex justify-between items-center text-4xs text-slate-400 font-bold uppercase mb-2">
                        <span>{m.sport?.name}</span>
                        <span>{formatDate(m.scheduledAt).split(',')[0]}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-850">
                          {t1Name} vs {t2Name}
                        </span>
                        
                        <span className="text-xs font-black bg-slate-105 text-slate-800 px-2 py-1 rounded">
                          {m.score1} - {m.score2}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
        <p>© 2026 NEC College of Engineering. All rights reserved.</p>
        <p className="mt-1">Built with React 19, Node.js, Mongoose & Socket.IO.</p>
      </footer>
    </div>
  );
};

export default Landing;
