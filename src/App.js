import React, { useState } from 'react';
import Banner from './Banner';
import Footer from './Footer';

const App = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    // Handle login logic here
  };

  return (
    <div>
      <Banner />
      <div style={{ marginBottom: '5px' }}></div>
      <div style={{ textAlign: 'center' }}>
      <h2>Welcome to the Visa Auto Scheduler</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input type="text" id="username" value={username} onChange={handleUsernameChange} />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" value={password} onChange={handlePasswordChange} />
        </div>
        <button type="submit">Log In</button>
      </form>
      <p>Don't have an account? <a href="/registeruser">Register here</a></p>
      <Footer />
      </div>
    </div>
  );
};

export default App;
