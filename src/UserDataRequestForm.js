import React, { useState } from 'react';
import Banner from './Banner';
import HamburgerMenu from './HamburgerMenu';

const UserDataRequestForm = () => {
  // State variables to store form data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [scheduleAfter, setScheduleAfter] = useState('');
  const [consulates, setConsulates] = useState([]);
  const [applicantServiceCenters, setApplicantServiceCenters] = useState([]);

  // Function to handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you can implement the logic to send the user data request
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Schedule After:', scheduleAfter);
    console.log('Selected Consulates:', consulates);
    console.log('Selected Applicant Service Centers:', applicantServiceCenters);
    // Reset form fields after submission
    setName('');
    setEmail('');
    setPassword('');
    setScheduleAfter('');
    setConsulates([]);
    setApplicantServiceCenters([]);
  };

  // Function to handle checkbox changes for Consulates
  const handleConsulateChange = (e) => {
    const value = e.target.value;
    if (consulates.includes(value)) {
      setConsulates(consulates.filter((consulate) => consulate !== value));
    } else {
      setConsulates([...consulates, value]);
    }
  };

  // Function to handle checkbox changes for Applicant Service Centers
  const handleApplicantServiceCenterChange = (e) => {
    const value = e.target.value;
    if (applicantServiceCenters.includes(value)) {
      setApplicantServiceCenters(applicantServiceCenters.filter((center) => center !== value));
    } else {
      setApplicantServiceCenters([...applicantServiceCenters, value]);
    }
  };

  return (
    <div>
      <HamburgerMenu />
      <Banner />
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
          <label htmlFor="scheduleAfter">Schedule After:</label>
          <input
            type="date"
            id="scheduleAfter"
            value={scheduleAfter}
            onChange={(e) => setScheduleAfter(e.target.value)}
            required
          />
        </div>
        <div>
          <h3>Consulates</h3>
          {consulateOptions.map((consulate) => (
            <div key={consulate}>
              <input
                type="checkbox"
                id={consulate}
                value={consulate}
                checked={consulates.includes(consulate)}
                onChange={handleConsulateChange}
              />
              <label htmlFor={consulate}>{consulate}</label>
            </div>
          ))}
        </div>
        <div>
          <h3>Applicant Service Centers</h3>
          {applicantServiceCenterOptions.map((center) => (
            <div key={center}>
              <input
                type="checkbox"
                id={center}
                value={center}
                checked={applicantServiceCenters.includes(center)}
                onChange={handleApplicantServiceCenterChange}
              />
              <label htmlFor={center}>{center}</label>
            </div>
          ))}
        </div>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

const consulateOptions = [
  "Ciudad Juarez",
  "Guadalajara",
  "Hermosillo",
  "Matamoros",
  "Merida",
  "Mexico City",
  "Monterrey",
  "Nogales",
  "Nuevo Laredo",
  "Tijuana"
];

const applicantServiceCenterOptions = [
    "Ciudad Juarez",
    "Guadalajara",
    "Hermosillo",
    "Matamoros",
    "Merida",
    "Mexico City",
    "Monterrey",
    "Nogales",
    "Nuevo Laredo",
    "Tijuana"
];

export default UserDataRequestForm;
