const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const upload = require('../middleware/upload');

// Public read settings
router.get('/:collegeId', settingsController.getSettings);

// Write configurations (superAdmin only)
router.put('/:collegeId', protect, authorizeRoles('superAdmin'), upload.single('logo'), settingsController.update);

module.exports = router;
