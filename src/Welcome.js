import React from 'react';
import { Link } from 'react-router-dom';

const Welcome = ({ username }) => {
  return (
    <div>
      <div style={{ marginBottom: '5px' }}></div>
      <h2>Welcome, {username}!</h2>
      <p>You have been registered successfully</p>
      <p>Click below to go to log in page</p>
      <Link to="/">Log in</Link>
    </div>
  );
};

export default Welcome;
