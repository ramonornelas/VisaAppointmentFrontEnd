import React from 'react';
import { Link } from 'react-router-dom';
import './HamburgerMenu.css'; // Import CSS file for styling

const HamburgerMenu = ({ isOpen, toggleMenu }) => {
  return (
    <div className="hamburger-menu-container">
      <button className={`hamburger-menu ${isOpen ? 'open' : ''}`} onClick={toggleMenu}>
        <div className="line">M</div>
        <div className="line">E</div>
        <div className="line">N</div>
        <div className="line">U</div>
      </button>
      <div className={`menu ${isOpen ? 'open' : ''}`}>
        <ul>
          <li><Link to="/app">App</Link></li>
          <li>Menu Item 2</li>
          <li>Menu Item 3</li>
        </ul>
      </div>
    </div>
  );
};

export default HamburgerMenu;
