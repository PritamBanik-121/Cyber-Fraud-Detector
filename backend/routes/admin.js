const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const History = require('../models/History');

// Authorization Guard Middleware to verify Admin Status
const adminAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'No authorization token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    if (decoded.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
    }
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token verification failed' });
  }
};

// @route   GET /api/admin/stats
// @desc    Get aggregate global threat intelligence metrics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalScans = await History.countDocuments();
    const totalScams = await History.countDocuments({ isScam: true });
    
    // Fetch recent events and populate user details
    const recentActivity = await History.find()
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .limit(15);

    res.json({ totalUsers, totalScans, totalScams, recentActivity });
  } catch (error) {
    console.error('Admin metrics fetch error:', error);
    res.status(500).json({ message: 'Internal Server Error fetching analytics' });
  }
});

module.exports = router;