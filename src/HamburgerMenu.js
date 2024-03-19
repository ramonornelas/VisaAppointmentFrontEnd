// HamburgerMenu.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './HamburgerMenu.css';

const HamburgerMenu = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  return (
    <div className="hamburger-menu-icon" onClick={toggleMenu}>
      <div className={`menu-icon ${isMenuOpen ? 'open' : ''}`}>
        <div className="line"></div>
        <div className="line"></div>
        <div className="line"></div>
      </div>
      <nav className={`menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="menu-items">
          <Link to="/">Home</Link>
          <Link to="/userdatarequestform">Create User</Link>
          <Link to="/about">About</Link>
        </div>
      </nav>
    </div>
  );
}

export default HamburgerMenu;
