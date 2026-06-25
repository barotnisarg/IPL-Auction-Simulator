// server/routes/roomRoutes.js

const express = require('express');

const roomController = require('../controllers/roomController');
const authMiddleware = require('../middlewares/authMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');

const router = express.Router();

router.use(authMiddleware);

router.post('/', asyncHandler(roomController.createRoom));
router.post('/join', asyncHandler(roomController.joinRoom));
router.get('/:roomCode', asyncHandler(roomController.getRoom));

module.exports = router;