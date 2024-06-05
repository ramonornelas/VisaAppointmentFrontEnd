import React from 'react';
import Banner from './Banner';
import HamburgerMenu from './HamburgerMenu';
import Footer from './Footer';

const About = () => {
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
