const express = require('express');
const router = express.Router();
const sportController = require('../controllers/sportController');
const { protect } = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');

// Public read
router.get('/', sportController.list);
router.get('/:id', sportController.detail);

// Admin-only updates
router.post('/', protect, authorizeRoles('superAdmin'), sportController.create);
router.put('/:id', protect, authorizeRoles('superAdmin'), sportController.update);
router.delete('/:id', protect, authorizeRoles('superAdmin'), sportController.delete);

module.exports = router;
