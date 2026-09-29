const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { protect } = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');

// Public endpoints
router.get('/live', matchController.getLiveMatches);
router.get('/upcoming', matchController.getUpcomingMatches);
router.get('/', matchController.list);
router.get('/:id', matchController.detail);

// Protected scheduling & assignment (Admins only)
router.post('/', protect, authorizeRoles('superAdmin'), matchController.create);
router.put('/:id', protect, authorizeRoles('superAdmin'), matchController.update);
router.delete('/:id', protect, authorizeRoles('superAdmin'), matchController.delete);

// Scorekeepers pathways (accessible to scorers and admins only)
router.patch('/:id/score', protect, authorizeRoles('scorer', 'superAdmin'), matchController.updateScore);
router.patch('/:id/status', protect, authorizeRoles('scorer', 'superAdmin'), matchController.updateStatus);

module.exports = router;
