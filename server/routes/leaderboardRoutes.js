const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');

// Department rankings are public
router.get('/departments', leaderboardController.getDepartmentPoints);

module.exports = router;
