import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Welcome from "./Welcome";
import LanguageSelector from "./LanguageSelector";
import Banner from "./Banner";
import Footer from "./Footer";
import { getTranslatedCountries } from "./utils/countries";
import { getRoles, createUser } from "./APIFunctions";
import Select from "react-select";
import FastVisaMetrics from "./utils/FastVisaMetrics";
import "./RegisterUser.css";

const UserRegistrationForm = () => {
  const { t, i18n } = useTranslation();
  
  // Initialize metrics tracker (stable)
  const metrics = useMemo(() => new FastVisaMetrics(), []);

  // Get translated countries list (stable)
  const countries = useMemo(() => getTranslatedCountries(t), [t]);
  
  // Calculate expiration date (one month from now)
  const getExpirationDate = () => {
    const now = new Date();
    const expirationDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate()
    );
    return expirationDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
  };

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    confirmPassword: "",
    phone_number: "",
    active: true,
    expiration_date: getExpirationDate(),
    country_code: "",
    role_id: "", // Will be set after fetching roles
  });
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [roleError, setRoleError] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  
  // Track page view when component mounts
  useEffect(() => {
    metrics.trackPageView();
    
    // Track custom event for registration page visit
    metrics.trackCustomEvent('registration_page_visit', {
      page: 'register',
      timestamp: new Date().toISOString()
    });
  }, [metrics]);

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
            console.warn('[RegisterUser] Metrics error tracking location_detected:', err);
          }
        } else {
          // Don't show user any message when country is not supported; keep silent
          console.warn('[RegisterUser] Detected country not supported by list:', countryCode);
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
            console.warn('[RegisterUser] Metrics error tracking location_detected (no match):', err);
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
            console.warn('[RegisterUser] Reverse geocode failed, falling back to IP geo', err);
          }
        }
      } catch (geoErr) {
        console.warn('[RegisterUser] Geolocation error or denied', geoErr);
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
        console.warn('[RegisterUser] IP geolocation failed', ipErr);
      }

      // fallback: no visible error — user picks manually
      setDetectingLocation(false);
    };

    // Run detection only once on mount
    detectCountry();
    return () => { isMounted = false; };
  }, [countries, metrics]);
  // Fetch roles and set role_id to the id of 'basic_user'
  useEffect(() => {
    let isMounted = true;
    const fetchRoles = async () => {
      try {
        const roles = await getRoles();
        const basicRole = roles.find(role => role.name === "basic_user");
        if (basicRole) {
          if (isMounted) {
            setFormData(prev => ({ ...prev, role_id: basicRole.id }));
            setRolesLoaded(true);
          }
        } else {
          if (isMounted) {
            setRoleError("Could not find the 'basic_user' role. Please contact support.");
            setRolesLoaded(false);
          }
        }
      } catch (err) {
        if (isMounted) {
          setRoleError("Failed to load roles. Please try again later.");
          setRolesLoaded(false);
        }
      }
    };
    fetchRoles();
    return () => { isMounted = false; };
  }, []);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    // For react-select country dropdown
    if (e && e.__isCountrySelect) {
      setFormData({ ...formData, country_code: e.value });
      if (errors.country_code) setErrors({ ...errors, country_code: "" });
      return;
    }
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    setFormData({ ...formData, [name]: val });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.username)) {
      newErrors.username = "Please enter a valid email address";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long";
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.country_code) {
      newErrors.country_code = "Country selection is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setApiError(""); // Clear previous API error

    // Track form submit attempt
    metrics.trackFormSubmit('registration-form', false); // false initially, will update on success
    
    // Track custom event for registration attempt
    metrics.trackCustomEvent('registration_attempt', {
      country: formData.country_code,
      hasPhone: !!formData.phone_number,
      language: i18n.language || 'en',
      timestamp: new Date().toISOString()
    });

    if (!rolesLoaded || !formData.role_id) {
      setRoleError("Roles are still loading. Please wait.");
      
      // Track role loading error
      metrics.trackCustomEvent('registration_error', {
        error: 'roles_not_loaded',
        timestamp: new Date().toISOString()
      });
      
      return;
    }

    if (!validateForm()) {
      // Track validation error
      metrics.trackCustomEvent('registration_error', {
        error: 'validation_failed',
        errors: Object.keys(errors),
        timestamp: new Date().toISOString()
      });
      
      return;
    }

    // Remove confirmPassword before sending
    const submitData = { 
      ...formData,
      email: formData.username, // Email is the same as username
      sendEmail: true,
      includePassword: false, // RegisterUser does NOT send password in email
      language: i18n.language || 'en', // Get current language from i18n
    };
    delete submitData.confirmPassword;
    
    createUser(submitData)
      .then((result) => {
        if (result.success) {
          // Store name in sessionStorage for use in menu
          if (formData.name) {
            sessionStorage.setItem("fastVisa_name", formData.name);
          }
          setRegistrationSuccess(true);
          
          // Track successful registration
          metrics.trackFormSubmit('registration-form', true);
          metrics.trackCustomEvent('user_registered', {
            userName: formData.name,
            userEmail: formData.username,
            country: formData.country_code,
            hasPhone: !!formData.phone_number,
            language: i18n.language || 'en',
            timestamp: new Date().toISOString()
          });
          
        } else {
          setApiError(result.error || 'Registration failed');
          
          // Track registration failure
          metrics.trackCustomEvent('registration_error', {
            error: 'api_error',
            errorMessage: result.error || 'Registration failed',
            timestamp: new Date().toISOString()
          });
        }
      })
      .catch((error) => {
        setApiError(error.message || 'An unexpected error occurred');
        
        // Track registration exception
        metrics.trackCustomEvent('registration_error', {
          error: 'api_exception',
          errorMessage: error.message || 'An unexpected error occurred',
          timestamp: new Date().toISOString()
        });
      });
  };

  const handleCancel = () => {
    // Track cancel button click
    metrics.trackButtonClick('cancel-registration-btn', 'Cancel Registration');
    
    navigate("/");
  };

  return (
    <div className="page-container">
      <LanguageSelector />
      <div className="content-wrap">
        <Banner />
        <div className="registration-container">
          <h2 className="registration-title">{t('signUp', 'Sign Up')}</h2>
          {roleError && (
            <div className="form-error" style={{ marginBottom: '1rem', textAlign: 'center' }}>{roleError}</div>
          )}
          {apiError && (
            <div className="form-error" style={{ marginBottom: '1rem', textAlign: 'center' }}>{apiError}</div>
          )}
          {registrationSuccess ? (
            <>
              <Welcome name={formData.name} />
              <button
                className="registration-button"
                style={{ width: 240, maxWidth: '95vw', margin: '1.5rem auto 0 auto', display: 'block' }}
                onClick={() => navigate('/')}
              >
                {t('login', 'Log in')}
              </button>
            </>
          ) : (
            <form className="registration-form" onSubmit={handleSubmit} autoComplete="on">
              <div className="form-field">
                <label htmlFor="name">
                  {t('name', 'Name')}: <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? "error" : ""}
                  required
                />
                {errors.name && (
                  <div className="form-error">{errors.name}</div>
                )}
              </div>
              <div className="form-field">
                <label htmlFor="username">
                  {t('username', 'E-mail')}: <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="email"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={errors.username ? "error" : ""}
                  required
                />
                {errors.username && (
                  <div className="form-error">{errors.username}</div>
                )}
              </div>
              <div className="form-field">
                <label htmlFor="password">
                  {t('password', 'Password')}: <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? "error" : ""}
                  required
                />
                {errors.password && (
                  <div className="form-error">{errors.password}</div>
                )}
              </div>
              <div className="form-field">
                <label htmlFor="confirmPassword">
                  {t('confirmPassword', 'Confirm Password')}: <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? "error" : ""}
                  required
                />
                {errors.confirmPassword && (
                  <div className="form-error">{errors.confirmPassword}</div>
                )}
              </div>
              <div className="form-field">
                <label htmlFor="country_code">
                  {t('country', 'Country')}: <span style={{ color: "red" }}>*</span>
                </label>
                <Select
                  inputId="country_code"
                  name="country_code"
                  classNamePrefix={errors.country_code ? "error" : ""}
                  value={countries.find(c => c.value === formData.country_code) || null}
                  onChange={option => handleChange({ ...option, __isCountrySelect: true })}
                  options={countries}
                  placeholder={t('selectCountry', 'Select a country')}
                  isSearchable
                  required
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
                      width: '340px',
                      maxWidth: '95vw',
                    }),
                    option: base => ({ ...base, fontSize: '1em' }),
                  }}
                />
                {errors.country_code && (
                  <div className="form-error">{errors.country_code}</div>
                )}
                {detectingLocation && (
                  <p style={{ color: '#6b7280', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                    {t('detectingLocation', 'Detecting your location...')}
                  </p>
                )}
              </div>
              <div className="form-field">
                <label htmlFor="phone_number">{t('phoneNumber', 'Phone Number')}:</label>
                <input
                  type="text"
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                />
              </div>
              <div className="button-row">
                <button type="button" className="cancel-button" onClick={handleCancel}>
                  {t('cancel', 'Cancel')}
                </button>
                <button type="submit" className="registration-button" disabled={!rolesLoaded || !formData.role_id}>{t('submit', 'Submit')}</button>
              </div>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default UserRegistrationForm;
