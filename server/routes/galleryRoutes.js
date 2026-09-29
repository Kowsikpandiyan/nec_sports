const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const { protect } = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const upload = require('../middleware/upload');

// Public view
router.get('/', galleryController.list);

// Protected writes (admins and coordinators only)
router.post('/', protect, authorizeRoles('superAdmin', 'coordinator'), upload.single('file'), galleryController.create);
router.delete('/:id', protect, authorizeRoles('superAdmin', 'coordinator'), galleryController.delete);

module.exports = router;
