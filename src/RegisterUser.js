import React, { useState, useEffect } from 'react';
import Welcome from './Welcome';
import Banner from './Banner';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';  
import { useAuth } from './utils/AuthContext';

const UserRegistrationForm = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
      if (!isAuthenticated) {
        document.body.classList.remove('menu-open');
        navigate('/');
        return;
      }
    }, [isAuthenticated, navigate]);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    phone_number: '',
    active: true,
    expiration_date: ''
  });
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData({ ...formData, [name]: val });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('https://w3a0pdhqul.execute-api.us-west-1.amazonaws.com/users', {
      method: 'POST',
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    })
    .then(response => {
      if (response.status === 201) {
        setRegistrationSuccess(true);
      } else {
        throw new Error('Network response was not ok');
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  };

  return (
    <div className="page-container">
      <div className="content-wrap">
      <div style={{ marginBottom: '5px' }}></div>
      <Banner />
      <div style={{ marginBottom: '5px' }}></div>
      <h2>User Registration Form</h2>
      {registrationSuccess ? (
        <Welcome username={formData.username} />
      ) : (
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username">Username:</label>
            <input type="email" id="username" name="username" value={formData.username} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="password">Password:</label>
            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="phone_number">Phone Number:</label>
            <input type="text" id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="active">Active:</label>
            <input type="checkbox" id="active" name="active" checked={formData.active} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="expiration_date">Expiration Date:</label>
            <input type="date" id="expiration_date" name="expiration_date" value={formData.expiration_date} onChange={handleChange} />
          </div>
          <button type="submit">Submit</button>
        </form>
      )}
      </div>
      <Footer />
    </div>
  );
};

export default UserRegistrationForm;
