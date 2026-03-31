import React, { createContext, useState, useContext, useEffect } from 'react';
import { UserDetails } from '../services/APIFunctions';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!sessionStorage.getItem('fastVisa_userid'));
  const [trialActive, setTrialActive] = useState(false);
  const [subscriptionExpired, setSubscriptionExpired] = useState(false);
  const [paymentPending, setPaymentPending] = useState(false);
  const [userDataLoaded, setUserDataLoaded] = useState(false);

  // Fetch user details to determine trial and subscription status
  useEffect(() => {
    const checkUserStatus = async () => {
      const userId = sessionStorage.getItem('fastVisa_userid');
      
      if (!userId || !isAuthenticated) {
        setUserDataLoaded(true);
        return;
      }

      try {
        const userData = await UserDetails(userId);
        
        if (userData) {
          // Check trial status
          setTrialActive(userData.trial_active === true);
          setPaymentPending(userData.payment_pending === true);

          // Keep concurrent applicants limit in sync for components reading sessionStorage
          if (userData.concurrent_applicants !== undefined && userData.concurrent_applicants !== null) {
            sessionStorage.setItem('concurrent_applicants', String(userData.concurrent_applicants));
          }
          
          // Check subscription expiration
          if (userData.subscription_expires_at) {
            const expirationDate = new Date(userData.subscription_expires_at);
            const currentDate = new Date();
            setSubscriptionExpired(currentDate >= expirationDate);
          } else {
            setSubscriptionExpired(false);
          }
        }
        setUserDataLoaded(true);
      } catch (error) {
        console.error('Error checking user status:', error);
        setUserDataLoaded(true);
      }
    };

    checkUserStatus();
  }, [isAuthenticated]);

  const login = () => {
    setIsAuthenticated(true);
  };

  const logout = () => {
    // Clear session storage to log out the user
    sessionStorage.removeItem('fastVisa_userid');
    sessionStorage.removeItem('fastVisa_username');
    sessionStorage.removeItem('fastVisa_name');
    setIsAuthenticated(false);
    setTrialActive(false);
    setSubscriptionExpired(false);
    setPaymentPending(false);
  };

  const refreshUserStatus = async () => {
    const userId = sessionStorage.getItem('fastVisa_userid');
    
    if (!userId) return;

    try {
      const userData = await UserDetails(userId);
      
      if (userData) {
        setTrialActive(userData.trial_active === true);
        setPaymentPending(userData.payment_pending === true);
        if (userData.concurrent_applicants !== undefined && userData.concurrent_applicants !== null) {
          sessionStorage.setItem('concurrent_applicants', String(userData.concurrent_applicants));
        }
        
        if (userData.subscription_expires_at) {
          const expirationDate = new Date(userData.subscription_expires_at);
          const currentDate = new Date();
          setSubscriptionExpired(currentDate >= expirationDate);
        } else {
          setSubscriptionExpired(false);
        }
      }
    } catch (error) {
      console.error('Error refreshing user status:', error);
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        login, 
        logout, 
        trialActive, 
        subscriptionExpired,
        paymentPending,
        userDataLoaded,
        refreshUserStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);