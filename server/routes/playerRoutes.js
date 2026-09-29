const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');
const { protect } = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const upload = require('../middleware/upload');

// Protect all player roster pathways
router.use(protect);
router.use(authorizeRoles('superAdmin', 'coordinator'));

router.route('/')
  .get(playerController.list)
  .post(upload.single('photo'), playerController.create);

router.get('/department/:deptId', playerController.getByDepartment);

router.route('/:id')
  .get(playerController.detail)
  .put(upload.single('photo'), playerController.update)
  .delete(playerController.delete);

module.exports = router;
