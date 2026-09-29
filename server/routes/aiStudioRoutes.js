const express = require('express');
const router = express.Router();
const aiStudioController = require('../controllers/aiStudioController');

router.post('/announcement', aiStudioController.generateAnnouncement);
router.post('/dispute', aiStudioController.resolveDispute);
router.post('/citation', aiStudioController.generateCitation);
router.post('/chat', aiStudioController.chat);
router.get('/status', aiStudioController.getAIStatus);

module.exports = router;
