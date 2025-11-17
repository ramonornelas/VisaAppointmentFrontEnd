import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './utils/AuthContext';
import { permissions } from './utils/permissions';
import HamburgerMenu from './HamburgerMenu';
import { ApplicantDetails, ApplicantUpdate, authenticateAIS, createApplicant } from './APIFunctions';
import { ALL_CITIES } from './utils/cities';
import './ApplicantForm.css';
import './index.css';

const ApplicantForm = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  
  const applicantId = searchParams.get('id');
  const isEditMode = !!applicantId;

  // Session data
  const fastVisaUserId = sessionStorage.getItem('fastVisa_userid');
  const fastVisaUsername = sessionStorage.getItem('fastVisa_username');
  const countryCode = sessionStorage.getItem('country_code');

  // Determine initial targetStartDays based on user permissions
  const initialTargetStartDays = permissions.canManageApplicants() ? '1' : '120';

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    aisEmail: '',
    aisPassword: '',
    aisScheduleId: '',
    numberOfApplicants: '1',
    applicantActive: true,
    targetStartMode: 'days',
    targetStartDays: initialTargetStartDays, // Basic users: 120 days, Admins: 1 day
    targetStartDate: '',
    targetEndDate: '',
    selectedCities: [],
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [cities, setCities] = useState([]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [aisAuthSuccess, setAisAuthSuccess] = useState(false);

  // Format date for display
  const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(i18n.language, options);
  };

  // Calculate minimum end date (210 days from today) for basic users
  const getMinEndDate = () => {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 210);
    return minDate.toISOString().split('T')[0];
  };

  // Calculate search start date based on days
  const getSearchStartDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight to avoid timezone issues
    const startDate = new Date(today);
    const daysToAdd = parseInt(formData.targetStartDays) || 3;
    startDate.setDate(startDate.getDate() + daysToAdd);
    return startDate;
  };

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Load cities
  useEffect(() => {
    const availableCities = ALL_CITIES[countryCode] || [];
    setCities(availableCities);
    
    // Auto-select if only one city
    if (availableCities.length === 1) {
      setFormData(prev => ({
        ...prev,
        selectedCities: [availableCities[0].city_code]
      }));
    }
  }, [countryCode]);

  // Load applicant data in edit mode
  useEffect(() => {
    if (isEditMode && applicantId) {
      setLoading(true);
      ApplicantDetails(applicantId)
        .then(data => {
          if (data) {
            // For basic users (non-admins), force targetStartDays to 120 if in days mode
            const startDays = data.target_start_days || '3';
            const finalStartDays = !permissions.canSearchUnlimited() && data.target_start_mode === 'days' 
              ? '120' 
              : startDays;
            
            setFormData({
              name: data.name || '',
              aisEmail: data.ais_username || '',
              aisPassword: '', // Never pre-fill password
              aisScheduleId: data.ais_schedule_id || '',
              numberOfApplicants: data.number_of_applicants || '1',
              applicantActive: data.applicant_active ?? true,
              targetStartMode: data.target_start_mode || 'date',
              targetStartDays: finalStartDays,
              targetStartDate: data.target_start_date || '',
              targetEndDate: data.target_end_date || '',
              selectedCities: data.target_city_codes ? data.target_city_codes.split(',') : [],
            });
          }
        })
        .catch(error => {
          console.error('Error loading applicant:', error);
          setSubmitError(t('failedToLoadApplicant', 'Failed to load applicant data'));
        })
        .finally(() => setLoading(false));
    }
  }, [isEditMode, applicantId]);

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCityToggle = (cityCode) => {
    setFormData(prev => {
      const isSelected = prev.selectedCities.includes(cityCode);
      return {
        ...prev,
        selectedCities: isSelected
          ? prev.selectedCities.filter(c => c !== cityCode)
          : [...prev.selectedCities, cityCode]
      };
    });
    
    if (errors.selectedCities) {
      setErrors(prev => ({ ...prev, selectedCities: '' }));
    }
  };

  // Function to authenticate Visa credentials and get schedule info
  const handleAuthenticateAIS = async () => {
    // Validate email and password first
    const newErrors = {};
    if (!formData.aisEmail.trim()) {
      newErrors.aisEmail = t('visaEmailRequired', 'Visa Appointment System Email is required');
    } else if (!/\S+@\S+\.\S+/.test(formData.aisEmail)) {
      newErrors.aisEmail = t('pleaseEnterValidEmail', 'Please enter a valid email');
    }
    if (!formData.aisPassword.trim()) {
      newErrors.aisPassword = t('visaPasswordRequired', 'Visa Appointment System Password is required');
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsAuthenticating(true);
    setAisAuthSuccess(false);
    
    try {
      const aisUserInfo = await authenticateAIS({
        username: formData.aisEmail,
        password: formData.aisPassword,
        country_code: countryCode,
      });

      if (!aisUserInfo || !aisUserInfo.schedule_id) {
        setErrors({ 
          ...errors, 
          aisEmail: t('failedToAuthVisa', 'Failed to authenticate Visa Appointment System credentials. Please check your email and password.'),
        });
        setFormData(prev => ({
          ...prev,
          aisScheduleId: '',
          numberOfApplicants: '1',
        }));
        return;
      }

      // Successfully authenticated - update fields
      setFormData(prev => ({
        ...prev,
        name: aisUserInfo.applicant_name || prev.name, // Auto-fill name from AIS
        aisScheduleId: aisUserInfo.schedule_id,
        numberOfApplicants: '1', // Default to 1 until API provides this info
      }));
      setAisAuthSuccess(true);
      
      // Clear any existing errors
      setErrors({});
      
    } catch (error) {
      console.error('AIS authentication error:', error);
      setErrors({ 
        ...errors, 
        aisEmail: t('authErrorOccurred', 'An error occurred while authenticating. Please try again.'),
      });
      setFormData(prev => ({
        ...prev,
        aisScheduleId: '',
        numberOfApplicants: '1',
      }));
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t('nameRequired', 'Name is required');
    }

    if (!formData.aisEmail.trim()) {
      newErrors.aisEmail = t('visaEmailRequired', 'Visa Appointment System Email is required');
    } else if (!/\S+@\S+\.\S+/.test(formData.aisEmail)) {
      newErrors.aisEmail = t('pleaseEnterValidEmail', 'Please enter a valid email');
    }

    // Schedule ID and number of applicants will be auto-filled from Visa
    // No need to validate manually entered values anymore

    if (formData.targetStartMode === 'days' && !formData.targetStartDays) {
      newErrors.targetStartDays = t('startDaysRequired', 'Required when using days mode');
    }

    if (formData.targetStartMode === 'date' && !formData.targetStartDate) {
      newErrors.targetStartDate = t('startDateRequired', 'Required when using date mode');
    }

    if (!formData.targetEndDate) {
      newErrors.targetEndDate = t('endDateRequired', 'Target end date is required');
    }

    if (cities.length > 1 && formData.selectedCities.length === 0) {
      newErrors.selectedCities = t('cityRequired', 'Please select at least one city');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const payload = {
      ais_schedule_id: formData.aisScheduleId,
      ais_username: formData.aisEmail,
      name: formData.name,
      number_of_applicants: formData.numberOfApplicants,
      applicant_active: formData.applicantActive,
      target_start_mode: formData.targetStartMode,
      target_start_days: formData.targetStartMode === 'days' ? formData.targetStartDays : '-',
      target_start_date: formData.targetStartMode === 'date' ? formData.targetStartDate : '-',
      target_end_date: formData.targetEndDate,
      target_city_codes: formData.selectedCities.join(','),
      target_country_code: countryCode,
    };

    // Add password if provided (optional in edit mode, required for create)
    if (formData.aisPassword.trim()) {
      payload.ais_password = formData.aisPassword;
    }

    try {
      if (isEditMode) {
        // Update existing applicant
        await ApplicantUpdate(applicantId, payload);
        // Redirect based on permissions
        if (permissions.canManageApplicants()) {
          navigate('/applicants');
        } else {
          navigate(`/view-applicant/${applicantId}`);
        }
      } else {
        // Create new applicant - password is required
        if (!formData.aisPassword.trim()) {
          setSubmitError(t('passwordRequiredForNewApplicants', 'Password is required for new applicants'));
          setLoading(false);
          return;
        }

        const createPayload = {
          ...payload,
          ais_password: formData.aisPassword,
          fastVisa_userid: fastVisaUserId,
          fastVisa_username: fastVisaUsername,
          consul_appointment_date: '',
          asc_appointment_date: '',
          container_id: '',
          container_start_datetime: '',
          container_stop_datetime: '',
          app_start_time: '',
        };

        const newApplicant = await createApplicant(createPayload);
        
        if (!newApplicant) {
          throw new Error(t('failedToCreateApplicant', 'Failed to create applicant'));
        }

        // Redirect based on permissions
        if (permissions.canManageApplicants()) {
          navigate('/applicants');
        } else {
          navigate(`/view-applicant/${newApplicant.id}`);
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError(isEditMode ? t('failedToUpdateApplicant', 'Failed to update applicant') : t('failedToCreateApplicant', 'Failed to create applicant'));
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <>
        <HamburgerMenu />
        <div className="applicant-form-container">
          <div className="applicant-form-loading">
            <i className="fas fa-spinner fa-spin"></i>
            <p>{t('loadingApplicant', 'Loading applicant data...')}</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <HamburgerMenu />
      <div className="applicant-form-container">
        <div className="applicant-form-header">
          <div>
            <h1 className="applicant-form-title">
              {isEditMode ? (
                <>
                  <i className={permissions.canManageApplicants() ? "fas fa-edit" : "fas fa-calendar-check"}></i>
                  {permissions.canManageApplicants() ? t('editApplicant', 'Edit Applicant') : t('myAppointment', 'My Appointment')}
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i>
                  {t('newApplicant', 'New Applicant')}
                </>
              )}
            </h1>
            <p className="applicant-form-subtitle">
              {isEditMode 
                ? (permissions.canManageApplicants() 
                    ? t('updateApplicantInfo', 'Update the information for this applicant')
                    : t('updateAppointmentSettings', 'Update your appointment search settings'))
                : t('fillDetailsToRegister', 'Fill in the details to register a new applicant')}
            </p>
          </div>
          
          {/* Top Action Buttons */}
          <div className="applicant-form-header-actions">
            {isEditMode && permissions.canManageApplicants() && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                marginRight: '1rem',
                padding: '8px 12px',
                backgroundColor: '#f9fafb',
                borderRadius: '6px',
                border: '1px solid #e5e7eb'
              }}>
                <div 
                  className="toggle-switch" 
                  data-title={formData.applicantActive ? t('clickToDeactivate', 'Click to deactivate') : t('clickToActivate', 'Click to activate')}
                  onClick={() => handleInputChange({ target: { name: 'applicantActive', type: 'checkbox', checked: !formData.applicantActive } })}
                >
                  <div className={`switch-track${formData.applicantActive ? " active" : ""}`}></div>
                  <div className={`switch-thumb${formData.applicantActive ? " active" : ""}`}></div>
                </div>
                <label style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: '500',
                  color: formData.applicantActive ? '#059669' : '#6b7280',
                  cursor: 'pointer',
                  userSelect: 'none',
                  margin: 0
                }}
                onClick={() => handleInputChange({ target: { name: 'applicantActive', type: 'checkbox', checked: !formData.applicantActive } })}
                >
                  {formData.applicantActive ? t('active', 'Active') : t('inactive', 'Inactive')}
                </label>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                if (permissions.canManageApplicants()) {
                  navigate('/applicants');
                } else if (isEditMode) {
                  navigate(`/view-applicant/${applicantId}`);
                } else {
                  navigate('/');
                }
              }}
              className="applicant-form-btn applicant-form-btn-cancel"
              disabled={loading}
            >
              <i className="fas fa-times"></i>
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              form="applicant-form"
              className="applicant-form-btn applicant-form-btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  {isEditMode ? t('updating', 'Updating...') : t('creating', 'Creating...')}
                </>
              ) : (
                <>
                  <i className={isEditMode ? 'fas fa-save' : 'fas fa-check'}></i>
                  {isEditMode ? t('updateApplicant', 'Update Applicant') : t('createApplicant', 'Create Applicant')}
                </>
              )}
            </button>
          </div>
        </div>

        <form id="applicant-form" onSubmit={handleSubmit} className="applicant-form">
          {submitError && (
            <div className="applicant-form-error-banner">
              <i className="fas fa-exclamation-circle"></i>
              {submitError}
            </div>
          )}

          {/* Visa Credentials Section */}
          <div className="applicant-form-section">
            <h2 className="applicant-form-section-title">
              <i className="fas fa-key"></i>
              {t('aisCredentials', 'Visa Appointment System Credentials')}
            </h2>
            
            <div className="applicant-form-row">
              <div className="applicant-form-field">
                <label htmlFor="aisEmail" className="applicant-form-label">
                  {t('visaAppointmentSystemEmail', 'Visa Appointment System Email')} <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="aisEmail"
                  name="aisEmail"
                  value={formData.aisEmail}
                  onChange={(e) => {
                    handleInputChange(e);
                    setAisAuthSuccess(false);
                  }}
                  className={`applicant-form-input applicant-form-input-medium ${errors.aisEmail ? 'error' : ''}`}
                  placeholder="visa@example.com"
                />
                {errors.aisEmail && <span className="applicant-form-error">{errors.aisEmail}</span>}
              </div>

              <div className="applicant-form-field">
                <label htmlFor="aisPassword" className="applicant-form-label">
                  {t('visaAppointmentSystemPassword', 'Visa Appointment System Password')} {!isEditMode && <span className="required">*</span>}
                </label>
                <input
                  type="password"
                  id="aisPassword"
                  name="aisPassword"
                  value={formData.aisPassword}
                  onChange={(e) => {
                    handleInputChange(e);
                    setAisAuthSuccess(false);
                  }}
                  className={`applicant-form-input applicant-form-input-medium ${errors.aisPassword ? 'error' : ''}`}
                  placeholder={isEditMode ? t('leaveEmptyToKeepPassword', 'Leave empty to keep current password') : t('enterVisaPassword', 'Enter Visa Appointment System password')}
                />
                {errors.aisPassword && <span className="applicant-form-error">{errors.aisPassword}</span>}
              </div>
            </div>
            
            {/* Button to authenticate Visa and auto-fill schedule info */}
            <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={handleAuthenticateAIS}
                disabled={isAuthenticating || !formData.aisEmail || !formData.aisPassword}
                style={{
                  padding: '12px 24px',
                  backgroundColor: aisAuthSuccess ? '#10b981' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isAuthenticating || !formData.aisEmail || !formData.aisPassword ? 'not-allowed' : 'pointer',
                  opacity: isAuthenticating || !formData.aisEmail || !formData.aisPassword ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.95rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
              >
                {isAuthenticating ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    {t('authenticating', 'Authenticating...')}
                  </>
                ) : aisAuthSuccess ? (
                  <>
                    <i className="fas fa-check-circle"></i>
                    {t('authenticationSuccessful', 'Authentication Successful')}
                  </>
                ) : (
                  <>
                    <i className="fas fa-key"></i>
                    {t('authenticate', 'Authenticate')}
                  </>
                )}
              </button>
              <small style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '8px', display: 'block' }}>
                {t('clickToVerifyCredentials', 'Click to verify your Visa Appointment System credentials and automatically retrieve your Schedule ID')}
              </small>
            </div>

            {/* Schedule ID - read-only, auto-filled */}
            <div className="applicant-form-row">
              <div className="applicant-form-field">
                <label htmlFor="aisScheduleId" className="applicant-form-label">
                  {t('aisScheduleId', 'Schedule ID')} <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="aisScheduleId"
                  name="aisScheduleId"
                  value={formData.aisScheduleId}
                  readOnly
                  className="applicant-form-input applicant-form-input-medium"
                  style={{ 
                    backgroundColor: '#f3f4f6', 
                    cursor: 'not-allowed',
                    color: '#4b5563'
                  }}
                  placeholder={t('autoFilledAfterAuth', 'Auto-filled after authentication')}
                />
                <small style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '4px', display: 'block' }}>
                  {t('scheduleIdAutoFilledInfo', 'This field is automatically filled after authenticating with Visa Appointment System')}
                </small>
              </div>

              <div className="applicant-form-field">
                <label htmlFor="name" className="applicant-form-label">
                  {t('fullName', 'Full Name')} <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`applicant-form-input applicant-form-input-medium ${errors.name ? 'error' : ''}`}
                  placeholder={t('autoFilledAfterAuth', 'Auto-filled after authentication')}
                />
                {errors.name && <span className="applicant-form-error">{errors.name}</span>}
                <small style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '4px', display: 'block' }}>
                  {t('nameAutoFilledInfo', 'This field is automatically filled after authenticating with Visa Appointment System')}
                </small>
              </div>
            </div>
          </div>

          {/* Target Dates Section */}
          <div className="applicant-form-section" style={cities.length === 0 ? { borderBottom: 'none', marginBottom: '36px', paddingBottom: 0 } : {}}>
            <h2 className="applicant-form-section-title">
              <i className="fas fa-calendar-alt"></i>
              {t('targetDates', 'Target Dates')}
            </h2>

            {!permissions.canSearchUnlimited() && formData.targetStartMode === 'days' && formData.targetStartDays === '120' && (
              <div style={{
                backgroundColor: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start'
              }}>
                <i className="fas fa-info-circle" style={{ color: '#0284c7', marginTop: '2px', fontSize: '1.1rem' }}></i>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, color: '#0c4a6e', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    <strong>{t('basicUserSearchSettings', 'Basic User Search Settings:')}</strong> {t('searchWillStartIn', 'Your appointment search will start 4 months from today.')}
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#0369a1', fontSize: '0.9rem' }}>
                    💎 <strong>{t('premiumUpgradeNote', 'Premium users')}</strong> {t('premiumUsersCanSearchTomorrow', 'can search for appointments starting from tomorrow.')}{' '}
                    <a 
                      href="/premium-upgrade" 
                      style={{ 
                        color: '#0284c7', 
                        textDecoration: 'underline',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/premium-upgrade');
                        window.scrollTo(0, 0);
                      }}
                    >
                      {t('upgradeToPremium', 'Upgrade to Premium')}
                    </a>
                  </p>
                </div>
              </div>
            )}

            {permissions.canSearchUnlimited() && (
              <div className="applicant-form-field">
                <label htmlFor="targetStartMode" className="applicant-form-label">
                  {t('startMode', 'Start Mode')} <span className="required">*</span>
                </label>
                <div className="applicant-form-radio-group">
                  <label className="applicant-form-radio-label">
                    <input
                      type="radio"
                      name="targetStartMode"
                      value="days"
                      checked={formData.targetStartMode === 'days'}
                      onChange={handleInputChange}
                      className="applicant-form-radio"
                    />
                    <span>{t('daysFromNow', 'Days from Now')}</span>
                  </label>
                  <label className="applicant-form-radio-label">
                    <input
                      type="radio"
                      name="targetStartMode"
                      value="date"
                      checked={formData.targetStartMode === 'date'}
                      onChange={handleInputChange}
                      className="applicant-form-radio"
                    />
                    <span>{t('specificDate', 'Specific Date')}</span>
                  </label>
                </div>
              </div>
            )}

            <div className="applicant-form-row" style={{ marginTop: '1.5rem' }}>
              {formData.targetStartMode === 'days' && (
                <div className="applicant-form-field">
                  {permissions.canSearchUnlimited() ? (
                    <>
                      <label htmlFor="targetStartDays" className="applicant-form-label">
                        {t('startAfterDays', 'Start After (Days)')} <span className="required">*</span>
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <input
                          type="number"
                          id="targetStartDays"
                          name="targetStartDays"
                          value={formData.targetStartDays}
                          onChange={handleInputChange}
                          min="1"
                          className={`applicant-form-input applicant-form-input-small ${errors.targetStartDays ? 'error' : ''}`}
                          style={{ margin: 0 }}
                        />
                        {formData.targetStartDays && (
                          <div style={{
                            padding: '8px 16px',
                            backgroundColor: '#f0f9ff',
                            border: '1px solid #bae6fd',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            color: '#059669',
                            fontWeight: '600',
                            whiteSpace: 'nowrap'
                          }}>
                            <i className="fas fa-calendar-day" style={{ marginRight: '6px' }}></i>
                            {t('startDate', 'Start date')}: {formatDate(getSearchStartDate())}
                          </div>
                        )}
                      </div>
                      {errors.targetStartDays && <span className="applicant-form-error">{errors.targetStartDays}</span>}
                    </>
                  ) : (
                    <>
                      <label className="applicant-form-label">
                        {t('searchStartsIn', 'Search Starts In')}
                      </label>
                      <div style={{
                        padding: '12px 16px',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        color: '#4b5563',
                        fontSize: '1rem',
                        fontWeight: '500'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                          <i className="fas fa-clock" style={{ marginRight: '8px', color: '#6b7280' }}></i>
                          {t('fourMonthsFromToday', '4 months from today (120 days)')}
                        </div>
                        <div style={{
                          marginTop: '8px',
                          paddingTop: '8px',
                          borderTop: '1px solid #d1d5db',
                          fontSize: '0.95rem',
                          color: '#059669',
                          fontWeight: '600'
                        }}>
                          <i className="fas fa-calendar-day" style={{ marginRight: '6px' }}></i>
                          {t('startDate', 'Start date')}: {formatDate(getSearchStartDate())}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {formData.targetStartMode === 'date' && (
                <div className="applicant-form-field">
                  <label htmlFor="targetStartDate" className="applicant-form-label">
                    {t('targetStartDate', 'Target Start Date')} <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="targetStartDate"
                    name="targetStartDate"
                    value={formData.targetStartDate}
                    onChange={handleInputChange}
                    className={`applicant-form-input applicant-form-input-date ${errors.targetStartDate ? 'error' : ''}`}
                  />
                  {errors.targetStartDate && <span className="applicant-form-error">{errors.targetStartDate}</span>}
                </div>
              )}

              <div className="applicant-form-field">
                <label htmlFor="targetEndDate" className="applicant-form-label">
                  {t('targetEndDate', 'Target End Date')} <span className="required">*</span>
                </label>
                <input
                  type="date"
                  id="targetEndDate"
                  name="targetEndDate"
                  value={formData.targetEndDate}
                  onChange={handleInputChange}
                  min={!permissions.canSearchUnlimited() ? getMinEndDate() : undefined}
                  className={`applicant-form-input applicant-form-input-date ${errors.targetEndDate ? 'error' : ''}`}
                />
                {errors.targetEndDate && <span className="applicant-form-error">{errors.targetEndDate}</span>}
                {!permissions.canSearchUnlimited() && (
                  <small style={{ 
                    display: 'block', 
                    marginTop: '6px', 
                    color: '#6b7280', 
                    fontSize: '0.875rem',
                    lineHeight: '1.4'
                  }}>
                    <i className="fas fa-info-circle" style={{ marginRight: '4px', color: '#9ca3af' }}></i>
                    {t('targetEndDateExplanation', 'This is the latest date you would accept for an appointment. The search will look for appointments between 4 months from now and this date. Minimum: 210 days from today.')}
                  </small>
                )}
              </div>
            </div>
          </div>

          {/* Target Cities Section */}
          {cities.length > 0 && (
            <div className="applicant-form-section">
              <h2 className="applicant-form-section-title">
                <i className="fas fa-map-marker-alt"></i>
                {t('targetCities', 'Target Cities')} {cities.length > 1 && <span className="required">*</span>}
              </h2>
              
              {cities.length === 1 ? (
                <div className="applicant-form-city-single">
                  <i className="fas fa-check-circle"></i>
                  <span>{cities[0].city_name}</span>
                  <span className="applicant-form-city-code">({cities[0].city_code})</span>
                </div>
              ) : (
                <div className="applicant-form-cities-grid">
                  {cities.map(city => (
                    <label key={city.city_code} className="applicant-form-city-card">
                      <input
                        type="checkbox"
                        checked={formData.selectedCities.includes(city.city_code)}
                        onChange={() => handleCityToggle(city.city_code)}
                        className="applicant-form-city-checkbox"
                      />
                      <div className="applicant-form-city-content">
                        <span className="applicant-form-city-name">{city.city_name}</span>
                        <span className="applicant-form-city-code-badge">{city.city_code}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
              {errors.selectedCities && <span className="applicant-form-error">{errors.selectedCities}</span>}
            </div>
          )}

          {/* Form Actions */}
          <div className="applicant-form-actions">
            <button
              type="button"
              onClick={() => {
                if (permissions.canManageApplicants()) {
                  navigate('/applicants');
                } else if (isEditMode) {
                  navigate(`/view-applicant/${applicantId}`);
                } else {
                  navigate('/');
                }
              }}
              className="applicant-form-btn applicant-form-btn-cancel"
              disabled={loading}
            >
              <i className="fas fa-times"></i>
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="applicant-form-btn applicant-form-btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  {isEditMode ? t('updating', 'Updating...') : t('creating', 'Creating...')}
                </>
              ) : (
                <>
                  <i className={isEditMode ? 'fas fa-save' : 'fas fa-check'}></i>
                  {isEditMode ? t('updateApplicant', 'Update Applicant') : t('createApplicant', 'Create Applicant')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ApplicantForm;
