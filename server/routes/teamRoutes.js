const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { protect } = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const upload = require('../middleware/upload');

router.use(protect);

// Registration & Management (Admins & Coordinators)
router.route('/')
  .get(authorizeRoles('superAdmin', 'coordinator'), teamController.list)
  .post(authorizeRoles('superAdmin', 'coordinator'), upload.single('photo'), teamController.create);

router.route('/:id')
  .get(authorizeRoles('superAdmin', 'coordinator'), teamController.detail)
  .put(authorizeRoles('superAdmin', 'coordinator'), upload.single('photo'), teamController.update)
  .delete(authorizeRoles('superAdmin'), teamController.delete);

// Approve registration (Admins only)
router.post('/:id/approve', authorizeRoles('superAdmin'), teamController.approve);

module.exports = router;
