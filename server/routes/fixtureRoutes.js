const express = require('express');
const router = express.Router();
const fixtureController = require('../controllers/fixtureController');
const { protect } = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');

// Public reads
router.get('/', fixtureController.list);
router.get('/:id', fixtureController.detail);

// Admin-only updates
router.post('/', protect, authorizeRoles('superAdmin'), fixtureController.create);
router.put('/:id', protect, authorizeRoles('superAdmin'), fixtureController.update);
router.delete('/:id', protect, authorizeRoles('superAdmin'), fixtureController.delete);

module.exports = router;
