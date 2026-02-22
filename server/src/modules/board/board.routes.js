const express = require('express');
const {
    getBoards,
    createBoard,
    getBoard,
    updateBoard,
    deleteBoard,
    getBoardData,
    updateBoardData
} = require('./board.controller');

const router = express.Router({ mergeParams: true }); // Enable params from parent router

const { protect } = require('../../middleware/auth');

// router.use(protect); // Removed global protect to allow guest access

// Routes for /api/boards (and /api/workspaces/:workspaceId/boards)
router
    .route('/')
    .get(protect, getBoards)
    .post(protect, createBoard);

router
    .route('/:id')
    .get(getBoard)
    .put(updateBoard)
    .delete(protect, deleteBoard);

// Board Data Routes
router
    .route('/:id/data')
    .get(getBoardData)
    .put(updateBoardData);

module.exports = router;
