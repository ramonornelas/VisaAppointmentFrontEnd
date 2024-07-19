import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import LogIn from './LogIn';
import Home from './Home';
import About from './About';
import RegisterUser from './RegisterUser';
import Applicants from './Applicants';
import RegisterApplicant from './RegisterApplicant';
import ViewApplicant from './ViewApplicant';
import DeleteApplicant from './DeleteApplicant';
import StartContainer from './StartContainer';
import StopContainer from './StopContainer';

ReactDOM.render(
  <Router>
    <Routes>
      <Route path="/" element={<LogIn />} />
      <Route path="/home" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/registeruser" element={<RegisterUser />} />
      <Route path="/applicants" element={<Applicants />} />
      <Route path="/registerapplicant" element={<RegisterApplicant />} />
      <Route path="/viewapplicant" element={<ViewApplicant />} />
      <Route path="/deleteapplicant" element={<DeleteApplicant />} />
      <Route path="/startcontainer" element={<StartContainer />} />
      <Route path="/stopcontainer" element={<StopContainer />} />
    </Routes>
  </Router>,
  document.getElementById('root')
);
