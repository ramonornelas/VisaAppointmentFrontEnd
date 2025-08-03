import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Welcome from './Welcome';
import Banner from './Banner';
import Footer from './Footer';

const UserRegistrationForm = () => {
  // Calculate expiration date (one month from now)
  const getExpirationDate = () => {
    const now = new Date();
    const expirationDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    return expirationDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    phone_number: '',
    active: true,
    expiration_date: getExpirationDate(),
    country_code: ''
  });
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const navigate = useNavigate();

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

  const handleCancel = () => {
    navigate('/');
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
            <label htmlFor="username">Username: </label>
            <input type="email" id="username" name="username" value={formData.username} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="password">Password: </label>
            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="country_code">Country: </label>
            <select id="country_code" name="country_code" value={formData.country_code} onChange={handleChange}>
              <option value="">Select a country</option>
              <option value="es-mx">Mexico</option>
              <option value="es-ar">Argentina</option>
              <option value="es-br">Brazil</option>
              <option value="es-co">Colombia</option>
              <option value="es-pe">Peru</option>
              <option value="es-ve">Venezuela</option>
              <option value="es-cl">Chile</option>
              <option value="es-ec">Ecuador</option>
              <option value="es-gt">Guatemala</option>
              <option value="es-cu">Cuba</option>
              <option value="es-hn">Honduras</option>
              <option value="es-bo">Bolivia</option>
              <option value="es-do">Dominican Republic</option>
              <option value="es-py">Paraguay</option>
              <option value="es-ni">Nicaragua</option>
              <option value="es-cr">Costa Rica</option>
              <option value="es-pa">Panama</option>
              <option value="es-uy">Uruguay</option>
              <option value="es-sv">El Salvador</option>
            </select>
          </div>
          <div>
            <label htmlFor="phone_number">Phone Number: </label>
            <input type="text" id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleChange} />
          </div>
          <div style={{ marginBottom: '5px' }}></div>
          <button type="submit">Submit</button>
          &nbsp;
          <button type="button" onClick={handleCancel}>Cancel</button>
        </form>
      )}
      </div>
      <Footer />
    </div>
  );
};

export default UserRegistrationForm;
