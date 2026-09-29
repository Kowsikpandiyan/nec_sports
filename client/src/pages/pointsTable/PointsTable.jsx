import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

const PointsTable = ({ tournamentId = '', inlineMode = false }) => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTourney, setSelectedTourney] = useState(tournamentId);
  const [standings, setStandings] = useState([]); // for tournament-specific
  const [globalStandings, setGlobalStandings] = useState([]); // for global rankings
  const [loading, setLoading] = useState(false);
  const [tFormat, setTFormat] = useState('');

  // Fetch tournaments if in inlineMode but no tournamentId is passed initially
  useEffect(() => {
    const fetchTourneys = async () => {
      if (!inlineMode) return;
      try {
        const res = await api.get('/tournaments?limit=100');
        if (res.data?.data) {
          const list = res.data.data.filter(t => t.format !== 'knockout');
          setTournaments(list);
          if (list.length > 0 && !selectedTourney) {
            setSelectedTourney(list[0]._id);
          }
        }
      } catch (err) {
        toast.error('Failed to load tournaments list');
      }
    };
    fetchTourneys();
  }, [inlineMode]);

  // Sync prop changes
  useEffect(() => {
    if (tournamentId) {
      setSelectedTourney(tournamentId);
    }
  }, [tournamentId]);

  // Fetch tournament standings when tournament changes (for inline mode)
  useEffect(() => {
    const fetchStandings = async () => {
      if (!inlineMode || !selectedTourney) return;
      try {
        setLoading(true);
        const [standingsRes, tourneyRes] = await Promise.all([
          api.get(`/tournaments/${selectedTourney}/points-table`),
          api.get(`/tournaments/${selectedTourney}`)
        ]);

        if (standingsRes.data?.data) {
          setStandings(standingsRes.data.data);
        }
        if (tourneyRes.data?.data) {
          setTFormat(tourneyRes.data.data.format);
        }
      } catch (err) {
        console.error('Failed to load points table:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStandings();
  }, [selectedTourney, inlineMode]);

  // Fetch global department standings (for standalone mode)
  useEffect(() => {
    const fetchGlobalStandings = async () => {
      if (inlineMode) return;
      try {
        setLoading(true);
        const res = await api.get('/leaderboard/departments');
        if (res.data?.data) {
          setGlobalStandings(res.data.data);
        }
      } catch (err) {
        toast.error('Failed to load department standings');
      } finally {
        setLoading(false);
      }
    };
    fetchGlobalStandings();
  }, [inlineMode]);

  if (loading) {
    return <Skeleton type="table" count={5} />;
  }

  // Standalone: Global Department rankings points table
  if (!inlineMode) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Overall Department Points Table"
          description="View global rankings and point accumulation across all college tournaments."
        />

        {globalStandings.length === 0 ? (
          <EmptyState
            title="No department standings recorded"
            description="Standings will appear once tournaments start concluding and match points are updated."
          />
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#2756F5' }} className="text-white uppercase tracking-wider text-xs font-bold">
                    <th className="px-5 py-4 text-center w-12">Rank</th>
                    <th className="px-5 py-4">Department</th>
                    <th className="px-5 py-4 text-center">Played</th>
                    <th className="px-5 py-4 text-center">Won</th>
                    <th className="px-5 py-4 text-center">Draw</th>
                    <th className="px-5 py-4 text-center">Lost</th>
                    <th className="px-5 py-4 text-center font-bold">Total Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-700">
                  {globalStandings.map((s, idx) => {
                    const rank = idx + 1;
                    
                    // Highlighting styles
                    let rowBg = '';
                    let rankBadge = '';
                    if (rank === 1) {
                      rowBg = 'bg-amber-50 hover:bg-amber-100/60 border-l-4 border-amber-500';
                      rankBadge = 'text-amber-600 font-extrabold';
                    } else if (rank === 2) {
                      rowBg = 'bg-gray-50 hover:bg-gray-100/60 border-l-4 border-gray-400';
                      rankBadge = 'text-gray-500 font-extrabold';
                    } else if (rank === 3) {
                      rowBg = 'bg-orange-50 hover:bg-orange-100/50 border-l-4 border-orange-500';
                      rankBadge = 'text-orange-600 font-extrabold';
                    }

                    return (
                      <tr
                        key={s._id}
                        className={`transition hover:bg-blue-50/30 ${rowBg}`}
                      >
                        <td className={`px-5 py-3.5 text-center font-black text-sm ${rankBadge}`}>
                          {rank === 1 ? '👑 1' : rank}
                        </td>
                        <td className="px-5 py-3.5 flex items-center space-x-3">
                          {s.department?.logo && (
                            <img
                              src={s.department.logo.startsWith('/uploads') ? `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${s.department.logo}` : s.department.logo}
                              alt="Logo"
                              className="w-6 h-6 rounded object-cover"
                            />
                          )}
                          <span className="font-semibold text-gray-900">
                            {s.department?.name}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center text-gray-600">{s.matchesPlayed}</td>
                        <td className="px-5 py-3.5 text-center text-green-600 font-semibold">
                          {s.matchesWon}
                        </td>
                        <td className="px-5 py-3.5 text-center text-gray-500">{s.matchesDrawn}</td>
                        <td className="px-5 py-3.5 text-center text-red-500 font-medium">
                          {s.matchesLost}
                        </td>
                        <td className="px-5 py-3.5 text-center font-black text-blue-700 text-base">
                          {s.totalPoints}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Inline mode: Tournament standings (preserves standard tournament display)
  if (tFormat === 'knockout') {
    return (
      <div className="text-center py-8 text-slate-400 text-xs">
        Points Table is not available for Knockout tournaments. Please view the Bracket tree.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Standings Table */}
      {!selectedTourney ? (
        <EmptyState
          title="No active league standings"
          description="Roster registration or matches have not concluded yet."
        />
      ) : standings.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed">
          Roster registration or matches have not concluded yet. No standings data.
        </div>
      ) : (
        <div className="border border-slate-205 rounded-2xl overflow-hidden shadow-xs bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-2xs font-bold">
                <tr>
                  <th className="px-5 py-4 text-center w-12">Rank</th>
                  <th className="px-5 py-4">Department</th>
                  <th className="px-5 py-4 text-center">P</th>
                  <th className="px-5 py-4 text-center">W</th>
                  <th className="px-5 py-4 text-center">L</th>
                  <th className="px-5 py-4 text-center">D</th>
                  <th className="px-5 py-4 text-center">GF</th>
                  <th className="px-5 py-4 text-center">GA</th>
                  <th className="px-5 py-4 text-center font-bold">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {standings.map((s, idx) => {
                  return (
                    <tr
                      key={s.teamId}
                      className="hover:bg-slate-50/60 transition"
                    >
                      <td className="px-5 py-3 text-center font-black text-xs">{idx + 1}</td>
                      <td className="px-5 py-3 flex items-center space-x-3">
                        {s.logo && (
                          <img
                            src={s.logo.startsWith('/uploads') ? `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${s.logo}` : s.logo}
                            alt="Logo"
                            className="w-6 h-6 rounded object-cover"
                          />
                        )}
                        <span className="font-semibold text-slate-900">
                          {s.department}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">{s.played}</td>
                      <td className="px-5 py-3 text-center text-green-600 font-medium">
                        {s.won}
                      </td>
                      <td className="px-5 py-3 text-center text-red-655 font-medium">
                        {s.lost}
                      </td>
                      <td className="px-5 py-3 text-center text-slate-500">{s.drawn}</td>
                      <td className="px-5 py-3 text-center">{s.goalsFor}</td>
                      <td className="px-5 py-3 text-center">{s.goalsAgainst}</td>
                      <td className="px-5 py-3 text-center font-black text-slate-905 text-xs">
                        {s.points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PointsTable;
