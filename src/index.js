import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './utils/AuthContext';
import './index.css';
import LogIn from './LogIn';
import Home from './Home';
import About from './About';
import RegisterUser from './RegisterUser';
import QuickStartApplicant from './QuickStartApplicant';
import Applicants from './Applicants';
import ApplicantForm from './ApplicantForm';
import ApplicantView from './ApplicantView';
import DeleteApplicant from './DeleteApplicant';
import LogOut from './LogOut';
import PremiumUpgrade from './PremiumUpgrade';

import Users from './Users';

import './i18n'; // Initialize i18n

ReactDOM.render(
  <AuthProvider>
    <Router>
      <Routes>
        <Route path="/" element={<LogIn />} />
        <Route path="/home" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/registeruser" element={<RegisterUser />} />
        <Route path="/quickstart" element={<QuickStartApplicant />} />
        <Route path="/applicants" element={<Applicants />} />
        <Route path="/applicant-form" element={<ApplicantForm />} />
        <Route path="/viewapplicant" element={<ApplicantView />} />
        <Route path="/view-applicant/:id" element={<ApplicantView />} />
        <Route path="/deleteapplicant" element={<DeleteApplicant />} />
        <Route path="/logout" element={<LogOut />} />
        <Route path="/premium-upgrade" element={<PremiumUpgrade />} />
  <Route path="/users" element={<Users />} />
      </Routes>
    </Router>
  </AuthProvider>,
  document.getElementById('root')
);
