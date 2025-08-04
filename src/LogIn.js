import React, { useState } from 'react';
import Banner from './Banner';
import Footer from './Footer';

const LogIn = () => {
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
          const searchusername = searchuserdata[0].username;
          const countryCode = searchuserdata[0].country_code;
          const concurrentApplicants = searchuserdata[0].concurrent_applicants;
          sessionStorage.setItem("fastVisa_userid", searchuserid);
          sessionStorage.setItem("fastVisa_username", searchusername);
          sessionStorage.setItem("country_code", countryCode);
          sessionStorage.setItem("concurrent_applicants", concurrentApplicants);
          window.location.href = '/applicants'; // Redirect to applicants page since it's the only active page so far
        } else {
          throw new Error('Failed to fetch user data');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to log in');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message)
    }
  };

  return (
    <div>
      <div className="content-wrap">
      <div style={{ marginBottom: '5px' }}></div>
      <Banner />
      <div style={{ marginBottom: '5px' }}></div>
      <div style={{ textAlign: 'center' }}>
        <h2>Welcome to FastVisa</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username">Username:</label>
            <input type="text" id="username" value={username} onChange={handleUsernameChange} style={{ marginLeft: '1em' }} />
          </div>
          <div style={{ marginBottom: '5px' }}></div>
          <div>
            <label htmlFor="password">Password:</label>
            &nbsp;
            <input type="password" id="password" value={password} onChange={handlePasswordChange} style={{ marginLeft: '1em' }} />
          </div>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <div style={{ marginBottom: '5px' }}></div>
          <button type="submit">Log In</button>
        </form>
        <p>Don't have an account? <a href="/registeruser">Register here</a></p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LogIn;
