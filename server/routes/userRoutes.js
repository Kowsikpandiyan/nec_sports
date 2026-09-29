const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');

// All user routes are restricted to superAdmins
router.use(protect);
router.use(authorizeRoles('superAdmin'));

router.route('/')
  .get(userController.list)
  .post(userController.create);

router.route('/:id')
  .get(userController.detail)
  .put(userController.update)
  .delete(userController.delete);

module.exports = router;
