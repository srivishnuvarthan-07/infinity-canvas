const express = require('express');
const {
    getLibraryItems,
    createLibraryItem,
    deleteLibraryItem
} = require('../controllers/library.controller');

const router = express.Router();

const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createLibraryItemSchema } = require('../validations/library.validation');

router.use(protect);

router
    .route('/')
    .get(getLibraryItems)
    .post(validate(createLibraryItemSchema), createLibraryItem);

router
    .route('/:id')
    .delete(deleteLibraryItem);

module.exports = router;
