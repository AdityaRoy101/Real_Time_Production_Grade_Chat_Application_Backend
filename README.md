# Production-Grade Real-Time Chat Application Backend
A robust backend API for a real-time chat application built with Node.js, Express, MongoDB, and Socket.IO.

Features
Real-time messaging using Socket.IO
Authentication with JWT (JSON Web Tokens)
RESTful API for managing users, conversations, and messages
Scalable architecture for production deployment
Cross-platform compatibility with frontend applications
Rate limiting to prevent abuse
Message read receipts
User presence detection (online/offline status)

# Comprehensive error handling
Tech Stack
Node.js - JavaScript runtime
Express - Web application framework
MongoDB - NoSQL database
Socket.IO - Real-time bidirectional event-based communication
JWT - Secure authentication mechanism
Mongoose - MongoDB object modeling
bcrypt - Password hashing
dotenv - Environment variable management

# API Endpoints
Authentication
POST /api/v1/auth/signup - Register a new user
POST /api/v1/auth/login - Authenticate user & receive token
GET /api/v1/auth/verify - Verify JWT token
Chat
GET /api/v1/chat/conversations/:userId - Get all conversations for a user
GET /api/v1/chat/conversation/:userId/:otherUserId - Get specific conversation
GET /api/v1/chat/messages/:conversationId - Get messages in a conversation
POST /api/v1/chat/messages - Send a new message
POST /api/v1/chat/read - Mark messages as read
GET /api/v1/chat/users/:userId - Get all users (except the current user)
Socket Events
Server Events (emitted from server)
message - New message received
message_read - Message read status updated
user_status - User online/offline status change
typing - User typing indicator
Client Events (handled by server)
create_conversation - Create a new conversation
disconnect - Handle user disconnection

# Installation
Clone the repository

Install dependencies -> npm i

Create a .env file based on .env.sample

Start the development server -> npm run dev

Environment Variables
Deployment
This backend is configured for deployment to platforms like Render:

# Set up environment variables in your hosting platform
Ensure MongoDB connection string is properly configured
Deploy using the following commands:
Cross-Origin Resource Sharing (CORS)
The backend has configured CORS to allow specific origins to access the API. Update the ALLOWED_DOMAIN_LIST environment variable to include your frontend domain.

# Authentication Flow
User registers or logs in to receive a JWT token
Token is stored as an HTTP-only cookie and also returned in the response
Subsequent requests include the token for authentication
Socket.IO connections also require authentication via token
Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

# License
This project is licensed under the ISC License.

Created by Aditya Roy