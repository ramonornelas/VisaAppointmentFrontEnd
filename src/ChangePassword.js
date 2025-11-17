import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Banner from './Banner';
import Footer from './Footer';
import HamburgerMenu from './HamburgerMenu';
import { changePassword } from './APIFunctions';
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

  const fastVisa_userid = sessionStorage.getItem('fastVisa_userid');
  const fastVisa_username = sessionStorage.getItem('fastVisa_username');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!currentPassword) {
      setError(t('currentPasswordRequired', 'Current password is required'));
      return;
    }

    if (!newPassword) {
      setError(t('newPasswordRequired', 'New password is required'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('passwordTooShort', 'Password must be at least 6 characters long'));
      return;
    }

    if (newPassword === currentPassword) {
      setError(t('newPasswordSameAsCurrent', 'New password must be different from current password'));
      return;
    }

    if (!confirmPassword) {
      setError(t('confirmPasswordRequired', 'Please confirm your password'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('passwordsNotMatch', 'Passwords do not match'));
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
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setError(t('errorChangingPassword', 'An error occurred while changing password'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
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
