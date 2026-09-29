import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Award, Shield, FileText, Camera, Plus, Check } from 'lucide-react';
import api from '../../lib/axios';
import { AuthContext } from '../../context/AuthContext';
import Skeleton from '../../components/common/Skeleton';
import Badge from '../../components/common/Badge';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';

// Fixture subcomponents
import BracketView from '../fixtures/BracketView';
import TableView from '../fixtures/TableView';
import PointsTable from '../pointsTable/PointsTable';
import Gallery from '../gallery/Gallery';

const TournamentDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'teams' | 'fixtures' | 'points' | 'gallery'

  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      // Fetch overview details
      const tourneyRes = await api.get(`/tournaments/${id}`);
      if (tourneyRes.data?.data) {
        setTournament(tourneyRes.data.data);
      }

      // Fetch teams list
      const teamsRes = await api.get(`/teams?tournament=${id}&limit=100`);
      if (teamsRes.data?.data) {
        setTeams(teamsRes.data.data);
      }

      // Fetch fixtures
      const fixturesRes = await api.get(`/tournaments/${id}/bracket`);
      if (fixturesRes.data?.data) {
        setFixtures(fixturesRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load tournament details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournamentData();
  }, [id]);

  const handleApproveTeam = async (teamId) => {
    try {
      const res = await api.post(`/teams/${teamId}/approve`);
      if (res.data && res.data.success) {
        toast.success('Team roster approved successfully');
        setTeams((prev) =>
          prev.map((t) => (t._id === teamId ? { ...t, isApproved: true } : t))
        );
      }
    } catch (err) {
      toast.error('Failed to approve team roster');
    }
  };

  const handleGenerateFixtures = async () => {
    try {
      const res = await api.post(`/tournaments/${id}/generate-fixtures`);
      if (res.data && res.data.success) {
        toast.success('Fixtures generated successfully');
        setFixtures(res.data.data);
        // Refresh tournament info (to update status to ongoing)
        const tourneyRes = await api.get(`/tournaments/${id}`);
        if (tourneyRes.data?.data) setTournament(tourneyRes.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate tournament fixtures');
    }
  };

  if (loading) {
    return <Skeleton type="card" count={3} />;
  }

  if (!tournament) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold">Tournament not found</h3>
        <Link to="/tournaments" className="text-blue-505 hover:underline mt-2 inline-block">
          Back to Tournaments
        </Link>
      </div>
    );
  }

  const hasFixtures = fixtures.length > 0;
  const approvedTeamsCount = teams.filter((t) => t.isApproved).length;

  const bannerUrl = tournament.banner?.startsWith('/uploads') 
    ? `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${tournament.banner}` 
    : (tournament.banner || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop');

  return (
    <div className="space-y-6">
      
      {/* Banner / Overview Header */}
      <div className="relative h-64 rounded-3xl overflow-hidden shadow-md">
        <img
          src={bannerUrl}
          alt={tournament.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent pointer-events-none" />
        
        {/* Title metadata overlay */}
        <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
          <Badge variant={tournament.status === 'ongoing' ? 'ongoing' : tournament.status === 'completed' ? 'success' : 'default'}>
            {tournament.status}
          </Badge>
          <h2 className="text-xl md:text-3xl font-black">{tournament.name}</h2>
          
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
            <span className="flex items-center gap-1">
              <Award size={14} className="text-blue-400" /> {tournament.sport?.name}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {tournament.venue?.name}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={14} /> {new Date(tournament.startDate).toLocaleDateString()} to {new Date(tournament.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex space-x-6 overflow-x-auto whitespace-nowrap">
        {['overview', 'teams', 'fixtures', 'points', 'gallery'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-sm font-bold capitalize border-b-2 transition ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'points' ? 'Points Table' : tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        
        {/* TAB 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <FileText size={18} className="text-blue-500" /> Tournament Rules & Regulations
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {tournament.rules || 'No custom rules have been added for this tournament.'}
            </p>
          </div>
        )}

        {/* TAB 2: Teams & Approvals */}
        {activeTab === 'teams' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Shield size={18} className="text-blue-500" /> Roster Registrations
              </h3>
              <span className="text-xs font-bold text-slate-400">
                Approved: {approvedTeamsCount} / {teams.length}
              </span>
            </div>

            {teams.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No teams have registered for this tournament yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map((t) => {
                  const deptLogo = t.department?.logo?.startsWith('/uploads') 
                    ? `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${t.department.logo}` 
                    : (t.department?.logo || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=150&auto=format&fit=crop');

                  return (
                    <div
                      key={t._id}
                      className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={deptLogo}
                          alt="Department Logo"
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-850">
                            {t.department?.name}
                          </p>
                          <p className="text-3xs text-slate-400">
                            Coach: {t.coach || 'N/A'} | Players: {t.players?.length || 0}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {t.isApproved ? (
                          <Badge variant="success" className="text-3xs">
                            Approved
                          </Badge>
                        ) : (
                          <>
                            <Badge variant="warning" className="text-3xs">
                              Pending
                            </Badge>
                            {user?.role === 'superAdmin' && (
                              <button
                                onClick={() => handleApproveTeam(t._id)}
                                className="p-1 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-700 transition"
                                aria-label="Approve team"
                              >
                                <Check size={14} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Fixtures / Matchups */}
        {activeTab === 'fixtures' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-extrabold text-slate-900">
                Match Scheduling
              </h3>
              
              {!hasFixtures && user?.role === 'superAdmin' && (
                <button
                  onClick={handleGenerateFixtures}
                  disabled={approvedTeamsCount < 2}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition shadow-sm"
                >
                  Generate Match Fixtures
                </button>
              )}
            </div>

            {!hasFixtures ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                {approvedTeamsCount < 2 
                  ? 'Need at least 2 approved team rosters to generate fixtures. Approve rosters in the Teams tab first.'
                  : 'Schedules have not been generated yet. Click Generate Match Fixtures above.'}
              </div>
            ) : tournament.format === 'knockout' ? (
              <BracketView fixtures={fixtures} />
            ) : (
              <TableView fixtures={fixtures} />
            )}
          </div>
        )}

        {/* TAB 4: Points standings (league only) */}
        {activeTab === 'points' && (
          <PointsTable tournamentId={id} inlineMode={true} />
        )}

        {/* TAB 5: Gallery uploads */}
        {activeTab === 'gallery' && (
          <Gallery tournamentId={id} inlineMode={true} />
        )}

      </div>
    </div>
  );
};

export default TournamentDetail;
