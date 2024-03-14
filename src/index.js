import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Import BrowserRouter, Routes, and Route
import App from './App'; // Import your App component
import UserDataRequestForm from './UserDataRequestForm';

ReactDOM.render(
    <Router>
      <Routes>
        <Route path="/" element={<UserDataRequestForm />} />
        <Route path="/app" element={<App />} />
      </Routes>
    </Router>,
    document.getElementById('root')
  );