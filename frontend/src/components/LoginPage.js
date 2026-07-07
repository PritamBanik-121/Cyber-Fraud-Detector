import React, { useState } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const LoginPage = ({ onLoginSuccess, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      // Send login request to MongoDB backend
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password
      });

      // The backend returns { token, user } on success
      const { token, user } = response.data;
      
      // Pass the real database user and token to App.js
      onLoginSuccess(user, token);

    } catch (err) {
      // Catch validation errors from the backend (like "Invalid credentials")
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Login failed. Ensure the backend server is running.');
      }
      console.error('Frontend API Login Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
        <img src="https://i.imgur.com/uYgmrvY.png" alt="Logo" className="auth-logo"/>
          <h1>Welcome Back</h1>
          <p>Login to Manipuri Cyber Detector</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <div class="divider">or</div>
        <div className="auth-footer">
          Don't have an account?{' '}
          <button type="button" onClick={onSwitchToRegister}>
            Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
