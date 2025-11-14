import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PayPalPayment from './PayPalPayment';
import HamburgerMenu from './HamburgerMenu';
import Banner from './Banner';
import Footer from './Footer';
import { UserDetails, updateUser, getRoles, getUSDMXNExchangeRate } from './APIFunctions';
import './PremiumUpgrade.css';


const PremiumUpgrade = () => {
  const { t, i18n } = useTranslation();
  const [userDetails, setUserDetails] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [priceUSD] = useState(10.0);
  const [priceMXN, setPriceMXN] = useState(null);
  const navigate = useNavigate();

  // Get current language from i18n
  const selectedLanguage = i18n.language;

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

  // Fetch exchange rate on mount
  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const rate = await getUSDMXNExchangeRate();
        setExchangeRate(rate);
        if (rate) {
          setPriceMXN((priceUSD * rate).toFixed(2));
        }
      } catch (err) {
        setExchangeRate(null);
        setPriceMXN(null);
      }
    };
    fetchExchangeRate();
  }, [priceUSD]);

  const getCurrentRoleName = () => {
    if (!userDetails || !roles.length) return t('unknown', 'Unknown');
    const currentRole = roles.find(role => role.id === userDetails.role_id);
    const roleName = currentRole ? currentRole.name : 'Unknown';
    
    // Display user-friendly names
    if (roleName === 'basic_user') return t('basic', 'Basic');
    if (roleName === 'premium_user') return t('premium', 'Premium');
    if (roleName === 'visa_agent') return t('visaAgent', 'Visa Agent');
    if (roleName === 'admin') return t('admin', 'Administrator');
    
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
      setError(t('paymentSuccessUpgradeFailed', 'Payment was successful but failed to upgrade account. Please contact support.'));
    } finally {
      setUpgrading(false);
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    setError(t('paymentFailed', 'Payment failed. Please try again.'));
    setUpgrading(false);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setUpgrading(false);
  };

  const MainContainer = ({ children }) => (
    <div className="main-centered-container">
      <HamburgerMenu />
      <Banner />
      {children}
    </div>
  );

  if (loading) {
    return (
      <div className="page-container">
        <MainContainer>
          <div className="premium-upgrade-container">
            <div className="loading">{t('loading', 'Loading...')}</div>
          </div>
        </MainContainer>
        <Footer />
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="page-container">
        <MainContainer>
          <div className="premium-upgrade-container">
            <div className="error">{t('failedToLoadUserInfo', 'Failed to load user information')}</div>
          </div>
        </MainContainer>
        <Footer />
      </div>
    );
  }

  if (success) {
    return (
      <div className="page-container">
        <MainContainer>
          <div className="premium-upgrade-container">
            <div className="success-message">
              <h2>{t('upgradeSuccessful', 'Upgrade Successful!')}</h2>
              <p>{t('welcomeToPremium', 'Welcome to FastVisa Premium!')}</p>
              <p>{t('accountUpgradedSuccessfully', 'Your account has been successfully upgraded.')}</p>
              <p style={{ fontSize: '0.9rem', opacity: '0.9' }}>
                {t('menuUpdatedPremium', 'Your menu has been updated to reflect your new premium status!')}
              </p>
              <div className="success-actions">
                <button 
                  onClick={() => navigate('/applicants')} 
                  className="btn btn-primary"
                >
                  {t('startUsingPremiumFeatures', 'Start Using Premium Features')}
                </button>
              </div>
            </div>
          </div>
        </MainContainer>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-container">
      <MainContainer>
        <div className="premium-upgrade-container">
          <div className="upgrade-header">
            <h1>{t('upgradeToPremiumTitle', 'Upgrade to Premium')}</h1>
            <p className="current-plan">
              {t('currentPlan', 'Current Plan')}: <span className="plan-name">{getCurrentRoleName()}</span>
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
                <h2>✨ {t('alreadyPremium', "You're Already Premium!")}</h2>
                <p>{t('accessAllPremiumFeatures', 'You have access to all premium features.')}</p>
                <button 
                  onClick={() => navigate('/applicants')} 
                  className="btn btn-primary"
                >
                  {t('accessPremiumFeatures', 'Access Premium Features')}
                </button>
              </div>
            </div>
          ) : (
            <div className="upgrade-content">
              <div className="plans-comparison">
                <div className="plan current-plan-card">
                  <h3>{t('basicPlan', 'Basic Plan')}</h3>
                  <div className="plan-price">$0{t('perMonth', '/month')}</div>
                  <ul className="plan-features">
                    <li>✅ {t('searchStartsSixMonthsAhead', 'Search starts from 6 months ahead')}</li>
                    <li>✅ {t('basicNotificationsEvery2Hours', 'Basic notifications every 2 hours')}</li>
                    <li>✅ {t('standardSearchQueue', 'Standard search queue')}</li>
                    <li>❌ {t('prioritySupport', 'Priority support')}</li>
                  </ul>
                  <div className="plan-status">{t('yourCurrentPlan', 'Your Current Plan')}</div>
                </div>

                <div className="plan premium-plan-card">
                  <div className="popular-badge">{t('mostPopular', 'Most Popular')}</div>
                  <h3>{t('premiumPlan', 'Premium Plan')}</h3>
                  <div className="plan-price">
                    {selectedLanguage === 'es' ? (
                      <>
                        <span className="currency">$</span>
                        {priceMXN === null
                          ? <span className="loading-rate">{t('loadingRate', 'Cargando...')}</span>
                          : priceMXN}
                        <span className="currency-code"> MXN</span>
                        <span className="period">{t('perMonth', '/mes')}</span>
                        {exchangeRate === null && (
                          <div className="exchange-error" style={{fontSize: '0.8rem', color: '#c00'}}>
                            {t('exchangeRateError', 'No se pudo obtener el tipo de cambio. El precio puede variar.')}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="currency">$</span>{priceUSD}
                        <span className="currency-code"> USD</span>
                        <span className="period">{t('perMonth', '/month')}</span>
                      </>
                    )}
                  </div>
                  <ul className="plan-features">
                    <li>✅ {t('allBasicFeatures', 'All basic features')}</li>
                    <li>🚀 {t('searchCanStartTomorrow', 'Search can start as early as tomorrow')}</li>
                    <li>⭐ {t('prioritySearchQueue', 'Priority search queue')}</li>
                    <li>🛡️ {t('prioritySupport', 'Priority customer support')}</li>
                  </ul>
                  {!showPayment ? (
                    <button 
                      onClick={handleUpgradeClick}
                      className="btn btn-upgrade"
                      disabled={upgrading}
                    >
                      {upgrading ? t('processing', 'Processing...') : t('upgradeNow', 'Upgrade Now')}
                    </button>
                  ) : (
                    <div className="payment-section">
                      <h4>{t('completeYourUpgrade', 'Complete Your Upgrade')}</h4>
                      <p>{t('securePaymentPayPal', 'Secure payment powered by PayPal')}</p>
                      <PayPalPayment
                        amount={priceUSD}
                        amountMXN={priceMXN}
                        defaultCurrency={selectedLanguage === 'es' ? 'MXN' : 'USD'}
                        description={t('premiumUpgradeDescription', 'FastVisa Premium Upgrade')}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                        onCancel={handlePaymentCancel}
                      />
                      <button 
                        onClick={() => setShowPayment(false)}
                        className="btn btn-cancel"
                      >
                        {t('cancel', 'Cancel')}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="upgrade-benefits">
                <h3>{t('whyUpgradePremium', 'Why Upgrade to Premium?')}</h3>
                <div className="benefits-grid">
                  <div className="benefit">
                    <div className="benefit-icon">🚀</div>
                    <h4>{t('nextDaySearch', 'Next-Day Search')}</h4>
                    <p>{t('nextDaySearchDesc', 'Start searching for appointments as early as tomorrow, vs 6 months ahead with Basic')}</p>
                  </div>
                  <div className="benefit">
                    <div className="benefit-icon">⭐</div>
                    <h4>{t('priorityQueue', 'Priority Search Queue')}</h4>
                    <p>{t('priorityQueueDesc', 'Your searches get priority over Basic users for faster results')}</p>
                  </div>
                </div>
              </div>

              <div className="upgrade-guarantee">
                <h4>{t('moneyBackGuarantee30Days', '30-Day Money Back Guarantee')}</h4>
                <p>{t('moneyBackGuaranteeDesc', 'Not satisfied? Get a full refund within 30 days, no questions asked.')}</p>
              </div>
            </div>
          )}
        </div>
      </MainContainer>
      <Footer />
    </div>
  );
};

export default PremiumUpgrade;