import React from 'react';

function AdminDashboard({ user, onLogout }) {
  return (
    <div style={{ padding: '20px', color: '#fff', textAlign: 'center' }}>
      <h2>🛡️ Admin Command Center</h2>
      <p>Welcome, Administrator {user.name}.</p>
      <button onClick={onLogout} style={{ padding: '10px 20px', marginTop: '20px' }}>
        Logout
      </button>
    </div>
  );
}

export default AdminDashboard;