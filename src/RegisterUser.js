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
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData({ ...formData, [name]: val });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.username)) {
      newErrors.username = 'Please enter a valid email address';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }
    
    if (!formData.country_code) {
      newErrors.country_code = 'Country selection is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
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
          <div className="form-field">
            <label htmlFor="username">
              Username: <span style={{ color: 'red' }}>*</span>
            </label>
            <input 
              type="email" 
              id="username" 
              name="username" 
              value={formData.username} 
              onChange={handleChange}
              style={{ borderColor: errors.username ? 'red' : '' }}
              required
            />
            {errors.username && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{errors.username}</div>}
          </div>
          <div className="form-field">
            <label htmlFor="password">
              Password: <span style={{ color: 'red' }}>*</span>
            </label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange}
              style={{ borderColor: errors.password ? 'red' : '' }}
              required
            />
            &nbsp;{errors.password && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{errors.password}</div>}
          </div>
          <div className="form-field">
            <label htmlFor="country_code">
              Country: <span style={{ color: 'red' }}>*</span>
            </label>
            <select 
              id="country_code" 
              name="country_code" 
              value={formData.country_code} 
              onChange={handleChange}
              style={{ borderColor: errors.country_code ? 'red' : '' }}
              required
            >
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
            {errors.country_code && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{errors.country_code}</div>}
          </div>
          <div className="form-field">
            <label htmlFor="phone_number">
              Phone Number:
            </label>
            <input 
              type="text" 
              id="phone_number" 
              name="phone_number" 
              value={formData.phone_number} 
              onChange={handleChange}
            />
          </div>
          <div style={{ marginBottom: '20px' }}></div>
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
