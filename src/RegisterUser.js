import React, { useState } from 'react';
import Welcome from './Welcome';
import Banner from './Banner';
import Footer from './Footer';

const UserRegistrationForm = () => {
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
        setRegistrationSuccess(true); // Set registration success flag to true
      } else {
        throw new Error('Network response was not ok');
      }
    })
    .catch(error => {
      console.error('Error:', error);
    });
  };

  return (
    <div>
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
      <Footer />
    </div>
  );
};

export default UserRegistrationForm;
