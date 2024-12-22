import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!sessionStorage.getItem('fastVisa_userid'));

  const login = () => {
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Clear session storage to log out the user
    sessionStorage.removeItem('fastVisa_userid');
    sessionStorage.removeItem('fastVisa_username');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);