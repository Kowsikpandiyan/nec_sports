import React from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../lib/utils';

/**
 * Table view for league and round-robin fixtures grouped by rounds
 */
const TableView = ({ fixtures = [] }) => {
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

  return (
    <div className="space-y-8 select-none">
      {roundNumbers.map((roundNum) => {
        const roundFixtures = roundsMap[roundNum].sort((a, b) => a.matchNumber - b.matchNumber);

        return (
          <div key={roundNum} className="space-y-3">
            {/* Round Divider */}
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-1.5">
              <h4 className="text-sm font-black text-slate-800">
                Round {roundNum}
              </h4>
              <span className="text-3xs text-slate-400 font-semibold uppercase tracking-wider">
                ({roundFixtures.length} MatchesScheduled)
              </span>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roundFixtures.map((f) => {
                const match = f.match;
                const t1Name = f.team1?.department?.name.split(' ')[0] || 'TBD';
                const t2Name = f.team2?.department?.name.split(' ')[0] || 'TBD';
                const status = match?.status || 'scheduled';

                return (
                  <div
                    key={f._id}
                    onClick={() => match && navigate(`/matches/${match._id}`)}
                    className={`p-4 bg-slate-50/50 border border-slate-100 rounded-xl flex items-center justify-between transition ${
                      match ? 'cursor-pointer hover:border-blue-500' : 'opacity-65'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-850">
                        {t1Name} vs {t2Name}
                      </p>
                      <p className="text-3xs text-slate-400">
                        Scheduled: {match ? formatDate(match.scheduledAt) : 'TBD'}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      {match && status !== 'scheduled' && (
                        <span className="text-xs font-black bg-slate-200/50 px-2 py-0.5 rounded text-slate-700">
                          {match.score1} - {match.score2}
                        </span>
                      )}

                      <Badge variant={status === 'live' ? 'ongoing' : status === 'completed' ? 'success' : 'default'} className="text-3xs">
                        {status}
                      </Badge>
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

export default TableView;
