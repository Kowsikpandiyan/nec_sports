const express = require('express');
const router = express.Router();
const {
  predictMatch,
  simulateMatch,
  getModelInfo
} = require('../controllers/aiPredictionController');

router.get('/info', getModelInfo);
router.get('/match/:matchId', predictMatch);
router.post('/simulate', simulateMatch);

module.exports = router;
