import React, { useState } from 'react';
import Banner from './Banner';
import HamburgerMenu from './HamburgerMenu';

const RegisterApplicant = () => {
  const fastVisa_userid = sessionStorage.getItem("fastVisa_userid");
  const fastVisa_username = sessionStorage.getItem("fastVisa_username");  
  // State variables to store form data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [scheduleId, setScheduleId] = useState('');
  const [hasConsulDate, setHasConsulDate] = useState(false);
  const [consulDate, setConsulDate] = useState('');
  const [hasAscDate, setHasAscDate] = useState(false);
  const [ascDate, setAscDate] = useState('');
  const [targetStartMode, setTargetStartMode] = useState('DATE');
  const [targetStartDays, setTargetStartDays] = useState('3');
  const [targetStartDate, setTargetStartDate] = useState('');
  const [targetEndDate, setTargetEndDate] = useState('');
  const [consulCodes, setConsulCodes] = useState('');
  const [ascCodes, setAscCodes] = useState('');

  // Function to handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const Body = {
        "ais_schedule_id": scheduleId,
        "ais_username": email,
        "ais_password": password,
        "fastVisa_userid": fastVisa_userid,
        "fastVisa_username": fastVisa_username,
        "applicant_active": true,
        "search_active": true,
        "consul_appointment_date": hasConsulDate ? consulDate : '',
        "asc_appointment_date": hasAscDate ? ascDate : '',
        'target_start_mode': targetStartMode,
        'target_start_days': targetStartMode === 'DAYS' ? targetStartDays : '-',
        'target_start_date': targetStartMode === 'DATE' ? targetStartDate : '-',
        'target_end_date': targetEndDate,
        "target_consul_codes": consulCodes,
        "target_asc_codes": ascCodes,
        "container_id": "",
        "container_start_datetime": ""
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
    setHasConsulDate(false);
    setConsulDate('');
    setHasAscDate(false);
    setAscDate('');
    setTargetStartMode('DATE');
    setTargetStartDays('3');
    setTargetStartDate('');
    setTargetEndDate('');
    setConsulCodes('');
    setAscCodes('');
    })
    .catch(error => {
    console.error('Error:', error);
    // Handle errors here if needed
    });
  };

  // Function to handle checkbox changes for Consul Codes
  const handleConsulCodeChange = (e) => {
    const value = parseInt(e.target.value);
    if (consulCodes.includes(value)) {
      setConsulCodes(consulCodes.split(',').filter((code) => code !== value).join(','));
    } else {
      setConsulCodes(consulCodes ? `${consulCodes},${value}` : `${value}`);
    }
  };

  // Function to handle checkbox changes for ASC Codes
  const handleAscCodeChange = (e) => {
    const value = parseInt(e.target.value);
    if (ascCodes.includes(value)) {
      setAscCodes(ascCodes.split(',').filter((code) => code !== value).join(','));
    } else {
      setAscCodes(ascCodes ? `${ascCodes},${value}` : `${value}`);
    }
  };

// Function to handle checkbox changes for Consul Date
    const handleConsulDateChange = (e) => {
        setHasConsulDate(e.target.checked);
    };
    
// Function to handle checkbox changes for ASC Date
    const handleAscDateChange = (e) => {
        setHasAscDate(e.target.checked);
    };

    const CONSUL_NAMES = {
        65: "Ciudad Juarez",
        66: "Guadalajara",
        67: "Hermosillo",
        68: "Matamoros",
        69: "Merida",
        70: "Mexico City",
        71: "Monterrey",
        72: "Nogales",
        73: "Nuevo Laredo",
        74: "Tijuana",
    };
      
    const ASC_NAMES = {
        76: "Ciudad Juarez",
        77: "Guadalajara",
        78: "Hermosillo",
        79: "Matamoros",
        81: "Merida",
        82: "Mexico City",
        83: "Monterrey",
        84: "Nogales",
        85: "Nuevo Laredo",
        88: "Tijuana",
    };

  return (
    <div>
      <HamburgerMenu />
      <div style={{ marginBottom: '5px' }}></div>
      <Banner />
      <div style={{ marginBottom: '5px' }}></div>
      <h2>User Data Request Form</h2>
      <form onSubmit={handleSubmit}>
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
                {/* Checkbox and field for Consul Date */}
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
        </div>
        {/* Checkbox and field for ASC Date */}
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
        </div>
        <div>
          <label htmlFor="targetStartMode">Target Start Mode:</label>
          <select
            id="targetStartMode"
            value={targetStartMode}
            onChange={(e) => setTargetStartMode(e.target.value)}
            required
          >
            <option value="DATE">Date</option>
            <option value="DAYS">Days</option>
          </select>
        </div>
        {targetStartMode === 'DAYS' && (
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
        {targetStartMode === 'DATE' && ( // Render targetStartDate only if targetStartMode is DATE
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
          <h3>Consul Codes</h3>
          {Object.entries(CONSUL_NAMES).map(([id, name]) => (
            <div key={id}>
              <input
                type="checkbox"
                id={id}
                value={id}
                checked={consulCodes.split(',').includes(id)}
                onChange={handleConsulCodeChange}
              />
              <label htmlFor={id}>{name}</label>
            </div>
          ))}
        </div>
        <div>
          <h3>ASC Codes</h3>
          {Object.entries(ASC_NAMES).map(([id, name]) => (
            <div key={id}>
              <input
                type="checkbox"
                id={id}
                value={id}
                checked={ascCodes.split(',').includes(id)}
                onChange={handleAscCodeChange}
              />
              <label htmlFor={id}>{name}</label>
            </div>
          ))}
        </div>
        <div style={{ marginBottom: '20px' }}></div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};



export default RegisterApplicant;
