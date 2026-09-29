import React, { useState, useEffect, useRef } from 'react';
import api from '../../lib/axios';
import { 
  MessageSquare, X, Send, Bot, User, Sparkles, Radio, Trophy, 
  TrendingUp, Calendar, RefreshCw, ChevronRight, BarChart2, ShieldAlert, Scale
} from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { Link } from 'react-router-dom';

const DashboardChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      type: 'text',
      text: "Hello! 👋 I'm your AI Sports Bot powered by OpenRouter. Ask me anything about live match scores, tournament standings, sports rules, or department tactics!",
      timestamp: new Date()
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputMessage).trim();
    if (!query) return;

    // Add user message to state
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      type: 'text',
      text: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setLoading(true);

    try {
      const botResponse = await processUserQuery(query);
      setMessages(prev => [...prev, botResponse]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'bot',
          type: 'text',
          text: "Sorry, I couldn't fetch live sports data right now. Please try asking again!",
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const processUserQuery = async (userQuery) => {
    const q = userQuery.toLowerCase();
    const isScoreQuery = q.includes('score') || q.includes('live') || q.includes('result') || q.includes('current match') || q.includes('playing');
    const isStandingsQuery = q.includes('stand') || q.includes('rank') || q.includes('leader') || q.includes('table') || q.includes('point');
    const isUpcomingQuery = q.includes('upcoming') || q.includes('schedule') || q.includes('fixture') || q.includes('next');

    // Pre-fetch relevant live data cards to display alongside AI answer
    let attachedMatches = null;
    let attachedStandings = null;
    let cardTitle = null;

    if (isScoreQuery) {
      try {
        const liveRes = await api.get('/matches?status=live&limit=5');
        const liveMatches = liveRes.data?.data || [];
        if (liveMatches.length > 0) {
          attachedMatches = liveMatches;
          cardTitle = '🔥 Live Ongoing Matches';
        } else {
          const recentRes = await api.get('/matches?limit=3&sort=-scheduledAt');
          attachedMatches = recentRes.data?.data || [];
          cardTitle = '⚡ Recent & Scheduled Match Scores';
        }
      } catch (e) {}
    } else if (isUpcomingQuery) {
      try {
        const schedRes = await api.get('/matches?status=scheduled&limit=5');
        attachedMatches = schedRes.data?.data || [];
        cardTitle = '📅 Upcoming Scheduled Fixtures';
      } catch (e) {}
    } else if (isStandingsQuery) {
      try {
        const standingsRes = await api.get('/leaderboard/departments');
        attachedStandings = (standingsRes.data?.data || []).slice(0, 5);
      } catch (e) {}
    }

    // Call OpenRouter AI backend endpoint
    try {
      const chatRes = await api.post('/ai/chat', {
        message: userQuery,
        history: messages.slice(-6)
      });

      if (chatRes.data?.success && chatRes.data?.data?.reply) {
        return {
          id: Date.now(),
          sender: 'bot',
          type: attachedMatches ? 'scores' : (attachedStandings ? 'standings' : 'text'),
          title: cardTitle,
          matches: attachedMatches,
          standings: attachedStandings,
          text: chatRes.data.data.reply,
          timestamp: new Date()
        };
      }
    } catch (err) {
      console.warn('AI Chat API fallback:', err);
    }

    // Fallback if AI endpoint is offline
    if (isScoreQuery && attachedMatches) {
      return {
        id: Date.now(),
        sender: 'bot',
        type: 'scores',
        title: cardTitle,
        matches: attachedMatches,
        text: `Here are the latest match scores from the tournament:`,
        timestamp: new Date()
      };
    }

    if (isStandingsQuery && attachedStandings) {
      return {
        id: Date.now(),
        sender: 'bot',
        type: 'standings',
        standings: attachedStandings,
        text: 'Here are the current top Department Standings & Points Table:',
        timestamp: new Date()
      };
    }

    return {
      id: Date.now(),
      sender: 'bot',
      type: 'text',
      text: "I am your AI Sports Bot. Feel free to ask about live matches, rules, standings, or team tactics!",
      timestamp: new Date()
    };
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Trigger Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-full shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 transform hover:scale-105 cursor-pointer border border-white/20"
        >
          <div className="relative">
            <Bot className="h-6 w-6 text-white animate-bounce" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-black tracking-wide flex items-center gap-1 text-white">
              Tournament Assistant
            </div>
            <div className="text-[10px] text-blue-100 font-medium">Scores & Standings</div>
          </div>
        </button>
      )}

      {/* Main Expandable Chat Window */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[420px] h-[560px] bg-slate-900 text-white rounded-2xl shadow-2xl border border-indigo-500/30 flex flex-col overflow-hidden animate-fade-in">
          {/* Chat Window Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 border-b border-indigo-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md border border-indigo-400/30">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                  AI Sports Bot
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold uppercase">
                    AI Powered
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">OpenRouter • GPT-4o-mini</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Quick Action Suggestion Pills */}
          <div className="bg-slate-950/60 p-2.5 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleSendMessage('What are the live match scores?')}
              className="shrink-0 text-[11px] font-semibold px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Radio className="h-3 w-3 text-red-400 animate-pulse" /> Live Scores
            </button>
            <button
              onClick={() => handleSendMessage('Show upcoming scheduled matches')}
              className="shrink-0 text-[11px] font-semibold px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Calendar className="h-3 w-3 text-purple-300" /> Upcoming
            </button>
            <button
              onClick={() => handleSendMessage('What is the tiebreaker rule for playoff matches?')}
              className="shrink-0 text-[11px] font-semibold px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Scale className="h-3 w-3 text-amber-300" /> Rules & Disputes
            </button>
            <button
              onClick={() => handleSendMessage('Show department standings')}
              className="shrink-0 text-[11px] font-semibold px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trophy className="h-3 w-3 text-amber-400" /> Standings
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-900/95">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="h-7 w-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="h-4 w-4 text-indigo-400" />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  {/* Standard Text response */}
                  {msg.text && (
                    <div
                      className={`p-3 text-xs leading-relaxed rounded-2xl ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-none font-medium shadow-md'
                          : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  )}

                  {/* Rich Content: Scores List */}
                  {msg.type === 'scores' && msg.matches && (
                    <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700 space-y-2.5">
                      <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Radio className="h-3.5 w-3.5 text-red-400" />
                        {msg.title || 'Match Scores'}
                      </div>
                      <div className="space-y-2">
                        {msg.matches.map((m) => {
                          const t1 = m.team1?.department?.name || m.team1?.name || 'Team 1';
                          const t2 = m.team2?.department?.name || m.team2?.name || 'Team 2';
                          return (
                            <div key={m._id} className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 space-y-1">
                              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                                <span>{m.sport?.name}</span>
                                <span className="capitalize text-indigo-400 font-bold">{m.status}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                                <span>{t1} vs {t2}</span>
                                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-mono">
                                  {m.status === 'scheduled' ? 'VS' : `${m.score1} - ${m.score2}`}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Rich Content: Standings Table */}
                  {msg.type === 'standings' && msg.standings && (
                    <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700 space-y-2">
                      <div className="text-[10px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Trophy className="h-3.5 w-3.5 text-amber-400" />
                        Top Department Rankings
                      </div>
                      <div className="space-y-1.5 text-xs">
                        {msg.standings.map((s, idx) => (
                          <div key={s._id} className="flex items-center justify-between p-2 bg-slate-900/80 rounded border border-slate-800">
                            <span className="font-bold text-slate-300">
                              #{idx + 1} {s.department?.name}
                            </span>
                            <span className="font-black text-indigo-400">
                              {s.totalPoints} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-[9px] text-slate-500 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="h-7 w-7 rounded-lg bg-blue-600/40 border border-blue-500/50 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="h-4 w-4 text-blue-200" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 items-center text-slate-400 text-xs py-2">
                <Bot className="h-4 w-4 text-indigo-400 animate-spin" />
                <span>AI Assistant is analyzing match data...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything (e.g. scores, rules, tactics)..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer shadow-md"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default DashboardChatbot;
