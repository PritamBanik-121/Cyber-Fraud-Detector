const { PythonShell } = require('python-shell');
const path = require('path');

const ML_SCRIPT = path.join(__dirname, '..', 'ml', 'ml_predict.py');
const PYTHON_PATH = process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');

let pyShell = null;
let pendingResolvers = [];

function getPyShell() {
  if (pyShell) return pyShell;

  pyShell = new PythonShell(ML_SCRIPT, {
    mode: 'json',
    pythonPath: PYTHON_PATH,
    pythonOptions: ['-u'],
  });

  pyShell.on('message', (result) => {
    const resolve = pendingResolvers.shift();
    if (resolve) resolve(result);
  });

  pyShell.on('error', (err) => {
    const resolve = pendingResolvers.shift();
    if (resolve) resolve({ error: err.message });
  });

  pyShell.on('pythonError', (err) => {
    const resolve = pendingResolvers.shift();
    if (resolve) resolve({ error: err.message });
  });

  return pyShell;
}

async function mlPredict(text) {
  return new Promise((resolve) => {
    pendingResolvers.push(resolve);
    getPyShell().send({ text });
  });
}

const HIGH_THRESHOLD = 0.65;

const RISK_THRESHOLDS = {
  HIGH_RISK: 0.70,
  DANGEROUS: 0.40,
  WARNING:   0.15
};
function getRiskLevel(score) {
  if (score >= RISK_THRESHOLDS.HIGH_RISK) return 'High Risk';
  if (score >= RISK_THRESHOLDS.DANGEROUS) return 'Dangerous';
  if (score >= RISK_THRESHOLDS.WARNING)   return 'Warning';
  return 'non-scam';
}

function buildExplanation(source, score, flaggedTerms, mlResult) {
  const parts = [];
  if (flaggedTerms && flaggedTerms.length > 0) {
    parts.push(`Lexicon flagged: ${flaggedTerms.slice(0, 5).join(', ')}.`);
  }
  if (source === 'hybrid' && mlResult) {
    const pct = Math.round(mlResult.probability_scam * 100);
    parts.push(`ML model: ${pct}% scam probability.`);
    if (mlResult.top_features && mlResult.top_features.length > 0) {
      const top = mlResult.top_features.slice(0, 3).map(f => `"${f.ngram}"`).join(', ');
      parts.push(`Key patterns: ${top}.`);
    }
  }
  return parts.join(' ') || 'No significant threats detected.';
}

// async function hybridAnalyze(text, lexiconResult) {
//   const { score, flaggedTerms, category } = lexiconResult;

//   // High confidence from lexicon — flag immediately, skip ML
//   if (score >= HIGH_THRESHOLD) {
//     return {
//       source:      'lexicon',
//       riskLevel:   getRiskLevel(score),
//       confidence:  Math.round(score * 100),
//       flaggedTerms,
//       category,
//       mlResult:    null,
//       explanation: buildExplanation('lexicon', score, flaggedTerms, null)
//     };
//   }

//   // Ambiguous — send to ML for deeper check
//   if (score >= LOW_THRESHOLD) {
//     const mlResult = await mlPredict(text);

//     if (mlResult.error) {
//       console.warn('ML bridge error:', mlResult.error);
//       return {
//         source:      'lexicon',
//         riskLevel:   getRiskLevel(score),
//         confidence:  Math.round(score * 100),
//         flaggedTerms,
//         category,
//         mlResult:    null,
//         explanation: buildExplanation('lexicon', score, flaggedTerms, null)
//       };
//     }

//     const combinedScore = 0.4 * score + 0.6 * mlResult.probability_scam;

//     return {
//       source:      'hybrid',
//       riskLevel:   getRiskLevel(combinedScore),
//       confidence:  Math.round(combinedScore * 100),
//       flaggedTerms,
//       category,
//       mlResult,
//       explanation: buildExplanation('hybrid', combinedScore, flaggedTerms, mlResult)
//     };
//   }

//   // Low score — likely safe
//   return {
//     source:      'lexicon',
//     riskLevel:   'non-scam',
//     confidence:  Math.round((1 - score) * 100),
//     flaggedTerms: [],
//     category:    'none',
//     mlResult:    null,
//     explanation: 'No significant threats detected.'
//   };
// }

// module.exports = { hybridAnalyze };
async function hybridAnalyze(text, lexiconResult) {
  const { score, flaggedTerms, category } = lexiconResult;

  // 1. High confidence from lexicon — flag immediately, skip ML
  if (score >= HIGH_THRESHOLD) {
    return {
      source:      'lexicon',
      riskLevel:   getRiskLevel(score),
      riskPercentage:  Math.round(score * 100),
      flaggedTerms,
      category,
      mlResult:    null,
      explanation: buildExplanation('lexicon', score, flaggedTerms, null)
    };
  }

  // 2. Ambiguous or No Lexicon Hits — send EVERYTHING else to ML
  const mlResult = await mlPredict(text);

  // Fallback if the Python bridge fails
  if (mlResult.error) {
    console.warn('ML bridge error:', mlResult.error);
    return {
      source:      'lexicon',
      riskLevel:   getRiskLevel(score),
      riskPercentageriskPercentage:  Math.round(score * 100),
      flaggedTerms,
      category,
      mlResult:    null,
      explanation: buildExplanation('lexicon', score, flaggedTerms, null)
    };
  }

  // Combine scores: ML gets weight even if lexicon score is 0
  const combinedScore = 0.4 * score + 0.6 * mlResult.probability_scam;

  return {
    source:      'hybrid',
    riskLevel:   getRiskLevel(combinedScore),
    riskPercentage:  Math.round(combinedScore * 100),
    flaggedTerms,
    category,
    mlResult,
    explanation: buildExplanation('hybrid', combinedScore, flaggedTerms, mlResult)
  };
}

module.exports = { hybridAnalyze };
