import React, { useState } from 'react';
import Banner from './Banner';
import HamburgerMenu from './HamburgerMenu';

const UserDataRequestForm = () => {
  // State variables to store form data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [scheduleId, setScheduleId] = useState('');
  const [targetStartMode, setTargetStartMode] = useState('DATE');
  const [targetStartDays, setTargetStartDays] = useState('3');
  const [targetStartDate, setTargetStartDate] = useState('');
  const [targetEndDate, setTargetEndDate] = useState('');
  const [countryCode, setCountryCode] = useState('es-mx'); // Adding countryCode state variable
  const [consulCodes, setConsulCodes] = useState('');
  const [ascCodes, setAscCodes] = useState('');

  // Function to handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you can implement the logic to send the user data request
    const Body = {
      'event_type': 'deploy',
      'client_payload' : {
        'username': email,
        'password': password,
        'schedule_id': scheduleId,
        'target_start_mode': targetStartMode,
        'target_start_days': targetStartMode === 'DATE' ? targetStartDays : '-',
        'target_start_date': targetStartMode === 'DAYS' ? targetStartDate : '-',
        'target_end_date': targetEndDate,
        'country_code': countryCode,
        'consul_codes': consulCodes,
        'asc_codes': ascCodes
    }};
    // Send the clientPayload object as JSON to the API
    fetch('https://api.github.com/repos/Nokktarehezth/VisaAppointmentConsole/dispatches', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      "Authorization": "Bearer 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"
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
    setTargetStartMode('DATE');
    setTargetStartDays('3');
    setTargetStartDate('');
    setTargetEndDate('');
    setCountryCode('es-mx');
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

  return (
    <div>
      <HamburgerMenu />
      <Banner />
      <h2>User Data Request Form</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="scheduleId">Schedule ID:</label>
          <input
            type="number"
            id="scheduleId"
            value={scheduleId}
            onChange={(e) => setScheduleId(e.target.value)}
            required
          />
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
        <button type="submit">Submit</button>
      </form>
    </div>
  );
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

export default UserDataRequestForm;