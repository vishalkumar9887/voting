const express = require('express');
const { createUser, getUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const { validate, validateQuery } = require('../middleware/validation');
const { createUserSchema, updateUserSchema, paginationSchema } = require('../validation/schemas');

const router = express.Router();

// POST /api/users - Create a new user
router.post('/', validate(createUserSchema), createUser);

// GET /api/users - Get all users with pagination
router.get('/', validateQuery(paginationSchema), getUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', getUserById);

// PUT /api/users/:id - Update user
router.put('/:id', validate(updateUserSchema), updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', deleteUser);

module.exports = router;
