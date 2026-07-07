import React, { useState, useEffect } from 'react';
import axios from 'axios';
import HistoryPanel from './HistoryPanel';
import API_BASE_URL from '../config/api';

// ========================================
// CIRCULAR GAUGE COMPONENT - PREMIUM VERSION
// ========================================
const RiskGauge = ({ riskPercentage, riskLevel }) => {
  const getGaugeColor = () => {
    if (riskLevel === 'Non-Scam' || riskLevel === 'non-scam') return 'safe';
    if (riskLevel === 'Low Risk' || riskLevel === 'Warning') return 'low';
    if (riskLevel === 'Medium Risk' || riskLevel === 'Dangerous') return 'medium';
    return 'dangerous';
  };

  const gaugeClass = getGaugeColor();
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (riskPercentage / 100) * circumference;

  return (
    <div className="gauge-container-premium">
      <div className="gauge-wrapper">
        <svg className="gauge-svg-premium" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle cx="60" cy="60" r="50" className="gauge-ring-background" />
          {/* Animated fill circle */}
          <circle
            cx="60" cy="60" r="50"
            className={`gauge-ring-fill ${gaugeClass}`}
            style={{
              '--dashoffset': strokeDashoffset,
              strokeDasharray: circumference,
              strokeLinecap: 'round'
            }}
          />
        </svg>
        <div className="gauge-content">
          <div className="gauge-percent-premium">{riskPercentage}%</div>
          <div className="gauge-label-premium">{riskLevel}</div>
        </div>
      </div>
      <div className="gauge-description">
        {riskPercentage < 20 && "Safe to interact"}
        {riskPercentage >= 20 && riskPercentage < 50 && "Caution advised"}
        {riskPercentage >= 50 && riskPercentage < 80 && "Likely suspicious"}
        {riskPercentage >= 80 && "High risk - avoid interaction"}
      </div>
    </div>
  );
};

// ========================================
// ENHANCED RESULT BADGE COMPONENT
// ========================================
// eslint-disable-next-line no-unused-vars
const RiskBadge = ({ riskLevel }) => {
  const getBadgeClass = () => {
    if (riskLevel === 'Non-Scam') return 'safe';
    if (riskLevel === 'Low Risk') return 'low';
    if (riskLevel === 'Medium Risk') return 'medium';
    return 'dangerous';
  };

  const getIcon = () => {
    if (riskLevel === 'Non-Scam') return '✓';
    if (riskLevel === 'Low Risk') return '⚠';
    if (riskLevel === 'Medium Risk') return '⚠';
    return '✕';
  };

  return (
    <span className={`risk-badge-premium ${getBadgeClass()}`}>
      <span className="badge-icon">{getIcon()}</span>
      {riskLevel}
    </span>
  );
};

// ========================================
// THREAT INDICATOR COMPONENT
// ========================================
const ThreatIndicator = ({ level, percentage }) => {
  return (
    <div className="threat-indicator">
      <div className="threat-info">
        <span className="threat-label">Threat Level</span>
        <span className={`threat-value ${level.toLowerCase().replace(/\s+/g, '-')}`}>
          {level}
        </span>
      </div>
      <div className="threat-bar-container">
        <div className="threat-bar-fill" style={{ width: `${percentage}%` }}></div>
      </div>
      <div className="threat-stats">
        <span>{percentage}%</span>
      </div>
    </div>
  );
};

// ========================================
// DETECTOR PAGE COMPONENT - PREMIUM VERSION
// ========================================
const DetectorPage = ({ user, onLogout }) => {
  const [commentInput, setCommentInput] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedResult, setExpandedResult] = useState(false);

  // Load history from MongoDB on startup
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/detector/history/${user.email}`);

        const formattedHistory = response.data.map(item => ({
          id: item._id,
          comment: item.commentText,
          isScam: item.isScam,
          scamLevel: item.scamLevel,
          riskPercentage: item.riskPercentage,
          totalWeight: item.totalWeight,
          timestamp: item.timestamp,
          source: item.source,
        }));

        setHistory(formattedHistory);
      } catch (error) {
        console.error('Failed to load history from DB:', error);
      }
    };

    if (user && user.email) {
      fetchHistory();
    }
  }, [user]);

  // Scroll listener for sticky header
  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector('.detector-header-premium');
      if (header) {
        if (window.scrollY > 0) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDetectComment = async (e) => {
    e.preventDefault();

    if (!commentInput.trim()) {
      alert('Please enter a comment');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/detector/analyze`, {
        comment: commentInput,
      });

      const detectionResult = response.data;
      setResult(detectionResult);
      setExpandedResult(true);

      const newHistoryItem = {
        text: commentInput,
        isScam: detectionResult.isScam,
        scamLevel: detectionResult.scamLevel,
        riskPercentage: detectionResult.riskPercentage,
        totalWeight: detectionResult.totalWeight,
        source: detectionResult.source,
      };

      const historyResponse = await axios.post(
        `${API_BASE_URL}/api/detector/history/${user.email}`,
        {
          historyItem: newHistoryItem,
        }
      );

      const formattedHistory = historyResponse.data.history.map(item => ({
        id: item._id,
        comment: item.commentText,
        isScam: item.isScam,
        scamLevel: item.scamLevel,
        riskPercentage: item.riskPercentage,
        totalWeight: item.totalWeight,
        timestamp: item.timestamp,
        source: item.source,
      }));

      setHistory(formattedHistory);
      setCommentInput('');
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/detector/history/${user.email}`);
        setHistory([]);
      } catch (error) {
        console.error('Failed to clear history:', error);
        alert('Could not clear history from the database.');
      }
    }
  };

  const handleDeleteHistoryItem = (id) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
  };

  return (
    <div className="detector-container-premium">
      {/* ===== PREMIUM HEADER ===== */}
      <div className="detector-header-premium">
        <div className="header-content-premium">
          <div className="header-branding">
            <div className="header-icon" onClick={() => window.location.reload()} style={{ cursor: 'pointer' }} title="Reload page">
              <img src="https://i.imgur.com/uYgmrvY.png" alt="Logo" className="auth-logo" onClick={window.location.reload} />
            </div>
            <div>
              <h1>Cyber Crime Detector</h1>
              <p className="header-subtitle">AI-Powered Scam Detection</p>
            </div>
          </div>
          <button className="logout-btn-premium" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="detector-content-premium">

        {/* Welcome Section */}
        <div className="welcome-section">
          <h2>Welcome<span className="user-name">{user.name}</span></h2>
          <p>Analyze comments for potential scams and cyber threats</p>
        </div>

        {/* Main Layout - Two Column on Desktop */}
        <div className="detector-layout">

          {/* Left Column - Input */}
          <div className="detector-column-left">
            <div className="card-premium card-input">
              <div className="card-header-premium">
                <div className="header-icon-text">
                  <span className="icon">📝</span>
                  <h2>Analyze Comment</h2>
                </div>
              </div>
              <form onSubmit={handleDetectComment}>
                <div className="input-wrapper">
                  <textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Paste the comment or text you want to check for scams..."
                    disabled={loading}
                    className="textarea-premium"
                  />
                  <div className="input-counter">
                    {commentInput.length} characters
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn-analyze-premium"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      Analyze
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="detector-column-right">
            {result && (
              <div className="card-premium card-result">
                <div className="card-header-premium">
                  <div className="header-icon-text">
                    <span className="icon">📊</span>
                    <h2>Detection Result</h2>
                  </div>
                  <button
                    className="expand-btn-premium"
                    onClick={() => setExpandedResult(!expandedResult)}
                    title={expandedResult ? "Collapse" : "Expand"}
                  >
                    <span>{expandedResult ? '−' : '+'}</span>
                  </button>
                </div>

                {/* Threat Indicator */}
                <ThreatIndicator
                  level={result.scamLevel}
                  percentage={result.riskPercentage}
                />

                {/* Risk Gauge */}
                <div className="gauge-section">
                  <RiskGauge
                    riskPercentage={result.riskPercentage}
                    riskLevel={result.scamLevel}
                  />
                </div>

                {/* Quick Stats */}
                <div className="result-stats-grid">
                  <div className="stat-item">
                    <div className="stat-label">Weight Score</div>
                    <div className="stat-value">{result.totalWeight}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Detected Terms</div>
                    <div className="stat-value">{result.matchedTerms?.length || 0}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Threat Types</div>
                    <div className="stat-value">{result.scamTypes?.length || 0}</div>
                  </div>
                </div>

                {/* Expandable Details */}
                {expandedResult && (
                  <div className="result-details-section">
                    {/* Matched Terms */}
                    {result.matchedTerms && result.matchedTerms.length > 0 && (
                      <div className="details-block">
                        <div className="details-title">
                          <span className="title-icon">🔍</span>
                          Detected Scam Terms
                        </div>
                        <div className="terms-container">
                          {result.matchedTerms.map((term, idx) => (
                            <span key={idx} className="term-tag">
                              {term}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Scam Types */}
                    {result.scamTypes && result.scamTypes.length > 0 && (
                      <div className="details-block">
                        <div className="details-title">
                          <span className="title-icon">⚠️</span>
                          Threat Categories
                        </div>
                        <div className="terms-container">
                          {result.scamTypes.map((type, idx) => (
                            <span key={idx} className="threat-tag">
                              {type}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {!result.matchedTerms?.length && !result.scamTypes?.length && (
                      <div className="empty-result">
                        <p>✓ No malicious patterns detected</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!result && (
              <div className="card-premium card-placeholder">
                <div className="placeholder-content">
                  <div className="placeholder-icon">🎯</div>
                  <h3>Analysis results will appear here</h3>
                  <p>Enter a comment and click analyze to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* History Section */}
        <div className="card-premium card-history">
          <HistoryPanel
            history={history}
            onDeleteItem={handleDeleteHistoryItem}
            onClearHistory={handleClearHistory}
          />
        </div>
      </div>
    </div>
  );
};

export default DetectorPage;
