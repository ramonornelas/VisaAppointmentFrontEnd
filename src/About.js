import React, { useEffect } from 'react';
import Banner from './Banner';
import HamburgerMenu from './HamburgerMenu';
import Footer from './Footer';
import { useNavigate } from 'react-router-dom';  
import { useAuth } from './utils/AuthContext';

const About = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
      if (!isAuthenticated) {
        document.body.classList.remove('menu-open');
        navigate('/');
        return;
      }
    }, [isAuthenticated, navigate]);

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
