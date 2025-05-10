import dotenv from 'dotenv';
import server from './setup/express.js';
// import connectDB from './setup/db.js';
import connectDB from './setup/mongo.js'; // Import your database connection function

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Connecting to MongoDB
connectDB()
  .then(() => {
    // Starting the server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  });