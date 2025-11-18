import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Banner from './Banner';
import Footer from './Footer';
import LanguageSelector from './LanguageSelector';
import { getTranslatedCountries } from './utils/countries';
import { ALL_CITIES } from './utils/cities';
import FastVisaMetrics from './utils/FastVisaMetrics';
import { 
  getRoles, 
  authenticateAIS, 
  notifyAdminAISFailure,
  createUser,
  searchUserByUsername,
  createApplicant,
  loginUser,
  getUserPermissions,
  StartApplicantContainer
} from './APIFunctions';
import Select from 'react-select';
import './ApplicantForm.css';
import './RegisterUser.css';
import './LogIn.css';

const QuickStartApplicant = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Get translated countries list
  const countries = getTranslatedCountries(t);

  // Calculate minimum end date (210 days from today) - Updated Nov 2025
  const getMinEndDate = () => {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 210);
    return minDate.toISOString().split('T')[0];
  };
  const minEndDate = getMinEndDate();

  // Calculate search start date (120 days from today) - Updated Nov 2025
  const getSearchStartDate = () => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 120);
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
    targetStartDays: '120', // 4 months = ~120 days
    targetStartDate: '',
    targetEndDate: getMinEndDate(), // Set default to minimum date (210 days from today)
    selectedCities: [],
  });

  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [basicRoleId, setBasicRoleId] = useState(null);
  const [cities, setCities] = useState([]);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Initialize metrics tracker
  const metrics = new FastVisaMetrics();
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

  // Try to detect the user's country to pre-select a likely country value
  useEffect(() => {
    let isMounted = true;
    const detectCountry = async () => {
      if (typeof window === 'undefined' || !navigator) return;
  setDetectingLocation(true);

      // Helper: set the country code (uppercase) if available in countries
  const setDetected = (countryCode, method = 'geolocation') => {
        if (!isMounted || !countryCode) return;
  // store only for debugging - not shown to user
        const codeLower = countryCode.toLowerCase();
        // 1) Direct match by full value
        let found = countries.find(c => c.value && c.value.toLowerCase() === codeLower);
        // 2) Fallback: match by suffix (e.g., "es-mx" -> "mx")
        if (!found) {
          found = countries.find(c => c.value && c.value.split('-').pop().toLowerCase() === codeLower);
        }
            if (found) {
              setFormData(prev => ({ ...prev, country_code: found.value }));
              try {
                const uid = sessionStorage.getItem('fastVisa_userid');
                if (uid) metrics.setUserId(uid);
                metrics.trackCustomEvent('location_detected', {
                  method,
                  detected_code: countryCode,
                  matched_value: found.value,
                  timestamp: new Date().toISOString()
                });
              } catch (err) {
                console.warn('[QuickStart] Metrics error tracking location_detected:', err);
              }
        } else {
          // Don't show user any message when country is not supported; keep silent
          console.warn('[QuickStart] Detected country not supported by list:', countryCode);
          try {
            const uid = sessionStorage.getItem('fastVisa_userid');
            if (uid) metrics.setUserId(uid);
            metrics.trackCustomEvent('location_detected', {
              method,
              detected_code: countryCode,
              matched_value: null,
              timestamp: new Date().toISOString()
            });
          } catch (err) {
            console.warn('[QuickStart] Metrics error tracking location_detected (no match):', err);
          }
        }
      };

      // 1) Try browser geolocation (more accurate) and reverse geocode using BigDataCloud
      try {
        if (navigator.geolocation) {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
          });

          const { latitude, longitude } = pos.coords;

          try {
            const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
            const resp = await fetch(url);
            if (resp.ok) {
              const data = await resp.json();
              const countryCode = data && (data.countryCode || data.country_code);
              if (countryCode) {
                setDetected(countryCode, 'geolocation');
                setDetectingLocation(false);
                return;
              }
            }
          } catch (err) {
            // Ignore and fallback
            console.warn('[QuickStart] Reverse geocode failed, falling back to IP geo', err);
          }
        }
      } catch (geoErr) {
        console.warn('[QuickStart] Geolocation error or denied', geoErr);
      }

      // 2) Fallback to IP-based lookup (less accurate but widely supported)
      try {
        const resp = await fetch('https://ipapi.co/json/');
        if (resp.ok) {
          const data = await resp.json();
          const countryCode = data && (data.country || data.country_code);
          if (countryCode) {
            setDetected(countryCode, 'ip');
            setDetectingLocation(false);
            return;
          }
        }
      } catch (ipErr) {
        console.warn('[QuickStart] IP geolocation failed', ipErr);
      }

  // fallback: no visible error — user picks manually
      setDetectingLocation(false);
    };

    // Run detection only once on mount
    detectCountry();
    return () => { isMounted = false; };
  }, []);

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
        newErrors.targetEndDate = t('endDateMinimum', 'Target end date must be at least 210 days from today');
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
      console.log('[QuickStart] Step 0: Password generated');
      
      // Use AIS email as username (or generate one if no cities)
      let username, userName, aisScheduleId, numberOfApplicants;
      
      if (cities.length > 0) {
        // If country has cities, authenticate with AIS
        username = formData.aisEmail;
        console.log('[QuickStart] Country has cities, will authenticate with AIS');
        
        // Initialize with fallback values
        userName = username; // Use username as fallback name
        aisScheduleId = '-';
        numberOfApplicants = '1';
        console.log('[QuickStart] Initialized fallback values:', { userName, aisScheduleId, numberOfApplicants });
        
        try {
          console.log('[QuickStart] Calling authenticateAIS...');
          // Call API to get user information from AIS credentials
          const aisUserInfo = await authenticateAIS({
            username: formData.aisEmail,
            password: formData.aisPassword,
            country_code: formData.country_code,
          });
          console.log('[QuickStart] AIS response:', aisUserInfo);
          
          if (aisUserInfo && aisUserInfo.schedule_id) {
            // Successfully got AIS info - use it
            userName = aisUserInfo.applicant_name || username; // Fallback to username if applicant_name is empty
            aisScheduleId = aisUserInfo.schedule_id;
            numberOfApplicants = '1'; // Default to 1, update if API returns more
            console.log('[QuickStart] AIS authentication successful, using AIS data:', { userName, aisScheduleId });
          } else {
            console.warn('[QuickStart] AIS authentication returned no schedule_id, using fallback values');
            // AIS authentication failed - notify admin but continue with defaults
            await notifyAdminAISFailure({
              username: formData.aisEmail,
              ais_username: formData.aisEmail,
              country_code: formData.country_code,
            });
          }
        } catch (aisError) {
          // AIS call failed - notify admin but continue with defaults
          console.error('[QuickStart] AIS authentication error:', aisError);
          await notifyAdminAISFailure({
            username: formData.aisEmail,
            ais_username: formData.aisEmail,
            country_code: formData.country_code,
          });
        }
      } else {
        // If country has no cities, use default values
        username = formData.aisEmail || `user_${Date.now()}@fastvisa.com`;
        userName = username; // Use username as name
        aisScheduleId = '-';
        numberOfApplicants = '1';
        console.log('[QuickStart] Country has no cities, using default values:', { username, userName });
      }
      
      // Step 1: Create User
      setCurrentStep(2);
      console.log('[QuickStart] Step 1: Creating user with payload:', { 
        name: userName, 
        username, 
        country_code: formData.country_code,
        role_id: basicRoleId 
      });
      
      const userPayload = {
        name: userName, // From AIS API (applicant_name field)
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
        language: i18n.language || 'en', // Get current language from i18n
      };

      const userResult = await createUser(userPayload);
      console.log('[QuickStart] User creation result:', userResult);
      
      if (!userResult.success) {
        console.error('[QuickStart] User creation failed:', userResult.error);
        throw new Error(userResult.error || t('userCreationFailed', 'Failed to create user account'));
      }
      console.log('[QuickStart] User created successfully');

      // Get the created user's ID
      console.log('[QuickStart] Searching for user:', username);
      const userData = await searchUserByUsername(username);
      console.log('[QuickStart] User search result:', userData);
      
      if (!userData || userData.length === 0) {
        console.error('[QuickStart] User search failed - no user found');
        throw new Error(t('userSearchFailed', 'Failed to retrieve user data'));
      }

      const userId = userData[0].id;
      const retrievedUserName = userData[0].name;
      console.log('[QuickStart] User found:', { userId, retrievedUserName });

      // Step 2: Create Applicant
      setCurrentStep(3);
      console.log('[QuickStart] Step 2: Creating applicant');
      
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
      
      console.log('[QuickStart] Applicant payload:', applicantPayload);
      const applicantData = await createApplicant(applicantPayload);
      console.log('[QuickStart] Applicant creation result:', applicantData);
      
      if (!applicantData || !applicantData.id) {
        console.error('[QuickStart] Failed to create applicant - no ID returned');
        // If we can't get the applicant ID, we can't continue to the view page
        throw new Error(t('applicantCreationFailed', 'Failed to create applicant'));
      }

      const applicantId = applicantData.id;
      console.log('[QuickStart] Applicant created successfully:', applicantId);

      // Step 3: Log in the user automatically
      console.log('[QuickStart] Step 3: Logging in user');
      const loginResult = await loginUser(username, generatedPassword);
      console.log('[QuickStart] Login result:', loginResult);
      
      if (!loginResult || !loginResult.success) {
        console.warn('[QuickStart] Auto-login failed, but user and applicant were created successfully');
        // Continue anyway - user can log in manually
      } else {
        console.log('[QuickStart] Login successful');
      }

      // Store session data
      console.log('[QuickStart] Storing session data');
      sessionStorage.setItem('fastVisa_userid', userId);
      sessionStorage.setItem('fastVisa_username', username);
      sessionStorage.setItem('country_code', formData.country_code);
      sessionStorage.setItem('concurrent_applicants', '1'); // Basic users get 1
      sessionStorage.setItem('fastVisa_name', retrievedUserName);

      // Fetch and store user permissions (optional - don't fail if this errors)
      console.log('[QuickStart] Fetching user permissions');
      try {
        const permissionsData = await getUserPermissions(userId);
        console.log('[QuickStart] Permissions data:', permissionsData);
        if (permissionsData) {
          sessionStorage.setItem('fastVisa_permissions', JSON.stringify(permissionsData));
        }
      } catch (permError) {
        console.warn('[QuickStart] Failed to fetch permissions, but continuing:', permError);
      }

      // Step 4: Start the container for the applicant (optional - don't fail if this errors)
      console.log('[QuickStart] Step 4: Starting container');
      try {
        await StartApplicantContainer(applicantId);
        console.log('[QuickStart] Container started successfully');
      } catch (containerError) {
        console.warn('[QuickStart] Failed to start container, but continuing:', containerError);
      }

      // Redirect to applicant details page
      console.log('[QuickStart] Redirecting to applicant view:', applicantId);
      window.location.href = `/view-applicant/${applicantId}`;

    } catch (error) {
      console.error('[QuickStart] ❌ ERROR in quick start flow:', error);
      console.error('[QuickStart] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
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
                  {detectingLocation && (
                    <p style={{ color: '#6b7280', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                      <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                      {t('detectingLocation', 'Detecting your location...')}
                    </p>
                  )}
                  {/* Location is detected silently — no 'detected country' notifications to the user */}
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
            <div className="applicant-form-section" style={cities.length === 0 ? { borderBottom: 'none', marginBottom: '36px', paddingBottom: 0 } : {}}>
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
                    <strong>{t('basicUserSearchInfo', 'Basic User Search Settings:')}</strong> {t('basicUserSearchDesc', 'Your appointment search will start 4 months from today.')}
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
                      {t('startDate', 'Start date')}: {formatDate(searchStartDate)}
                    </div>
                    <br />
                    <div className="date-info-box">
                      <i className="fas fa-info-circle date-info-icon"></i>
                      <div style={{ flex: 1 }}>
                        <p className="date-info-text">{t('targetStartDateExplanationView', 'This is the earliest date the system will start searching for available appointments.')}</p>
                      </div>
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
                  <div className="date-info-box">
                    <i className="fas fa-info-circle date-info-icon"></i>
                    <div style={{ flex: 1 }}>
                      <p className="date-info-text">{t('targetEndDateExplanation', 'This is the latest date you would accept for an appointment. The search will look for appointments between 4 months from now and this date.')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Target Cities Section */}
            {formData.country_code && cities.length > 0 && (
              <div className="applicant-form-section" style={{ borderBottom: 'none', marginBottom: '36px', paddingBottom: 0 }}>
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
