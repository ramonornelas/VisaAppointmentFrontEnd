// HamburgerMenu.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './utils/AuthContext';
import './HamburgerMenu.css';

import { permissions } from './utils/permissions';

const HamburgerMenu = () => {
  const { isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    if (isMenuOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
  }, [isMenuOpen]);

  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <div className="hamburger-menu-icon">
      <div className={`menu-icon ${isMenuOpen ? 'open' : ''}`} onClick={toggleMenu}>
        <div className="line"></div>
        <div className="line"></div>
        <div className="line"></div>
      </div>
      <nav className={`menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="menu-items">
          <Link to="/applicants">Applicants</Link>
          {permissions.canManageUsers() && <Link to="/users">Users</Link>}
          <Link to="/logout">Log Out</Link>
        </div>
      </nav>
    </div>
  );
};

export default HamburgerMenu;