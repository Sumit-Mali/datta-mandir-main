import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { FaSearch } from 'react-icons/fa';
import { io } from 'socket.io-client';

const socket = io('https://datta-mandir-backend-7z73.onrender.com');

const DonorPage = () => {
	const [donors, setDonors] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [loading, setLoading] = useState(false);
	const cachedData = useRef({});

	// Debounce the search term to limit API calls
	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedSearch(searchTerm);
			setPage(1); // Reset to page 1 on new search
		}, 500);
		return () => clearTimeout(handler);
	}, [searchTerm]);

	// Function to fetch donors based on page and search term
	const fetchDonors = async (queryPage = page, querySearch = debouncedSearch) => {
		const cacheKey = `${querySearch}-${queryPage}`;
		if (cachedData.current[cacheKey]) {
			setDonors(cachedData.current[cacheKey].donors);
			setTotalPages(cachedData.current[cacheKey].totalPages);
			return;
		}

		setLoading(true); // Show loading indicator
		try {
			const response = await axios.get(
				`https://datta-mandir-backend-7z73.onrender.com/getDonors?page=${queryPage}&limit=12&search=${querySearch}`
			);
			const { donors, totalCount } = response.data;
			setDonors(donors);
			setTotalPages(Math.ceil(totalCount / 12));
			cachedData.current[cacheKey] = { donors, totalPages: Math.ceil(totalCount / 12) };
		} catch (error) {
			console.error('Error fetching data:', error);
		} finally {
			setLoading(false); // Hide loading indicator
		}
	};

	// Fetch donors on page or search change
	useEffect(() => {
		fetchDonors();
		socket.on('donorDataChanged', () => fetchDonors(page, debouncedSearch)); // Update current page with the latest data
		return () => socket.off('donorDataChanged', fetchDonors);
	}, [page, debouncedSearch]);

	return (
		<div className="p-4">
			<p className="text-center text-xl font-bold text-red-600 my-4">
				नवीन दत्त मंदिर बांधकामासाठी देणगी दिलेल्या सर्व भाविक भक्तांचे
				श्री दत्त सेवा मंडळ, कुर्ली यांच्या वतीने हार्दिक आभार !
			</p>
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

			{loading ? (
				<div className="flex justify-center items-center h-40">
					<div className="w-12 h-12 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-4 place-items-center gap-2 md:gap-4">
					{donors.length > 0 ? (
						donors.map((donor) => (
							<div key={donor._id} className="w-80 border rounded-lg p-2 shadow-lg bg-[#F4EEDC]">
								<div className="w-full h-40 flex items-center justify-center bg-gray-100">
									<img
										src={donor.photo_url}
										alt={donor.name}
										className="max-w-full max-h-full object-contain"
										loading="lazy"
									/>
								</div>
								<div className="p-2">
									<h4 className="text-md font-bold">{donor.name}</h4>
									<p className="text-gray-600">{donor.village}</p>
									<h4 className="text-md text-gray-800 font-semibold">₹ {donor.amount}</h4>
								</div>
							</div>
						))
					) : (
						<p className="col-span-4 text-gray-600">देणगीदाराचे नाव अस्तित्वात नाही</p>
					)}
				</div>
			)}

			<div className="flex justify-center w-full mt-4">
				<button
					onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
					disabled={page === 1}
					window.scrollTo({ top: 0, behavior: 'smooth' })
					className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg mr-2 cursor-pointer ${
						page === 1 ? 'bg-gray-300' : 'bg-blue-500 text-white'
					}`}
				>
					Previous
				</button>
				<span className="px-4 py-2">{`Page ${page} of ${totalPages}`}</span>
				<button
					onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
					disabled={page >= totalPages}
					window.scrollTo({ top: 0, behavior: 'smooth' })
					className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg cursor-pointer ${
						page >= totalPages ? 'bg-gray-300' : 'bg-blue-500 text-white'
					}`}
				>
					Next
				</button>
			</div>
		</div>
	);
};

export default DonorPage;
