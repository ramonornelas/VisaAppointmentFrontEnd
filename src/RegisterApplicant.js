import React, { useState, useEffect } from 'react';
import Banner from './Banner';
import HamburgerMenu from './HamburgerMenu';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';  
import { useAuth } from './utils/AuthContext';
import './index.css';

const RegisterApplicant = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const fastVisaUsername = sessionStorage.getItem("fastVisa_username"); 
  
  useEffect(() => {
      if (!isAuthenticated) {
        document.body.classList.remove('menu-open');
        navigate('/');
        return;
      }
    }, [isAuthenticated, navigate]);
    
  const fastVisa_userid = sessionStorage.getItem("fastVisa_userid");
  const fastVisa_username = sessionStorage.getItem("fastVisa_username");
  const countryCode = sessionStorage.getItem("country_code");  
  // State variables to store form data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [scheduleId, setScheduleId] = useState('');
  const [name, setName] = useState('');
  const [numberofapplicants, setNumberofApplicants] = useState('');
  const [hasConsulDate, setHasConsulDate] = useState(false);
  const [consulDate, setConsulDate] = useState('');
  const [hasAscDate, setHasAscDate] = useState(false);
  const [ascDate, setAscDate] = useState('');
  const [targetStartMode, setTargetStartMode] = useState('date');
  const [targetStartDays, setTargetStartDays] = useState('3');
  const [targetStartDate, setTargetStartDate] = useState('');
  const [targetEndDate, setTargetEndDate] = useState('');
  const [cityCodes, setCityCodes] = useState('');
  const [errors, setErrors] = useState({});

  // Function to validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!email.trim()) {
      newErrors.email = 'AIS Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password.trim()) {
      newErrors.password = 'AIS Password is required';
    }
    
    if (!scheduleId.trim()) {
      newErrors.scheduleId = 'AIS Schedule ID is required';
    }
    
    if (!numberofapplicants.trim()) {
      newErrors.numberofapplicants = 'Number of Applicants is required';
    }
    
    if (targetStartMode === 'days' && !targetStartDays) {
      newErrors.targetStartDays = 'Target Start Days is required';
    }
    
    if (targetStartMode === 'date' && !targetStartDate) {
      newErrors.targetStartDate = 'Target Start Date is required';
    }
    
    if (!targetEndDate) {
      newErrors.targetEndDate = 'Target End Date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Function to handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const Body = {
      "ais_schedule_id": scheduleId,
      "ais_username": email,
      "ais_password": password,
      "fastVisa_userid": fastVisa_userid,
      "fastVisa_username": fastVisa_username,
      "name": name,
      "number_of_applicants": numberofapplicants,
      "applicant_active": true,
      "consul_appointment_date": hasConsulDate ? consulDate : '',
      "asc_appointment_date": hasAscDate ? ascDate : '',
      'target_start_mode': targetStartMode,
      'target_start_days': targetStartMode === 'days' ? targetStartDays : '-',
      'target_start_date': targetStartMode === 'date' ? targetStartDate : '-',
      'target_end_date': targetEndDate,
      "target_city_codes": cityCodes,
      "target_country_code": countryCode,
      "container_id": "",
      "container_start_datetime": "",
      "container_stop_datetime": "",
      "app_start_time": "",
    };
    // Send the clientPayload object as JSON to the API
    fetch('https://w3a0pdhqul.execute-api.us-west-1.amazonaws.com/applicants', {
      method: 'POST',
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(Body)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        console.log('Response:', response);
        return response;
      })
      .then(data => {
        console.log('Success:', data);
        // Reset form fields after successful submission if needed
        setEmail('');
        setPassword('');
        setScheduleId('');
        setName('');
        setNumberofApplicants('');
        setHasConsulDate(false);
        setConsulDate('');
        setHasAscDate(false);
        setAscDate('');
        setTargetStartMode('date');
        setTargetStartDays('3');
        setTargetStartDate('');
        setTargetEndDate('');
        setCityCodes('');
        // Redirect to applicants
        window.location.href = '/applicants';
      })
      .catch(error => {
        console.error('Error:', error);
        // Handle errors here if needed
      });
  };

  // Helper function to clear errors when user starts typing
  const clearError = (fieldName) => {
    if (errors[fieldName]) {
      setErrors({ ...errors, [fieldName]: '' });
    }
  };

  // Function to handle checkbox changes for Cities
  const handleCityCodeChange = (e) => {
    const value = e.target.value;
    if (cityCodes.includes(value)) {
      setCityCodes(cityCodes.split(',').filter((code) => code !== value).join(','));
    } else {
      setCityCodes(cityCodes ? `${cityCodes},${value}` : `${value}`);
    }
  };

  const ALL_CITIES = {
    'es-mx': [
      {"city_code": "CJS", "city_name": "Ciudad Juarez"},
      {"city_code": "GDL", "city_name": "Guadalajara"},
      {"city_code": "HMO", "city_name": "Hermosillo"},
      {"city_code": "MAM", "city_name": "Matamoros"},
      {"city_code": "MID", "city_name": "Merida"},
      {"city_code": "MEX", "city_name": "Mexico City"},
      {"city_code": "MTY", "city_name": "Monterrey"},
      {"city_code": "NOG", "city_name": "Nogales"},
      {"city_code": "NLD", "city_name": "Nuevo Laredo"},
      {"city_code": "TIJ", "city_name": "Tijuana"},
    ],
    'es-hn': [
      {"city_code": "TGU", "city_name": "Tegucigalpa"}
    ]
  };

  const CITIES = ALL_CITIES[countryCode] || [];

  return (
    <div className="page-container">
      <div className="content-wrap">
      <HamburgerMenu />
      <div style={{ marginBottom: '5px' }}></div>
      <Banner />
      <div style={{ marginBottom: '5px' }}></div>
      <p className="username-right">{fastVisaUsername}</p>
      <h2>User Data Request Form</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="name">Name: <span style={{ color: 'red' }}>*</span></label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearError('name');
            }}
            style={{ borderColor: errors.name ? 'red' : '' }}
            required
          />
          {errors.name && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{errors.name}</div>}
        </div>
        <div className="form-field">
          <label htmlFor="email">AIS Email: <span style={{ color: 'red' }}>*</span></label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError('email');
            }}
            style={{ borderColor: errors.email ? 'red' : '' }}
            required
          />
          {errors.email && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{errors.email}</div>}
        </div>
        <div className="form-field">
          <label htmlFor="password">AIS Password: <span style={{ color: 'red' }}>*</span></label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError('password');
            }}
            style={{ borderColor: errors.password ? 'red' : '' }}
            required
          />
          {errors.password && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{errors.password}</div>}
        </div>
        <div className="form-field">
          <label htmlFor="scheduleId">AIS Schedule ID: <span style={{ color: 'red' }}>*</span></label>
          <input
            type="number"
            id="scheduleId"
            value={scheduleId}
            onChange={(e) => {
              setScheduleId(e.target.value);
              clearError('scheduleId');
            }}
            style={{ borderColor: errors.scheduleId ? 'red' : '' }}
            required
          />
          {errors.scheduleId && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{errors.scheduleId}</div>}
        </div>
        <div className="form-field">
          <label htmlFor="numberofapplicants">Number of Applicants: <span style={{ color: 'red' }}>*</span></label>
          <input
            type="number"
            id="numberofapplicants"
            value={numberofapplicants}
            onChange={(e) => {
              setNumberofApplicants(e.target.value);
              clearError('numberofapplicants');
            }}
            style={{ borderColor: errors.numberofapplicants ? 'red' : '' }}
            required
          />
          {errors.numberofapplicants && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{errors.numberofapplicants}</div>}
        </div>
        <div className="form-field">
          <label htmlFor="targetStartMode">Target Start Mode: <span style={{ color: 'red' }}>*</span></label>
          <select
            id="targetStartMode"
            value={targetStartMode}
            onChange={(e) => setTargetStartMode(e.target.value)}
            required
          >
            <option value="date">Date</option>
            <option value="days">Days</option>
          </select>
        </div>
        {targetStartMode === 'days' && (
          <div className="form-field">
            <label htmlFor="targetStartDays">Target Start Days: <span style={{ color: 'red' }}>*</span></label>
            <input
              type="number"
              id="targetStartDays"
              value={targetStartDays}
              onChange={(e) => {
                setTargetStartDays(parseInt(e.target.value));
                clearError('targetStartDays');
              }}
              style={{ borderColor: errors.targetStartDays ? 'red' : '' }}
              required
            />
            {errors.targetStartDays && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{errors.targetStartDays}</div>}
          </div>
        )}
        {targetStartMode === 'date' && (
          <div className="form-field">
            <label htmlFor="targetStartDate">Target Start Date: <span style={{ color: 'red' }}>*</span></label>
            <input
              type="date"
              id="targetStartDate"
              value={targetStartDate}
              onChange={(e) => {
                setTargetStartDate(e.target.value);
                clearError('targetStartDate');
              }}
              style={{ borderColor: errors.targetStartDate ? 'red' : '' }}
              required
            />
            {errors.targetStartDate && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{errors.targetStartDate}</div>}
          </div>
        )}
        <div className="form-field">
          <label htmlFor="targetEndDate">Target End Date: <span style={{ color: 'red' }}>*</span></label>
          <input
            type="date"
            id="targetEndDate"
            value={targetEndDate}
            onChange={(e) => {
              setTargetEndDate(e.target.value);
              clearError('targetEndDate');
            }}
            style={{ borderColor: errors.targetEndDate ? 'red' : '' }}
            required
          />
          {errors.targetEndDate && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{errors.targetEndDate}</div>}
        </div>
        <div>
          <h3>Target Cities</h3>
          {CITIES.map((city) => (
            <div key={city.city_code} className="form-field">
              <input
                type="checkbox"
                id={city.city_code}
                value={city.city_code}
                checked={cityCodes.split(',').includes(city.city_code)}
                onChange={handleCityCodeChange}
              />
              <label htmlFor={city.city_code}>{city.city_name}</label>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: '20px' }}></div>
        <button type="submit">Submit</button>
      </form>
      </div>
      <Footer />
    </div>
  );
};

export default RegisterApplicant;
