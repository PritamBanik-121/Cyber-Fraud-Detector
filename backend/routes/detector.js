const { hybridAnalyze } = require('./hybridAnalyze');
const express = require('express');
const fs = require('fs');
const path = require('path');

// 1. IMPORT YOUR MONGODB MODELS
const User = require('../models/User');
const History = require('../models/History');

const router = express.Router();

// 2. Load the lexicon data from CSV
const LEXICON_FILE = path.join(__dirname, '../../frontend/src/data/Lexicons - lexicone_translated_final.csv');
let lexicon = [];

try {
  if (fs.existsSync(LEXICON_FILE)) {
    const data = fs.readFileSync(LEXICON_FILE, 'utf8');
    const lines = data.split('\n').filter(line => line.trim() !== '');

    // Skip header row
    const startIndex = lines[0].toLowerCase().includes('lexicon') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Find the LAST comma — term may contain commas, weight is always last
      const lastComma = line.lastIndexOf(',');
      if (lastComma === -1) continue;

      const term   = line.substring(0, lastComma).trim();
      const weight = parseFloat(line.substring(lastComma + 1).trim());

      if (term && !isNaN(weight)) {
        lexicon.push({
          term,
          type:   'scam',   // default type since CSV has no type column
          weight
        });
      }
    }
    console.log(`Loaded ${lexicon.length} terms from CSV.`);
  } else {
    console.warn("Lexicon file not found.");
  }
} catch (error) {
  console.error("Error reading CSV lexicon file:", error);
}

function looksLikeGibberish(text) {
  const clean = text.trim();
  if (clean.length < 3) return true;

  const letters = clean.replace(/[^a-zA-Z]/g, '');
  if (letters.length < clean.length * 0.5) return false;

  const vowels = (letters.match(/[aeiouAEIOU]/g) || []).length;
  const vowelRatio = vowels / letters.length;

  const consonantRuns = letters.match(/[^aeiouAEIOU\s]+/g) || [];
  const maxConsonantRun = Math.max(0, ...consonantRuns.map(r => r.length));

  return vowelRatio < 0.1 || maxConsonantRun >= 5;
}
// 3. Helper: Scam Classification Logic
const classifyComment = (comment) => {
  const lowerComment = comment.toLowerCase();
  let totalWeight = 0;
  let matchedTerms = [];
  let scamTypes = new Set();

  lexicon.forEach(item => {
    if (lowerComment.includes(item.term.toLowerCase())) {
      totalWeight += Number(item.weight);
      matchedTerms.push(item.term);
      scamTypes.add(item.type);
    }
  });

  
let isScam = totalWeight > 0.2;
let scamLevel = 'Non-Scam';
let riskPercentage = 0;

if (isScam) {
  riskPercentage = Math.min((totalWeight / 2) * 100, 100);
  if (totalWeight < 1.0)      scamLevel = 'Low Risk';
  else if (totalWeight < 2.0) scamLevel = 'Medium Risk';
  else                         scamLevel = 'High Risk';
} else {
  riskPercentage = Math.max(100 - (totalWeight * 50), 0);
}

return {
  isScam,
  scamLevel,
  riskPercentage: Math.round(riskPercentage),   // was: confidence: Math.round(confidence)
  totalWeight:    Math.round(totalWeight * 100) / 100,
  matchedTerms,
  scamTypes:      Array.from(scamTypes),
  timestamp:      new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
};
};

// 4. ROUTE: Analyze a comment
router.post('/analyze', async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    if (looksLikeGibberish(comment)) {
      return res.json({
        isScam: false,
        scamLevel: 'Unrecognized',
        riskPercentage: 0,
        matchedTerms: [],
        scamTypes: [],
        explanation: 'Input does not appear to be valid text and could not be analyzed.',
        source: 'validation',
        mlResult: null
      });
    }

    const lexiconResult = classifyComment(comment);

    const lexiconData = {
      score:        lexiconResult.totalWeight / 2,
      flaggedTerms: lexiconResult.matchedTerms,
      category:     lexiconResult.scamTypes[0] || 'none'
    };

    const hybridResult = await hybridAnalyze(comment, lexiconData);

    const finalResult = {
      isScam:       hybridResult.riskLevel !== 'non-scam', 
      scamLevel:    hybridResult.riskLevel,
      riskPercentage:   hybridResult.riskPercentage,
      totalWeight:  lexiconResult.totalWeight,
      matchedTerms: lexiconResult.matchedTerms,
      scamTypes:    lexiconResult.scamTypes,
      timestamp:    lexiconResult.timestamp,
      source:       hybridResult.source,
      explanation:  hybridResult.explanation,
      mlResult:     hybridResult.mlResult,
    };

    res.json(finalResult);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ message: 'Server error during analysis' });
  }
});

// ==========================================================
// MONGODB HISTORY ROUTES (REPLACED FS FILE SYSTEM LOGIC)
// ==========================================================

// 5. ROUTE: Get user history from MongoDB
router.get('/history/:email', async (req, res) => {
  try {
    // Find the user object by email
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.json([]);

    // Get their history from the database
    const history = await History.find({ userId: user._id })
                                 .sort({ timestamp: -1 })
                                 .limit(100);
    res.json(history);
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ message: 'Error fetching history from DB' });
  }
});

// 6. ROUTE: Save to history in MongoDB
router.post('/history/:email', async (req, res) => {
  try {
    const { historyItem } = req.body;
    if (!historyItem) {
      return res.status(400).json({ message: 'History item is required' });
    }

    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Create a new document in MongoDB
    const newLog = new History({
      userId: user._id,
      commentText: historyItem.text || "Analyzed text", 
      isScam: historyItem.isScam || false,
      scamLevel: historyItem.scamLevel || 'Non-Scam',
      riskPercentage: historyItem.riskPercentage || 0,
      source: historyItem.source || 'Lexicon'
    });

    await newLog.save();

    // Fetch the updated list to send back to frontend
    const updatedHistory = await History.find({ userId: user._id })
                                        .sort({ timestamp: -1 })
                                        .limit(100);
                                        
    res.status(201).json({ message: 'History saved successfully', history: updatedHistory });
  } catch (error) {
    console.error('History save error:', error);
    res.status(500).json({ message: 'Error saving history to DB' });
  }
});

// 7. ROUTE: Clear history in MongoDB
router.delete('/history/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Delete all records matching this user
    await History.deleteMany({ userId: user._id });
    res.json({ message: 'History cleared successfully' });
  } catch (error) {
    console.error('History delete error:', error);
    res.status(500).json({ message: 'Error clearing history in DB' });
  }
});

module.exports = router;