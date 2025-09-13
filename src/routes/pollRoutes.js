const express = require('express');
const { createPoll, getPolls, getPollById, updatePoll, deletePoll, getPollResults } = require('../controllers/pollController');
const { validate, validateQuery } = require('../middleware/validation');
const { createPollSchema, updatePollSchema, paginationSchema } = require('../validation/schemas');

const router = express.Router();

// POST /api/polls - Create a new poll
router.post('/', validate(createPollSchema), createPoll);

// GET /api/polls - Get all polls with pagination
router.get('/', validateQuery(paginationSchema), getPolls);

// GET /api/polls/:id - Get poll by ID
router.get('/:id', getPollById);

// GET /api/polls/:id/results - Get poll results
router.get('/:id/results', getPollResults);

// PUT /api/polls/:id - Update poll
router.put('/:id', validate(updatePollSchema), updatePoll);

// DELETE /api/polls/:id - Delete poll
router.delete('/:id', deletePoll);

module.exports = router;
