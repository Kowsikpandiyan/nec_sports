import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { FileText, FileSpreadsheet, Download, RefreshCw, Trophy, Users, ShieldAlert, Sparkles, Award } from 'lucide-react';

const Reports = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loadingLists, setLoadingLists] = useState(true);

  // Selection states
  const [selectedTournament, setSelectedTournament] = useState('');

  // Downloading status
  const [exportingTourneyPdf, setExportingTourneyPdf] = useState(false);
  const [exportingTourneyExcel, setExportingTourneyExcel] = useState(false);
  const [exportingDeptPdf, setExportingDeptPdf] = useState(false);

  const fetchData = async () => {
    try {
      setLoadingLists(true);
      const tourneyRes = await api.get('/tournaments?limit=100');

      if (tourneyRes.data && tourneyRes.data.data) {
        setTournaments(tourneyRes.data.data);
        if (tourneyRes.data.data.length > 0) {
          setSelectedTournament(tourneyRes.data.data[0]._id);
        }
      }
    } catch (err) {
      toast.error('Failed to load tournaments filter');
    } finally {
      setLoadingLists(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownload = async (url, defaultFilename, setSpinner) => {
    try {
      setSpinner(true);
      const response = await api.get(url, { responseType: 'blob' });
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = defaultFilename;
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename="?([^"]+)"?/);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Report downloaded successfully');
    } catch (err) {
      toast.error('Failed to generate report export');
      console.error(err);
    } finally {
      setSpinner(false);
    }
  };

  const downloadTourneyPDF = () => {
    if (!selectedTournament) return toast.error('Please select a tournament');
    const name = tournaments.find(t => t._id === selectedTournament)?.name || 'Tournament';
    handleDownload(
      `/reports/tournament/${selectedTournament}/pdf`,
      `${name.replace(/\s+/g, '_')}_Report.pdf`,
      setExportingTourneyPdf
    );
  };

  const downloadTourneyExcel = () => {
    if (!selectedTournament) return toast.error('Please select a tournament');
    const name = tournaments.find(t => t._id === selectedTournament)?.name || 'Tournament';
    handleDownload(
      `/reports/tournament/${selectedTournament}/excel`,
      `${name.replace(/\s+/g, '_')}_Report.xlsx`,
      setExportingTourneyExcel
    );
  };

  const downloadDeptRankingsPDF = () => {
    handleDownload(
      `/reports/departments/pdf`,
      `Department_Rankings_Report.pdf`,
      setExportingDeptPdf
    );
  };

  if (loadingLists) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      <PageHeader 
        title="Export Reports & Leaderboards" 
        subtitle="Generate comprehensive PDF and Excel summaries for college tournaments and department standings"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Tournament Results & Matches */}
        <div className="bg-white border border-slate-205 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
              <Trophy className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-bold text-slate-800 font-sans">Tournament Reports</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Generate dynamic fixture sheets, scoreboard timelines, tournament brackets, standing statistics, and active team listings.
              </p>
              
              {tournaments.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center">
                  <p className="text-xs text-slate-500">No tournaments seeded yet to generate reports.</p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Select Tournament
                  </label>
                  <select
                    value={selectedTournament}
                    onChange={(e) => setSelectedTournament(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {tournaments.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 pt-0 border-t border-slate-100 mt-auto">
            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                onClick={downloadTourneyPDF}
                disabled={exportingTourneyPdf || tournaments.length === 0}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-sm shadow-sm transition-all gap-2 cursor-pointer disabled:opacity-50"
              >
                {exportingTourneyPdf ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-slate-500" />
                ) : (
                  <FileText className="h-4 w-4 text-rose-500" />
                )}
                Export PDF
              </button>

              <button
                onClick={downloadTourneyExcel}
                disabled={exportingTourneyExcel || tournaments.length === 0}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-sm shadow-sm transition-all gap-2 cursor-pointer disabled:opacity-50"
              >
                {exportingTourneyExcel ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-slate-500" />
                ) : (
                  <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                )}
                Export Excel
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Department Rankings Report */}
        <div className="bg-white border border-slate-205 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
              <Trophy className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-bold text-slate-800 font-sans">Department Rankings</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed font-sans">
                Generate the official overall Department Points Table report. This lists all departments, their match statistics (played, won, drawn, lost), tournament points, and overall ranks.
              </p>
            </div>
          </div>

          <div className="p-6 pt-0 border-t border-slate-100 mt-auto font-sans">
            <div className="pt-4">
              <button
                onClick={downloadDeptRankingsPDF}
                disabled={exportingDeptPdf}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-sm shadow-sm transition-all gap-2 cursor-pointer disabled:opacity-50 font-sans"
              >
                {exportingDeptPdf ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-slate-500" />
                ) : (
                  <FileText className="h-4 w-4 text-rose-500" />
                )}
                Export Rankings PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Honors & Award Citation Studio Shortcut */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 border border-purple-500/30 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-white shadow-md">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-xl">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white">AI Certificate & Honors Citation Generator</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-500/40 uppercase">
                AI Powered
              </span>
            </div>
            <p className="text-xs text-purple-200/80 mt-0.5">
              Draft formal orator speeches, medal citations, and merit certificates for players and championship teams.
            </p>
          </div>
        </div>
        <Link
          to="/ai-studio"
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
        >
          <Sparkles className="h-4 w-4 text-amber-300" />
          <span>Open AI Studio</span>
        </Link>
      </div>

      {/* Roster & Roster Card Print Information */}
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl flex items-start gap-4">
        <Download className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-800">Printable Roster & Scorecards</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            All PDF report formats are formatted with standard A4 paper size styles. If you require printed physical copies for offline records, you may connect a printer directly and print using the native PDF viewer download option.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
