const PDFDocument = require('pdfkit');

/**
 * Generates a PDF report for a tournament
 * @param {Object} tournament Tournament document
 * @param {Array} matches Match list
 * @param {Array} teams Team list
 * @returns {Promise<Buffer>} PDF file buffer
 */
const exportTournamentPDF = (tournament, matches, teams) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Title & Branding
      doc.fillColor('#1e3a8a').fontSize(24).text('NEC College Sports Tournament Report', { align: 'center' });
      doc.fillColor('#475569').fontSize(10).text(`Report Generated On: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(1.5);

      // Section: Tournament Details
      doc.fillColor('#1e293b').fontSize(16).text('Tournament Overview', { underline: true });
      doc.moveDown(0.5);

      doc.fillColor('#334155').fontSize(11);
      doc.text(`Name: ${tournament.name}`);
      doc.text(`Sport: ${tournament.sport ? tournament.sport.name : 'N/A'}`);
      doc.text(`Format: ${tournament.format.toUpperCase()}`);
      doc.text(`Venue: ${tournament.venue ? tournament.venue.name : 'N/A'}`);
      doc.text(`Duration: ${new Date(tournament.startDate).toLocaleDateString()} to ${new Date(tournament.endDate).toLocaleDateString()}`);
      doc.text(`Status: ${tournament.status.toUpperCase()}`);
      doc.moveDown(1.5);

      // Section: Teams list
      doc.fillColor('#1e293b').fontSize(16).text('Registered Teams & Departments', { underline: true });
      doc.moveDown(0.5);

      if (!teams || teams.length === 0) {
        doc.fillColor('#64748b').fontSize(11).text('No teams registered.');
      } else {
        doc.fillColor('#334155').fontSize(11);
        teams.forEach((t, i) => {
          const deptName = t.department ? t.department.name : 'Unknown Dept';
          const captainName = t.captain ? t.captain.name : 'N/A';
          doc.text(`${i + 1}. Department of ${deptName} (Captain: ${captainName}, Coach: ${t.coach || 'N/A'})`);
        });
      }
      doc.moveDown(1.5);

      // Section: Matches list
      doc.fillColor('#1e293b').fontSize(16).text('Matches & Results', { underline: true });
      doc.moveDown(0.5);

      if (!matches || matches.length === 0) {
        doc.fillColor('#64748b').fontSize(11).text('No matches scheduled yet.');
      } else {
        doc.fillColor('#334155').fontSize(11);
        matches.forEach((m, i) => {
          const t1 = m.team1 && m.team1.department ? m.team1.department.name : 'TBD';
          const t2 = m.team2 && m.team2.department ? m.team2.department.name : 'TBD';
          let matchStr = `Round ${m.round} - Match #${i + 1}: ${t1} vs ${t2}`;
          
          if (m.status === 'completed') {
            matchStr += ` | Score: ${m.score1} - ${m.score2} (Winner: ${m.winner && m.winner.department ? m.winner.department.name : 'Draw'})`;
          } else {
            matchStr += ` | Status: ${m.status.toUpperCase()} (Scheduled: ${new Date(m.scheduledAt).toLocaleString()})`;
          }
          doc.text(matchStr);
        });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generates a PDF player list report for a department
 * @param {Object} department Department document
 * @param {Array} players Player documents list
 * @returns {Promise<Buffer>} PDF file buffer
 */
/**
 * Generates a PDF report for the department points standings leaderboard
 * @param {Array} standings Department points list
 * @returns {Promise<Buffer>} PDF file buffer
 */
const exportDepartmentRankingPDF = (standings) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Title & Branding
      doc.fillColor('#1e3a8a').fontSize(22).text('NEC Overall Department Leaderboard Standings', { align: 'center' });
      doc.fillColor('#475569').fontSize(9).text(`Generated On: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(1.5);

      // Section Table Header
      doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Overall Rankings:', { underline: true });
      doc.moveDown(0.8);

      const tableTop = doc.y;
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Rank', 40, tableTop);
      doc.text('Department', 80, tableTop);
      doc.text('Played', 280, tableTop, { width: 50, align: 'center' });
      doc.text('Won', 330, tableTop, { width: 40, align: 'center' });
      doc.text('Draw', 370, tableTop, { width: 40, align: 'center' });
      doc.text('Lost', 410, tableTop, { width: 40, align: 'center' });
      doc.text('Points', 450, tableTop, { width: 60, align: 'center' });

      doc.moveTo(40, tableTop + 15).lineTo(520, tableTop + 15).strokeColor('#cbd5e1').stroke();
      doc.moveDown(0.8);

      doc.font('Helvetica');
      let currentY = tableTop + 20;

      standings.forEach((s, idx) => {
        const deptName = s.department ? s.department.name : 'Unknown';

        doc.text(idx + 1, 40, currentY);
        doc.text(deptName, 80, currentY);
        doc.text(s.matchesPlayed.toString(), 280, currentY, { width: 50, align: 'center' });
        doc.text(s.matchesWon.toString(), 330, currentY, { width: 40, align: 'center' });
        doc.text(s.matchesDrawn.toString(), 370, currentY, { width: 40, align: 'center' });
        doc.text(s.matchesLost.toString(), 410, currentY, { width: 40, align: 'center' });
        doc.text(s.totalPoints.toString(), 450, currentY, { width: 60, align: 'center' });

        currentY += 20;

        if (currentY > 750) {
          doc.addPage();
          currentY = 50;
        }
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  exportTournamentPDF,
  exportDepartmentRankingPDF
};
