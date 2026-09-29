const express = require('express');
const router = express.Router();
const venueController = require('../controllers/venueController');
const { protect } = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');

// Public reads
router.get('/', venueController.list);
router.get('/:id', venueController.detail);

// Admin-only updates
router.post('/', protect, authorizeRoles('superAdmin'), venueController.create);
router.put('/:id', protect, authorizeRoles('superAdmin'), venueController.update);
router.delete('/:id', protect, authorizeRoles('superAdmin'), venueController.delete);

module.exports = router;
