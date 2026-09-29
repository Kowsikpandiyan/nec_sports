const express = require('express');
const router = express.Router();
const scoreController = require('../controllers/scoreController');
const { protect } = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');

// Public reads
router.get('/', scoreController.list);
router.get('/:id', scoreController.detail); // by match ID

// Administrative score updates
router.post('/', protect, authorizeRoles('scorer', 'superAdmin'), scoreController.create);
router.put('/:id', protect, authorizeRoles('scorer', 'superAdmin'), scoreController.update);
router.delete('/:id', protect, authorizeRoles('superAdmin'), scoreController.delete);

module.exports = router;
