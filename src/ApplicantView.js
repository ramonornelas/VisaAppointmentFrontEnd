import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './utils/AuthContext';
import { permissions } from './utils/permissions';
import HamburgerMenu from './HamburgerMenu';
import Modal from './Modal';
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
  const { id } = useParams(); // Get ID from URL parameter
  
  // Use ID from URL parameter if available, otherwise use sessionStorage
  const applicantId = id || sessionStorage.getItem('applicant_userid');
  const fastVisaUserId = sessionStorage.getItem('fastVisa_userid');
  const countryCode = sessionStorage.getItem('country_code');

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState([]);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    showCancel: false
  });

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Store applicantId in sessionStorage if received from URL
  useEffect(() => {
    if (id && id !== sessionStorage.getItem('applicant_userid')) {
      sessionStorage.setItem('applicant_userid', id);
    }
  }, [id]);

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
    setModal({
      isOpen: true,
      title: 'Delete Applicant',
      message: 'Are you sure you want to delete this applicant?',
      type: 'confirm',
      showCancel: true,
      onConfirm: async () => {
        const isSearchRunning = data && (data.search_status === 'Running');
        
        if (isSearchRunning) {
          setModal({
            isOpen: true,
            title: 'Search in Progress',
            message: 'Search is in progress. Do you want to stop the search before deleting?',
            type: 'warning',
            showCancel: true,
            onConfirm: async () => {
              try {
                await StopApplicantContainer(applicantId);
                setModal({
                  isOpen: true,
                  title: 'Search Stopped',
                  message: 'Search stopped. The applicant will now be deleted.',
                  type: 'info',
                  showCancel: false,
                  onConfirm: async () => {
                    try {
                      const response = await ApplicantDelete(applicantId);
                      if (response && response.success) {
                        setModal({
                          isOpen: true,
                          title: 'Success',
                          message: 'Applicant deleted successfully.',
                          type: 'success',
                          showCancel: false,
                          onConfirm: () => navigate('/applicants')
                        });
                      } else {
                        setModal({
                          isOpen: true,
                          title: 'Error',
                          message: 'Unexpected response when deleting applicant.',
                          type: 'error',
                          showCancel: false
                        });
                      }
                    } catch (error) {
                      setModal({
                        isOpen: true,
                        title: 'Error',
                        message: 'Failed to delete applicant. Please try again.',
                        type: 'error',
                        showCancel: false
                      });
                    }
                  }
                });
              } catch (error) {
                setModal({
                  isOpen: true,
                  title: 'Error',
                  message: 'Failed to stop search or delete applicant. Please try again.',
                  type: 'error',
                  showCancel: false
                });
              }
            }
          });
          return;
        }

        try {
          const response = await ApplicantDelete(applicantId);
          if (response && response.success) {
            setModal({
              isOpen: true,
              title: 'Success',
              message: 'Applicant deleted successfully.',
              type: 'success',
              showCancel: false,
              onConfirm: () => navigate('/applicants')
            });
          } else {
            setModal({
              isOpen: true,
              title: 'Error',
              message: 'Unexpected response when deleting applicant.',
              type: 'error',
              showCancel: false
            });
          }
        } catch (error) {
          console.error('Error deleting applicant:', error);
          setModal({
            isOpen: true,
            title: 'Error',
            message: 'Error deleting applicant.',
            type: 'error',
            showCancel: false
          });
        }
      }
    });
  };

  const handleToggleSearch = async () => {
    try {
      if (data.search_status === 'Inactive') {
        const concurrentLimit = parseInt(sessionStorage.getItem('concurrent_applicants'));
        const applicantsResponse = await ApplicantSearch(fastVisaUserId);
        const runningCount = applicantsResponse.filter(a => a.search_status === 'Running').length;
        
        if (runningCount >= concurrentLimit) {
          setModal({
            isOpen: true,
            title: 'Limit Reached',
            message: `You have reached your concurrent applicants limit (${concurrentLimit}).\nTo start a new applicant, please end one of your currently running applicants first.`,
            type: 'warning',
            showCancel: false
          });
          return;
        }
        
        await StartApplicantContainer(applicantId);
        setModal({
          isOpen: true,
          title: 'Success',
          message: 'Search started successfully.',
          type: 'success',
          showCancel: false
        });
      } else {
        await StopApplicantContainer(applicantId);
        setModal({
          isOpen: true,
          title: 'Success',
          message: 'Search stopped successfully.',
          type: 'success',
          showCancel: false
        });
      }
      
      setRefreshFlag(flag => !flag);
    } catch (error) {
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'Error performing action.',
        type: 'error',
        showCancel: false
      });
      console.error(error);
    }
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(data.ais_username);
      setModal({
        isOpen: true,
        title: 'Copied',
        message: 'Email copied to clipboard',
        type: 'success',
        showCancel: false
      });
    } catch (error) {
      console.error('Error copying email:', error);
    }
  };

  const handleCopyPassword = async () => {
    try {
      const response = await GetApplicantPassword(applicantId);
      await navigator.clipboard.writeText(response.password);
      setModal({
        isOpen: true,
        title: 'Copied',
        message: 'Password copied to clipboard',
        type: 'success',
        showCancel: false
      });
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
            {permissions.canManageApplicants() && (
              <button onClick={() => navigate('/applicants')} className="applicant-view-btn">
                Back to Applicants
              </button>
            )}
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
              <i className={permissions.canManageApplicants() ? "fas fa-user-circle" : "fas fa-calendar-check"}></i>
              {permissions.canManageApplicants() ? 'Applicant Details' : 'My Appointment'}
            </h1>
            <p className="applicant-view-subtitle">
              {permissions.canManageApplicants() ? 'View and manage applicant information' : 'View and manage your appointment search'}
            </p>
          </div>
          <div className="applicant-view-header-actions">
            {permissions.canManageApplicants() && (
              <button onClick={() => navigate('/applicants')} className="applicant-view-btn applicant-view-btn-secondary">
                <i className="fas fa-arrow-left"></i>
                Back
              </button>
            )}
            <button onClick={handleEdit} className="applicant-view-btn applicant-view-btn-primary">
              <i className="fas fa-edit"></i>
              Edit
            </button>
            {permissions.canManageApplicants() && (
              <button onClick={handleDelete} className="applicant-view-btn" style={{ background: '#f44336', color: '#fff' }}>
                <i className="fas fa-trash-alt"></i>
                Delete
              </button>
            )}
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
            
            {!permissions.canManageApplicants() && data.target_start_mode === 'days' && data.target_start_days === '180' && (
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
                    <strong>Basic User Search Settings:</strong> Your appointment search will start 6 months from today.
                  </p>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#0369a1', fontSize: '0.9rem' }}>
                    💎 <strong>Premium users</strong> can search for appointments starting from tomorrow.
                  </p>
                </div>
              </div>
            )}
            
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
              {data.target_city_codes && data.target_city_codes.split(',').filter(Boolean).length > 0 ? (
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
                      <strong>Search in all cities:</strong> The search will be performed in all available cities for this country.
                    </p>
                    {!permissions.canManageApplicants() && (
                      <p style={{ margin: '0.5rem 0 0 0', color: '#0369a1', fontSize: '0.9rem' }}>
                        💎 <strong>Premium users</strong> can select specific cities for their search.
                      </p>
                    )}
                  </div>
                </div>
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

      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        showCancel={modal.showCancel}
      />
    </>
  );
};

export default ApplicantView;
