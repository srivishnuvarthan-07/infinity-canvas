const express = require('express');
const {
    getBoards,
    createBoard,
    getBoard,
    updateBoard,
    deleteBoard,
    getBoardData,
    updateBoardData,
    addBoardMember,
    removeBoardMember
} = require('./board.controller');

const router = express.Router({ mergeParams: true }); // Enable params from parent router

const { protect, getPermissiveUser } = require('../../middleware/auth');

// router.use(protect); // Removed global protect to allow guest access

// Routes for /api/boards (and /api/workspaces/:workspaceId/boards)
router
    .route('/')
    .get(protect, getBoards)
    .post(protect, createBoard);

router
    .route('/:id')
    .get(getPermissiveUser, getBoard)
    .put(getPermissiveUser, updateBoard)
    .delete(protect, deleteBoard);

// Board Data Routes
router
    .route('/:id/data')
    .get(getPermissiveUser, getBoardData)
    .put(getPermissiveUser, updateBoardData);

// Member Management
router.post('/:id/members', protect, addBoardMember);
router.delete('/:id/members/:userId', protect, removeBoardMember);

module.exports = router;
