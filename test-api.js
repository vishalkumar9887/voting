const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test data
let testUserId = null;
let testPollId = null;
let testPollOptionId = null;

async function testAPI() {
  console.log('🧪 Starting API Tests...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // Test 2: Create User
    console.log('2. Testing User Creation...');
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };
    const userResponse = await axios.post(`${BASE_URL}/api/users`, userData);
    testUserId = userResponse.data.user.id;
    console.log('✅ User Created:', userResponse.data.user);
    console.log('');

    // Test 3: Get Users
    console.log('3. Testing Get Users...');
    const usersResponse = await axios.get(`${BASE_URL}/api/users`);
    console.log('✅ Users Retrieved:', usersResponse.data.users.length, 'users');
    console.log('');

    // Test 4: Create Poll
    console.log('4. Testing Poll Creation...');
    const pollData = {
      question: 'What is your favorite color?',
      options: ['Red', 'Blue', 'Green', 'Yellow'],
      isPublished: true,
      creatorId: testUserId
    };
    const pollResponse = await axios.post(`${BASE_URL}/api/polls`, pollData);
    testPollId = pollResponse.data.poll.id;
    testPollOptionId = pollResponse.data.poll.pollOptions[0].id;
    console.log('✅ Poll Created:', pollResponse.data.poll.question);
    console.log('   Poll ID:', testPollId);
    console.log('   Options:', pollResponse.data.poll.pollOptions.length);
    console.log('');

    // Test 5: Get Polls
    console.log('5. Testing Get Polls...');
    const pollsResponse = await axios.get(`${BASE_URL}/api/polls`);
    console.log('✅ Polls Retrieved:', pollsResponse.data.polls.length, 'polls');
    console.log('');

    // Test 6: Get Poll by ID
    console.log('6. Testing Get Poll by ID...');
    const pollByIdResponse = await axios.get(`${BASE_URL}/api/polls/${testPollId}`);
    console.log('✅ Poll Retrieved:', pollByIdResponse.data.poll.question);
    console.log('');

    // Test 7: Get Poll Results
    console.log('7. Testing Get Poll Results...');
    const pollResultsResponse = await axios.get(`${BASE_URL}/api/polls/${testPollId}/results`);
    console.log('✅ Poll Results:', pollResultsResponse.data.results.length, 'options');
    console.log('   Total Votes:', pollResultsResponse.data.totalVotes);
    console.log('');

    // Test 8: Submit Vote
    console.log('8. Testing Vote Submission...');
    const voteData = {
      pollOptionId: testPollOptionId,
      userId: testUserId
    };
    const voteResponse = await axios.post(`${BASE_URL}/api/votes`, voteData);
    console.log('✅ Vote Submitted:', voteResponse.data.vote.pollOption.text);
    console.log('');

    // Test 9: Get Poll Results After Vote
    console.log('9. Testing Poll Results After Vote...');
    const pollResultsAfterVote = await axios.get(`${BASE_URL}/api/polls/${testPollId}/results`);
    console.log('✅ Poll Results After Vote:');
    pollResultsAfterVote.data.results.forEach(option => {
      console.log(`   ${option.text}: ${option.voteCount} votes`);
    });
    console.log('   Total Votes:', pollResultsAfterVote.data.totalVotes);
    console.log('');

    // Test 10: Get User Votes
    console.log('10. Testing Get User Votes...');
    const userVotesResponse = await axios.get(`${BASE_URL}/api/votes/user/${testUserId}`);
    console.log('✅ User Votes:', userVotesResponse.data.votes.length, 'votes');
    console.log('');

    // Test 11: Get Poll Votes
    console.log('11. Testing Get Poll Votes...');
    const pollVotesResponse = await axios.get(`${BASE_URL}/api/votes/poll/${testPollId}`);
    console.log('✅ Poll Votes:', pollVotesResponse.data.votes.length, 'votes');
    console.log('');

    console.log('🎉 All API tests passed successfully!');
    console.log('\n📊 Test Summary:');
    console.log(`- Created User ID: ${testUserId}`);
    console.log(`- Created Poll ID: ${testPollId}`);
    console.log(`- Poll Option ID: ${testPollOptionId}`);
    console.log('\n🔌 WebSocket Test:');
    console.log('Open test-client.html in your browser to test WebSocket functionality');
    console.log(`Use Poll ID: ${testPollId}`);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAPI();
}

module.exports = testAPI;
