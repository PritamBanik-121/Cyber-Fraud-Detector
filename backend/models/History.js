const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  commentText: { type: String, required: true },
  isScam: { type: Boolean, required: true },
  scamLevel: { type: String, default: 'Non-Scam' },
  riskPercentage: { type: Number, default: 0 },
  source: { type: String, default: 'Lexicon' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('History', HistorySchema);