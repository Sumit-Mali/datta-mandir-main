const mongoose = require('mongoose');

// Donor Schema
const DonorSchema = new mongoose.Schema({
    name: { type: String, required: true, index: true }, 
    amount: { type: String, required: true },
    village: {type: String, default: '' },
    photo_url: {type: String, default: '' }
},{ timestamps: true });

// Text index for faster name-based searches
DonorSchema.index({ name: 'text' });

// Donor Model
const DonorModel = mongoose.model('donors', DonorSchema);

module.exports = DonorModel;
