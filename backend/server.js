const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const DonorModel = require('./models/DonorModel');
const http = require('http'); // For creating the server
const { Server } = require('socket.io'); // Socket.IO for real-time updates

const app = express();
const server = http.createServer(app); // Create an HTTP server

const io = new Server(server, {
	cors: {
		origin: 'https://datta-mandir-frontend.onrender.com', // Replace with your frontend URL if deployed
		methods: ['GET', 'POST'],
		credentials: true,
	},
});

// Middleware
app.use(
	cors({
		origin: 'https://datta-mandir-frontend.onrender.com', // Allow the frontend URL
		credentials: true,
	})
);
app.use(express.json());

// MongoDB Connection
const mongoURI =
	'mongodb+srv://sumitmali2002:Skms121524@cluster0.fd7sc.mongodb.net/donordb?retryWrites=true&w=majority&appName=Cluster0';
mongoose
	.connect(mongoURI)
	.then(() => {
		console.log('MongoDB connected');

		// MongoDB Change Stream: Listen for changes in the donors collection
		const donorChangeStream = DonorModel.watch();

		donorChangeStream.on('change', (change) => {
			console.log('Change detected:', change);

			// Emit change to all connected clients
			io.emit('donorDataChanged', { message: 'Donor data updated' });
		});
	})
	.catch((err) => console.error('MongoDB connection error:', err));

// Route for donors pagination
app.get('/getDonors', async (req, res) => {
	const { page = 1, limit = 10, search = '' } = req.query;
	const pageNumber = parseInt(page, 10);
	const limitNumber = parseInt(limit, 10);

	try {
		const query = search
			? { name: { $regex: search, $options: 'i' } } // Case-insensitive search
			: {};

		const totalCountPromise = DonorModel.countDocuments(query);
		const donorsPromise = DonorModel.find(query)
			.skip((pageNumber - 1) * limitNumber)
			.limit(limitNumber)
			.select('name amount village photo_url')
			.lean();

		const [totalCount, donors] = await Promise.all([
			totalCountPromise,
			donorsPromise,
		]);

		res.json({ donors, totalCount });
	} catch (error) {
		res.status(500).send('Server Error');
	}
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
