import React, { useState, useEffect } from 'react';
import './App.css';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import DetectorPage from './components/DetectorPage';
import AdminDashboard from './components/AdminDashboard'; // You will need to create this file

function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      
      // Admin accounts are sent directly to the dashboard
      if (user.role === 'admin') {
        setCurrentScreen('admin');
      } else {
        setCurrentScreen('detector');
      }
    }
  }, []);

  const handleLoginSuccess = (user, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setCurrentUser(user);
    
    if (user.role === 'admin') {
      setCurrentScreen('admin');
    } else {
      setCurrentScreen('detector');
    }
  };

  const handleRegisterSuccess = () => {
    setCurrentScreen('login');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setCurrentScreen('login');
  };

  return (
    <div className="App">
      {currentScreen === 'login' && (
        <LoginPage 
          onLoginSuccess={handleLoginSuccess}
          onSwitchToRegister={() => setCurrentScreen('register')}
        />
      )}
      {currentScreen === 'register' && (
        <RegisterPage 
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={() => setCurrentScreen('login')}
        />
      )}
      {currentScreen === 'detector' && currentUser && (
        <DetectorPage 
          user={currentUser}
          onLogout={handleLogout}
        />
      )}
      {currentScreen === 'admin' && currentUser && (
        <AdminDashboard 
          user={currentUser}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;