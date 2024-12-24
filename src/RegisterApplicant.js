import React, { useState, useEffect } from 'react';
import Banner from './Banner';
import HamburgerMenu from './HamburgerMenu';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';  
import { useAuth } from './utils/AuthContext';

const RegisterApplicant = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
      if (!isAuthenticated) {
        document.body.classList.remove('menu-open');
        navigate('/');
        return;
      }
    }, [isAuthenticated, navigate]);
    
  const fastVisa_userid = sessionStorage.getItem("fastVisa_userid");
  const fastVisa_username = sessionStorage.getItem("fastVisa_username");  
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

  // Function to handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
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

  /* 
  // Function to handle checkbox changes for Consul Date
  const handleConsulDateChange = (e) => {
    setHasConsulDate(e.target.checked);
  };

  // Function to handle checkbox changes for ASC Date
  const handleAscDateChange = (e) => {
    setHasAscDate(e.target.checked);
  };
  */

  // Function to handle checkbox changes for Cities
  const handleCityCodeChange = (e) => {
    const value = e.target.value;
    if (cityCodes.includes(value)) {
      setCityCodes(cityCodes.split(',').filter((code) => code !== value).join(','));
    } else {
      setCityCodes(cityCodes ? `${cityCodes},${value}` : `${value}`);
    }
  };

  const CITIES = [
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
  ];

  return (
    <div className="page-container">
      <div className="content-wrap">
      <HamburgerMenu />
      <div style={{ marginBottom: '5px' }}></div>
      <Banner />
      <div style={{ marginBottom: '5px' }}></div>
      <h2>User Data Request Form</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="email">AIS Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">AIS Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="scheduleId">AIS Schedule ID:</label>
          <input
            type="number"
            id="scheduleId"
            value={scheduleId}
            onChange={(e) => setScheduleId(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="numberofapplicants">Number of Applicants:</label>
          <input
            type="number"
            id="numberofapplicants"
            value={numberofapplicants}
            onChange={(e) => setNumberofApplicants(e.target.value)}
            required
          />
        </div>
        {/* Checkbox and field for Consul Date 
        <div>
          <input
            type="checkbox"
            id="hasConsulDate"
            checked={hasConsulDate}
            onChange={handleConsulDateChange}
          />
          <label htmlFor="hasConsulDate">I already have a Consul Date</label>
          {hasConsulDate && (
            <div>
              <label htmlFor="consulDate">Consul Date:</label>
              <input
                type="date"
                id="consulDate"
                value={consulDate}
                onChange={(e) => setConsulDate(e.target.value)}
                required={hasConsulDate}
              />
            </div>
          )}
        </div>*/}
        {/* Checkbox and field for ASC Date 
        <div>
          <input
            type="checkbox"
            id="hasAscDate"
            checked={hasAscDate}
            onChange={handleAscDateChange}
          />
          <label htmlFor="hasAscDate">I already have an ASC Date</label>
          {hasAscDate && (
            <div>
              <label htmlFor="ascDate">ASC Date:</label>
              <input
                type="date"
                id="ascDate"
                value={ascDate}
                onChange={(e) => setAscDate(e.target.value)}
                required={hasAscDate}
              />
            </div>
          )}
        </div>*/}
        <div>
          <label htmlFor="targetStartMode">Target Start Mode:</label>
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
          <div>
            <label htmlFor="targetStartDays">Target Start Days:</label>
            <input
              type="number"
              id="targetStartDays"
              value={targetStartDays}
              onChange={(e) => setTargetStartDays(parseInt(e.target.value))}
              required
            />
          </div>
        )}
        {targetStartMode === 'date' && ( // Render targetStartDate only if targetStartMode is DATE
          <div>
            <label htmlFor="targetStartDate">Target Start Date:</label>
            <input
              type="date"
              id="targetStartDate"
              value={targetStartDate}
              onChange={(e) => setTargetStartDate(e.target.value)}
              required
            />
          </div>
        )}
        <div>
          <label htmlFor="targetEndDate">Target End Date:</label>
          <input
            type="date"
            id="targetEndDate"
            value={targetEndDate}
            onChange={(e) => setTargetEndDate(e.target.value)}
            required
          />
        </div>
        <div>
          <h3>Target Cities</h3>
          {CITIES.map((city) => (
            <div key={city.city_code}>
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
