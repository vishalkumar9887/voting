const prisma = require('../database/prismaClient');
const { broadcastPollUpdate } = require('../websocket/websocketHandler');

// Submit a vote
const submitVote = async (req, res) => {
  try {
    const { pollOptionId } = req.body;
    const userId = req.body.userId; // In a real app, this would come from auth middleware

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user found with the provided user ID'
      });
    }

    // Validate poll option exists and get poll info
    const pollOption = await prisma.pollOption.findUnique({
      where: { id: pollOptionId },
      include: {
        poll: {
          select: {
            id: true,
            question: true,
            isPublished: true
          }
        }
      }
    });

    if (!pollOption) {
      return res.status(404).json({
        error: 'Poll option not found',
        message: 'No poll option found with the provided ID'
      });
    }

    // Check if poll is published
    if (!pollOption.poll.isPublished) {
      return res.status(400).json({
        error: 'Poll not published',
        message: 'Cannot vote on unpublished polls'
      });
    }

    // Check if user has already voted on this poll
    const existingVote = await prisma.vote.findFirst({
      where: {
        userId,
        pollOption: {
          pollId: pollOption.poll.id
        }
      },
      include: {
        pollOption: {
          select: {
            id: true,
            text: true
          }
        }
      }
    });

    if (existingVote) {
      return res.status(409).json({
        error: 'Already voted',
        message: 'User has already voted on this poll',
        previousVote: {
          id: existingVote.id,
          pollOption: existingVote.pollOption,
          createdAt: existingVote.createdAt
        }
      });
    }

    // Create vote
    const vote = await prisma.vote.create({
      data: {
        userId,
        pollOptionId
      },
      include: {
        pollOption: {
          select: {
            id: true,
            text: true,
            poll: {
              select: {
                id: true,
                question: true
              }
            }
          }
        }
      }
    });

    // Get updated poll results for broadcasting
    const pollResults = await getPollResults(pollOption.poll.id);

    // Broadcast poll update to all connected clients
    broadcastPollUpdate(pollOption.poll.id, pollResults);

    res.status(201).json({
      message: 'Vote submitted successfully',
      vote: {
        id: vote.id,
        pollOption: vote.pollOption,
        createdAt: vote.createdAt
      },
      pollResults
    });
  } catch (error) {
    console.error('Error submitting vote:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to submit vote'
    });
  }
};

// Get votes for a specific poll
const getPollVotes = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { page, limit, sortBy, sortOrder } = req.query;
    const skip = (page - 1) * limit;

    // Validate poll exists
    const poll = await prisma.poll.findUnique({
      where: { id: pollId }
    });

    if (!poll) {
      return res.status(404).json({
        error: 'Poll not found',
        message: 'No poll found with the provided ID'
      });
    }

    const [votes, total] = await Promise.all([
      prisma.vote.findMany({
        where: {
          pollOption: {
            pollId
          }
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          pollOption: {
            select: {
              id: true,
              text: true
            }
          }
        }
      }),
      prisma.vote.count({
        where: {
          pollOption: {
            pollId
          }
        }
      })
    ]);

    res.json({
      votes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching poll votes:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch poll votes'
    });
  }
};

// Get user's votes
const getUserVotes = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page, limit, sortBy, sortOrder } = req.query;
    const skip = (page - 1) * limit;

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'No user found with the provided ID'
      });
    }

    const [votes, total] = await Promise.all([
      prisma.vote.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          pollOption: {
            select: {
              id: true,
              text: true,
              poll: {
                select: {
                  id: true,
                  question: true,
                  isPublished: true
                }
              }
            }
          }
        }
      }),
      prisma.vote.count({
        where: { userId }
      })
    ]);

    res.json({
      votes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user votes:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch user votes'
    });
  }
};

// Delete a vote
const deleteVote = async (req, res) => {
  try {
    const { voteId } = req.params;

    // Check if vote exists and get poll info
    const vote = await prisma.vote.findUnique({
      where: { id: voteId },
      include: {
        pollOption: {
          select: {
            pollId: true
          }
        }
      }
    });

    if (!vote) {
      return res.status(404).json({
        error: 'Vote not found',
        message: 'No vote found with the provided ID'
      });
    }

    await prisma.vote.delete({
      where: { id: voteId }
    });

    // Get updated poll results for broadcasting
    const pollResults = await getPollResults(vote.pollOption.pollId);

    // Broadcast poll update to all connected clients
    broadcastPollUpdate(vote.pollOption.pollId, pollResults);

    res.json({
      message: 'Vote deleted successfully',
      pollResults
    });
  } catch (error) {
    console.error('Error deleting vote:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete vote'
    });
  }
};

// Helper function to get poll results
const getPollResults = async (pollId) => {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
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

  if (!poll) return null;

  const results = poll.pollOptions.map(option => ({
    id: option.id,
    text: option.text,
    voteCount: option._count.votes
  }));

  const totalVotes = results.reduce((sum, option) => sum + option.voteCount, 0);

  return {
    poll: {
      id: poll.id,
      question: poll.question,
      isPublished: poll.isPublished,
      createdAt: poll.createdAt
    },
    results,
    totalVotes
  };
};

module.exports = {
  submitVote,
  getPollVotes,
  getUserVotes,
  deleteVote,
  getPollResults
};
