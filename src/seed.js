const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' }); // ya './.env' agar tumhari file .env hai


const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    // Clear existing data
    await prisma.vote.deleteMany();
    await prisma.pollOption.deleteMany();
    await prisma.poll.deleteMany();
    await prisma.user.deleteMany();

    console.log('🗑️  Cleared existing data');

    // Create users
    const users = await Promise.all([
      prisma.user.create({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          passwordHash: await bcrypt.hash('password123', 12)
        }
      }),
      prisma.user.create({
        data: {
          name: 'Jane Smith',
          email: 'jane@example.com',
          passwordHash: await bcrypt.hash('password123', 12)
        }
      }),
      prisma.user.create({
        data: {
          name: 'Bob Johnson',
          email: 'bob@example.com',
          passwordHash: await bcrypt.hash('password123', 12)
        }
      })
    ]);

    console.log('👥 Created users');

    // Create polls
    const polls = await Promise.all([
      prisma.poll.create({
        data: {
          question: 'What is your favorite programming language?',
          isPublished: true,
          creatorId: users[0].id,
          pollOptions: {
            create: [
              { text: 'JavaScript' },
              { text: 'Python' },
              { text: 'Java' },
              { text: 'Go' },
              { text: 'Rust' }
            ]
          }
        },
        include: {
          pollOptions: true
        }
      }),
      prisma.poll.create({
        data: {
          question: 'Which framework do you prefer for web development?',
          isPublished: true,
          creatorId: users[1].id,
          pollOptions: {
            create: [
              { text: 'React' },
              { text: 'Vue.js' },
              { text: 'Angular' },
              { text: 'Svelte' }
            ]
          }
        },
        include: {
          pollOptions: true
        }
      }),
      prisma.poll.create({
        data: {
          question: 'What is your preferred database?',
          isPublished: false, // Unpublished poll
          creatorId: users[2].id,
          pollOptions: {
            create: [
              { text: 'PostgreSQL' },
              { text: 'MySQL' },
              { text: 'MongoDB' },
              { text: 'Redis' }
            ]
          }
        },
        include: {
          pollOptions: true
        }
      })
    ]);

    console.log('📊 Created polls');

    // Create some votes
    const votes = await Promise.all([
      // User 1 votes on poll 1
      prisma.vote.create({
        data: {
          userId: users[0].id,
          pollOptionId: polls[0].pollOptions[0].id // JavaScript
        }
      }),
      prisma.vote.create({
        data: {
          userId: users[0].id,
          pollOptionId: polls[1].pollOptions[0].id // React
        }
      }),
      // User 2 votes on poll 1
      prisma.vote.create({
        data: {
          userId: users[1].id,
          pollOptionId: polls[0].pollOptions[1].id // Python
        }
      }),
      prisma.vote.create({
        data: {
          userId: users[1].id,
          pollOptionId: polls[1].pollOptions[1].id // Vue.js
        }
      }),
      // User 3 votes on poll 1
      prisma.vote.create({
        data: {
          userId: users[2].id,
          pollOptionId: polls[0].pollOptions[2].id // Java
        }
      }),
      prisma.vote.create({
        data: {
          userId: users[2].id,
          pollOptionId: polls[1].pollOptions[2].id // Angular
        }
      })
    ]);

    console.log('🗳️  Created votes');

    // Display summary
    console.log('\n📈 Seed Summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Polls: ${polls.length}`);
    console.log(`- Votes: ${votes.length}`);
    
    console.log('\n🔗 Test Data:');
    console.log(`- Poll 1 ID: ${polls[0].id}`);
    console.log(`- Poll 2 ID: ${polls[1].id}`);
    console.log(`- User 1 ID: ${users[0].id}`);
    console.log(`- User 2 ID: ${users[1].id}`);
    console.log(`- User 3 ID: ${users[2].id}`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n🚀 You can now start the server with: npm run dev');
    console.log('📊 View polls at: http://localhost:3000/api/polls');
    console.log('👥 View users at: http://localhost:3000/api/users');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed();
}

module.exports = seed;
