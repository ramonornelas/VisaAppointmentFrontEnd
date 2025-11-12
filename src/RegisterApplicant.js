import React, { useState, useEffect, useMemo } from 'react';
import Banner from './Banner';
import HamburgerMenu from './HamburgerMenu';
import { useNavigate } from 'react-router-dom';  
import { useAuth } from './utils/AuthContext';
import './index.css';
import './Applicants.css';
import { ALL_CITIES } from './utils/cities';
import { NameField, EmailField, PasswordField, ScheduleIdField } from './utils/ApplicantFormFields';
import { authenticateAIS } from './APIFunctions';

const RegisterApplicant = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth(); 
  
  useEffect(() => {
      if (!isAuthenticated) {
        document.body.classList.remove('menu-open');
        navigate('/');
        return;
      }
    }, [isAuthenticated, navigate]);
    
  const fastVisa_userid = sessionStorage.getItem("fastVisa_userid");
  const fastVisa_username = sessionStorage.getItem("fastVisa_username");
  const countryCode = sessionStorage.getItem("country_code");  
  // State variables to store form data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [scheduleId, setScheduleId] = useState('');
  const [name, setName] = useState('');
  const [numberofapplicants, setNumberofApplicants] = useState('');
  const [hasConsulDate, setHasConsulDate] = useState(false);
  const [consulDate, setConsulDate] = useState('');
  const [hasAscDate, setHasAscDate] = useState(false);
  const [ascDate, setAscDate] = useState('');
  const [targetStartMode, setTargetStartMode] = useState('date');
  const [targetStartDays, setTargetStartDays] = useState('3');
  const [targetStartDate, setTargetStartDate] = useState('');
  const [targetEndDate, setTargetEndDate] = useState('');
  const [cityCodes, setCityCodes] = useState('');
  const [cityError, setCityError] = useState('');
  const [errors, setErrors] = useState({});
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [aisAuthSuccess, setAisAuthSuccess] = useState(false);

  // Function to validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!email.trim()) {
      newErrors.email = 'Visa Appointment System Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password.trim()) {
      newErrors.password = 'Visa Appointment System Password is required';
    }
    
    // Schedule ID and number of applicants will be auto-filled from Visa
    // No need to validate manually entered values anymore
    
    if (targetStartMode === 'days' && !targetStartDays) {
      newErrors.targetStartDays = 'Target Start Days is required';
    }
    
    if (targetStartMode === 'date' && !targetStartDate) {
      newErrors.targetStartDate = 'Target Start Date is required';
    }
    
    if (!targetEndDate) {
      newErrors.targetEndDate = 'Target End Date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Function to authenticate Visa credentials and get schedule info
  const handleAuthenticateAIS = async () => {
    // Validate email and password first
    const newErrors = {};
    if (!email.trim()) {
      newErrors.email = 'Visa Appointment System Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!password.trim()) {
      newErrors.password = 'Visa Appointment System Password is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsAuthenticating(true);
    setAisAuthSuccess(false);
    
    try {
      const aisUserInfo = await authenticateAIS({
        username: email,
        password: password,
        country_code: countryCode,
      });

      if (!aisUserInfo || !aisUserInfo.schedule_id) {
        setErrors({ 
          ...errors, 
          email: 'Failed to authenticate Visa Appointment System credentials. Please check your email and password.',
        });
        setScheduleId('');
        setNumberofApplicants('');
        return;
      }

      // Successfully authenticated - update fields
      setScheduleId(aisUserInfo.schedule_id);
      setNumberofApplicants('1'); // Default to 1 until API provides this info
      // Name field is manual - don't auto-fill
      setAisAuthSuccess(true);
      
      // Clear any existing errors
      setErrors({});
      
    } catch (error) {
      console.error('AIS authentication error:', error);
      setErrors({ 
        ...errors, 
        email: 'An error occurred while authenticating. Please try again.',
      });
      setScheduleId('');
      setNumberofApplicants('');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Function to handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setCityError('');
    if (CITIES.length > 1) {
      const selectedCities = (cityCodes || '').split(',').filter(Boolean);
      if (selectedCities.length === 0) {
        setCityError('Please select at least one city.');
        return;
      }
    }
    if (!validateForm()) {
      return;
    }
    const Body = {
      "ais_schedule_id": scheduleId,
      "ais_username": email,
      "ais_password": password,
      "fastVisa_userid": fastVisa_userid,
      "fastVisa_username": fastVisa_username,
      "name": name,
      "number_of_applicants": numberofapplicants,
      "applicant_active": true,
      "consul_appointment_date": hasConsulDate ? consulDate : '',
      "asc_appointment_date": hasAscDate ? ascDate : '',
      'target_start_mode': targetStartMode,
      'target_start_days': targetStartMode === 'days' ? targetStartDays : '-',
      'target_start_date': targetStartMode === 'date' ? targetStartDate : '-',
      'target_end_date': targetEndDate,
      "target_city_codes": cityCodes,
      "target_country_code": countryCode,
      "container_id": "",
      "container_start_datetime": "",
      "container_stop_datetime": "",
      "app_start_time": "",
    };
    // Send the clientPayload object as JSON to the API
    fetch('https://w3a0pdhqul.execute-api.us-west-1.amazonaws.com/applicants', {
      method: 'POST',
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(Body)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response;
      })
      .then(data => {
        setEmail('');
        setPassword('');
        setScheduleId('');
        setName('');
        setNumberofApplicants('');
        setHasConsulDate(false);
        setConsulDate('');
        setHasAscDate(false);
        setAscDate('');
        setTargetStartMode('date');
        setTargetStartDays('3');
        setTargetStartDate('');
        setTargetEndDate('');
        setCityCodes('');
        // Redirect to applicants
        window.location.href = '/applicants';
      })
      .catch(error => {
        console.error('Error:', error);
        // Handle errors here if needed
      });
  };

  // Helper function to clear errors when user starts typing
  const clearError = (fieldName) => {
    if (errors[fieldName]) {
      setErrors({ ...errors, [fieldName]: '' });
    }
  };

  // Function to handle checkbox changes for Cities
  const handleCityCodeChange = (e) => {
    const value = e.target.value;
    if (cityCodes.includes(value)) {
      setCityCodes(cityCodes.split(',').filter((code) => code !== value).join(','));
    } else {
      setCityCodes(cityCodes ? `${cityCodes},${value}` : `${value}`);
    }
  };

  const CITIES = useMemo(() => ALL_CITIES[countryCode] || [], [countryCode]);

  // Set cityCodes to the single city code if only one city is available
  useEffect(() => {
    if (CITIES.length === 1) {
      setCityCodes(CITIES[0].city_code);
    }
  }, [CITIES]);

  return (
    <>
      <HamburgerMenu />
      <div className="applicants-main-container">
        <h2 className="applicants-title">Register New Applicant</h2>
        <div className="applicants-table-container" style={{ padding: '30px' }}>
          <form onSubmit={handleSubmit}>
            <NameField value={name} onChange={e => { setName(e.target.value); clearError('name'); }} error={errors.name} />
            <EmailField value={email} onChange={e => { setEmail(e.target.value); clearError('email'); setAisAuthSuccess(false); }} error={errors.email} />
            <PasswordField value={password} onChange={e => { setPassword(e.target.value); clearError('password'); setAisAuthSuccess(false); }} error={errors.password} />
            
            {/* Button to authenticate AIS and auto-fill schedule info */}
            <div className="form-field" style={{ marginBottom: '20px' }}>
              <button
                type="button"
                onClick={handleAuthenticateAIS}
                disabled={isAuthenticating || !email || !password}
                style={{
                  padding: '10px 20px',
                  backgroundColor: aisAuthSuccess ? '#10b981' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isAuthenticating || !email || !password ? 'not-allowed' : 'pointer',
                  opacity: isAuthenticating || !email || !password ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                {isAuthenticating ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Authenticating...
                  </>
                ) : aisAuthSuccess ? (
                  <>
                    <i className="fas fa-check-circle"></i>
                    Authentication Successful
                  </>
                ) : (
                  <>
                    <i className="fas fa-key"></i>
                    Authenticate
                  </>
                )}
              </button>
              <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                Click to verify your Visa Appointment System credentials
              </small>
            </div>

            <ScheduleIdField 
              value={scheduleId} 
              onChange={e => { setScheduleId(e.target.value); clearError('scheduleId'); }} 
              error={errors.scheduleId}
              disabled={true}
              style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
            />
            
            <div className="form-field">
              <label htmlFor="numberofapplicants">Number of Applicants: <span style={{ color: 'red' }}>*</span></label>
              <input
                type="number"
                id="numberofapplicants"
                name="numberofapplicants"
                value={numberofapplicants}
                onChange={e => { setNumberofApplicants(e.target.value); clearError('numberofapplicants'); }}
                style={{ borderColor: errors.numberofapplicants ? 'red' : '', width: '80px' }}
                required
              />
              {errors.numberofapplicants && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{errors.numberofapplicants}</div>}
            </div>
            
            <div className="form-field">
              <label htmlFor="targetStartMode">Target Start Mode: <span style={{ color: 'red' }}>*</span></label>
              <select
                id="targetStartMode"
                value={targetStartMode}
                onChange={(e) => setTargetStartMode(e.target.value)}
                required
              >
                <option value="date">Date</option>
                <option value="days">Days</option>
              </select>
            </div>
            
            {targetStartMode === 'days' && (
              <div className="form-field">
                <label htmlFor="targetStartDays">Target Start Days: <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="number"
                  id="targetStartDays"
                  value={targetStartDays}
                  onChange={(e) => {
                    setTargetStartDays(parseInt(e.target.value));
                    clearError('targetStartDays');
                  }}
                  style={{ borderColor: errors.targetStartDays ? 'red' : '', width: '80px' }}
                  required
                />
                {errors.targetStartDays && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{errors.targetStartDays}</div>}
              </div>
            )}
            
            {targetStartMode === 'date' && (
              <div className="form-field">
                <label htmlFor="targetStartDate">Target Start Date: <span style={{ color: 'red' }}>*</span></label>
                <input
                  type="date"
                  id="targetStartDate"
                  value={targetStartDate}
                  onChange={(e) => {
                    setTargetStartDate(e.target.value);
                    clearError('targetStartDate');
                  }}
                  style={{ borderColor: errors.targetStartDate ? 'red' : '' }}
                  required
                />
                {errors.targetStartDate && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{errors.targetStartDate}</div>}
              </div>
            )}
            
            <div className="form-field">
              <label htmlFor="targetEndDate">Target End Date: <span style={{ color: 'red' }}>*</span></label>
              <input
                type="date"
                id="targetEndDate"
                value={targetEndDate}
                onChange={(e) => {
                  setTargetEndDate(e.target.value);
                  clearError('targetEndDate');
                }}
                style={{ borderColor: errors.targetEndDate ? 'red' : '' }}
                required
              />
              {errors.targetEndDate && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{errors.targetEndDate}</div>}
            </div>
            
            <div style={{ marginTop: '20px', marginBottom: '20px' }}>
              <h3 style={{ color: '#2C6BA0', fontSize: '1.2rem', marginBottom: '15px' }}>Target Cities</h3>
              {CITIES.length === 1 ? (
                <div className="form-field">
                  <input
                    type="checkbox"
                    id={CITIES[0].city_code}
                    value={CITIES[0].city_code}
                    checked={true}
                    disabled
                  />
                  <label htmlFor={CITIES[0].city_code}>{CITIES[0].city_name}</label>
                </div>
              ) : (
                CITIES.map((city) => (
                  <div key={city.city_code} className="form-field">
                    <input
                      type="checkbox"
                      id={city.city_code}
                      value={city.city_code}
                      checked={cityCodes.split(',').includes(city.city_code)}
                      onChange={handleCityCodeChange}
                    />
                    <label htmlFor={city.city_code}>{city.city_name}</label>
                  </div>
                ))
              )}
              {cityError && <div style={{ color: 'red', fontSize: '12px', marginTop: '2px' }}>{cityError}</div>}
            </div>
            
            <div style={{ marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'flex-start' }}>
              <button
                type="button"
                className="applicants-register-btn"
                style={{ 
                  margin: 0,
                  background: 'linear-gradient(90deg, #6c757d 0%, #495057 100%)'
                }}
                onClick={() => navigate('/applicants')}
              >
                <i className="fas fa-times" style={{marginRight: 8}}></i>Cancel
              </button>
              <button 
                type="submit"
                className="applicants-register-btn"
                style={{ margin: 0 }}
              >
                <i className="fas fa-check" style={{marginRight: 8}}></i>Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default RegisterApplicant;
