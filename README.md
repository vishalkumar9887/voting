# Real-Time Polling Application API

A robust backend service for a real-time polling application built with Node.js, Express, PostgreSQL, Prisma, and WebSockets. This application allows users to create polls, vote on them, and receive live updates through WebSocket connections.

## 🚀 Features

- **RESTful API** with full CRUD operations for Users, Polls, and Votes
- **Real-time Updates** via WebSocket connections for live poll results
- **PostgreSQL Database** with Prisma ORM for robust data management
- **Input Validation** using Joi for data integrity
- **Error Handling** with comprehensive error responses
- **Pagination** for efficient data retrieval
- **Security** with Helmet and CORS middleware

## 🛠️ Technologies Used

- **Backend Framework**: Node.js with Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Real-time Communication**: WebSockets (`ws` library)
- **Validation**: Joi
- **Security**: Helmet, CORS
- **Password Hashing**: bcryptjs

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd voting22

```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory (copy from `config.env`):

```bash
cp config.env .env
```

Update the `.env` file with your database credentials:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/polling_db?schema=public"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server
PORT=3000
NODE_ENV=development
```

### 4. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE polling_db;
```

Generate Prisma client and push schema to database:

```bash
npm run db:generate
npm run db:push
```

### 5. Start the Application

For development (with auto-restart):

```bash
npm run dev
```

For production:

```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## 📊 API Endpoints

### Health Check
- `GET /health` - Server health status

### Users
- `POST /api/users` - Create a new user
- `GET /api/users` - Get all users (with pagination)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Polls
- `POST /api/polls` - Create a new poll
- `GET /api/polls` - Get all polls (with pagination)
- `GET /api/polls/:id` - Get poll by ID
- `GET /api/polls/:id/results` - Get poll results
- `PUT /api/polls/:id` - Update poll
- `DELETE /api/polls/:id` - Delete poll

### Votes
- `POST /api/votes` - Submit a vote
- `GET /api/votes/poll/:pollId` - Get votes for a specific poll
- `GET /api/votes/user/:userId` - Get votes by a specific user
- `DELETE /api/votes/:voteId` - Delete a vote

## 🔌 WebSocket API

Connect to the WebSocket server at `ws://localhost:3000/ws`

### Message Types

#### Subscribe to Poll
```json
{
  "type": "subscribe_poll",
  "pollId": "poll_id_here"
}
```

#### Unsubscribe from Poll
```json
{
  "type": "unsubscribe_poll",
  "pollId": "poll_id_here"
}
```

#### Ping
```json
{
  "type": "ping"
}
```

### Server Messages

#### Poll Update
```json
{
  "type": "poll_update",
  "pollId": "poll_id_here",
  "data": {
    "poll": {
      "id": "poll_id",
      "question": "What is your favorite color?",
      "isPublished": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "results": [
      {
        "id": "option_id_1",
        "text": "Red",
        "voteCount": 5
      },
      {
        "id": "option_id_2",
        "text": "Blue",
        "voteCount": 3
      }
    ],
    "totalVotes": 8
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 📝 API Usage Examples

### Create a User
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Create a Poll
```bash
curl -X POST http://localhost:3000/api/polls \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is your favorite programming language?",
    "options": ["JavaScript", "Python", "Java", "Go"],
    "isPublished": true,
    "creatorId": "user_id_here"
  }'
```

### Submit a Vote
```bash
curl -X POST http://localhost:3000/api/votes \
  -H "Content-Type: application/json" \
  -d '{
    "pollOptionId": "option_id_here",
    "userId": "user_id_here"
  }'
```

## 🗄️ Database Schema

The application uses the following database schema:

### Users
- `id` (String, Primary Key)
- `name` (String)
- `email` (String, Unique)
- `passwordHash` (String)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)

### Polls
- `id` (String, Primary Key)
- `question` (String)
- `isPublished` (Boolean)
- `createdAt` (DateTime)
- `updatedAt` (DateTime)
- `creatorId` (String, Foreign Key to Users)

### Poll Options
- `id` (String, Primary Key)
- `text` (String)
- `pollId` (String, Foreign Key to Polls)

### Votes
- `id` (String, Primary Key)
- `userId` (String, Foreign Key to Users)
- `pollOptionId` (String, Foreign Key to Poll Options)
- `createdAt` (DateTime)

### Relationships
- **One-to-Many**: User → Polls (creator relationship)
- **One-to-Many**: Poll → PollOptions
- **Many-to-Many**: User ↔ PollOptions (through Votes)

## 🔧 Development

### Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed the database with sample data

### Project Structure

```
src/
├── controllers/          # Route controllers
│   ├── userController.js
│   ├── pollController.js
│   └── voteController.js
├── database/            # Database configuration
│   └── prismaClient.js
├── middleware/          # Custom middleware
│   └── validation.js
├── routes/              # API routes
│   ├── userRoutes.js
│   ├── pollRoutes.js
│   └── voteRoutes.js
├── validation/          # Validation schemas
│   └── schemas.js
├── websocket/           # WebSocket handlers
│   └── websocketHandler.js
└── server.js            # Main server file
```

## 🧪 Testing the Application

### 1. Test REST API
Use tools like Postman, curl, or any HTTP client to test the API endpoints.

### 2. Test WebSocket Connection
Use a WebSocket client or browser console:

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  console.log('Connected to WebSocket');
  
  // Subscribe to a poll
  ws.send(JSON.stringify({
    type: 'subscribe_poll',
    pollId: 'your_poll_id_here'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

## 🚀 Production Deployment

1. Set `NODE_ENV=production` in your environment variables
2. Use a process manager like PM2
3. Set up a reverse proxy with Nginx
4. Use environment-specific database credentials
5. Enable SSL/TLS for secure connections

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support or questions, please open an issue in the repository.
