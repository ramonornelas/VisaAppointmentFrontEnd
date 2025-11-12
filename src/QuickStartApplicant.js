import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Banner from './Banner';
import Footer from './Footer';
import LanguageSelector from './LanguageSelector';
import { getTranslatedCountries } from './utils/countries';
import { ALL_CITIES } from './utils/cities';
import { getRoles, authenticateAIS } from './APIFunctions';
import { BASE_URL } from './config.js';
import Select from 'react-select';
import './ApplicantForm.css';
import './RegisterUser.css';
import './LogIn.css';

const QuickStartApplicant = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Get translated countries list
  const countries = getTranslatedCountries(t);

  // Calculate minimum end date (290 days from today)
  const getMinEndDate = () => {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 290);
    return minDate.toISOString().split('T')[0];
  };
  const minEndDate = getMinEndDate();

  // Calculate search start date (180 days from today)
  const getSearchStartDate = () => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 180);
    return startDate;
  };
  const searchStartDate = getSearchStartDate();

  // Format date for display
  const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  // Get expiration date (one month from now)
  const getExpirationDate = () => {
    const now = new Date();
    const expirationDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate()
    );
    return expirationDate.toISOString().split('T')[0];
  };

  // Generate a random password
  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const [formData, setFormData] = useState({
    // User data - simplified
    phone_number: '',
    country_code: '',
    
    // Applicant data
    aisEmail: '',
    aisPassword: '',
    aisScheduleId: '',
    numberOfApplicants: '1',
    targetStartMode: 'days',
    targetStartDays: '180', // 6 months = ~180 days
    targetStartDate: '',
    targetEndDate: getMinEndDate(), // Set default to minimum date (290 days from today)
    selectedCities: [],
  });

  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [basicRoleId, setBasicRoleId] = useState(null);
  const [cities, setCities] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: form, 2: creating user, 3: creating applicant

  // Fetch basic_user role
  useEffect(() => {
    let isMounted = true;
    const fetchRoles = async () => {
      try {
        const roles = await getRoles();
        const basicRole = roles.find(role => role.name === 'basic_user');
        if (basicRole && isMounted) {
          setBasicRoleId(basicRole.id);
          setRolesLoaded(true);
        } else if (isMounted) {
          setSubmitError('Could not find the basic_user role. Please contact support.');
        }
      } catch (err) {
        if (isMounted) {
          setSubmitError('Failed to load configuration. Please try again later.');
        }
      }
    };
    fetchRoles();
    return () => { isMounted = false; };
  }, []);

  // Load cities when country changes
  useEffect(() => {
    if (formData.country_code) {
      const availableCities = ALL_CITIES[formData.country_code] || [];
      setCities(availableCities);
      
      // Auto-select if only one city
      if (availableCities.length === 1) {
        setFormData(prev => ({
          ...prev,
          selectedCities: [availableCities[0].city_code]
        }));
      } else {
        // Clear selection if switching countries
        setFormData(prev => ({ ...prev, selectedCities: [] }));
      }
    }
  }, [formData.country_code]);

  const handleChange = (e) => {
    // For react-select country dropdown
    if (e && e.__isCountrySelect) {
      setFormData({ ...formData, country_code: e.value });
      if (errors.country_code) setErrors({ ...errors, country_code: '' });
      return;
    }

    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData({ ...formData, [name]: val });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
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

  const validateForm = () => {
    const newErrors = {};

    // Simplified validations - only country and AIS credentials
    if (!formData.country_code) {
      newErrors.country_code = t('countryRequired', 'Country selection is required');
    }

    // AIS credentials validations - only if country has cities
    if (cities.length > 0) {
      if (!formData.aisEmail.trim()) {
        newErrors.aisEmail = t('aisEmailRequired', 'AIS Email is required');
      } else if (!/\S+@\S+\.\S+/.test(formData.aisEmail)) {
        newErrors.aisEmail = t('invalidEmail', 'Please enter a valid email');
      }

      if (!formData.aisPassword.trim()) {
        newErrors.aisPassword = t('aisPasswordRequired', 'AIS Password is required');
      }
    }

    // AIS Schedule ID and Number of Applicants will be obtained via API
    // No validation needed for these fields

    // Start mode is fixed for basic users, no validation needed
    // targetStartDays is always 180 for basic users

    if (!formData.targetEndDate) {
      newErrors.targetEndDate = t('endDateRequired', 'Target end date is required');
    } else {
      // Validar usando solo la parte de la fecha (YYYY-MM-DD) para evitar diferencias de horas
      const minEndDateStr = minEndDate; // minEndDate ya es YYYY-MM-DD
      const selectedEndDateStr = formData.targetEndDate;
      if (selectedEndDateStr < minEndDateStr) {
        newErrors.targetEndDate = t('endDateMinimum', 'Target end date must be at least 290 days from today');
      }
    }

    if (cities.length > 1 && formData.selectedCities.length === 0) {
      newErrors.selectedCities = t('cityRequired', 'Please select at least one city');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!rolesLoaded || !basicRoleId) {
      setSubmitError(t('loadingConfig', 'Configuration is still loading. Please wait.'));
      return;
    }

    if (!validateForm()) {
      return;
    }

    // Scroll to top to see loading progress
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setLoading(true);

    try {
      // Generate automatic password
      const generatedPassword = generatePassword();
      
      // Use AIS email as username (or generate one if no cities)
      let username, userName, aisScheduleId, numberOfApplicants;
      
      if (cities.length > 0) {
        // If country has cities, authenticate with AIS
        username = formData.aisEmail;
        
        // Call API to get user information from AIS credentials
        const aisUserInfo = await authenticateAIS({
          username: formData.aisEmail,
          password: formData.aisPassword,
          country_code: formData.country_code,
        });
        if (!aisUserInfo || !aisUserInfo.schedule_id) {
          throw new Error(t('aisAuthFailed', 'Failed to authenticate AIS credentials or retrieve schedule ID'));
        }
        userName = aisUserInfo.username;
        aisScheduleId = aisUserInfo.schedule_id;
        numberOfApplicants = '1'; // Default to 1, update if API returns more
      } else {
        // If country has no cities, use default values
        username = formData.aisEmail || `user_${Date.now()}@fastvisa.com`;
        userName = 'Quick Start User';
        aisScheduleId = '-';
        numberOfApplicants = '1';
      }
      
      // Step 1: Create User
      setCurrentStep(2);
      const userPayload = {
        name: userName, // TODO: From AIS API
        username: username, // Using AIS email as username
        email: username, // Email is the same as username
        password: generatedPassword,
        phone_number: formData.phone_number,
        active: true,
        expiration_date: getExpirationDate(),
        country_code: formData.country_code,
        role_id: basicRoleId,
        sendEmail: true,
        includePassword: true, // QuickStart always sends password in email
      };

      const userResponse = await fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userPayload),
      });

      if (!userResponse.ok) {
        throw new Error(t('userCreationFailed', 'Failed to create user account'));
      }

      // Get the created user's ID
      const searchUserResponse = await fetch(`${BASE_URL}/users/search`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username }),
      });

      if (!searchUserResponse.ok) {
        throw new Error(t('userSearchFailed', 'Failed to retrieve user data'));
      }

      const userData = await searchUserResponse.json();
      const userId = userData[0].id;
      const retrievedUserName = userData[0].name;

      // Step 2: Create Applicant
      setCurrentStep(3);
      const applicantPayload = {
        fastVisa_userid: userId,
        fastVisa_username: username,
        name: userName, // From AIS API or default
        ais_username: formData.aisEmail || '-',
        ais_password: cities.length > 0 ? formData.aisPassword : '-',
        ais_schedule_id: aisScheduleId, // From AIS API or default
        number_of_applicants: numberOfApplicants, // From AIS API or default
        applicant_active: true,
        target_start_mode: formData.targetStartMode,
        target_start_days: formData.targetStartMode === 'days' ? formData.targetStartDays : '-',
        target_start_date: formData.targetStartMode === 'date' ? formData.targetStartDate : '-',
        target_end_date: formData.targetEndDate,
        target_city_codes: formData.selectedCities.join(','),
        target_country_code: formData.country_code,
        consul_appointment_date: '',
        asc_appointment_date: '',
        container_id: '',
        container_start_datetime: '',
        container_stop_datetime: '',
        app_start_time: '',
      };

      const applicantResponse = await fetch(`${BASE_URL}/applicants`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicantPayload),
      });

      if (!applicantResponse.ok) {
        throw new Error(t('applicantCreationFailed', 'Failed to create applicant'));
      }

      const applicantData = await applicantResponse.json();
      const applicantId = applicantData.id;

      // Step 3: Log in the user automatically
      const loginResponse = await fetch('https://w3a0pdhqul.execute-api.us-west-1.amazonaws.com/auth/login', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username: username, 
          password: generatedPassword 
        }),
      });

      if (!loginResponse.ok) {
        throw new Error(t('loginFailed', 'Failed to log in'));
      }

      // Store session data
      sessionStorage.setItem('fastVisa_userid', userId);
      sessionStorage.setItem('fastVisa_username', username);
      sessionStorage.setItem('country_code', formData.country_code);
      sessionStorage.setItem('concurrent_applicants', '1'); // Basic users get 1
      sessionStorage.setItem('fastVisa_name', retrievedUserName);

      // Fetch and store user permissions
      const permissionsResponse = await fetch(`${BASE_URL}/users/permissions/${userId}`);
      if (permissionsResponse.ok) {
        const permissionsData = await permissionsResponse.json();
        sessionStorage.setItem('fastVisa_permissions', JSON.stringify(permissionsData));
      }

      // Step 4: Start the container for the applicant
      const startPayload = { applicant_id: applicantId };
      await fetch(`${BASE_URL}/applicants/start`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(startPayload),
      });

      // TODO: Send generated password to user's email
      // API call to send email with password and instructions to change it
      // await sendPasswordEmail(username, generatedPassword);

      // Redirect to applicant details page
      window.location.href = `/view-applicant/${applicantId}`;

    } catch (error) {
      console.error('Quick start error:', error);
      setSubmitError(error.message || t('unexpectedError', 'An unexpected error occurred'));
      setCurrentStep(1);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="login-root">
        <LanguageSelector />
        <div className="content-wrap">
          <Banner />
          <div className="applicant-form-container" style={{ minHeight: '100vh' }}>
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div style={{ marginBottom: '2rem' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', color: '#2563eb' }}></i>
              </div>
              {currentStep === 2 && (
                <>
                  <h2>{t('registeringUser', 'Creating your account...')}</h2>
                  <p style={{ color: '#666', marginTop: '1rem' }}>
                    {t('pleaseWait', 'Please wait while we set up your account')}
                  </p>
                </>
              )}
              {currentStep === 3 && (
                <>
                  <h2>{t('startingSearch', 'Starting appointment search...')}</h2>
                  <p style={{ color: '#666', marginTop: '1rem' }}>
                    {t('almostDone', 'Almost done! Setting up your appointment search')}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="login-root">
      <LanguageSelector />
      <div className="content-wrap">
        <Banner />
        <div className="applicant-form-container" style={{ minHeight: '100vh' }}>
          <div className="applicant-form-header">
            <div>
              <h1 className="applicant-form-title">
                <i className="fas fa-bolt" style={{ color: '#10b981' }}></i>
                {t('quickStart', 'Quick Start')}
              </h1>
              <p className="applicant-form-subtitle">
                {t('quickStartDescription', "Start using the app immediately. We'll create your account automatically.")}
              </p>
            </div>
          </div>

          <form id="quick-start-form" onSubmit={handleSubmit} className="applicant-form">
            {submitError && (
              <div className="applicant-form-error-banner">
                <i className="fas fa-exclamation-circle"></i>
                {submitError}
              </div>
            )}

            {/* Personal Information Section - Simplified */}
            <div className="applicant-form-section">
              <h2 className="applicant-form-section-title">
                <i className="fas fa-globe-americas"></i>
                {t('basicInfo', 'Basic Information')}
              </h2>
              
              <div className="applicant-form-row">
                <div className="applicant-form-field">
                  <label htmlFor="country_code" className="applicant-form-label">
                    {t('country', 'Country')} <span className="required">*</span>
                  </label>
                  <Select
                    inputId="country_code"
                    name="country_code"
                    classNamePrefix={errors.country_code ? 'error' : ''}
                    value={countries.find(c => c.value === formData.country_code) || null}
                    onChange={option => handleChange({ ...option, __isCountrySelect: true })}
                    options={countries}
                    placeholder={t('selectCountry', 'Select a country')}
                    isSearchable
                    formatOptionLabel={option => (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                        <span style={{ fontSize: '1.2em' }}>{option.flag}</span>
                        <span>{option.label}</span>
                      </div>
                    )}
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        borderColor: errors.country_code ? '#e11d48' : base.borderColor,
                        boxShadow: state.isFocused ? '0 0 0 1.5px #2563eb' : base.boxShadow,
                        minHeight: '36px',
                      }),
                    }}
                  />
                  {errors.country_code && <span className="applicant-form-error">{errors.country_code}</span>}
                </div>

                <div className="applicant-form-field">
                  <label htmlFor="phone_number" className="applicant-form-label">
                    {t('phoneNumber', 'Phone Number')} {t('optional', '(Optional)')}
                  </label>
                  <input
                    type="text"
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    className="applicant-form-input applicant-form-input-medium"
                    placeholder={t('enterPhone', 'Optional')}
                  />
                </div>
              </div>
            </div>

            {/* AIS Credentials Section */}
            <div className="applicant-form-section">
              <h2 className="applicant-form-section-title">
                <i className="fas fa-key"></i>
                {t('aisCredentials', 'AIS Appointment System Credentials')}
              </h2>
              
              <p style={{ 
                color: '#6b7280', 
                fontSize: '0.95rem', 
                marginBottom: '1.5rem',
                lineHeight: '1.5'
              }}>
                {t('aisCredentialsInfo', 'Enter your AIS login credentials. We will automatically retrieve your schedule ID and number of applicants from the AIS system.')}
              </p>

              <div className="applicant-form-row">
                <div className="applicant-form-field">
                  <label htmlFor="aisEmail" className="applicant-form-label">
                    {t('aisEmail', 'AIS Email')} <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="aisEmail"
                    name="aisEmail"
                    value={formData.aisEmail}
                    onChange={handleChange}
                    className={`applicant-form-input applicant-form-input-medium ${errors.aisEmail ? 'error' : ''}`}
                    placeholder="ais@example.com"
                  />
                  {errors.aisEmail && <span className="applicant-form-error">{errors.aisEmail}</span>}
                </div>

                <div className="applicant-form-field">
                  <label htmlFor="aisPassword" className="applicant-form-label">
                    {t('aisPassword', 'AIS Password')} <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    id="aisPassword"
                    name="aisPassword"
                    value={formData.aisPassword}
                    onChange={handleChange}
                    className={`applicant-form-input applicant-form-input-medium ${errors.aisPassword ? 'error' : ''}`}
                    placeholder={t('enterAisPassword', 'Enter AIS password')}
                  />
                  {errors.aisPassword && <span className="applicant-form-error">{errors.aisPassword}</span>}
                </div>
              </div>
            </div>

            {/* Target Dates Section */}
            <div className="applicant-form-section">
              <h2 className="applicant-form-section-title">
                <i className="fas fa-calendar-alt"></i>
                {t('targetDates', 'Target Dates')}
              </h2>

              {/* Info banner for basic users */}
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
                    <strong>{t('basicUserSearchInfo', 'Basic User Search Settings:')}</strong> {t('basicUserSearchDesc', 'Your appointment search will start 6 months from today.')}
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#0369a1', fontSize: '0.9rem' }}>
                    💎 <strong>{t('premiumUpgradeNote', 'Premium users')}</strong> {t('premiumCanSearchTomorrow', 'can search for appointments starting from tomorrow.')}
                  </p>
                </div>
              </div>

              <div className="applicant-form-row">
                <div className="applicant-form-field">
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
                      {t('sixMonthsFromToday', '6 months from today (180 days)')}
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
                      {t('startDate', 'Start date')}: {formatDate(searchStartDate)}
                    </div>
                  </div>
                </div>

                <div className="applicant-form-field">
                  <label htmlFor="targetEndDate" className="applicant-form-label">
                    {t('targetEndDate', 'Target End Date')} <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="targetEndDate"
                    name="targetEndDate"
                    value={formData.targetEndDate}
                    onChange={handleChange}
                    min={minEndDate}
                    className={`applicant-form-input applicant-form-input-date ${errors.targetEndDate ? 'error' : ''}`}
                  />
                  {errors.targetEndDate && <span className="applicant-form-error">{errors.targetEndDate}</span>}
                  <small style={{ 
                    display: 'block', 
                    marginTop: '6px', 
                    color: '#6b7280', 
                    fontSize: '0.875rem',
                    lineHeight: '1.4'
                  }}>
                    <i className="fas fa-info-circle" style={{ marginRight: '4px', color: '#9ca3af' }}></i>
                    {t('targetEndDateExplanation', 'This is the latest date you would accept for an appointment. The search will look for appointments between 6 months from now and this date.')}
                  </small>
                </div>
              </div>
            </div>

            {/* Target Cities Section */}
            {formData.country_code && (
              <div className="applicant-form-section" style={{ borderBottom: 'none', marginBottom: '36px', paddingBottom: 0 }}>
                <h2 className="applicant-form-section-title">
                  <i className="fas fa-map-marker-alt"></i>
                  {t('targetCities', 'Target Cities')} {cities.length > 1 && <span className="required">*</span>}
                </h2>
                
                {cities.length === 0 ? (
                  <div style={{
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '8px',
                    padding: '1rem',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start'
                  }}>
                    <i className="fas fa-globe" style={{ color: '#0284c7', marginTop: '2px', fontSize: '1.1rem' }}></i>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, color: '#0c4a6e', fontSize: '0.95rem', lineHeight: '1.5' }}>
                        <strong>{t('searchAllCities', 'Search in all cities:')}</strong> {t('searchAllCitiesDesc', 'The search will be performed in all available cities for this country.')}
                      </p>
                      <p style={{ margin: '0.5rem 0 0 0', color: '#0369a1', fontSize: '0.9rem' }}>
                        💎 <strong>{t('premiumCitySelection', 'Premium users')}</strong> {t('premiumCanSelectCities', 'can select specific cities for their search.')}
                      </p>
                    </div>
                  </div>
                ) : cities.length === 1 ? (
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
                onClick={handleCancel}
                className="applicant-form-btn applicant-form-btn-cancel"
                disabled={loading}
              >
                <i className="fas fa-times"></i>
                {t('cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                className="applicant-form-btn applicant-form-btn-submit"
                disabled={loading || !rolesLoaded}
                style={{ backgroundColor: '#10b981' }}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    {t('processing', 'Processing...')}
                  </>
                ) : (
                  <>
                    <i className="fas fa-bolt"></i>
                    {t('startNow', 'Start Now')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default QuickStartApplicant;
