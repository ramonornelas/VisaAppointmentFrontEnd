// FILE: LogOut.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LogOut = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear session storage to log out the user
    sessionStorage.removeItem('fastVisa_userid');
    sessionStorage.removeItem('fastVisa_username');
    // Redirect to login page
    navigate('/');
  }, [navigate]);

  return (
    <div>
      <h1>Logging out...</h1>
    </div>
  );
};

export default LogOut;