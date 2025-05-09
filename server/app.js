import dotenv from 'dotenv';
import server from './setup/express.js';
import initMongo from './setup/mongo.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

// Initialize MongoDB
initMongo()
  .then((message) => {
    console.log(message);
    
    // Start the server
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize MongoDB:', error);
    process.exit(1);
  });