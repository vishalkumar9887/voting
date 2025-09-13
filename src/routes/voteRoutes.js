const express = require('express');
const { submitVote, getPollVotes, getUserVotes, deleteVote } = require('../controllers/voteController');
const { validate, validateQuery } = require('../middleware/validation');
const { createVoteSchema, paginationSchema } = require('../validation/schemas');

const router = express.Router();

// POST /api/votes - Submit a vote
router.post('/', validate(createVoteSchema), submitVote);

// GET /api/votes/poll/:pollId - Get votes for a specific poll
router.get('/poll/:pollId', validateQuery(paginationSchema), getPollVotes);

// GET /api/votes/user/:userId - Get votes by a specific user
router.get('/user/:userId', validateQuery(paginationSchema), getUserVotes);

// DELETE /api/votes/:voteId - Delete a vote
router.delete('/:voteId', deleteVote);

module.exports = router;
