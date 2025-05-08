import mongoose from 'mongoose';

const initMongo = () => {
	return new Promise((resolve, reject) => {
		if (process.env.NODE_ENV === 'production') {
			mongoose.connect(process.env.MONGO_URL);
		} else {
			const options = {
				useNewUrlParser: true,
				useUnifiedTopology: true,
				socketTimeoutMS: 60000, // Set socket timeout to 60 seconds (for buffering)
				family: 4 // Use IPv4
			};
			mongoose.connect(process.env.MONGO_URL, options);
		}
		mongoose.connection.once('connected', function() {
			resolve('Mongoose default connection open to ' + process.env.MONGO_URL);
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

export default initMongo;
