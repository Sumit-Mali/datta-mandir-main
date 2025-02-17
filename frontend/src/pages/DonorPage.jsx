import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaSearch } from 'react-icons/fa';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

const DonorPage = () => {
	const [donors, setDonors] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);

	// Debounce search input
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearch(searchTerm);
		}, 500);
		return () => clearTimeout(handler);
	}, [searchTerm]);

	// Function to load donors from localStorage
	const loadDonorsFromLocalStorage = () => {
		const cachedDonors = localStorage.getItem('donors');
		const cachedSearchTerm = localStorage.getItem('searchTerm');
		const cachedPage = localStorage.getItem('page');

		// Load cached data if search term and page match
		if (
			cachedDonors &&
			cachedSearchTerm === debouncedSearch &&
			Number(cachedPage) === page
		) {
			setDonors(JSON.parse(cachedDonors));
		} else {
			fetchDonors();
		}
	};

	// Fetch donors from API
	const fetchDonors = async () => {
		try {
			const response = await axios.get(
				`http://localhost:3001/getDonors?page=${
					debouncedSearch ? 1 : page
				}&limit=10&search=${debouncedSearch}&t=${Date.now()}`
			);
			setDonors(response.data.donors);
			setTotalPages(Math.ceil(response.data.totalCount / 10));

			// Cache the data in localStorage
			localStorage.setItem('donors', JSON.stringify(response.data.donors));
			localStorage.setItem('searchTerm', debouncedSearch);
			localStorage.setItem('page', page);
		} catch (error) {
			console.error('Error fetching data:', error);
		}
	};

	// Use localStorage data if available, otherwise fetch from API
	useEffect(() => {
		loadDonorsFromLocalStorage();

		// Listen for real-time updates from Socket.IO
		socket.on('donorDataChanged', () => {
			// Clear the cache on data changes and fetch fresh data
			localStorage.removeItem('donors');
			fetchDonors();
		});

		// Cleanup listener on component unmount
		return () => socket.off('donorDataChanged');
	}, [page, debouncedSearch]);

	return (
		<div className="p-4">
			<p className="text-center text-xl font-bold text-red-600 my-4">
				नवीन दत्त मंदिर बांधकामासाठी देणगी दिलेल्या सर्व भाविक भक्तांचे
				श्री दत्त सेवा मंडळ, कुर्ली यांच्या वतीने हार्दिक आभार !
			</p>

			{/* Search Input */}
			<div className="mb-4 flex items-center justify-center">
				<FaSearch className="text-gray-500 absolute left-6 md:left-110" />
				<input
					type="text"
					placeholder="देणगीदारांचे नाव शोधण्यासाठी मराठी मध्ये टाईप करा..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="w-2xl p-2 pl-7 md:pl-10 border rounded-4xl shadow-sm"
				/>
			</div>

			{/* Donor Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 place-items-center gap-2 md:gap-4">
				{donors.length > 0 ? (
					donors.map((donor) => (
						<div
							key={donor._id}
							className="w-80 border rounded-lg p-2 shadow-lg bg-[#F4EEDC]">
							<div className="w-full h-40 flex items-center justify-center bg-gray-100">
								<img
									src={donor.photo_url}
									alt={donor.name}
									className="max-w-full max-h-full object-contain"
								/>
							</div>
							<div className="p-2">
								<h4 className="text-md font-bold">
									{donor.name}
								</h4>
								<p className="text-gray-600">{donor.village}</p>
								<h4 className="text-md text-gray-800 font-semibold">
									₹ {donor.amount}
								</h4>
							</div>
						</div>
					))
				) : (
					<p className="col-span-4 text-gray-600">
						देणगीदाराचे नाव अस्तित्वात नाही
					</p>
				)}
			</div>

			{/* Pagination Buttons */}
			{!searchTerm && (
				<div className="flex justify-center w-full mt-4">
					<button
						onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
						disabled={page === 1}
						className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg mr-2 cursor-pointer ${
							page === 1
								? 'bg-gray-300'
								: 'bg-blue-500 text-white'
						}`}>
						Previous
					</button>
					<button
						onClick={() => setPage((prev) => prev + 1)}
						disabled={page >= totalPages}
						className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg cursor-pointer ${
							page >= totalPages
								? 'bg-gray-300'
								: 'bg-blue-500 text-white'
						}`}>
						Next
					</button>
				</div>
			)}
		</div>
	);
};

export default DonorPage;
