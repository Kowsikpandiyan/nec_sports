import React, { useState, useEffect } from 'react';
import api from '../../lib/axios';
import PageHeader from '../../components/common/PageHeader';
import toast from 'react-hot-toast';
import {
  Sparkles,
  Share2,
  Scale,
  Award,
  Copy,
  Check,
  Send,
  RefreshCw,
  ExternalLink,
  HelpCircle,
  ShieldCheck,
  Zap,
  BookOpen,
  MessageCircle,
  Instagram,
  FileText,
  Trophy,
  Flame,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const AIStudio = () => {
  const [activeTab, setActiveTab] = useState('announcements'); // 'announcements' | 'disputes' | 'citations'
  const [aiStatus, setAiStatus] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Announcement state
  const [announcementType, setAnnouncementType] = useState('Match Result');
  const [announcementTone, setAnnouncementTone] = useState('hype');
  const [announcementTournament, setAnnouncementTournament] = useState('');
  const [announcementSport, setAnnouncementSport] = useState('Football');
  const [matchDetails, setMatchDetails] = useState('Computer Science defeated Electronics 3-1 in an electric semi-final thriller!');
  const [announcementOutput, setAnnouncementOutput] = useState(null);
  const [loadingAnnouncement, setLoadingAnnouncement] = useState(false);
  const [copiedChannel, setCopiedChannel] = useState(null);

  // Dispute state
  const [disputeSport, setDisputeSport] = useState('Football');
  const [disputeCategory, setDisputeCategory] = useState('Tiebreaker & Extra Time');
  const [disputeQuery, setDisputeQuery] = useState('Match ended in a 2-2 tie after full-time in the semi-finals. Team B claims direct penalties while Team A demands extra-time.');
  const [disputeOutput, setDisputeOutput] = useState(null);
  const [loadingDispute, setLoadingDispute] = useState(false);

  // Citation state
  const [athleteName, setAthleteName] = useState('Aravind Kumar');
  const [athleteDept, setAthleteDept] = useState('Computer Science & Engineering');
  const [athleteSport, setAthleteSport] = useState('Football');
  const [awardType, setAwardType] = useState('Player of the Tournament (MVP)');
  const [citationHighlights, setCitationHighlights] = useState('Scored 5 goals across 4 matches, recorded 3 assists, and led the team with zero fouls.');
  const [citationStyle, setCitationStyle] = useState('inspiring');
  const [citationOutput, setCitationOutput] = useState(null);
  const [loadingCitation, setLoadingCitation] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState(false);

  // Fetch initial data (tournaments, departments, AI status)
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [statusRes, tourneyRes, deptRes] = await Promise.allSettled([
          api.get('/ai/status'),
          api.get('/tournaments?limit=50'),
          api.get('/departments')
        ]);

        if (statusRes.status === 'fulfilled' && statusRes.value.data?.data) {
          setAiStatus(statusRes.value.data.data);
        }
        if (tourneyRes.status === 'fulfilled' && tourneyRes.value.data?.data) {
          const list = tourneyRes.value.data.data;
          setTournaments(list);
          if (list.length > 0) {
            setAnnouncementTournament(list[0].name);
          }
        }
        if (deptRes.status === 'fulfilled' && deptRes.value.data?.data) {
          setDepartments(deptRes.value.data.data);
        }
      } catch (e) {
        console.error('Metadata load error:', e);
      }
    };
    fetchMeta();
  }, []);

  // Generate Announcements
  const handleGenerateAnnouncement = async (e) => {
    e?.preventDefault();
    try {
      setLoadingAnnouncement(true);
      const res = await api.post('/ai/announcement', {
        type: announcementType,
        tone: announcementTone,
        tournamentName: announcementTournament || 'NEC Annual Sports Tournament',
        sportName: announcementSport,
        matchDetails
      });
      if (res.data?.success && res.data?.data) {
        setAnnouncementOutput(res.data.data);
        toast.success('Social updates & circular generated successfully!');
      }
    } catch (err) {
      toast.error('Failed to generate announcements');
    } finally {
      setLoadingAnnouncement(false);
    }
  };

  // Resolve Dispute
  const handleResolveDispute = async (e) => {
    e?.preventDefault();
    if (!disputeQuery.trim()) {
      toast.error('Please enter the dispute scenario');
      return;
    }
    try {
      setLoadingDispute(true);
      const res = await api.post('/ai/dispute', {
        sport: disputeSport,
        category: disputeCategory,
        query: disputeQuery
      });
      if (res.data?.success && res.data?.data) {
        setDisputeOutput(res.data.data);
        toast.success('Referee ruling generated!');
      }
    } catch (err) {
      toast.error('Failed to evaluate referee dispute');
    } finally {
      setLoadingDispute(false);
    }
  };

  // Generate Citation
  const handleGenerateCitation = async (e) => {
    e?.preventDefault();
    if (!athleteName.trim()) {
      toast.error('Please enter the recipient athlete name');
      return;
    }
    try {
      setLoadingCitation(true);
      const res = await api.post('/ai/citation', {
        playerName: athleteName,
        departmentName: athleteDept,
        sportName: athleteSport,
        awardCategory: awardType,
        highlights: citationHighlights,
        style: citationStyle
      });
      if (res.data?.success && res.data?.data) {
        setCitationOutput(res.data.data);
        toast.success('Certificate citation drafted!');
      }
    } catch (err) {
      toast.error('Failed to generate citation');
    } finally {
      setLoadingCitation(false);
    }
  };

  // Copy helper
  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    if (key === 'citation') {
      setCopiedCitation(true);
      setTimeout(() => setCopiedCitation(false), 2000);
    } else {
      setCopiedChannel(key);
      setTimeout(() => setCopiedChannel(null), 2000);
    }
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <PageHeader
        title="AI Sports Intelligence Studio"
        description="Next-generation AI tools powered by OpenRouter to elevate tournaments, announcements, referee rulings, and athlete honors."
      >
        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-blue-700">
          <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />
          <span>{aiStatus?.configured ? (aiStatus?.mode || 'OpenRouter AI Online') : 'Smart Hybrid AI Active'}</span>
        </div>
      </PageHeader>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
            activeTab === 'announcements'
              ? 'bg-white text-blue-700 shadow-md shadow-blue-500/5 border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Share2 className="h-4 w-4 text-blue-600" />
          <span>Social & Announcement Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('disputes')}
          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
            activeTab === 'disputes'
              ? 'bg-white text-indigo-700 shadow-md shadow-indigo-500/5 border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Scale className="h-4 w-4 text-indigo-600" />
          <span>Referee & Dispute Assistant</span>
        </button>

        <button
          onClick={() => setActiveTab('citations')}
          className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
            activeTab === 'citations'
              ? 'bg-white text-purple-700 shadow-md shadow-purple-500/5 border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Award className="h-4 w-4 text-purple-600" />
          <span>Honors & Citation Generator</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SOCIAL MEDIA & ANNOUNCEMENT STUDIO */}
      {/* ========================================================================= */}
      {activeTab === 'announcements' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Form */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Share2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Publishing Parameters</h2>
                <p className="text-xs text-slate-500">Customize target channels and tournament context</p>
              </div>
            </div>

            <form onSubmit={handleGenerateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Announcement Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Match Result', 'Upcoming Match', 'Tournament Finals', 'General Bulletin'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAnnouncementType(t)}
                      className={`text-xs font-semibold py-2 px-3 rounded-lg border text-left transition-all ${
                        announcementType === t
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sport Discipline
                </label>
                <select
                  value={announcementSport}
                  onChange={(e) => setAnnouncementSport(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Football">⚽ Football</option>
                  <option value="Cricket">🏏 Cricket</option>
                  <option value="Basketball">🏀 Basketball</option>
                  <option value="Volleyball">🏐 Volleyball</option>
                  <option value="Badminton">🏸 Badminton</option>
                  <option value="Kabaddi">🤼 Kabaddi</option>
                  <option value="Chess">♟️ Chess</option>
                  <option value="TableTennis">🏓 Table Tennis</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tournament Name
                </label>
                <input
                  type="text"
                  value={announcementTournament}
                  onChange={(e) => setAnnouncementTournament(e.target.value)}
                  placeholder="e.g. NEC Annual Inter-Department Tournament"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tone & Energy
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'hype', label: '🔥 Hype', desc: 'High energy' },
                    { id: 'official', label: '🏛️ Official', desc: 'Formal tone' },
                    { id: 'friendly', label: '🤝 Campus', desc: 'Community' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAnnouncementTone(item.id)}
                      className={`text-xs py-2 px-2 rounded-lg border text-center transition-all ${
                        announcementTone === item.id
                          ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <div>{item.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Match Details / Key Moments
                </label>
                <textarea
                  rows={3}
                  value={matchDetails}
                  onChange={(e) => setMatchDetails(e.target.value)}
                  placeholder="Enter score, standout player moments, or schedule..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loadingAnnouncement}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {loadingAnnouncement ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Synthesizing Copy...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>Generate Multi-Channel Broadcasts</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results Column */}
          <div className="lg:col-span-7 space-y-4">
            {!announcementOutput && !loadingAnnouncement && (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Share2 className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">Instant Multi-Platform Sports Broadcasts</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click generate to produce ready-to-share WhatsApp broadcasts, captivating Instagram captions with hashtags, and formal college circulars.
                </p>
              </div>
            )}

            {loadingAnnouncement && (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
                <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
                <p className="text-sm font-semibold text-slate-700">AI is crafting announcements across 3 channels...</p>
              </div>
            )}

            {announcementOutput && !loadingAnnouncement && (
              <div className="space-y-4">
                {/* Engine Source Badge */}
                <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Generated via: <strong className="text-slate-700">{announcementOutput.engine}</strong>
                  </span>
                  <span className="text-[11px] text-slate-400">Ready to distribute</span>
                </div>

                {/* WhatsApp Format */}
                <div className="bg-white border border-emerald-500/30 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-emerald-600 px-4 py-2.5 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                      <MessageCircle className="h-4 w-4" />
                      <span>WhatsApp Department Broadcast</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(announcementOutput.whatsapp, 'whatsapp')}
                        className="flex items-center gap-1 text-[11px] bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        {copiedChannel === 'whatsapp' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{copiedChannel === 'whatsapp' ? 'Copied' : 'Copy'}</span>
                      </button>
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(announcementOutput.whatsapp)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] bg-emerald-700 hover:bg-emerald-800 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Open WhatsApp</span>
                      </a>
                    </div>
                  </div>
                  <div className="p-4 bg-emerald-50/20 font-sans text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
                    {announcementOutput.whatsapp}
                  </div>
                </div>

                {/* Instagram Format */}
                <div className="bg-white border border-pink-500/30 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-amber-600 px-4 py-2.5 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                      <Instagram className="h-4 w-4" />
                      <span>Instagram Caption & Hashtags</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(announcementOutput.instagram, 'instagram')}
                      className="flex items-center gap-1 text-[11px] bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      {copiedChannel === 'instagram' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedChannel === 'instagram' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="p-4 font-sans text-xs text-slate-800 whitespace-pre-wrap leading-relaxed select-all">
                    {announcementOutput.instagram}
                  </div>
                </div>

                {/* Official Circular Format */}
                <div className="bg-white border border-slate-300 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-slate-800 px-4 py-2.5 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                      <FileText className="h-4 w-4" />
                      <span>Official College Sports Notice</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(announcementOutput.circular, 'circular')}
                      className="flex items-center gap-1 text-[11px] bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      {copiedChannel === 'circular' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedChannel === 'circular' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="p-4 font-mono text-[11px] text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50/50 select-all border-b border-slate-100">
                    {announcementOutput.circular}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: REFEREE & DISPUTE ASSISTANT */}
      {/* ========================================================================= */}
      {activeTab === 'disputes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Dispute Input Pane */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Referee Arbitration Desk</h2>
                <p className="text-xs text-slate-500">Official tournament rules & tiebreaker resolution</p>
              </div>
            </div>

            <form onSubmit={handleResolveDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Sport
                </label>
                <select
                  value={disputeSport}
                  onChange={(e) => setDisputeSport(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Football">⚽ Football (IFAB)</option>
                  <option value="Cricket">🏏 Cricket (BCCI / ICC)</option>
                  <option value="Basketball">🏀 Basketball (FIBA)</option>
                  <option value="Volleyball">🏐 Volleyball (FIVB)</option>
                  <option value="Badminton">🏸 Badminton (BWF)</option>
                  <option value="Kabaddi">🤼 Kabaddi (AKFI)</option>
                  <option value="Chess">♟️ Chess (FIDE)</option>
                  <option value="TableTennis">🏓 Table Tennis (ITTF)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Dispute Topic
                </label>
                <select
                  value={disputeCategory}
                  onChange={(e) => setDisputeCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Tiebreaker & Extra Time">Tiebreaker & Overtime Protocols</option>
                  <option value="Cards & Disciplinary Suspension">Yellow/Red Card Accumulation & Ban</option>
                  <option value="Weather Delay & Time Curtailment">Weather Delay, Rain & DLS / Time Cuts</option>
                  <option value="Substitution & Squad Limits">Substitution Quotas & Rolling Substitutions</option>
                  <option value="Walkover & Forfeiture Points">Late Reporting, Walkover & Forfeit Scoring</option>
                  <option value="Player Eligibility & Department Transfer">Player Registration & Department Eligibility</option>
                  <option value="Custom Dispute Scenario">Custom Field Incident</option>
                </select>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                  Quick Scenario Presets:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDisputeSport('Cricket');
                      setDisputeCategory('Weather Delay & Time Curtailment');
                      setDisputeQuery('Rain halted play after 6 overs in 2nd innings of 12-over match. Team batting 2nd is at 52/1 chasing 98.');
                    }}
                    className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md transition-colors"
                  >
                    🏏 Rain DLS Target
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDisputeSport('Football');
                      setDisputeCategory('Tiebreaker & Extra Time');
                      setDisputeQuery('Knockout quarterfinal tied at 1-1 after regulation time. Organizers running behind schedule due to dusk.');
                    }}
                    className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md transition-colors"
                  >
                    ⚽ Football Tiebreaker
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDisputeSport('Kabaddi');
                      setDisputeCategory('Tiebreaker & Extra Time');
                      setDisputeQuery('Both teams locked at 28-28 at the final whistle in the semifinal match.');
                    }}
                    className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md transition-colors"
                  >
                    🤼 Golden Raid Rules
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Describe Incident / Query
                </label>
                <textarea
                  rows={4}
                  value={disputeQuery}
                  onChange={(e) => setDisputeQuery(e.target.value)}
                  placeholder="Detail the on-field situation, disagreement, or rule question..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={loadingDispute}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {loadingDispute ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Evaluating Official Rulebook...</span>
                  </>
                ) : (
                  <>
                    <Scale className="h-4 w-4 text-amber-300" />
                    <span>Arbitrate & Issue Official Ruling</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Dispute Resolution Output */}
          <div className="lg:col-span-7 space-y-4">
            {!disputeOutput && !loadingDispute && (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">Impartial Rulebook Arbitrator</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Resolve on-field protests, tiebreaker dilemmas, card accumulation rules, and weather delays with authoritative collegiate federation regulations.
                </p>
              </div>
            )}

            {loadingDispute && (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
                <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
                <p className="text-sm font-semibold text-slate-700">Checking federation bylaws and tournament precedents...</p>
              </div>
            )}

            {disputeOutput && !loadingDispute && (
              <div className="space-y-4">
                {/* Official Ruling Banner */}
                <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white rounded-2xl p-5 border border-indigo-500/30 shadow-xl space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-full">
                      Official Referee Ruling
                    </span>
                    <span className="text-xs text-indigo-300 font-mono">
                      {disputeSport.toUpperCase()} ARBITRATION
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm md:text-base font-extrabold text-white leading-snug">
                      {disputeOutput.ruling}
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-indigo-200">
                    <BookOpen className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Statutory Citation:</span>
                    <span className="font-mono text-white font-bold bg-indigo-950/70 px-2 py-0.5 rounded border border-indigo-800">
                      {disputeOutput.ruleReference}
                    </span>
                  </div>
                </div>

                {/* Step-by-Step Action Plan */}
                {disputeOutput.immediateAction && disputeOutput.immediateAction.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                      <Zap className="h-4 w-4 text-amber-500" />
                      <span>Immediate On-Field Execution Steps</span>
                    </div>
                    <div className="space-y-2">
                      {disputeOutput.immediateAction.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800">
                          <span className="flex items-center justify-center h-5 w-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] shrink-0">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tiebreak Metric & Prevention Tip */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1.5">
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block">
                      Tiebreak / Penalty Standard
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {disputeOutput.tiebreakOrPenalty}
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1.5">
                    <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                      Dispute Prevention Protocol
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {disputeOutput.preventionTip}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: HONORS & CITATION GENERATOR */}
      {/* ========================================================================= */}
      {activeTab === 'citations' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Athlete Form */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">Honors Configuration</h2>
                <p className="text-xs text-slate-500">Draft inspiring citations for certificates & banquets</p>
              </div>
            </div>

            <form onSubmit={handleGenerateCitation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Award / Title
                </label>
                <select
                  value={awardType}
                  onChange={(e) => setAwardType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Player of the Tournament (MVP)">🏆 Player of the Tournament (MVP)</option>
                  <option value="Tournament Champions">🥇 Tournament Champions</option>
                  <option value="Fair Play & Sportsmanship Award">🤝 Fair Play & Sportsmanship Trophy</option>
                  <option value="Golden Boot / Top Scorer">⚡ Golden Boot / Highest Scorer</option>
                  <option value="Best Defensive Player">🛡️ Best Defensive Player of the Meet</option>
                  <option value="Emerging Young Talent">🌟 Emerging Young Talent of the Year</option>
                  <option value="Certificate of Athletic Merit">📜 Certificate of Athletic Merit</option>
                  <option value="Certificate of Participation">🎗️ Certificate of Participation</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Athlete Name
                  </label>
                  <input
                    type="text"
                    value={athleteName}
                    onChange={(e) => setAthleteName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Sport
                  </label>
                  <input
                    type="text"
                    value={athleteSport}
                    onChange={(e) => setAthleteSport(e.target.value)}
                    placeholder="e.g. Football"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Department
                </label>
                <select
                  value={athleteDept}
                  onChange={(e) => setAthleteDept(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                  <option value="Electrical & Electronics Engineering">Electrical & Electronics Engineering</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Oratory Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'inspiring', label: '✨ Inspiring' },
                    { id: 'modern', label: '⚡ Dynamic' },
                    { id: 'prestigious', label: '🏛️ Prestigious' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setCitationStyle(s.id)}
                      className={`text-xs py-2 px-2 rounded-lg border text-center transition-all ${
                        citationStyle === s.id
                          ? 'bg-purple-50 border-purple-500 text-purple-700 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Highlights & Notable Feats
                </label>
                <textarea
                  rows={3}
                  value={citationHighlights}
                  onChange={(e) => setCitationHighlights(e.target.value)}
                  placeholder="Goals scored, clean sheets, clutch final points, leadership..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={loadingCitation}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                {loadingCitation ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Orating Commendation...</span>
                  </>
                ) : (
                  <>
                    <Award className="h-4 w-4 text-amber-300" />
                    <span>Generate Award Citation</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Certificate Citation Output */}
          <div className="lg:col-span-7 space-y-4">
            {!citationOutput && !loadingCitation && (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center space-y-3">
                <div className="mx-auto w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">Bespoke Honors Citations</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Generate eloquent, dignified commendation paragraphs for certificates of merit, medals, and podium banquet speeches.
                </p>
              </div>
            )}

            {loadingCitation && (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
                <RefreshCw className="h-8 w-8 text-purple-600 animate-spin mx-auto" />
                <p className="text-sm font-semibold text-slate-700">Composing formal honors commendation...</p>
              </div>
            )}

            {citationOutput && !loadingCitation && (
              <div className="space-y-4">
                {/* Visual Certificate Card Preview */}
                <div className="relative overflow-hidden bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border-4 border-double border-amber-500/40 rounded-3xl p-6 md:p-8 shadow-xl space-y-5">
                  {/* Decorative corner emblems */}
                  <div className="flex justify-between items-center pb-4 border-b border-amber-500/20">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-gradient-to-tr from-amber-500 to-amber-600 text-white rounded-xl shadow-md shadow-amber-500/30">
                        <Trophy className="h-6 w-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 block">
                          NATIONAL ENGINEERING COLLEGE
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 tracking-wide">
                          HONORS & COMMENDATION
                        </h4>
                      </div>
                    </div>

                    <button
                      onClick={() => copyToClipboard(citationOutput.citationText, 'citation')}
                      className="flex items-center gap-1.5 text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 border border-amber-500/30 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                    >
                      {copiedCitation ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copiedCitation ? 'Copied' : 'Copy Citation'}</span>
                    </button>
                  </div>

                  {/* Recipient Ribbon */}
                  <div className="text-center space-y-1 py-1">
                    <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
                      This formal citation honors
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      {athleteName}
                    </h2>
                    <p className="text-xs text-amber-800 font-semibold">
                      {athleteDept} • {athleteSport}
                    </p>
                  </div>

                  {/* Orator Citation Speech */}
                  <div className="bg-white/80 p-5 rounded-2xl border border-amber-500/20 shadow-inner">
                    <p className="font-serif italic text-sm md:text-base text-slate-800 leading-relaxed text-justify">
                      "{citationOutput.citationText}"
                    </p>
                  </div>

                  {/* Badges / Commended Qualities */}
                  {citationOutput.badges && (
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      {citationOutput.badges.map((b, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-900 border border-amber-500/30 flex items-center gap-1"
                        >
                          <Sparkles className="h-3 w-3 text-amber-600" />
                          {b}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Inspirational Sports Quote */}
                  {citationOutput.quote && (
                    <div className="text-center pt-2 border-t border-amber-500/20">
                      <p className="text-xs text-slate-500 font-medium italic">
                        {citationOutput.quote}
                      </p>
                    </div>
                  )}
                </div>

                {/* Short Announcer Summary Card */}
                {citationOutput.shortSummary && (
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Announcer Podium Blurb (1-Liner)
                      </span>
                      <p className="text-xs text-slate-700 font-medium mt-0.5">
                        {citationOutput.shortSummary}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(citationOutput.shortSummary, 'short')}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
                      title="Copy Blurb"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIStudio;
