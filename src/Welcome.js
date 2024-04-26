import React from 'react';
import Banner from './Banner';
import HamburgerMenu from './HamburgerMenu';
import Footer from './Footer';

const Welcome = ({ username }) => {
  return (
    <div>
      <HamburgerMenu />
      <div style={{ marginBottom: '5px' }}></div>
      <Banner />
      <div style={{ marginBottom: '5px' }}></div>
      <h2>Welcome, {username}!</h2>
      <p>You have been registered successfully</p>
      <Footer />
    </div>
  );
};

export default Welcome;
