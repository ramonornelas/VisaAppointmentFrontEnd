import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './utils/AuthContext';
import HamburgerMenu from './HamburgerMenu';
import { 
  ApplicantDetails, 
  ApplicantDelete,
  ApplicantSearch,
  StartApplicantContainer,
  StopApplicantContainer,
  GetApplicantPassword 
} from './APIFunctions';
import { ALL_CITIES } from './utils/cities';
import './ApplicantView.css';
import './index.css';

const ApplicantView = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const applicantId = sessionStorage.getItem('applicant_userid');
  const fastVisaUserId = sessionStorage.getItem('fastVisa_userid');
  const countryCode = sessionStorage.getItem('country_code');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [refreshFlag, setRefreshFlag] = useState(false);

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
  }, [countryCode]);

  // Load applicant data
  useEffect(() => {
    if (applicantId) {
      setLoading(true);
      ApplicantDetails(applicantId)
        .then(response => {
          if (response && typeof response === 'object') {
            setData(response);
          }
        })
        .catch(error => {
          console.error('Error loading applicant:', error);
        })
        .finally(() => setLoading(false));
    }
  }, [applicantId, refreshFlag]);

  const handleEdit = () => {
    navigate(`/applicant-form?id=${applicantId}`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this applicant?')) {
      return;
    }

    const isSearchRunning = data && (data.search_status === 'Running');
    
    if (isSearchRunning) {
      const confirmStop = window.confirm(
        'Search is in progress. Do you want to stop the search before deleting?'
      );
      
      if (confirmStop) {
        try {
          await StopApplicantContainer(applicantId);
          alert('Search stopped. The applicant will now be deleted.');
          
          const response = await ApplicantDelete(applicantId);
          if (response && response.success) {
            alert('Applicant deleted successfully.');
            navigate('/applicants');
          } else {
            alert('Unexpected response when deleting applicant.');
          }
        } catch (error) {
          alert('Failed to stop search or delete applicant. Please try again.');
        }
      }
      return;
    }

    try {
      const response = await ApplicantDelete(applicantId);
      if (response && response.success) {
        alert('Applicant deleted successfully.');
        navigate('/applicants');
      } else {
        alert('Unexpected response when deleting applicant.');
      }
    } catch (error) {
      console.error('Error deleting applicant:', error);
      alert('Error deleting applicant.');
    }
  };

  const handleToggleSearch = async () => {
    try {
      if (data.search_status === 'Inactive') {
        const concurrentLimit = parseInt(sessionStorage.getItem('concurrent_applicants'));
        const applicantsResponse = await ApplicantSearch(fastVisaUserId);
        const runningCount = applicantsResponse.filter(a => a.search_status === 'Running').length;
        
        if (runningCount >= concurrentLimit) {
          alert(`You have reached your concurrent applicants limit (${concurrentLimit}).\nTo start a new applicant, please end one of your currently running applicants first.`);
          return;
        }
        
        await StartApplicantContainer(applicantId);
        alert('Search started successfully.');
      } else {
        await StopApplicantContainer(applicantId);
        alert('Search stopped successfully.');
      }
      
      setRefreshFlag(flag => !flag);
    } catch (error) {
      alert('Error performing action.');
      console.error(error);
    }
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(data.ais_username);
      alert('Email copied to clipboard');
    } catch (error) {
      console.error('Error copying email:', error);
    }
  };

  const handleCopyPassword = async () => {
    try {
      const response = await GetApplicantPassword(applicantId);
      await navigator.clipboard.writeText(response.password);
      alert('Password copied to clipboard');
    } catch (error) {
      console.error('Error copying password:', error);
    }
  };

  const getCityNames = (cityCodes) => {
    if (!cityCodes) return 'N/A';
    const codes = cityCodes.split(',').filter(Boolean);
    return codes.map(code => {
      const city = cities.find(c => c.city_code === code);
      return city ? city.city_name : code;
    }).join(', ');
  };

  const renderStatusBadge = (status) => {
    const statusStyles = {
      'Running': { background: '#2196f3', color: '#fff' },
      'Inactive': { background: '#e0e0e0', color: '#888' },
      'Stopped': { background: '#ff9800', color: '#fff' },
      'Error': { background: '#f44336', color: '#fff' },
      'Completed': { background: '#4caf50', color: '#fff' },
    };

    const style = statusStyles[status] || { background: '#9e9e9e', color: '#fff' };

    return (
      <span className="applicant-view-badge" style={{ background: style.background, color: style.color }}>
        {status}
      </span>
    );
  };

  const renderBooleanBadge = (value) => (
    <span className="applicant-view-badge" style={{
      background: value ? '#4caf50' : '#e0e0e0',
      color: value ? '#fff' : '#888'
    }}>
      {value ? 'Active' : 'Inactive'}
    </span>
  );

  if (loading) {
    return (
      <>
        <HamburgerMenu />
        <div className="applicant-view-container">
          <div className="applicant-view-loading">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading applicant details...</p>
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <HamburgerMenu />
        <div className="applicant-view-container">
          <div className="applicant-view-error">
            <i className="fas fa-exclamation-triangle"></i>
            <p>Applicant not found</p>
            <button onClick={() => navigate('/applicants')} className="applicant-view-btn">
              Back to Applicants
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <HamburgerMenu />
      <div className="applicant-view-container">
        <div className="applicant-view-header">
          <div>
            <h1 className="applicant-view-title">
              <i className="fas fa-user-circle"></i>
              Applicant Details
            </h1>
            <p className="applicant-view-subtitle">
              View and manage applicant information
            </p>
          </div>
          <div className="applicant-view-header-actions">
            <button onClick={() => navigate('/applicants')} className="applicant-view-btn applicant-view-btn-secondary">
              <i className="fas fa-arrow-left"></i>
              Back
            </button>
            <button onClick={handleEdit} className="applicant-view-btn applicant-view-btn-primary">
              <i className="fas fa-edit"></i>
              Edit
            </button>
            <button onClick={handleDelete} className="applicant-view-btn" style={{ background: '#f44336', color: '#fff' }}>
              <i className="fas fa-trash-alt"></i>
              Delete
            </button>
          </div>
        </div>

        <div className="applicant-view-content">

          {/* Basic Information Section */}
          <div className="applicant-view-section">
            <h2 className="applicant-view-section-title">
              <i className="fas fa-user"></i>
              Basic Information
            </h2>
            
            <div className="applicant-view-grid">
              <div className="applicant-view-field">
                <label>Full Name</label>
                <div className="applicant-view-value">{data.name || 'N/A'}</div>
              </div>

              <div className="applicant-view-field">
                <label>Number of Applicants</label>
                <div className="applicant-view-value">{data.number_of_applicants || 'N/A'}</div>
              </div>

              <div className="applicant-view-field">
                <label>Applicant Status</label>
                <div className="applicant-view-value">
                  {renderBooleanBadge(data.applicant_active)}
                </div>
              </div>

              <div className="applicant-view-field">
                <label>Search Status</label>
                <div className="applicant-view-value" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {renderStatusBadge(data.search_status)}
                  <button 
                    onClick={handleToggleSearch} 
                    className={`applicant-view-action-btn ${data.search_status === 'Inactive' ? 'start' : 'stop'}`}
                    style={{ margin: 0, minWidth: '140px' }}
                  >
                    <i className={data.search_status === 'Inactive' ? 'fas fa-play-circle' : 'fas fa-stop-circle'}></i>
                    {data.search_status === 'Inactive' ? 'Start Search' : 'Stop Search'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* AIS Credentials Section */}
          <div className="applicant-view-section">
            <h2 className="applicant-view-section-title">
              <i className="fas fa-key"></i>
              AIS Credentials
            </h2>
            
            <div className="applicant-view-grid">
              <div className="applicant-view-field">
                <label>AIS Email</label>
                <div className="applicant-view-value applicant-view-value-code" style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                  <span>{data.ais_username || 'N/A'}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleCopyEmail} className="applicant-view-action-btn" style={{ margin: 0, padding: '6px 12px', fontSize: '0.9rem' }} title="Copy Email">
                      <i className="fas fa-copy"></i>
                    </button>
                    <button onClick={handleCopyPassword} className="applicant-view-action-btn" style={{ margin: 0, padding: '6px 12px', fontSize: '0.9rem' }} title="Copy Password">
                      <i className="fas fa-key"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div className="applicant-view-field">
                <label>AIS Schedule ID</label>
                <div className="applicant-view-value applicant-view-value-code">
                  {data.ais_schedule_id || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Target Dates Section */}
          <div className="applicant-view-section">
            <h2 className="applicant-view-section-title">
              <i className="fas fa-calendar-alt"></i>
              Target Dates
            </h2>
            
            <div className="applicant-view-grid">
              <div className="applicant-view-field">
                <label>Start Mode</label>
                <div className="applicant-view-value">
                  <span className="applicant-view-badge" style={{ background: '#eaf4fb', color: '#2C6BA0' }}>
                    {data.target_start_mode === 'date' ? 'Specific Date' : 'Days from Now'}
                  </span>
                </div>
              </div>

              {data.target_start_mode === 'date' && (
                <div className="applicant-view-field">
                  <label>Target Start Date</label>
                  <div className="applicant-view-value">{data.target_start_date || 'N/A'}</div>
                </div>
              )}

              {data.target_start_mode === 'days' && (
                <div className="applicant-view-field">
                  <label>Target Start Days</label>
                  <div className="applicant-view-value">{data.target_start_days || 'N/A'}</div>
                </div>
              )}

              <div className="applicant-view-field">
                <label>Target End Date</label>
                <div className="applicant-view-value">{data.target_end_date || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Target Cities Section */}
          <div className="applicant-view-section">
            <h2 className="applicant-view-section-title">
              <i className="fas fa-map-marker-alt"></i>
              Target Cities
            </h2>
            
            <div className="applicant-view-cities">
              {data.target_city_codes ? (
                data.target_city_codes.split(',').filter(Boolean).map(code => {
                  const city = cities.find(c => c.city_code === code);
                  return (
                    <div key={code} className="applicant-view-city-tag">
                      <span className="city-name">{city ? city.city_name : code}</span>
                      <span className="city-code">{code}</span>
                    </div>
                  );
                })
              ) : (
                <div className="applicant-view-value">No cities selected</div>
              )}
            </div>
          </div>

          {/* AIS Reserved Appointments Section */}
          {(data.consul_appointment_date || data.asc_appointment_date) && (
            <div className="applicant-view-section">
              <h2 className="applicant-view-section-title">
                <i className="fas fa-calendar-check"></i>
                AIS Reserved Appointments
              </h2>
              
              <div className="applicant-view-grid">
                <div className="applicant-view-field">
                  <label>Consulate Appointment Date</label>
                  <div className="applicant-view-value">{data.consul_appointment_date || 'Not set'}</div>
                </div>

                <div className="applicant-view-field">
                  <label>ASC Appointment Date</label>
                  <div className="applicant-view-value">{data.asc_appointment_date || 'Not set'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ApplicantView;
