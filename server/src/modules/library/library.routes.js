const express = require('express');
const {
    getLibraryItems,
    getPublicLibraryItems,
    createLibraryItem,
    deleteLibraryItem,
    updateLibraryItem
} = require('./library.controller');

const router = express.Router();
const { protect, getPermissiveUser } = require('../../middleware/auth');

router.get('/public', getPermissiveUser, getPublicLibraryItems);
router.use(protect);

router
    .route('/')
    .get(getLibraryItems)
    .post(createLibraryItem);

router
    .route('/:id')
    .patch(updateLibraryItem)
    .delete(deleteLibraryItem);

module.exports = router;
