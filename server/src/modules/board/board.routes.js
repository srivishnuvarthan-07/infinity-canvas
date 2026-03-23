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
    removeBoardMember,
    deleteAllBoards,
    exportBoards
} = require('./board.controller');

const router = express.Router({ mergeParams: true });

const { protect, getPermissiveUser } = require('../../middleware/auth');

// Health check for this router
router.get('/ping', (req, res) => res.json({ status: 'board-router-ok' }));

// IMPORTANT: Define specific routes BEFORE parameterized routes
router.get('/export', protect, exportBoards);

router
    .route('/')
    .get(protect, getBoards)
    .post(protect, createBoard)
    .delete(protect, deleteAllBoards);

router
    .route('/:id')
    .get(getPermissiveUser, getBoard)
    .put(getPermissiveUser, updateBoard)
    .delete(protect, deleteBoard);

router
    .route('/:id/data')
    .get(getPermissiveUser, getBoardData)
    .put(getPermissiveUser, updateBoardData);

router.post('/:id/members', protect, addBoardMember);
router.delete('/:id/members/:userId', protect, removeBoardMember);

module.exports = router;
