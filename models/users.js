const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    required: true,
    enum: ['host', 'subscriber'], // Restrict roles to 'host' or 'subscriber'
  },
});

module.exports = mongoose.model('User', userSchema);