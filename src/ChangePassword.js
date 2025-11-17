import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Banner from './Banner';
import Footer from './Footer';
import HamburgerMenu from './HamburgerMenu';
import { changePassword } from './APIFunctions';
import FastVisaMetrics from './utils/FastVisaMetrics';
import './ChangePassword.css';

const ChangePassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Initialize metrics tracker
  const metrics = new FastVisaMetrics();

  const fastVisa_userid = sessionStorage.getItem('fastVisa_userid');
  const fastVisa_username = sessionStorage.getItem('fastVisa_username');

  // Track page view when component mounts
  useEffect(() => {
    metrics.trackPageView();
    
    // Set user ID if available
    if (fastVisa_userid) {
      metrics.setUserId(fastVisa_userid);
    }
    
    // Track custom event for change password page visit
    metrics.trackCustomEvent('change_password_page_visit', {
      page: 'change_password',
      timestamp: new Date().toISOString()
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Track form submit attempt
    metrics.trackFormSubmit('change-password-form', false); // false initially, will update on success

    // Track custom event for password change attempt
    metrics.trackCustomEvent('password_change_attempt', {
      timestamp: new Date().toISOString()
    });

    // Validation
    if (!currentPassword) {
      setError(t('currentPasswordRequired', 'Current password is required'));
      
      // Track validation error
      metrics.trackCustomEvent('password_change_validation_error', {
        error: 'current_password_required',
        timestamp: new Date().toISOString()
      });
      
      return;
    }

    if (!newPassword) {
      setError(t('newPasswordRequired', 'New password is required'));
      
      // Track validation error
      metrics.trackCustomEvent('password_change_validation_error', {
        error: 'new_password_required',
        timestamp: new Date().toISOString()
      });
      
      return;
    }

    if (newPassword.length < 6) {
      setError(t('passwordTooShort', 'Password must be at least 6 characters long'));
      
      // Track validation error
      metrics.trackCustomEvent('password_change_validation_error', {
        error: 'password_too_short',
        timestamp: new Date().toISOString()
      });
      
      return;
    }

    if (newPassword === currentPassword) {
      setError(t('newPasswordSameAsCurrent', 'New password must be different from current password'));
      
      // Track validation error
      metrics.trackCustomEvent('password_change_validation_error', {
        error: 'new_password_same_as_current',
        timestamp: new Date().toISOString()
      });
      
      return;
    }

    if (!confirmPassword) {
      setError(t('confirmPasswordRequired', 'Please confirm your password'));
      
      // Track validation error
      metrics.trackCustomEvent('password_change_validation_error', {
        error: 'confirm_password_required',
        timestamp: new Date().toISOString()
      });
      
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('passwordsNotMatch', 'Passwords do not match'));
      
      // Track validation error
      metrics.trackCustomEvent('password_change_validation_error', {
        error: 'passwords_not_match',
        timestamp: new Date().toISOString()
      });
      
      return;
    }

    setLoading(true);

    try {
      const response = await changePassword({
        userId: fastVisa_userid,
        username: fastVisa_username,
        currentPassword,
        newPassword,
      });

      if (response && response.success) {
        setSuccess(t('passwordChangedSuccess', 'Password changed successfully'));
        
        // Track successful password change
        metrics.trackFormSubmit('change-password-form', true);
        metrics.trackCustomEvent('password_changed_success', {
          timestamp: new Date().toISOString()
        });
        
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Redirect to applicants or appropriate page after 2 seconds
        setTimeout(() => {
          navigate('/applicants');
        }, 2000);
      } else {
        setError(response?.message || t('failedToChangePassword', 'Failed to change password'));
        
        // Track password change failure
        metrics.trackCustomEvent('password_change_failed', {
          error: response?.message || 'API error',
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setError(t('errorChangingPassword', 'An error occurred while changing password'));
      
      // Track password change exception
      metrics.trackCustomEvent('password_change_error', {
        error: err.message || 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Track cancel button click
    metrics.trackButtonClick('cancel-change-password-btn', 'Cancel Change Password');
    
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="change-password-root">
      <HamburgerMenu />
      <div className="content-wrap">
        <Banner />
        <div className="change-password-container">
          <div className="change-password-card">
            <h1 className="change-password-title">
              <i className="fas fa-lock"></i> {t('changePassword', 'Change Password')}
            </h1>
            <p className="change-password-subtitle">
              {t('changePasswordDescription', 'Enter your current password and choose a new one')}
            </p>

            <form onSubmit={handleSubmit} className="change-password-form">
              {/* Current Password */}
              <div className="input-group">
                <label htmlFor="currentPassword" className="input-label">
                  {t('currentPassword', 'Current Password')} <span className="required">*</span>
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    id="currentPassword"
                    className="input-field"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    tabIndex="-1"
                  >
                    <i className={showCurrentPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="input-group">
                <label htmlFor="newPassword" className="input-label">
                  {t('newPassword', 'New Password')} <span className="required">*</span>
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    className="input-field"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    placeholder={t('enterPassword', 'At least 6 characters')}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    tabIndex="-1"
                  >
                    <i className={showNewPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="input-group">
                <label htmlFor="confirmPassword" className="input-label">
                  {t('confirmNewPassword', 'Confirm New Password')} <span className="required">*</span>
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    className="input-field"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    placeholder={t('confirmYourPassword', 'Re-enter password')}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex="-1"
                  >
                    <i className={showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i> {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="success-message">
                  <i className="fas fa-check-circle"></i> {success}
                </div>
              )}

              {/* Buttons */}
              <div className="button-group">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-cancel"
                  disabled={loading}
                >
                  {t('cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> {t('updating', 'Updating...')}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i> {t('changePassword', 'Change Password')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ChangePassword;
