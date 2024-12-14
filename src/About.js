import React, { useEffect } from 'react';
import Banner from './Banner';
import HamburgerMenu from './HamburgerMenu';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom'; 

const About = () => {
  const fastVisaUserId = sessionStorage.getItem("fastVisa_userid"); 
  const fastVisaUsername = sessionStorage.getItem("fastVisa_username"); 
  const navigate = useNavigate();
  
  useEffect(() => {
      if (!fastVisaUserId || !fastVisaUsername) {
          navigate('/');
          return;
      }
    }, fastVisaUserId);

  return (
    <div className="page-container">
      <div className="content-wrap">
      <HamburgerMenu />
      <div style={{ marginBottom: '5px' }}></div>
      <Banner />
      <div style={{ marginBottom: '5px' }}></div>
      <h2>About</h2>
      <p>We are Orion Scaled</p>
      <p>Find your way in IT with Orion Scaled</p>
      </div>
      <Footer />
    </div>
  );
};

export default About;
