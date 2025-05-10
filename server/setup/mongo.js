import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectDB = () => {
	return new Promise((resolve, reject) => {
		if (process.env.NODE_ENV === 'production') {
			mongoose.connect(process.env.MONGO_URL, {
				maxPoolSize: 10,
				serverSelectionTimeoutMS: 5000,
				socketTimeoutMS: 45000,
			});
		} else {
			mongoose.connect(process.env.MONGO_URI, {
				socketTimeoutMS: 60000,
				family: 4,
				maxPoolSize: 5
			});
			console.log('MongoDb Connected');
		}
		mongoose.connection.once('connected', function() {
			resolve('Mongoose default connection open to ' + process.env.MONGO_URI);
		});

		// If the connection throws an error
		mongoose.connection.on('error', function(err) {
			reject('Mongoose default connection error: ' + err);
		});

		// When the connection is disconnected
		mongoose.connection.on('disconnected', function() {
			resolve('Mongoose default connection disconnected');
		});
	});
};

export default connectDB;
