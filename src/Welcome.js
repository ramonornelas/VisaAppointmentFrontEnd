import React from 'react';
import { Link } from 'react-router-dom';

const Welcome = ({ username }) => {
  return (
    <div>
      <div style={{ marginBottom: '5px' }}></div>
      <h2>Welcome, {username}!</h2>
      <p>You have been registered successfully</p>
      <Link to="/">Go to Home to log in</Link>
    </div>
  );
};

export default Welcome;
