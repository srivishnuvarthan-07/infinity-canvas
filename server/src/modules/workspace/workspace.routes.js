const express = require('express');
const {
    getWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    addMember,
    removeMember
} = require('./workspace.controller');

// Include other resource routers
const boardRouter = require('../board/board.routes');

const router = express.Router();

const { protect } = require('../../middleware/auth');

// Re-route into other resource routers
// /api/workspaces/:workspaceId/boards
router.use('/:workspaceId/boards', boardRouter);

router.use(protect); // All workspace routes require authentication

router
    .route('/')
    .get(getWorkspaces)
    .post(createWorkspace);

router
    .route('/:id')
    .put(updateWorkspace)
    .delete(deleteWorkspace);

router
    .route('/:id/members')
    .post(addMember);

router
    .route('/:id/members/:userId')
    .delete(removeMember);

module.exports = router;
