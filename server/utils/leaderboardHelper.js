const Department = require('../models/Department');
const DepartmentPoints = require('../models/DepartmentPoints');
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const Team = require('../models/Team');

/**
 * Find the Final match of a tournament.
 * A "final" match is identified by:
 *   1. round field equals "Final" (case-insensitive), OR
 *   2. For knockout format: the match in the highest numeric round number.
 *
 * The match MUST be completed to be returned.
 *
 * @param {string} tournamentId
 * @returns {Promise<Object|null>} The final match document, or null if not found/not completed.
 */
const getFinalMatch = async (tournamentId) => {
  try {
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return null;

    const allMatches = await Match.find({ tournament: tournamentId }).populate({
      path: 'team1 team2',
      populate: { path: 'department' }
    });

    if (allMatches.length === 0) return null;

    // Priority 1: Find a match explicitly named "Final" (case-insensitive)
    const namedFinal = allMatches.find(
      (m) => m.round && m.round.toString().trim().toLowerCase() === 'final'
    );

    if (namedFinal) {
      if (namedFinal.status === 'completed') return namedFinal;
      return null;
    }

    // Priority 2: For knockout format — highest numeric round = final
    if (tournament.format === 'knockout') {
      let maxRound = 0;
      allMatches.forEach((m) => {
        const r = parseInt(m.round, 10);
        if (!isNaN(r) && r > maxRound) maxRound = r;
      });

      if (maxRound === 0) return null;

      const finalMatches = allMatches.filter(
        (m) => parseInt(m.round, 10) === maxRound
      );

      const finalMatch = finalMatches[0];
      if (finalMatch && finalMatch.status === 'completed') return finalMatch;
    }

    return null;
  } catch (err) {
    console.error('Error finding final match:', err.message);
    return null;
  }
};

/**
 * Recalculate global department leaderboard rankings from all completed matches and tournaments.
 *
 * ╔══════════════════════════════════════════════╗
 * ║           POINTS SYSTEM                      ║
 * ╠══════════════════════════════════════════════╣
 * ║  Win any match        →  +10 points          ║
 * ║  Draw any match       →  +5 points each      ║
 * ║  Loss any match       →  0 points            ║
 * ║  Runner-up (Final)    →  +5 bonus points     ║
 * ╚══════════════════════════════════════════════╝
 *
 * Example: CSE wins 4 matches = 4 × 10 = 40 points
 * Runner-up wins 2 matches + Final loss = 2 × 10 + 5 = 25 points
 */
const recalculateGlobalDepartmentLeaderboard = async () => {
  try {
    const departments = await Department.find({});

    const stats = {};
    departments.forEach((dept) => {
      stats[dept._id.toString()] = {
        department: dept._id,
        tournamentsPlayed: 0,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        matchesDrawn: 0,
        totalPoints: 0
      };
    });

    // ── Step 1: Per-match points (Win=10, Draw=5, Loss=0) ─────────────────────
    const completedMatches = await Match.find({ status: 'completed' }).populate({
      path: 'team1 team2',
      populate: { path: 'department' }
    });

    completedMatches.forEach((m) => {
      if (!m.team1 || !m.team2) return;
      const dept1 = m.team1.department;
      const dept2 = m.team2.department;
      if (!dept1 || !dept2) return;

      const dept1Id = (dept1._id || dept1).toString();
      const dept2Id = (dept2._id || dept2).toString();

      if (stats[dept1Id]) stats[dept1Id].matchesPlayed += 1;
      if (stats[dept2Id]) stats[dept2Id].matchesPlayed += 1;

      if (m.winner) {
        // Win = 10 points, Loss = 0 points
        const winnerTeamId = m.winner.toString();
        const isTeam1Winner = m.team1._id.toString() === winnerTeamId;

        const winnerDeptId = isTeam1Winner ? dept1Id : dept2Id;
        const loserDeptId  = isTeam1Winner ? dept2Id : dept1Id;

        if (stats[winnerDeptId]) {
          stats[winnerDeptId].matchesWon += 1;
          stats[winnerDeptId].totalPoints += 10; // Win = 10 pts
        }
        if (stats[loserDeptId]) {
          stats[loserDeptId].matchesLost += 1;
          // Loss = 0 pts
        }
      } else {
        // Draw = 5 pts each
        if (stats[dept1Id]) {
          stats[dept1Id].matchesDrawn += 1;
          stats[dept1Id].totalPoints += 5;
        }
        if (stats[dept2Id]) {
          stats[dept2Id].matchesDrawn += 1;
          stats[dept2Id].totalPoints += 5;
        }
      }
    });

    // ── Step 2: Runner-up +5 bonus — awarded to the LOSER of the Final match ──
    //
    // The WINNER of the Final already gets their +10 from Step 1 (regular win).
    // The LOSER of the Final gets a +5 consolation/runner-up bonus.
    //
    const allTournaments = await Tournament.find({});
    for (const tourney of allTournaments) {
      const finalMatch = await getFinalMatch(tourney._id);

      if (!finalMatch || !finalMatch.winner) continue;

      // Identify runner-up (the loser of the Final match)
      const winnerTeamId = finalMatch.winner.toString();
      const isTeam1Winner = finalMatch.team1?._id?.toString() === winnerTeamId;

      const runnerUpDept = isTeam1Winner
        ? finalMatch.team2?.department
        : finalMatch.team1?.department;

      const runnerUpDeptId = (runnerUpDept?._id || runnerUpDept)?.toString();

      if (runnerUpDeptId && stats[runnerUpDeptId]) {
        stats[runnerUpDeptId].totalPoints += 5;
        console.log(
          `[Leaderboard] +5 Runner-up bonus → dept: ${runnerUpDeptId} (tourney: ${tourney.name})`
        );
      }

      // Count tournamentsPlayed for participating departments
      const teams = await Team.find({ tournament: tourney._id, isApproved: true });
      teams.forEach((t) => {
        const deptId = t.department.toString();
        if (stats[deptId]) {
          stats[deptId].tournamentsPlayed += 1;
        }
      });
    }

    // ── Step 3: Persist results ────────────────────────────────────────────────
    await DepartmentPoints.deleteMany({});

    const recordsToInsert = Object.values(stats).filter((r) => r.department);
    if (recordsToInsert.length > 0) {
      await DepartmentPoints.insertMany(recordsToInsert);
    }

    console.log('✅ Department points leaderboard recalculated successfully.');
  } catch (error) {
    console.error('Error recalculating department points leaderboard:', error);
  }
};

module.exports = {
  recalculateGlobalDepartmentLeaderboard,
  getFinalMatch
};
