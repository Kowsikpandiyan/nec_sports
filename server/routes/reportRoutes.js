const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');

router.use(protect);

// Tournament reports (superAdmin only)
router.get('/tournament/:id/pdf', authorizeRoles('superAdmin'), reportController.getTournamentPDF);
router.get('/tournament/:id/excel', authorizeRoles('superAdmin'), reportController.getTournamentExcel);

// Department Rankings reports (superAdmin and coordinators)
router.get('/departments/pdf', authorizeRoles('superAdmin', 'coordinator'), reportController.getDepartmentRankingsPDF);

module.exports = router;
