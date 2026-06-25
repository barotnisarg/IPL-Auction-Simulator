// server/routes/teamRoutes.js

const express = require('express');

const teamController = require('../controllers/teamController');
const authMiddleware = require('../middlewares/authMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');

const router = express.Router();

router.use(authMiddleware);

router.get('/room/:roomId', asyncHandler(teamController.getTeamsByRoom));
router.get('/:teamId', asyncHandler(teamController.getTeam));

module.exports = router;