// Import the lexicon data directly from your new JSON file
import LEXICON from '../data/lexicon.csv';

/**
 * Classifies a comment as scam or non-scam with risk levels
 * @param {string} comment - The comment to classify
 * @returns {Object} Classification result
 */
export const classifyComment = (comment) => {
  const lowerComment = comment.toLowerCase();
  
  let totalWeight = 0;
  let matchedTerms = [];
  let scamTypes = new Set();

  // Find matching terms from the imported JSON lexicon
  LEXICON.forEach(item => {
    if (lowerComment.includes(item.term.toLowerCase())) {
      totalWeight += item.weight;
      matchedTerms.push(item.term);
      scamTypes.add(item.type);
    }
  });

  // Determine if scam and level based on weight thresholds
  let isScam = totalWeight > 0.2;
  let scamLevel = 'Non-Scam';
  let riskPercentage = 0;

  if (isScam) {
    // Normalize riskPercentage (0-100%)
    riskPercentage = Math.min((totalWeight / 2) * 100, 100);
    
    // Risk level classification
    if (totalWeight < 1.0) {
      scamLevel = 'Low Risk';
    } else if (totalWeight < 2.0) {
      scamLevel = 'Medium Risk';
    } else {
      scamLevel = 'High Risk';
    }
  } else {
    riskPercentage = Math.max(100 - (totalWeight * 50), 0);
    scamLevel = 'Non-Scam';
  }

  return {
    isScam,
    scamLevel,
    riskPercentage: Math.round(riskPercentage),
    totalWeight: Math.round(totalWeight * 100) / 100,
    matchedTerms,
    scamTypes: Array.from(scamTypes),
    timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  };
};

/**
 * Gets risk level color for UI
 * @param {string} level - Risk level
 * @returns {string} Color code
 */
export const getLevelColor = (level) => {
  const colors = {
    'Non-Scam': '#059669',
    'Low Risk': '#f59e0b',
    'Medium Risk': '#f97316',
    'High Risk': '#dc2626'
  };
  return colors[level] || '#6b7280';
};

/**
 * Gets risk level background color for badges
 * @param {string} level - Risk level
 * @returns {string} Background color
 */
export const getLevelBgColor = (level) => {
  const colors = {
    'Non-Scam': '#d1fae5',
    'Low Risk': '#fef3c7',
    'Medium Risk': '#fed7aa',
    'High Risk': '#fee2e2'
  };
  return colors[level] || '#f3f4f6';
};

/**
 * Gets text color for dark backgrounds
 * @param {string} level - Risk level
 * @returns {string} Text color
 */
export const getLevelTextColor = (level) => {
  const colors = {
    'Non-Scam': '#065f46',
    'Low Risk': '#78350f',
    'Medium Risk': '#92400e',
    'High Risk': '#7f1d1d'
  };
  return colors[level] || '#111827';
};