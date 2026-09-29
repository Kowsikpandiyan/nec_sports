import React from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../../components/common/Badge';

/**
 * Knockout Bracket visualizer using CSS flex columns
 */
const BracketView = ({ fixtures = [] }) => {
  const navigate = useNavigate();

  if (fixtures.length === 0) return null;

  // Group fixtures by round
  const roundsMap = {};
  fixtures.forEach((f) => {
    if (!roundsMap[f.round]) {
      roundsMap[f.round] = [];
    }
    roundsMap[f.round].push(f);
  });

  const roundNumbers = Object.keys(roundsMap).sort((a, b) => parseInt(a) - parseInt(b));

  const getRoundLabel = (roundNum, totalRounds) => {
    const rInt = parseInt(roundNum, 10);
    const tot = parseInt(totalRounds, 10);
    if (rInt === tot) return 'Finals';
    if (rInt === tot - 1) return 'Semifinals';
    if (rInt === tot - 2) return 'Quarterfinals';
    return `Round ${rInt}`;
  };

  return (
    <div className="flex items-start overflow-x-auto pb-6 space-x-8 min-h-[400px] w-full select-none">
      {roundNumbers.map((roundNum) => {
        const roundFixtures = roundsMap[roundNum].sort((a, b) => a.matchNumber - b.matchNumber);
        const roundLabel = getRoundLabel(roundNum, roundNumbers.length);

        return (
          <div key={roundNum} className="flex flex-col justify-around h-full space-y-8 min-w-[220px] shrink-0">
            {/* Round Title */}
            <div className="text-center border-b border-slate-100 pb-2 mb-2">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                {roundLabel}
              </h4>
            </div>

            {/* Matches list in round */}
            <div className="flex-1 flex flex-col justify-center space-y-6">
              {roundFixtures.map((f) => {
                const match = f.match;
                const t1 = f.team1;
                const t2 = f.team2;
                
                const t1Name = t1?.department?.name.split(' ')[0] || 'TBD';
                const t2Name = t2?.department?.name.split(' ')[0] || 'TBD';
                
                const score1 = match?.score1 ?? '-';
                const score2 = match?.score2 ?? '-';

                const isCompleted = match?.status === 'completed';
                const isLive = match?.status === 'live';

                // Check winner IDs
                const t1Winner = isCompleted && match?.winner?.toString() === t1?._id.toString();
                const t2Winner = isCompleted && match?.winner?.toString() === t2?._id.toString();

                return (
                  <div
                    key={f._id}
                    onClick={() => match && navigate(`/matches/${match._id}`)}
                    className={`p-3 bg-white border rounded-xl shadow-xs transition ${
                      match ? 'cursor-pointer hover:border-blue-500' : 'opacity-60'
                    } ${
                      isLive ? 'ring-1 ring-red-500 border-red-500' : 'border-slate-200'
                    }`}
                  >
                    {/* Status Badge */}
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-4xs text-slate-400 font-bold">Match #{f.matchNumber}</span>
                      {isLive && <Badge variant="ongoing" className="text-4xs px-1">Live</Badge>}
                    </div>

                    {/* Team 1 Row */}
                    <div className={`flex justify-between items-center py-1 px-1.5 rounded transition ${
                      t1Winner ? 'bg-blue-500/10 text-blue-600 font-bold' : 'text-slate-700'
                    }`}>
                      <span className="text-xs truncate max-w-[120px]">{t1Name}</span>
                      <span className="text-xs font-black">{score1}</span>
                    </div>

                    {/* Team 2 Row */}
                    <div className={`flex justify-between items-center py-1 px-1.5 rounded mt-1 transition ${
                      t2Winner ? 'bg-blue-500/10 text-blue-600 font-bold' : 'text-slate-700'
                    }`}>
                      <span className="text-xs truncate max-w-[120px]">{t2Name}</span>
                      <span className="text-xs font-black">{score2}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BracketView;
