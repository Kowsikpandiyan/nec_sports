import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import PageHeader from '../../components/common/PageHeader';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import toast from 'react-hot-toast';
import { Calendar, Clock, MapPin, Plus, Trash, Edit, Filter, Radio, CheckSquare, RefreshCw, User, ShieldAlert, Eye } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { Link } from 'react-router-dom';

const MatchList = () => {
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [sports, setSports] = useState([]);
  const [venues, setVenues] = useState([]);
  const [scorers, setScorers] = useState([]);
  const [teams, setTeams] = useState([]); // Teams for selected tournament in form
  const [loading, setLoading] = useState(true);

  // Filter States
  const [filterTournament, setFilterTournament] = useState('');
  const [filterSport, setFilterSport] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  // Form States for Create/Edit Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState('');
  
  const [formTournament, setFormTournament] = useState('');
  const [formSport, setFormSport] = useState('');
  const [formRound, setFormRound] = useState('1');
  const [formTeam1, setFormTeam1] = useState('');
  const [formTeam2, setFormTeam2] = useState('');
  const [formVenue, setFormVenue] = useState('');
  const [formScheduledAt, setFormScheduledAt] = useState('');
  const [formScorer, setFormScorer] = useState('');
  const [formReferee, setFormReferee] = useState('');
  const [formStatus, setFormStatus] = useState('scheduled');
  const [formWinner, setFormWinner] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete dialog state
  const [deleteId, setDeleteId] = useState('');

  const fetchFilters = async () => {
    try {
      const [tourneysRes, sportsRes, venuesRes, usersRes] = await Promise.all([
        api.get('/tournaments?limit=100'),
        api.get('/sports?limit=100'),
        api.get('/venues?limit=100'),
        api.get('/users?limit=200') // or standard get users endpoint
      ]);

      if (tourneysRes.data && tourneysRes.data.data) setTournaments(tourneysRes.data.data);
      if (sportsRes.data && sportsRes.data.data) setSports(sportsRes.data.data);
      if (venuesRes.data && venuesRes.data.data) setVenues(venuesRes.data.data);
      if (usersRes.data && usersRes.data.data) {
        // Filter users that are scorers or admins
        const scorerList = usersRes.data.data.filter(u => u.role === 'scorer' || u.role === 'superAdmin');
        setScorers(scorerList);
      }
    } catch (err) {
      console.error('Failed to load filter metadata', err);
    }
  };

  const fetchMatches = async () => {
    try {
      setLoading(true);
      let query = `?page=${page}&limit=${limit}`;
      if (filterTournament) query += `&tournament=${filterTournament}`;
      if (filterSport) query += `&sport=${filterSport}`;
      if (filterStatus) query += `&status=${filterStatus}`;

      const res = await api.get(`/matches${query}`);
      if (res.data && res.data.data) {
        setMatches(res.data.data);
        if (res.data.pagination) {
          setTotalPages(res.data.pagination.pages || 1);
        }
      }
    } catch (err) {
      toast.error('Failed to load matches list');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamsForTournament = async (tourneyId) => {
    if (!tourneyId) {
      setTeams([]);
      return;
    }
    try {
      const res = await api.get(`/teams?tournament=${tourneyId}&limit=100`);
      if (res.data && res.data.data) {
        // Only include approved teams
        setTeams(res.data.data.filter(t => t.isApproved));
      }
    } catch (err) {
      console.error('Failed to fetch teams', err);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchMatches();
  }, [page, filterTournament, filterSport, filterStatus]);

  // Handle tournament change in Form Modal
  useEffect(() => {
    fetchTeamsForTournament(formTournament);
  }, [formTournament]);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setSelectedMatchId('');
    setFormTournament(tournaments[0]?._id || '');
    setFormSport(sports[0]?._id || '');
    setFormRound('1');
    setFormTeam1('');
    setFormTeam2('');
    setFormVenue(venues[0]?._id || '');
    setFormScheduledAt('');
    setFormScorer(scorers[0]?._id || '');
    setFormReferee('');
    setFormStatus('scheduled');
    setFormWinner('');
    setShowFormModal(true);
  };

  const handleOpenEditModal = (match) => {
    setIsEditing(true);
    setSelectedMatchId(match._id);
    setFormTournament(match.tournament?._id || '');
    setFormSport(match.sport?._id || '');
    setFormRound(match.round?.toString() || '1');
    setFormTeam1(match.team1?._id || '');
    setFormTeam2(match.team2?._id || '');
    setFormVenue(match.venue?._id || '');
    // Format scheduledAt to datetime-local friendly string (YYYY-MM-DDTHH:MM)
    if (match.scheduledAt) {
      const d = new Date(match.scheduledAt);
      const iso = d.getFullYear() + '-' + 
                  String(d.getMonth()+1).padStart(2, '0') + '-' + 
                  String(d.getDate()).padStart(2, '0') + 'T' + 
                  String(d.getHours()).padStart(2, '0') + ':' + 
                  String(d.getMinutes()).padStart(2, '0');
      setFormScheduledAt(iso);
    } else {
      setFormScheduledAt('');
    }
    setFormScorer(match.scorer?._id || '');
    setFormReferee(match.referee || '');
    setFormStatus(match.status || 'scheduled');
    setFormWinner(match.winner?._id || '');
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formTournament || !formSport || !formVenue || !formScorer || !formScheduledAt) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (formTeam1 && formTeam2 && formTeam1 === formTeam2) {
      toast.error('Team 1 and Team 2 must be different');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        tournament: formTournament,
        sport: formSport,
        round: parseInt(formRound, 10),
        team1: formTeam1 || null,
        team2: formTeam2 || null,
        venue: formVenue,
        scheduledAt: formScheduledAt,
        scorer: formScorer,
        referee: formReferee,
        status: formStatus
      };

      if (isEditing) {
        payload.winner = formWinner || null;
        const res = await api.put(`/matches/${selectedMatchId}`, payload);
        if (res.data && res.data.success) {
          toast.success('Match updated successfully');
          setShowFormModal(false);
          fetchMatches();
        }
      } else {
        const res = await api.post('/matches', payload);
        if (res.data && res.data.success) {
          toast.success('Match scheduled successfully');
          setShowFormModal(false);
          fetchMatches();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save match');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      const res = await api.delete(`/matches/${deleteId}`);
      if (res.data && res.data.success) {
        toast.success('Match deleted successfully');
        setDeleteId('');
        fetchMatches();
      }
    } catch (err) {
      toast.error('Failed to delete match');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-red-500 text-white animate-pulse';
      case 'completed': return 'bg-slate-200 text-slate-700';
      case 'abandoned': return 'bg-amber-100 text-amber-800';
      default: return 'bg-blue-50 text-blue-700 border border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader 
          title="Match Schedules & Fixtures" 
          subtitle="Add, edit, assign scorers, and manage live match schedules for college tournaments"
        />
        
        <button
          onClick={handleOpenCreateModal}
          className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:shadow transition-colors gap-2 cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          Schedule Match
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
            <Filter className="h-3 w-3" />
            Tournament
          </label>
          <select
            value={filterTournament}
            onChange={(e) => { setFilterTournament(e.target.value); setPage(1); }}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Tournaments</option>
            {tournaments.map(t => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
            <Filter className="h-3 w-3" />
            Sport
          </label>
          <select
            value={filterSport}
            onChange={(e) => { setFilterSport(e.target.value); setPage(1); }}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Sports</option>
            {sports.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
            <Filter className="h-3 w-3" />
            Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="live">Live Now</option>
            <option value="completed">Completed</option>
            <option value="abandoned">Abandoned</option>
          </select>
        </div>
      </div>

      {/* Main Listing Grid */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-100 h-28 rounded-xl" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <EmptyState 
          title="No Scheduled Matches" 
          description="There are no matches found matching your filters. Click 'Schedule Match' to seed new fixtures manually."
          icon={Calendar}
        />
      ) : (
        <div className="space-y-4">
          {matches.map((m) => {
            const team1Name = m.team1?.department?.name || 'TBD';
            const team2Name = m.team2?.department?.name || 'TBD';
            
            return (
              <div 
                key={m._id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                {/* Left: Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600">
                      {m.tournament?.name}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {m.sport?.name} (Round {m.round})
                    </span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getStatusColor(m.status)}`}>
                      {m.status}
                    </span>
                  </div>

                  {/* Teams vs Score */}
                  <div className="flex items-center gap-4 py-1">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      <span className="text-base font-bold text-slate-800">{team1Name}</span>
                      <span className="text-xs text-slate-400 font-medium sm:mx-1">vs</span>
                      <span className="text-base font-bold text-slate-800">{team2Name}</span>
                    </div>
                    {(m.status === 'live' || m.status === 'completed') && (
                      <span className="text-base font-black px-2.5 py-1 bg-slate-900 text-blue-400 rounded font-mono select-none">
                        {m.score1} - {m.score2}
                      </span>
                    )}
                  </div>

                  {/* Logistics */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(m.scheduledAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {m.venue?.name || 'Unassigned Venue'}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      Scorer: {m.scorer?.name || 'Staff'}
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">


                  <Link
                    to={`/matches/${m._id}`}
                    className="flex-1 md:flex-initial inline-flex items-center justify-center p-2 text-slate-600 hover:text-blue-500 border border-slate-200 hover:border-blue-500 rounded-lg transition-colors cursor-pointer"
                    title="View Match Details"
                  >
                    <Eye className="h-4.5 w-4.5" />
                  </Link>

                  <button
                    onClick={() => handleOpenEditModal(m)}
                    className="flex-1 md:flex-initial inline-flex items-center justify-center p-2 text-slate-600 hover:text-blue-500 border border-slate-200 hover:border-blue-500 rounded-lg transition-colors cursor-pointer"
                    title="Edit Match Schedule"
                  >
                    <Edit className="h-4.5 w-4.5" />
                  </button>

                  <button
                    onClick={() => setDeleteId(m._id)}
                    className="flex-1 md:flex-initial inline-flex items-center justify-center p-2 text-slate-600 hover:text-red-500 border border-slate-200 hover:border-red-500 rounded-lg transition-colors cursor-pointer"
                    title="Delete Match"
                  >
                    <Trash className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </div>
      )}

      {/* Creation / Update Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={isEditing ? 'Modify Match Fixture' : 'Schedule New Match'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Tournament *
              </label>
              <select
                required
                value={formTournament}
                onChange={(e) => setFormTournament(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Tournament...</option>
                {tournaments.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Sport *
              </label>
              <select
                required
                value={formSport}
                onChange={(e) => setFormSport(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Sport...</option>
                {sports.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Tournament Round
              </label>
              <input
                type="number"
                min="1"
                required
                value={formRound}
                onChange={(e) => setFormRound(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Scheduled Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formScheduledAt}
                onChange={(e) => setFormScheduledAt(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Team 1 (Home)
              </label>
              <select
                value={formTeam1}
                onChange={(e) => setFormTeam1(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">TBD (To Be Decided)</option>
                {teams.map(t => (
                  <option key={t._id} value={t._id}>{t.department?.name || t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Team 2 (Away)
              </label>
              <select
                value={formTeam2}
                onChange={(e) => setFormTeam2(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">TBD (To Be Decided)</option>
                {teams.map(t => (
                  <option key={t._id} value={t._id}>{t.department?.name || t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Venue *
              </label>
              <select
                required
                value={formVenue}
                onChange={(e) => setFormVenue(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Venue...</option>
                {venues.map(v => (
                  <option key={v._id} value={v._id}>{v.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Assign Scorer *
              </label>
              <select
                required
                value={formScorer}
                onChange={(e) => setFormScorer(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Scorer...</option>
                {scorers.map(s => (
                  <option key={s._id} value={s._id}>{s.name} ({s.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Referee / Match Official
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={formReferee}
                onChange={(e) => setFormReferee(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {isEditing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 pt-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Match Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed</option>
                  <option value="abandoned">Abandoned</option>
                </select>
              </div>

              {formStatus === 'completed' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Declare Winner
                  </label>
                  <select
                    value={formWinner}
                    onChange={(e) => setFormWinner(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 bg-white rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Draw / No Winner</option>
                    {formTeam1 && (
                      <option value={formTeam1}>
                        {teams.find(t => t._id === formTeam1)?.department?.name || 'Team 1'}
                      </option>
                    )}
                    {formTeam2 && (
                      <option value={formTeam2}>
                        {teams.find(t => t._id === formTeam2)?.department?.name || 'Team 2'}
                      </option>
                    )}
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowFormModal(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                'Save Schedule'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-slate-200 p-6 rounded-xl max-w-sm w-full space-y-4 shadow-lg">
            <div className="flex items-center gap-3 text-red-600">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-lg font-bold">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete this match schedule? All live score logs and timelines linked to this match will be lost forever.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteId('')}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchList;
