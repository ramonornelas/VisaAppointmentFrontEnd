import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from './utils/AuthContext';
import HamburgerMenu from './HamburgerMenu';
import { ApplicantDetails, ApplicantUpdate } from './APIFunctions';
import { ALL_CITIES } from './utils/cities';
import { BASE_URL } from './config.js';
import './ApplicantForm.css';
import './index.css';

const ApplicantForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  
  const applicantId = searchParams.get('id');
  const isEditMode = !!applicantId;

  // Session data
  const fastVisaUserId = sessionStorage.getItem('fastVisa_userid');
  const fastVisaUsername = sessionStorage.getItem('fastVisa_username');
  const countryCode = sessionStorage.getItem('country_code');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    aisEmail: '',
    aisPassword: '',
    aisScheduleId: '',
    numberOfApplicants: '1',
    applicantActive: true,
    targetStartMode: 'date',
    targetStartDays: '3',
    targetStartDate: '',
    targetEndDate: '',
    selectedCities: [],
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [cities, setCities] = useState([]);

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
            setFormData({
              name: data.name || '',
              aisEmail: data.ais_username || '',
              aisPassword: '', // Never pre-fill password
              aisScheduleId: data.ais_schedule_id || '',
              numberOfApplicants: data.number_of_applicants || '1',
              applicantActive: data.applicant_active ?? true,
              targetStartMode: data.target_start_mode || 'date',
              targetStartDays: data.target_start_days || '3',
              targetStartDate: data.target_start_date || '',
              targetEndDate: data.target_end_date || '',
              selectedCities: data.target_city_codes ? data.target_city_codes.split(',') : [],
            });
          }
        })
        .catch(error => {
          console.error('Error loading applicant:', error);
          setSubmitError('Failed to load applicant data');
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

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.aisEmail.trim()) {
      newErrors.aisEmail = 'AIS Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.aisEmail)) {
      newErrors.aisEmail = 'Please enter a valid email';
    }

    if (!formData.aisScheduleId.trim()) {
      newErrors.aisScheduleId = 'Schedule ID is required';
    }

    if (!formData.numberOfApplicants || formData.numberOfApplicants < 1) {
      newErrors.numberOfApplicants = 'Must be at least 1';
    }

    if (formData.targetStartMode === 'days' && !formData.targetStartDays) {
      newErrors.targetStartDays = 'Required when using days mode';
    }

    if (formData.targetStartMode === 'date' && !formData.targetStartDate) {
      newErrors.targetStartDate = 'Required when using date mode';
    }

    if (!formData.targetEndDate) {
      newErrors.targetEndDate = 'Target end date is required';
    }

    if (cities.length > 1 && formData.selectedCities.length === 0) {
      newErrors.selectedCities = 'Please select at least one city';
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
        navigate('/applicants');
      } else {
        // Create new applicant - password is required
        if (!formData.aisPassword.trim()) {
          setSubmitError('Password is required for new applicants');
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

        const response = await fetch(`${BASE_URL}/applicants`, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(createPayload)
        });

        if (!response.ok) {
          throw new Error('Failed to create applicant');
        }

        navigate('/applicants');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError(isEditMode ? 'Failed to update applicant' : 'Failed to create applicant');
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
            <p>Loading applicant data...</p>
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
                  <i className="fas fa-edit"></i>
                  Edit Applicant
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i>
                  New Applicant
                </>
              )}
            </h1>
            <p className="applicant-form-subtitle">
              {isEditMode 
                ? 'Update the information for this applicant'
                : 'Fill in the details to register a new applicant'}
            </p>
          </div>
          
          {/* Top Action Buttons */}
          <div className="applicant-form-header-actions">
            <button
              type="button"
              onClick={() => navigate('/applicants')}
              className="applicant-form-btn applicant-form-btn-cancel"
              disabled={loading}
            >
              <i className="fas fa-times"></i>
              Cancel
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
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <i className={isEditMode ? 'fas fa-save' : 'fas fa-check'}></i>
                  {isEditMode ? 'Update' : 'Create'}
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

          {/* Basic Information Section */}
          <div className="applicant-form-section">
            <h2 className="applicant-form-section-title">
              <i className="fas fa-user"></i>
              Basic Information
            </h2>
            
            <div className="applicant-form-row">
              <div className="applicant-form-field">
                <label htmlFor="name" className="applicant-form-label">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`applicant-form-input applicant-form-input-medium ${errors.name ? 'error' : ''}`}
                  placeholder="Enter full name"
                />
                {errors.name && <span className="applicant-form-error">{errors.name}</span>}
              </div>

              <div className="applicant-form-field">
                <label htmlFor="numberOfApplicants" className="applicant-form-label">
                  Number of Applicants <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="numberOfApplicants"
                  name="numberOfApplicants"
                  value={formData.numberOfApplicants}
                  onChange={handleInputChange}
                  min="1"
                  className={`applicant-form-input applicant-form-input-small ${errors.numberOfApplicants ? 'error' : ''}`}
                />
                {errors.numberOfApplicants && <span className="applicant-form-error">{errors.numberOfApplicants}</span>}
              </div>
            </div>

            {isEditMode && (
              <div className="applicant-form-field">
                <label className="applicant-form-checkbox-label">
                  <input
                    type="checkbox"
                    name="applicantActive"
                    checked={formData.applicantActive}
                    onChange={handleInputChange}
                    className="applicant-form-checkbox"
                  />
                  <span>Applicant is active</span>
                </label>
              </div>
            )}
          </div>

          {/* AIS Credentials Section */}
          <div className="applicant-form-section">
            <h2 className="applicant-form-section-title">
              <i className="fas fa-key"></i>
              AIS Credentials
            </h2>
            
            <div className="applicant-form-row">
              <div className="applicant-form-field">
                <label htmlFor="aisEmail" className="applicant-form-label">
                  AIS Email <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="aisEmail"
                  name="aisEmail"
                  value={formData.aisEmail}
                  onChange={handleInputChange}
                  className={`applicant-form-input applicant-form-input-medium ${errors.aisEmail ? 'error' : ''}`}
                  placeholder="email@example.com"
                />
                {errors.aisEmail && <span className="applicant-form-error">{errors.aisEmail}</span>}
              </div>

              <div className="applicant-form-field">
                <label htmlFor="aisScheduleId" className="applicant-form-label">
                  AIS Schedule ID <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="aisScheduleId"
                  name="aisScheduleId"
                  value={formData.aisScheduleId}
                  onChange={handleInputChange}
                  className={`applicant-form-input applicant-form-input-small ${errors.aisScheduleId ? 'error' : ''}`}
                  placeholder="12345"
                />
                {errors.aisScheduleId && <span className="applicant-form-error">{errors.aisScheduleId}</span>}
              </div>
            </div>

            <div className="applicant-form-field">
              <label htmlFor="aisPassword" className="applicant-form-label">
                AIS Password {!isEditMode && <span className="required">*</span>}
              </label>
              <input
                type="password"
                id="aisPassword"
                name="aisPassword"
                value={formData.aisPassword}
                onChange={handleInputChange}
                className={`applicant-form-input applicant-form-input-medium ${errors.aisPassword ? 'error' : ''}`}
                placeholder={isEditMode ? "Leave empty to keep current password" : "Enter password"}
              />
              {errors.aisPassword && <span className="applicant-form-error">{errors.aisPassword}</span>}
              {isEditMode && (
                <small style={{ color: '#666', fontSize: '0.875rem', marginTop: '4px', display: 'block' }}>
                  Leave empty to keep the current password unchanged
                </small>
              )}
            </div>
          </div>

          {/* Target Dates Section */}
          <div className="applicant-form-section">
            <h2 className="applicant-form-section-title">
              <i className="fas fa-calendar-alt"></i>
              Target Dates
            </h2>

            <div className="applicant-form-field">
              <label htmlFor="targetStartMode" className="applicant-form-label">
                Start Mode <span className="required">*</span>
              </label>
              <div className="applicant-form-radio-group">
                <label className="applicant-form-radio-label">
                  <input
                    type="radio"
                    name="targetStartMode"
                    value="date"
                    checked={formData.targetStartMode === 'date'}
                    onChange={handleInputChange}
                    className="applicant-form-radio"
                  />
                  <span>Specific Date</span>
                </label>
                <label className="applicant-form-radio-label">
                  <input
                    type="radio"
                    name="targetStartMode"
                    value="days"
                    checked={formData.targetStartMode === 'days'}
                    onChange={handleInputChange}
                    className="applicant-form-radio"
                  />
                  <span>Days from Now</span>
                </label>
              </div>
            </div>

            <div className="applicant-form-row">
              {formData.targetStartMode === 'date' && (
                <div className="applicant-form-field">
                  <label htmlFor="targetStartDate" className="applicant-form-label">
                    Target Start Date <span className="required">*</span>
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

              {formData.targetStartMode === 'days' && (
                <div className="applicant-form-field">
                  <label htmlFor="targetStartDays" className="applicant-form-label">
                    Start After (Days) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id="targetStartDays"
                    name="targetStartDays"
                    value={formData.targetStartDays}
                    onChange={handleInputChange}
                    min="1"
                    className={`applicant-form-input applicant-form-input-small ${errors.targetStartDays ? 'error' : ''}`}
                  />
                  {errors.targetStartDays && <span className="applicant-form-error">{errors.targetStartDays}</span>}
                </div>
              )}

              <div className="applicant-form-field">
                <label htmlFor="targetEndDate" className="applicant-form-label">
                  Target End Date <span className="required">*</span>
                </label>
                <input
                  type="date"
                  id="targetEndDate"
                  name="targetEndDate"
                  value={formData.targetEndDate}
                  onChange={handleInputChange}
                  className={`applicant-form-input applicant-form-input-date ${errors.targetEndDate ? 'error' : ''}`}
                />
                {errors.targetEndDate && <span className="applicant-form-error">{errors.targetEndDate}</span>}
              </div>
            </div>
          </div>

          {/* Target Cities Section */}
          <div className="applicant-form-section">
            <h2 className="applicant-form-section-title">
              <i className="fas fa-map-marker-alt"></i>
              Target Cities {cities.length > 1 && <span className="required">*</span>}
            </h2>
            
            {cities.length === 0 ? (
              <p className="applicant-form-no-cities">No cities available for this country</p>
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

          {/* Form Actions */}
          <div className="applicant-form-actions">
            <button
              type="button"
              onClick={() => navigate('/applicants')}
              className="applicant-form-btn applicant-form-btn-cancel"
              disabled={loading}
            >
              <i className="fas fa-times"></i>
              Cancel
            </button>
            <button
              type="submit"
              className="applicant-form-btn applicant-form-btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <i className={isEditMode ? 'fas fa-save' : 'fas fa-check'}></i>
                  {isEditMode ? 'Update Applicant' : 'Create Applicant'}
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
