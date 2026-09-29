const ExcelJS = require('exceljs');

/**
 * Exports tournament details and matches to an Excel buffer
 * @param {Object} data 
 * @param {Object} data.tournament
 * @param {Array} data.matches
 * @param {Array} data.teams
 * @returns {Promise<Buffer>} Excel file buffer
 */
const exportTournamentExcel = async ({ tournament, matches, teams }) => {
  const workbook = new ExcelJS.Workbook();
  
  // Sheet 1: Tournament Info
  const infoSheet = workbook.addWorksheet('Overview');
  infoSheet.columns = [
    { header: 'Parameter', key: 'param', width: 25 },
    { header: 'Detail', key: 'detail', width: 50 }
  ];
  infoSheet.addRow({ param: 'Tournament Name', detail: tournament.name });
  infoSheet.addRow({ param: 'Sport', detail: tournament.sport ? tournament.sport.name : 'N/A' });
  infoSheet.addRow({ param: 'Format', detail: tournament.format });
  infoSheet.addRow({ param: 'Venue', detail: tournament.venue ? tournament.venue.name : 'N/A' });
  infoSheet.addRow({ param: 'Start Date', detail: new Date(tournament.startDate).toLocaleDateString() });
  infoSheet.addRow({ param: 'End Date', detail: new Date(tournament.endDate).toLocaleDateString() });
  infoSheet.addRow({ param: 'Status', detail: tournament.status });
  
  // Style Info Sheet Header
  infoSheet.getRow(1).font = { bold: true };

  // Sheet 2: Teams Roster
  const teamsSheet = workbook.addWorksheet('Registered Teams');
  teamsSheet.columns = [
    { header: 'S.No', key: 'sno', width: 10 },
    { header: 'Department', key: 'dept', width: 30 },
    { header: 'Coach', key: 'coach', width: 25 },
    { header: 'Captain', key: 'captain', width: 25 }
  ];
  if (teams && teams.length > 0) {
    teams.forEach((t, i) => {
      teamsSheet.addRow({
        sno: i + 1,
        dept: t.department ? t.department.name : 'N/A',
        coach: t.coach || 'N/A',
        captain: t.captain ? t.captain.name : 'N/A'
      });
    });
  }
  teamsSheet.getRow(1).font = { bold: true };

  // Sheet 3: Matches & Scores
  const matchesSheet = workbook.addWorksheet('Matches & Scores');
  matchesSheet.columns = [
    { header: 'Round', key: 'round', width: 15 },
    { header: 'Match No', key: 'matchNo', width: 15 },
    { header: 'Team 1', key: 'team1', width: 25 },
    { header: 'Team 2', key: 'team2', width: 25 },
    { header: 'Score 1', key: 'score1', width: 12 },
    { header: 'Score 2', key: 'score2', width: 12 },
    { header: 'Winner', key: 'winner', width: 25 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Scheduled Time', key: 'time', width: 25 }
  ];

  if (matches && matches.length > 0) {
    matches.forEach((m) => {
      const t1 = m.team1 && m.team1.department ? m.team1.department.name : 'TBD';
      const t2 = m.team2 && m.team2.department ? m.team2.department.name : 'TBD';
      const winnerName = m.winner && m.winner.department ? m.winner.department.name : (m.status === 'completed' ? 'Draw' : 'N/A');

      matchesSheet.addRow({
        round: `Round ${m.round}`,
        matchNo: m.matchNumber || '-',
        team1: t1,
        team2: t2,
        score1: m.status === 'scheduled' ? '-' : m.score1,
        score2: m.status === 'scheduled' ? '-' : m.score2,
        winner: winnerName,
        status: m.status,
        time: new Date(m.scheduledAt).toLocaleString()
      });
    });
  }
  matchesSheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

module.exports = {
  exportTournamentExcel
};
