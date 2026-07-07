import React from 'react';

const HistoryPanel = ({ history, onDeleteItem, onClearHistory }) => {
  if (!history || history.length === 0) {
    return (
      <div className="history-panel">
        <div className="history-header">
          <h2>Detection History</h2>
        </div>
        <div className="history-empty">
          <p>No history yet. Analyze a comment to get started!</p>
        </div>
      </div>
    );
  }

  const getBorderClass = (level) => {
    if (level === 'Non-Scam') return 'safe';
    if (level === 'Low Risk') return 'low-risk';
    if (level === 'Medium Risk') return 'medium-risk';
    return 'high-risk';
  };

  const getBadgeClass = (level) => {
    if (level === 'Non-Scam') return 'badge-safe';
    if (level === 'Low Risk') return 'badge-warning';
    if (level === 'Medium Risk') return 'badge-alert';
    return 'badge-danger';
  };

  return (
    <div className="history-panel">
      <div className="history-header">
        <h2>Detection History</h2>
        <button className="btn-clear" onClick={onClearHistory}>
          Clear All
        </button>
      </div>

      <div className="history-list">
        {history.map((item) => {
          const level = item.scamLevel;
          const timestamp = item.timestamp
            ? new Date(item.timestamp).toLocaleString()
            : '';

          return (
            <div
              key={item.id}
              className={`history-item border-left-${getBorderClass(level)}`}
            >
              <div className="history-item-header">
                <span className={`badge ${getBadgeClass(level)}`}>
                  {level}
                </span>
                <span className="history-time">{timestamp}</span>
              </div>

              <p className="history-comment">"{item.comment}"</p>

              <div className="history-details">
                <span>Risk: {item.riskPercentage}%</span>
                {item.totalWeight !== undefined && (
                  <span>Weight: {item.totalWeight}</span>
                )}
              </div>

              <button
                className="btn-delete-item"
                onClick={() => onDeleteItem(item.id)}
                title="Delete this item"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryPanel;