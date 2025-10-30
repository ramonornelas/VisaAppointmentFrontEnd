import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PayPalPayment from './PayPalPayment';
import HamburgerMenu from './HamburgerMenu';
import Banner from './Banner';
import Footer from './Footer';
import { UserDetails, updateUser, getRoles } from './APIFunctions';
import './PremiumUpgrade.css';

const PremiumUpgrade = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const fastVisa_userid = sessionStorage.getItem('fastVisa_userid');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!fastVisa_userid) {
          navigate('/');
          return;
        }

        // Fetch user details and roles
        const [userData, rolesData] = await Promise.all([
          UserDetails(fastVisa_userid),
          getRoles()
        ]);

        setUserDetails(userData);
        setRoles(rolesData);
        setLoading(false);

        // Check if user just completed upgrade (after page reload)
        const upgradeSuccess = sessionStorage.getItem('fastVisa_upgrade_success');
        if (upgradeSuccess === 'true') {
          setSuccess(true);
          // Remove the flag so it doesn't show again
          sessionStorage.removeItem('fastVisa_upgrade_success');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user information');
        setLoading(false);
      }
    };

    fetchUserData();
  }, [fastVisa_userid, navigate]);

  const getCurrentRoleName = () => {
    if (!userDetails || !roles.length) return 'Unknown';
    const currentRole = roles.find(role => role.id === userDetails.role_id);
    const roleName = currentRole ? currentRole.name : 'Unknown';
    
    // Display user-friendly names
    if (roleName === 'basic_user') return 'Basic';
    if (roleName === 'premium_user') return 'Premium';
    if (roleName === 'visa_agent') return 'Visa Agent';
    if (roleName === 'admin') return 'Administrator';
    
    return roleName;
  };

  const isPremiumUser = () => {
    const roleName = getCurrentRoleName();
    return roleName === 'premium_user' || roleName === 'visa_agent' || roleName === 'admin';
  };

  const handleUpgradeClick = () => {
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentDetails) => {
    setUpgrading(true);
    try {
      // Find premium_user role ID
      const premiumRole = roles.find(role => role.name === 'premium_user');
      
      if (!premiumRole) {
        throw new Error('Premium role not found');
      }

      // Update user role to premium
      const updateData = {
        role_id: premiumRole.id
      };

      const updatedUser = await updateUser(fastVisa_userid, updateData);
      
      if (updatedUser) {
        setUserDetails(updatedUser);
        
        // Optional: Log payment details for tracking
        console.log('Payment successful:', paymentDetails);
        console.log('User upgraded to premium:', updatedUser);
        
        // Set success flag in sessionStorage to show after reload
        sessionStorage.setItem('fastVisa_upgrade_success', 'true');
        
        // Reload page immediately to update menu and remove upgrade option
        window.location.reload();
      } else {
        throw new Error('Failed to update user role');
      }
    } catch (error) {
      console.error('Error upgrading user:', error);
      setError('Payment was successful but failed to upgrade account. Please contact support.');
    } finally {
      setUpgrading(false);
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    setError('Payment failed. Please try again.');
    setUpgrading(false);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setUpgrading(false);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="content-wrap">
          <HamburgerMenu />
          <Banner />
          <div className="premium-upgrade-container">
            <div className="loading">Loading...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="page-container">
        <div className="content-wrap">
          <HamburgerMenu />
          <Banner />
          <div className="premium-upgrade-container">
            <div className="error">Failed to load user information</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (success) {
    return (
      <div className="page-container">
        <div className="content-wrap">
          <HamburgerMenu />
          <Banner />
          <div className="premium-upgrade-container">
            <div className="success-message">
              <h2>Upgrade Successful!</h2>
              <p>Welcome to FastVisa Premium!</p>
              <p>Your account has been successfully upgraded.</p>
              <p style={{ fontSize: '0.9rem', opacity: '0.9' }}>
                Your menu has been updated to reflect your new premium status!
              </p>
              <div className="success-actions">
                <button 
                  onClick={() => navigate('/applicants')} 
                  className="btn btn-primary"
                >
                  Start Using Premium Features
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content-wrap">
        <HamburgerMenu />
        <Banner />
        <div className="premium-upgrade-container">
        <div className="upgrade-header">
        <h1>Upgrade to Premium</h1>
        <p className="current-plan">
          Current Plan: <span className="plan-name">{getCurrentRoleName()}</span>
        </p>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="close-error">×</button>
        </div>
      )}

      {isPremiumUser() ? (
        <div className="already-premium">
          <div className="premium-badge">
            <h2>✨ You're Already Premium!</h2>
            <p>You have access to all premium features.</p>
            <button 
              onClick={() => navigate('/applicants')} 
              className="btn btn-primary"
            >
              Access Premium Features
            </button>
          </div>
        </div>
      ) : (
        <div className="upgrade-content">
          <div className="plans-comparison">
            <div className="plan current-plan-card">
              <h3>Basic Plan</h3>
              <div className="plan-price">$0/month</div>
              <ul className="plan-features">
                <li>✅ Search starts from 6 months ahead</li>
                <li>✅ Basic notifications every 2 hours</li>
                <li>✅ Standard search queue</li>
                <li>❌ Custom notification settings</li>
                <li>❌ Priority support</li>
              </ul>
              <div className="plan-status">Your Current Plan</div>
            </div>

            <div className="plan premium-plan-card">
              <div className="popular-badge">Most Popular</div>
              <h3>Premium Plan</h3>
              <div className="plan-price">
                <span className="currency">$</span>10
                <span className="period">/month</span>
              </div>
              <ul className="plan-features">
                <li>✅ All basic features</li>
                <li>🚀 Search can start as early as tomorrow</li>
                <li>🔔 Customizable notifications (when & how you want)</li>
                <li>⭐ Priority search queue</li>
                <li>🛡️ Priority customer support</li>
              </ul>
              
              {!showPayment ? (
                <button 
                  onClick={handleUpgradeClick}
                  className="btn btn-upgrade"
                  disabled={upgrading}
                >
                  {upgrading ? 'Processing...' : 'Upgrade Now'}
                </button>
              ) : (
                <div className="payment-section">
                  <h4>Complete Your Upgrade</h4>
                  <p>Secure payment powered by PayPal</p>
                  <PayPalPayment
                    amount="1.00"
                    amountMXN="20.00"
                    defaultCurrency="USD"
                    description="FastVisa Premium Upgrade"
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    onCancel={handlePaymentCancel}
                  />
                  <button 
                    onClick={() => setShowPayment(false)}
                    className="btn btn-cancel"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="upgrade-benefits">
            <h3>Why Upgrade to Premium?</h3>
            <div className="benefits-grid">
              <div className="benefit">
                <div className="benefit-icon">🚀</div>
                <h4>Next-Day Search</h4>
                <p>Start searching for appointments as early as tomorrow, vs 6 months ahead with Basic</p>
              </div>
              <div className="benefit">
                <div className="benefit-icon">🔔</div>
                <h4>Custom Notifications</h4>
                <p>Choose when and how you get notified vs basic alerts every 2 hours</p>
              </div>
              <div className="benefit">
                <div className="benefit-icon">⭐</div>
                <h4>Priority Search Queue</h4>
                <p>Your searches get priority over Basic users for faster results</p>
              </div>
            </div>
          </div>

          <div className="upgrade-guarantee">
            <h4>30-Day Money Back Guarantee</h4>
            <p>Not satisfied? Get a full refund within 30 days, no questions asked.</p>
          </div>
        </div>

      )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PremiumUpgrade;