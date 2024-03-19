import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import About from './About';
import UserDataRequestForm from './UserDataRequestForm';

ReactDOM.render(
  <Router>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/userdatarequestform" element={<UserDataRequestForm />} />
      <Route path="/about" element={<About />} />
    </Routes>
  </Router>,
  document.getElementById('root')
);
