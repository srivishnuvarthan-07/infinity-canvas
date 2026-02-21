const express = require('express');
const {
    getLibraryItems,
    createLibraryItem,
    deleteLibraryItem
} = require('./library.controller');

const router = express.Router();

const { protect } = require('../../middleware/auth');

router.use(protect);

router
    .route('/')
    .get(getLibraryItems)
    .post(createLibraryItem);

router
    .route('/:id')
    .delete(deleteLibraryItem);

module.exports = router;
