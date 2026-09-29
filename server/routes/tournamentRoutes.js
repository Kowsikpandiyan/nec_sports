const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');
const { protect } = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const upload = require('../middleware/upload');

// Public endpoints
router.get('/', tournamentController.list);
router.get('/:id', tournamentController.detail);
router.get('/:id/bracket', tournamentController.getBracket);
router.get('/:id/points-table', tournamentController.getPointsTable);

// Administrative pathways (superAdmin only)
router.post('/', protect, authorizeRoles('superAdmin'), upload.single('banner'), tournamentController.create);
router.put('/:id', protect, authorizeRoles('superAdmin'), upload.single('banner'), tournamentController.update);
router.delete('/:id', protect, authorizeRoles('superAdmin'), tournamentController.delete);

// Generate matches & fixtures
router.post('/:id/generate-fixtures', protect, authorizeRoles('superAdmin'), tournamentController.generateFixtures);

module.exports = router;
