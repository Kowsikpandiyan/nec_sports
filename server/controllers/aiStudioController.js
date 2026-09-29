const geminiAiService = require('../services/geminiAiService');

/**
 * POST /api/v1/ai/announcement
 * Generate multi-channel social media and college announcement
 */
exports.generateAnnouncement = async (req, res, next) => {
  try {
    const { type, tone, tournamentName, sportName, matchDetails, customContext } = req.body;
    const result = await geminiAiService.generateAnnouncement({
      type,
      tone,
      tournamentName,
      sportName,
      matchDetails,
      customContext
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/ai/dispute
 * Resolve a referee dispute or query rules for a sport
 */
exports.resolveDispute = async (req, res, next) => {
  try {
    const { sport, query, category } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Dispute query description is required' });
    }
    const result = await geminiAiService.resolveDispute({ sport, query, category });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/ai/citation
 * Generate honors commendation and certificate citation
 */
exports.generateCitation = async (req, res, next) => {
  try {
    const { playerName, departmentName, sportName, tournamentName, awardCategory, highlights, style } = req.body;
    const result = await geminiAiService.generateCitation({
      playerName,
      departmentName,
      sportName,
      tournamentName,
      awardCategory,
      highlights,
      style
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/ai/status
 * Check configuration of Gemini AI
 */
exports.getAIStatus = async (req, res, next) => {
  try {
    const status = geminiAiService.getStatus();
    return res.status(200).json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/ai/chat
 * Conversational AI chatbot for sports tournament
 */
exports.chat = async (req, res, next) => {
  try {
    const { message, history, context } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    const result = await geminiAiService.chatWithAI({ message, history, liveContext: context });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

