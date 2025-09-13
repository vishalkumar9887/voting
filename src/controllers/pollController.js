const prisma = require('../database/prismaClient');

// Create a new poll
const createPoll = async (req, res) => {
  try {
    const { question, options, isPublished } = req.body;
    const creatorId = req.body.creatorId; // In a real app, this would come from auth middleware

    // Validate creator exists
    const creator = await prisma.user.findUnique({
      where: { id: creatorId }
    });

    if (!creator) {
      return res.status(404).json({
        error: 'Creator not found',
        message: 'No user found with the provided creator ID'
      });
    }

    // Create poll with options in a transaction
    const poll = await prisma.$transaction(async (tx) => {
      const newPoll = await tx.poll.create({
        data: {
          question,
          isPublished: isPublished || false,
          creatorId
        }
      });

      // Create poll options
      const pollOptions = await Promise.all(
        options.map(optionText =>
          tx.pollOption.create({
            data: {
              text: optionText,
              pollId: newPoll.id
            }
          })
        )
      );

      return {
        ...newPoll,
        pollOptions
      };
    });

    res.status(201).json({
      message: 'Poll created successfully',
      poll
    });
  } catch (error) {
    console.error('Error creating poll:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create poll'
    });
  }
};

// Get all polls with pagination
const getPolls = async (req, res) => {
  try {
    const { page, limit, sortBy, sortOrder } = req.query;
    const skip = (page - 1) * limit;

    const [polls, total] = await Promise.all([
      prisma.poll.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          pollOptions: {
            include: {
              _count: {
                select: {
                  votes: true
                }
              }
            }
          },
          _count: {
            select: {
              pollOptions: true
            }
          }
        }
      }),
      prisma.poll.count()
    ]);

    res.json({
      polls,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch polls'
    });
  }
};

// Get poll by ID
const getPollById = async (req, res) => {
  try {
    const { id } = req.params;

    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        pollOptions: {
          include: {
            _count: {
              select: {
                votes: true
              }
            }
          }
        },
        _count: {
          select: {
            pollOptions: true
          }
        }
      }
    });

    if (!poll) {
      return res.status(404).json({
        error: 'Poll not found',
        message: 'No poll found with the provided ID'
      });
    }

    res.json({ poll });
  } catch (error) {
    console.error('Error fetching poll:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch poll'
    });
  }
};

// Update poll
const updatePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, isPublished } = req.body;

    // Check if poll exists
    const existingPoll = await prisma.poll.findUnique({
      where: { id }
    });

    if (!existingPoll) {
      return res.status(404).json({
        error: 'Poll not found',
        message: 'No poll found with the provided ID'
      });
    }

    const updatedPoll = await prisma.poll.update({
      where: { id },
      data: {
        ...(question && { question }),
        ...(isPublished !== undefined && { isPublished })
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        pollOptions: {
          include: {
            _count: {
              select: {
                votes: true
              }
            }
          }
        }
      }
    });

    res.json({
      message: 'Poll updated successfully',
      poll: updatedPoll
    });
  } catch (error) {
    console.error('Error updating poll:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update poll'
    });
  }
};

// Delete poll
const deletePoll = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if poll exists
    const existingPoll = await prisma.poll.findUnique({
      where: { id }
    });

    if (!existingPoll) {
      return res.status(404).json({
        error: 'Poll not found',
        message: 'No poll found with the provided ID'
      });
    }

    await prisma.poll.delete({
      where: { id }
    });

    res.json({
      message: 'Poll deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting poll:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete poll'
    });
  }
};

// Get poll results (vote counts)
const getPollResults = async (req, res) => {
  try {
    const { id } = req.params;

    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        pollOptions: {
          include: {
            _count: {
              select: {
                votes: true
              }
            }
          }
        }
      }
    });

    if (!poll) {
      return res.status(404).json({
        error: 'Poll not found',
        message: 'No poll found with the provided ID'
      });
    }

    const results = poll.pollOptions.map(option => ({
      id: option.id,
      text: option.text,
      voteCount: option._count.votes
    }));

    const totalVotes = results.reduce((sum, option) => sum + option.voteCount, 0);

    res.json({
      poll: {
        id: poll.id,
        question: poll.question,
        isPublished: poll.isPublished,
        createdAt: poll.createdAt
      },
      results,
      totalVotes
    });
  } catch (error) {
    console.error('Error fetching poll results:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch poll results'
    });
  }
};

module.exports = {
  createPoll,
  getPolls,
  getPollById,
  updatePoll,
  deletePoll,
  getPollResults
};
