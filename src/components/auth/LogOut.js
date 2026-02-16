// FILE: LogOut.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';

const LogOut = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    document.body.classList.remove('menu-open');
    // Update authentication status
    logout();
    // Redirect to Login screen
    navigate('/login');
  }, [navigate, logout]);

  return (
    <div>
      <h1>Logging out...</h1>
    </div>
  );
};

export default LogOut;