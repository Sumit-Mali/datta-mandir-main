const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const DonorModel = require('./models/DonorModel');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		origin: [
			'https://shree-datta-mandir-kurli.onrender.com',  // Frontend Url
			'http://localhost:5173', // Added for local testing
		],
		methods: ['GET', 'POST'],
		credentials: true,
	},
});

// Middleware
app.use(
	cors({
		origin: [
			'https://shree-datta-mandir-kurli.onrender.com',   // Frontend Url
			'http://localhost:5173', // Added for local testing
		],
		credentials: true,
	})
);
app.use(express.json());

// MongoDB Connection
const mongoURI =
	'mongodb+srv://sumitmali2002:Skms121524@cluster0.fd7sc.mongodb.net/donordb?retryWrites=true&w=majority&appName=Cluster0';
mongoose
	.connect(mongoURI, { serverSelectionTimeoutMS: 5000 })
	.then(() => {
		console.log('MongoDB connected');

		// MongoDB Change Stream: Listen for changes
		const donorChangeStream = DonorModel.watch();
		let debounceTimer;

		donorChangeStream.on('change', async () => {
			clearTimeout(debounceTimer);
			debounceTimer = setTimeout(async () => {
				const updatedDonors = await DonorModel.find({})
					.select('name amount village photo_url')
					.lean();
				io.emit('donorDataChanged', updatedDonors); // Emit updated donors to all clients
			}, 2000); // Increased debounce to 2 seconds
		});
	})
	.catch((err) => console.error('MongoDB connection error:', err));

// Handle MongoDB connection errors
mongoose.connection.on('error', (err) => {
	console.error('MongoDB connection error:', err);
});

// Route for donors pagination
// app.get('/getDonors', async (req, res) => {
// 	const { page = 1, limit = 12, search = '' } = req.query;
// 	const pageNumber = parseInt(page, 10);
// 	const limitNumber = parseInt(limit, 10);

// 	try {
// 		const query = search
// 			? { name: { $regex: search, $options: 'i' } }
// 			: {};

// 		const totalCount = await DonorModel.countDocuments(query);
// 		const donors = await DonorModel.find(query)
// 			.skip((pageNumber - 1) * limitNumber)
// 			.limit(limitNumber)
// 			.select('name amount village photo_url')
// 			.lean();

// 		res.json({ donors, totalCount });
// 	} catch (error) {
// 		res.status(500).send('Server Error');
// 	}
// });

app.get('/getDonors', async (req, res) => {
    const { page = 1, limit = 12, search = '' } = req.query;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    
    try {
        const query = search
            ? { name: { $regex: search, $options: 'i' } }
            : {};

        // Get total donor count
        const totalCount = await DonorModel.countDocuments(query).exec();

        // Skip & limit logic for pagination
        const skip = (pageNumber - 1) * limitNumber;
        const donors = await DonorModel.find(query)
            .skip(skip)
            .limit(limitNumber)
            .select('name amount village photo_url')
            .lean();

        console.log(`Page: ${pageNumber}, Skip: ${skip}, Limit: ${limitNumber}, Total Count: ${totalCount}, Returned: ${donors.length}`);

        res.json({ donors, totalCount });
    } catch (error) {
        console.error('Error fetching donors:', error);
        res.status(500).send('Server Error');
    }
});


io.on('connection', (socket) => {
	console.log('Client connected');
	socket.on('disconnect', () => console.log('Client disconnected'));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
