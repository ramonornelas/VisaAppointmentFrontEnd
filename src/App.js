import React, { useState } from 'react';
import Banner from './Banner';
import Footer from './Footer';

const App = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://w3a0pdhqul.execute-api.us-west-1.amazonaws.com/auth/login', {
        method: 'POST',
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.status === 200) {
        const searchuserresponse = await fetch('https://w3a0pdhqul.execute-api.us-west-1.amazonaws.com/users/search', {
          method: 'POST',
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ username }),
        });

        if (searchuserresponse.status === 200) {
          const searchuserdata = await searchuserresponse.json();
          const searchuserid = searchuserdata[0].id;
          sessionStorage.setItem("userId", searchuserid);
          window.location.href = '/home';
        } else {
          throw new Error('Failed to fetch user data');
        }
      } else {
        throw new Error('Failed to log in');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message)
    }
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
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button type="submit">Log In</button>
        </form>
        <p>Don't have an account? <a href="/registeruser">Register here</a></p>
        <Footer />
      </div>
    </div>
  );
};

export default App;
