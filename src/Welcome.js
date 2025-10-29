import React from 'react';
import { Link } from 'react-router-dom';

const Welcome = ({ username }) => {
  return (
    <div>
      <div style={{ marginBottom: '5px' }}></div>
      <h2>Welcome, {username}!</h2>
      <p>You have been registered successfully</p>
      <p>Log in to get your visa appointment sooner!</p>
    </div>
  );
};

export default Welcome;
