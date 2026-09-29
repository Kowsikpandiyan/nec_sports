const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/collegeController');
const { protect } = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const upload = require('../middleware/upload');

// Public read endpoints
router.get('/', collegeController.list);
router.get('/:id', collegeController.detail);

// Protected administrative writes
router.post('/', protect, authorizeRoles('superAdmin'), upload.single('logo'), collegeController.create);
router.put('/:id', protect, authorizeRoles('superAdmin'), upload.single('logo'), collegeController.update);
router.delete('/:id', protect, authorizeRoles('superAdmin'), collegeController.delete);

module.exports = router;
