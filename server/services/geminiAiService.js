/**
 * OpenRouter AI Service for NEC Sports Tournament Management System
 * Connects to OpenRouter.ai API with intelligent heuristic fallback.
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Call OpenRouter API with prompt and systemInstruction
 */
const callOpenRouterAPI = async (prompt, systemInstruction = '') => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }

  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

  try {
    const payload = {
      model,
      messages: [
        ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1024
    };

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:3000',
        'X-Title': 'NEC Sports Management'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`OpenRouter API returned status ${response.status}:`, errText);
      return null;
    }

    const data = await response.json();
    const candidate = data.choices?.[0]?.message?.content;
    return candidate || null;
  } catch (err) {
    console.error('Error invoking OpenRouter API:', err.message);
    return null;
  }
};

/**
 * 1. AI Social Media & Announcement Studio
 */
exports.generateAnnouncement = async ({ type, tone = 'hype', tournamentName, sportName, matchDetails, customContext }) => {
  const systemInstruction = `You are the lead Sports Media Director for NEC College Sports. Generate viral, high-engagement sports announcements formatted cleanly for college students and faculty. Return strictly valid JSON.`;
  
  const prompt = `
Generate 3 distinct formats of sports announcement for the following event:
- Type: ${type} (e.g. Match Result, Upcoming Clash, Tournament Championship, General Bulletin)
- Sport: ${sportName || 'College Sports'}
- Tournament: ${tournamentName || 'NEC Annual Sports Meet'}
- Tone: ${tone} (options: hype, official, friendly)
- Details/Match Info: ${matchDetails || 'Inter-department championship'}
- Extra notes: ${customContext || 'All students and faculty are invited to cheer!'}

Return your response in strictly VALID JSON format without markdown code fences or backticks:
{
  "whatsapp": "string containing WhatsApp announcement formatted with emojis, *bold text*, bullet points, and call to action",
  "instagram": "string containing engaging Instagram caption with hook line, match recap/preview, emojis, and relevant hashtags",
  "circular": "string containing formal college notice board announcement with reference header, date, body, and sports committee signature"
}`;

  let aiOutput = await callOpenRouterAPI(prompt, systemInstruction);
  if (aiOutput) {
    try {
      const cleanJson = aiOutput.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
      const parsed = JSON.parse(cleanJson);
      return { ...parsed, isAiGenerated: true, engine: `OpenRouter AI (${process.env.OPENROUTER_MODEL || 'gpt-4o-mini'})` };
    } catch (e) {
      console.warn('Failed to parse OpenRouter JSON output, falling back to smart template engine');
    }
  }

  // --- Smart Intelligent Fallback Engine ---
  const tName = tournamentName || 'NEC Inter-Department Tournament';
  const sName = sportName || 'Sports Meet';
  const info = matchDetails || 'Exciting competitive match between top department squads!';

  let headline = `🏆 ${tName.toUpperCase()} - ${sName.toUpperCase()}`;
  let hook = '⚡ Action Alert!';
  if (tone === 'hype') {
    hook = '🔥 MASSIVE CLASH ALERT! ARE YOU READY?! 🔥';
  } else if (tone === 'official') {
    hook = '📢 OFFICIAL COMMUNIQUÉ - SPORTS ADVISORY BOARD';
  }

  const whatsapp = `*${headline}*\n${hook}\n\n📍 *Event Details:* ${info}\n🏅 *Discipline:* ${sName}\n🏛️ *Tournament:* ${tName}\n\n👉 Come down to the arena and show your department pride! Noise, chants, and full energy required!\n\n#NECSports #${sName.replace(/\s+/g, '')} #ChampionshipDrive`;

  const instagram = `${hook}\n\n${info}\n\nThe stakes have never been higher at the ${tName}. Every second counts, every goal/point matters! 💥\n\nDrop your department's initials in the comments and let's see who's taking the trophy home this year! 👇🏆\n\n.\n.\n#NECSports #${sName.replace(/\s+/g, '')} #CollegeSports #InterDeptClash #CampusAthletics #ChampionsRise #NECPride`;

  const circular = `NATIONAL ENGINEERING COLLEGE (NEC)\nDEPARTMENT OF PHYSICAL EDUCATION & SPORTS BOARD\n\nCIRCULAR / NOTICE\nDate: ${new Date().toLocaleDateString('en-GB')}\n\nSub: ${tName} - Schedule and Event Information (${sName})\n\nThis is to notify all faculty members, staff, and students that the ${tName} for ${sName} is underway. \n\nEvent Summary:\n${info}\n\nAll department heads and student sports coordinators are requested to ensure timely presence at the designated venue. Let us uphold the spirit of camaraderie, healthy competition, and sportsmanship.\n\nWarm regards,\nDirector of Physical Education\nNEC Sports Council`;

  return {
    whatsapp,
    instagram,
    circular,
    isAiGenerated: false,
    engine: 'Smart Dynamic Heuristic Engine'
  };
};

/**
 * 2. AI Tournament Rulebook & Dispute Assistant
 */
exports.resolveDispute = async ({ sport, query, category }) => {
  const systemInstruction = `You are the Chief Tournament Referee and Arbitrator for collegiate sports at NEC. Provide definitive, fair, and legally sound sporting rulings grounded in standard collegiate and international federation guidelines. Return strictly valid JSON.`;

  const prompt = `
A referee dispute or rule query has been raised:
- Sport: ${sport || 'General Sports'}
- Category: ${category || 'General Rule Interpretation'}
- Query / Dispute Scenario: "${query}"

Provide a structured referee resolution in strictly VALID JSON format without code fences:
{
  "ruling": "Clear 1-2 sentence final verdict on the dispute",
  "ruleReference": "Official federation or collegiate rulebook section (e.g. FIFA Law 12, ICC Playing Conditions Clause 16, FIBA Rule 4)",
  "immediateAction": ["Step 1 for referee", "Step 2 for scorer/coordinators", "Step 3 for restart of play"],
  "tiebreakOrPenalty": "Specific penalty, card, points deduction, or tiebreaker metric applied",
  "preventionTip": "Best practice to avoid this dispute in future matches"
}`;

  let aiOutput = await callOpenRouterAPI(prompt, systemInstruction);
  if (aiOutput) {
    try {
      const cleanJson = aiOutput.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
      const parsed = JSON.parse(cleanJson);
      return { ...parsed, isAiGenerated: true, engine: `OpenRouter AI (${process.env.OPENROUTER_MODEL || 'gpt-4o-mini'})` };
    } catch (e) {
      console.warn('Failed to parse OpenRouter dispute JSON, using smart rule engine');
    }
  }

  // --- Smart Intelligent Rulebook Fallback Engine ---
  const sportRules = {
    Football: {
      ref: 'IFAB Laws of the Game - Laws 3, 10 & 12',
      tiebreaker: 'Direct penalty shootout (5 kicks each) if knockout; Head-to-head then Goal Difference if league.',
      actions: ['Stop play immediately and record the game minute.', 'Consult assistant referee/linesman for clear angle.', 'Award direct/indirect free-kick or restart per Law 12.'],
      tip: 'Ensure pre-match captain briefing explicitly confirms maximum 3 substitution windows.'
    },
    Cricket: {
      ref: 'BCCI / ICC Standard T20 Playing Conditions - Clauses 12, 16 & 21',
      tiebreaker: 'Super Over (1 over per side). If tied, subsequent Super Over until winner is determined.',
      actions: ['Umpire consults square leg umpire and official match scorer.', 'Confirm ball count and over limits before resumption.', 'Signal decision clearly to players and scorer panel.'],
      tip: 'Calculate revised target using DLS / Run Rate method prior to start of rain-shortened innings.'
    },
    Basketball: {
      ref: 'FIBA Official Basketball Rules - Article 9 & 36',
      tiebreaker: '5-minute overtime period until winner is decided.',
      actions: ['Stop the game clock immediately.', 'Referee reviews scorer table scoresheet and foul count.', 'Administer free throws or baseline inbound as applicable.'],
      tip: 'Verify team foul counters before the start of each quarter to avoid bonus dispute.'
    },
    Volleyball: {
      ref: 'FIVB Official Volleyball Rules - Rules 6, 15 & 21',
      tiebreaker: 'Deciding 5th set played to 15 points with a minimum 2-point advantage.',
      actions: ['First referee whistles for substitution or dispute review.', 'Scorer confirms rotation order and jersey numbers.', 'Resume with service whistle.'],
      tip: 'Ensure line judge flags are clearly visible and rotations submitted before set start.'
    },
    Badminton: {
      ref: 'BWF Statutes Section 4.1 - Laws of Badminton',
      tiebreaker: 'Deuce at 20-all: first side to gain 2-point lead or first to reach 30 points wins.',
      actions: ['Umpire calls service let or fault clearly with hand signal.', 'Verify shuttlecock condition before re-serving.', 'Log score in official score sheet.'],
      tip: 'Check court boundary lines and net height (1.55m at posts) prior to game start.'
    },
    Kabaddi: {
      ref: 'AKFI Rules of Kabaddi - Clause 8 (Golden Raid / Tiebreaker)',
      tiebreaker: '5 Golden Raids each with baulk line as bonus line. No out/revival system.',
      actions: ['Referee halts raider and notes remaining raid clock (30s).', 'Umpire signals bonus / touch point with exact jersey numbers.', 'Both scorers tally points.'],
      tip: 'Confirm player registration cards and weight category before mat entry.'
    }
  };

  const defaultRule = sportRules[sport] || {
    ref: 'NEC Inter-Department Tournament General Sports Code - Rule IV',
    tiebreaker: 'Head-to-head result, followed by point difference, then fair-play ranking.',
    actions: ['Referee halts play and gathers team captains for official interpretation.', 'Match referee confers with Scorer Panel.', 'Ruling recorded in official match log sheet.'],
    tip: 'Review tournament rulebook with both teams during pre-match coin toss.'
  };

  return {
    ruling: `Under official ${sport || 'tournament'} regulations, the referee's on-field decision regarding ${category || 'the incident'} is binding. Players must respect the referee whistle, and any official protest must be lodged in writing to the Sports Committee within 30 minutes of match completion.`,
    ruleReference: defaultRule.ref,
    immediateAction: defaultRule.actions,
    tiebreakOrPenalty: defaultRule.tiebreaker,
    preventionTip: defaultRule.tip,
    isAiGenerated: false,
    engine: 'Smart Collegiate Rulebook Engine'
  };
};

/**
 * 3. AI Certificate Citation & Honors Generator
 */
exports.generateCitation = async ({ playerName, departmentName, sportName, tournamentName, awardCategory, highlights, style = 'inspiring' }) => {
  const systemInstruction = `You are a distinguished university orator and Sports Committee Chairman at NEC. Write elegant, stirring citations for academic sports awards and certificates. Return strictly valid JSON.`;

  const prompt = `
Write an award citation and honors commendation:
- Recipient: ${playerName || 'Distinguished Student Athlete'}
- Department: ${departmentName || 'Engineering & Technology'}
- Sport: ${sportName || 'Collegiate Tournament'}
- Tournament: ${tournamentName || 'NEC Sports Fest'}
- Award / Honor: ${awardCategory || 'Player of the Tournament'}
- Highlights / Achievements: ${highlights || 'Exceptional gameplay, stellar consistency, leadership, and exemplary sportsmanship'}
- Style: ${style} (inspiring, modern, or prestigious academic)

Return response strictly in VALID JSON format without backticks or markdown fences:
{
  "citationText": "A moving, beautifully crafted 3-4 sentence commendation suitable for printing on a formal Certificate of Merit or reading at the podium",
  "shortSummary": "1 sentence punchy summary for announcer or social media caption",
  "badges": ["3-4 key tags/qualities like 'Relentless Grit', 'Master Tactician', 'Unmatched Sportsmanship'"],
  "quote": "An inspiring sports quote tailored to this athlete's achievement"
}`;

  let aiOutput = await callOpenRouterAPI(prompt, systemInstruction);
  if (aiOutput) {
    try {
      const cleanJson = aiOutput.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();
      const parsed = JSON.parse(cleanJson);
      return { ...parsed, isAiGenerated: true, engine: `OpenRouter AI (${process.env.OPENROUTER_MODEL || 'gpt-4o-mini'})` };
    } catch (e) {
      console.warn('Failed to parse OpenRouter citation JSON, using smart citation engine');
    }
  }

  // --- Smart Intelligent Citation Engine ---
  const pName = playerName || 'The Student Athlete';
  const dept = departmentName || 'Department';
  const sport = sportName || 'Athletics';
  const award = awardCategory || 'Player of the Tournament';

  let citation = `In recognition of unmatched determination, extraordinary technical mastery, and unwavering leadership, National Engineering College is proud to confer the title of ${award.toUpperCase()} upon ${pName} from the ${dept}. Throughout the ${tournamentName || 'NEC Annual Sports Tournament'}, their commanding presence on the ${sport} arena showcased both competitive grit and the highest ideals of collegiate sportsmanship. May this honor stand as an enduring testament to their passion, teamwork, and athletic excellence.`;

  let short = `${pName} (${dept}) receives the ${award} for outstanding competitive distinction in ${sport}.`;
  let badges = ['Tactical Brilliance', 'Clutch Performer', 'Exemplary Sportsmanship', 'Department Pride'];
  let quote = '"Excellence is not a singular act, but a habit forged on the field through dedication and heart."';

  return {
    citationText: citation,
    shortSummary: short,
    badges,
    quote,
    isAiGenerated: false,
    engine: 'Smart Collegiate Citation Engine'
  };
};

/**
 * Check AI status
 */
exports.getStatus = () => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const hasKey = !!(apiKey && apiKey.trim().length > 10);
  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';
  return {
    configured: hasKey,
    mode: hasKey ? `OpenRouter AI (${model}) Online` : 'Smart Dynamic Heuristic Engine (Offline Active)',
    model,
    provider: 'OpenRouter.ai',
    features: [
      'AI Social Media & Announcement Studio',
      'AI Tournament Rulebook & Dispute Assistant',
      'AI Certificate Citation & Honors Generator',
      'AI Conversational Tournament Sports Bot'
    ]
  };
};

/**
 * 4. AI Conversational Sports Assistant
 */
exports.chatWithAI = async ({ message, history = [], liveContext = '' }) => {
  let dbContext = liveContext;
  if (!dbContext) {
    try {
      const Match = require('../models/Match');
      const DepartmentPoints = require('../models/DepartmentPoints');

      const [liveList, schedList, pointsList] = await Promise.all([
        Match.find({ status: 'live' }).populate('sport team1 team2').limit(5).lean(),
        Match.find({ status: 'scheduled' }).populate('sport team1 team2').sort('scheduledAt').limit(5).lean(),
        DepartmentPoints.find().populate('department').sort('-points').limit(5).lean()
      ]);

      const liveStr = (liveList || []).map(m => `${m.sport?.name || 'Match'}: ${m.team1?.name || 'Team 1'} (${m.score1 || 0}) vs ${m.team2?.name || 'Team 2'} (${m.score2 || 0})`).join('; ') || 'No live matches in progress right now';
      const schedStr = (schedList || []).map(m => `${m.sport?.name || 'Match'}: ${m.team1?.name || 'TBD'} vs ${m.team2?.name || 'TBD'}`).join('; ') || 'No upcoming fixtures scheduled';
      const pointsStr = (pointsList || []).map((p, i) => `${i + 1}. ${p.department?.name || 'Dept'} (${p.points || 0} pts)`).join(', ') || 'Standings being calculated';

      dbContext = `LIVE MATCHES: ${liveStr}\nUPCOMING FIXTURES: ${schedStr}\nLEADERBOARD / STANDINGS: ${pointsStr}`;
    } catch (err) {
      console.warn('Could not fetch DB context for chat:', err.message);
    }
  }

  const systemInstruction = `You are the official AI Sports Bot for National Engineering College (NEC) Sports Tournament.
You have real-time access to the college tournament database:
${dbContext}

Guidelines:
- Answer the user's question directly, engagingly, and concisely.
- If asked about live scores, upcoming matches, or standings, use the live tournament data provided above.
- You can also explain rules for any sport (Football, Cricket, Basketball, Volleyball, Badminton, Kabaddi, Chess, Table Tennis), give tactics, or offer team encouragement.
- Use emojis and clear markdown formatting (bolding, lists). Keep responses brief and friendly.`;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return {
      reply: "I am your Tournament Sports Assistant! I can help you with live scores, upcoming matches, rules, and standings.",
      isAiGenerated: false
    };
  }

  const model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

  try {
    const formattedHistory = (history || []).slice(-6).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: typeof msg.text === 'string' ? msg.text : 'Data summary'
    }));

    const payload = {
      model,
      messages: [
        { role: 'system', content: systemInstruction },
        ...formattedHistory,
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 500
    };

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:3000',
        'X-Title': 'NEC Sports AI Bot'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`OpenRouter Chat API returned ${response.status}:`, errText);
      return {
        reply: "I am currently running in local tournament mode. You can check live scores, fixtures, and standings using the quick buttons above!",
        isAiGenerated: false
      };
    }

    const data = await response.json();
    const candidate = data.choices?.[0]?.message?.content;
    return {
      reply: candidate || "How can I assist you with the tournament today?",
      isAiGenerated: true,
      engine: `OpenRouter AI (${model})`
    };
  } catch (err) {
    console.error('Chat AI error:', err.message);
    return {
      reply: "I am ready to help you with NEC sports scores, fixtures, rules, and department standings!",
      isAiGenerated: false
    };
  }
};

