import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Play, Pause, CheckSquare, Radio } from 'lucide-react';
import api from '../../lib/axios';
import { socket } from '../../lib/socket';
import { AuthContext } from '../../context/AuthContext';
import Skeleton from '../../components/common/Skeleton';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import toast from 'react-hot-toast';

const ScorerPanel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [finishWinner, setFinishWinner] = useState('');

  const fetchMatchDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/matches/${id}`);
      if (res.data && res.data.data) {
        setMatch(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load match details');
      navigate('/live');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatchDetails();

    // Connect & Join Room
    socket.connect();
    socket.emit('match:subscribe', id);

    // Sync state with socket updates (in case multiple admins are viewing/editing)
    socket.on('score:update', ({ score1, score2 }) => {
      setMatch((prev) => (prev ? { ...prev, score1, score2 } : null));
    });

    socket.on('match:status', ({ status }) => {
      setMatch((prev) => (prev ? { ...prev, status } : null));
      if (status === 'completed') {
        toast.success('Match marked as completed!');
        navigate('/live');
      }
    });

    return () => {
      socket.emit('match:unsubscribe', id);
      socket.off('score:update');
      socket.off('match:status');
    };
  }, [id]);

  const handleScoreChange = (teamNum, amount) => {
    if (!match) return;
    
    let newScore1 = match.score1;
    let newScore2 = match.score2;

    if (teamNum === 1) {
      newScore1 = Math.max(0, match.score1 + amount);
    } else {
      newScore2 = Math.max(0, match.score2 + amount);
    }

    // Emit live set event
    socket.emit('score:set', {
      matchId: id,
      score1: newScore1,
      score2: newScore2
    });
  };

  const handleStatusChange = (newStatus) => {
    if (newStatus === 'pause') {
      socket.emit('match:pause', { matchId: id });
    } else if (newStatus === 'resume') {
      socket.emit('match:resume', { matchId: id });
    }
  };

  const handleFinishConfirm = () => {
    socket.emit('match:finish', {
      matchId: id,
      winnerId: finishWinner || 'draw'
    });
  };

  if (loading) {
    return <Skeleton type="card" count={2} />;
  }

  if (!match) {
    return <div className="text-center py-12">Match details missing.</div>;
  }

  const t1 = match.team1;
  const t2 = match.team2;
  const t1Name = t1?.department?.name || 'Team 1';
  const t2Name = t2?.department?.name || 'Team 2';

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b pb-4 border-slate-205">
        <Link
          to={`/matches/${id}`}
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition gap-1"
        >
          <ArrowLeft size={14} /> Back to Details
        </Link>
        <span className="flex items-center gap-1.5 px-3 py-1 bg-red-600/10 text-red-650 rounded-lg text-xs font-bold uppercase tracking-wider animate-pulse">
          <Radio size={14} /> Live Scorer Panel
        </span>
      </div>

      {/* Main Scoreboard Display */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
        
        <p className="text-4xs text-blue-400 font-extrabold uppercase tracking-wider">
          {match.tournament?.name}
        </p>

        {/* Score Counter */}
        <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
          {/* Team 1 Score controls */}
          <div className="space-y-3 flex flex-col items-center">
            <h3 className="text-base font-extrabold truncate max-w-[200px]">{t1Name.split(' ')[0]}</h3>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleScoreChange(1, -1)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 font-bold text-lg select-none"
              >
                -
              </button>
              <span className="text-4xl md:text-5xl font-black">{match.score1}</span>
              <button
                onClick={() => handleScoreChange(1, 1)}
                className="w-8 h-8 rounded-full bg-slate-850 hover:bg-slate-700 font-bold text-lg select-none"
              >
                +
              </button>
            </div>
          </div>

          <div className="text-slate-400 text-xl font-bold uppercase">vs</div>

          {/* Team 2 Score controls */}
          <div className="space-y-3 flex flex-col items-center">
            <h3 className="text-base font-extrabold truncate max-w-[200px]">{t2Name.split(' ')[0]}</h3>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleScoreChange(2, -1)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 font-bold text-lg select-none"
              >
                -
              </button>
              <span className="text-4xl md:text-5xl font-black">{match.score2}</span>
              <button
                onClick={() => handleScoreChange(2, 1)}
                className="w-8 h-8 rounded-full bg-slate-850 hover:bg-slate-700 font-bold text-lg select-none"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Match Status Controls */}
        <div className="flex justify-center space-x-4 border-t border-slate-800/80 pt-4 mt-2">
          {match.status === 'scheduled' ? (
            <button
              onClick={() => handleStatusChange('resume')}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 transition cursor-pointer"
            >
              <Play size={14} /> Start Match
            </button>
          ) : match.status === 'live' ? (
            <button
              onClick={() => handleStatusChange('pause')}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold text-xs gap-2 transition cursor-pointer"
            >
              <Pause size={14} /> Pause Match
            </button>
          ) : match.status === 'paused' ? (
            <button
              onClick={() => handleStatusChange('resume')}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 transition cursor-pointer"
            >
              <Play size={14} /> Resume Match
            </button>
          ) : null}

          <button
            onClick={() => {
              setFinishWinner('');
              setShowFinishDialog(true);
            }}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-red-650 hover:bg-red-700 text-white font-bold text-xs gap-2 transition"
          >
            <CheckSquare size={14} /> Complete Match
          </button>
        </div>
      </div>

      {/* Confirm Finish Dialogue */}
      <ConfirmDialog
        isOpen={showFinishDialog}
        onClose={() => setShowFinishDialog(false)}
        onConfirm={handleFinishConfirm}
        title="Complete Match Session"
        message="Are you sure you want to conclude the match? This will lock scoring operations and push conclusions to standings/brackets."
        confirmText="Conclude Match"
        variant="primary"
      />
    </div>
  );
};

export default ScorerPanel;
