const express = require('express');
const {
    getBoards,
    getBoard,
    createBoard,
    updateBoard,
    deleteBoard
} = require('../controllers/board.controller');

const router = express.Router();

const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createBoardSchema, updateBoardSchema } = require('../validations/board.validation');

// router.use(protect); // Protect all routes

router
    .route('/')
    .get(protect, getBoards)
    .post(protect, validate(createBoardSchema), createBoard);

router
    .route('/:id')
    .get(getBoard)
    .put(validate(updateBoardSchema), updateBoard)
    .delete(protect, deleteBoard);

module.exports = router;
