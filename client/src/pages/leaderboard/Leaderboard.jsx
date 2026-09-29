import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import toast from 'react-hot-toast';
import { Award, Trophy, Users, ShieldAlert } from 'lucide-react';

const Leaderboard = () => {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTourney, setSelectedTourney] = useState('');
  const [topScorers, setTopScorers] = useState([]);
  const [bestPlayers, setBestPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statTab, setStatTab] = useState('scorers'); // 'scorers' | 'best'

  useEffect(() => {
    const fetchTourneys = async () => {
      try {
        const res = await api.get('/tournaments?limit=100');
        if (res.data?.data) {
          setTournaments(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedTourney(res.data.data[0]._id);
          }
        }
      } catch (err) {
        toast.error('Failed to load tournaments list');
      }
    };
    fetchTourneys();
  }, []);

  const fetchStats = async () => {
    if (!selectedTourney) return;
    try {
      setLoading(true);
      const [scorersRes, bestRes] = await Promise.all([
        api.get(`/leaderboard/${selectedTourney}/top-scorers`),
        api.get(`/leaderboard/${selectedTourney}/best-players`)
      ]);

      if (scorersRes.data?.data) {
        setTopScorers(scorersRes.data.data);
      }
      if (bestRes.data?.data) {
        setBestPlayers(bestRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load statistics:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedTourney]);

  const renderPodium = (items, valueKey) => {
    if (items.length === 0) return null;

    // We sort/arrange them visually as: [2nd, 1st, 3rd]
    const podiumItems = [];
    if (items[1]) podiumItems.push({ rank: 2, item: items[1], color: 'text-slate-400 bg-slate-100' });
    if (items[0]) podiumItems.push({ rank: 1, item: items[0], color: 'text-amber-500 bg-amber-100 border border-amber-550/20' });
    if (items[2]) podiumItems.push({ rank: 3, item: items[2], color: 'text-amber-700 bg-amber-900/10' });

    // Sort order for visual rendering: 2nd, 1st, 3rd
    const visualOrder = [];
    if (podiumItems.find(p => p.rank === 2)) visualOrder.push(podiumItems.find(p => p.rank === 2));
    if (podiumItems.find(p => p.rank === 1)) visualOrder.push(podiumItems.find(p => p.rank === 1));
    if (podiumItems.find(p => p.rank === 3)) visualOrder.push(podiumItems.find(p => p.rank === 3));

    return (
      <div className="flex items-end justify-center py-8 space-x-4 md:space-x-8 max-w-lg mx-auto border-b border-slate-100 mb-6">
        {visualOrder.map(({ rank, item, color }) => {
          const isFirst = rank === 1;
          const player = item.player;

          return (
            <div
              key={player._id}
              className={`flex flex-col items-center text-center space-y-2 transition-transform duration-300 hover:scale-105 ${
                isFirst ? 'mb-4 scale-110 z-10' : 'mb-0 scale-95'
              }`}
            >
              {/* Avatar Frame */}
              <div className="relative">
                <Avatar src={player.photo} name={player.name} size={isFirst ? 'lg' : 'md'} />
                
                {/* Crown/Trophy Indicator */}
                <span className={`absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center justify-center h-6 w-6 rounded-full font-black text-xs ${color} shadow-sm`}>
                  {rank === 1 ? '👑' : rank}
                </span>
              </div>

              {/* Player Details */}
              <div className="space-y-0.5">
                <p className="text-xs font-black text-slate-905 line-clamp-1 w-24">
                  {player.name.split(' ')[0]}
                </p>
                <p className="text-4xs text-slate-400 uppercase tracking-wide">
                  {player.department?.name.split(' ')[0]}
                </p>
              </div>

              {/* Stat Value tag */}
              <Badge variant={isFirst ? 'primary' : 'default'} className="text-3xs px-2.5">
                {item[valueKey]} {statTab === 'scorers' ? 'Goals' : 'Points'}
              </Badge>
            </div>
          );
        })}
      </div>
    );
  };

  const getRankList = (items, valueKey) => {
    const list = items.slice(3); // Rank 4 onwards
    if (list.length === 0) return null;

    return (
      <div className="divide-y divide-slate-100">
        {list.map((item, idx) => {
          const player = item.player;
          const rank = idx + 4;

          return (
            <div key={player._id} className="flex items-center justify-between py-3 hover:bg-slate-50/50 rounded-xl px-2 transition">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-black text-slate-400 w-6 text-center">{rank}</span>
                <Avatar src={player.photo} name={player.name} size="xs" />
                <div>
                  <Link to={`/players/${player._id}`} className="text-xs font-bold text-slate-850 hover:underline">
                    {player.name}
                  </Link>
                  <p className="text-4xs text-slate-400">
                    Dept: {player.department?.name}
                  </p>
                </div>
              </div>

              <Badge variant="default" className="text-3xs">
                {item[valueKey]} {statTab === 'scorers' ? 'Goals' : 'Points'}
              </Badge>
            </div>
          );
        })}
      </div>
    );
  };

  const currentList = statTab === 'scorers' ? topScorers : bestPlayers;
  const valueKey = statTab === 'scorers' ? 'count' : 'points';

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <PageHeader
        title="Tournament Leaderboard"
        description="View player and scorer statistics for college events."
      />

      {/* Select Tournament */}
      {tournaments.length > 0 && (
        <div className="flex flex-col space-y-1.5 max-w-sm">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Select Tournament
          </label>
          <select
            value={selectedTourney}
            onChange={(e) => setSelectedTourney(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg bg-white border border-slate-205 outline-none text-slate-800 focus:border-blue-500 cursor-pointer"
          >
            {tournaments.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setStatTab('scorers')}
          className={`pb-2.5 px-3 text-xs font-bold capitalize border-b-2 transition ${
            statTab === 'scorers'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Top Goal Scorers
        </button>
        <button
          onClick={() => setStatTab('best')}
          className={`pb-2.5 px-3 text-xs font-bold capitalize border-b-2 transition ${
            statTab === 'best'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Valuable Players (Overall Points)
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <Skeleton type="row" count={4} />
      ) : !selectedTourney ? (
        <EmptyState
          title="No tournaments registered"
          description="There are currently no tournaments to gather statistics from."
        />
      ) : currentList.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs bg-white rounded-2xl border">
          No statistical events have been logged yet for this tournament. Check back later!
        </div>
      ) : (
        <div className="bg-white border border-slate-205 rounded-2xl p-5 shadow-xs max-w-xl mx-auto">
          {/* Podium (Ranks 1 to 3) */}
          {renderPodium(currentList, valueKey)}

          {/* List (Ranks 4+) */}
          {getRankList(currentList, valueKey)}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
