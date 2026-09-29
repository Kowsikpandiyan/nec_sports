const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { protect } = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const upload = require('../middleware/upload');

// Public read endpoints
router.get('/', departmentController.list);
router.get('/:id', departmentController.detail);

// Roster views (accessible to coordinators & admins)
router.get('/:id/players', protect, authorizeRoles('superAdmin', 'coordinator'), departmentController.getPlayers);
router.get('/:id/teams', protect, authorizeRoles('superAdmin', 'coordinator'), departmentController.getTeams);

// Write configurations (restricted)
router.post('/', protect, authorizeRoles('superAdmin'), upload.single('logo'), departmentController.create);
router.put('/:id', protect, authorizeRoles('superAdmin', 'coordinator'), upload.single('logo'), departmentController.update);
router.delete('/:id', protect, authorizeRoles('superAdmin'), departmentController.delete);

module.exports = router;
