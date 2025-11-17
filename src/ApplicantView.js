import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();
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

  // Format date for display
  const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(i18n.language, options);
  };

  // Calculate search start date based on days
  const getSearchStartDate = (days) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight to avoid timezone issues
    const startDate = new Date(today);
    const daysToAdd = parseInt(days) || 3;
    startDate.setDate(startDate.getDate() + daysToAdd);
    return startDate;
  };

  // Format end date for display
  const formatEndDate = (dateString) => {
    if (!dateString) return 'N/A';
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day);
    return formatDate(date);
  };

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
      title: t('deleteApplicant', 'Delete Applicant'),
      message: t('deleteApplicantConfirm', 'Are you sure you want to delete this applicant?'),
      type: 'confirm',
      showCancel: true,
      onConfirm: async () => {
        const isSearchRunning = data && (data.search_status === 'Running');
        
        if (isSearchRunning) {
          setModal({
            isOpen: true,
            title: t('searchInProgress', 'Search in Progress'),
            message: t('stopSearchBeforeDeleting', 'Search is in progress. Do you want to stop the search before deleting?'),
            type: 'warning',
            showCancel: true,
            onConfirm: async () => {
              try {
                await StopApplicantContainer(applicantId);
                setModal({
                  isOpen: true,
                  title: t('searchStopped', 'Search Stopped'),
                  message: t('searchStoppedApplicantDeleted', 'Search stopped. The applicant will now be deleted.'),
                  type: 'info',
                  showCancel: false,
                  onConfirm: async () => {
                    try {
                      const response = await ApplicantDelete(applicantId);
                      if (response && response.success) {
                        setModal({
                          isOpen: true,
                          title: t('success', 'Success'),
                          message: t('applicantDeletedSuccessfully', 'Applicant deleted successfully.'),
                          type: 'success',
                          showCancel: false,
                          onConfirm: () => navigate('/applicants')
                        });
                      } else {
                        setModal({
                          isOpen: true,
                          title: t('error', 'Error'),
                          message: t('unexpectedResponseDeleting', 'Unexpected response when deleting applicant.'),
                          type: 'error',
                          showCancel: false
                        });
                      }
                    } catch (error) {
                      setModal({
                        isOpen: true,
                        title: t('error', 'Error'),
                        message: t('failedToDeleteApplicant', 'Failed to delete applicant. Please try again.'),
                        type: 'error',
                        showCancel: false
                      });
                    }
                  }
                });
              } catch (error) {
                setModal({
                  isOpen: true,
                  title: t('error', 'Error'),
                  message: t('failedToStopSearchOrDelete', 'Failed to stop search or delete applicant. Please try again.'),
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
              title: t('success', 'Success'),
              message: t('applicantDeletedSuccessfully', 'Applicant deleted successfully.'),
              type: 'success',
              showCancel: false,
              onConfirm: () => navigate('/applicants')
            });
          } else {
            setModal({
              isOpen: true,
              title: t('error', 'Error'),
              message: t('unexpectedResponseDeleting', 'Unexpected response when deleting applicant.'),
              type: 'error',
              showCancel: false
            });
          }
        } catch (error) {
          console.error('Error deleting applicant:', error);
          setModal({
            isOpen: true,
            title: t('error', 'Error'),
            message: t('errorDeletingApplicant', 'Error deleting applicant.'),
            type: 'error',
            showCancel: false
          });
        }
      }
    });
  };

  const handleToggleSearch = async () => {
    try {
      if (data.search_status === 'Stopped') {
        const concurrentLimit = parseInt(sessionStorage.getItem('concurrent_applicants'));
        const applicantsResponse = await ApplicantSearch(fastVisaUserId);
        const runningCount = applicantsResponse.filter(a => a.search_status === 'Running').length;
        
        if (runningCount >= concurrentLimit) {
          setModal({
            isOpen: true,
            title: t('limitReached', 'Limit Reached'),
            message: t('concurrentLimitMessage', `You have reached your concurrent applicants limit ({limit}).\nTo start a new applicant, please end one of your currently running applicants first.`).replace('{limit}', concurrentLimit),
            type: 'warning',
            showCancel: false
          });
          return;
        }
        
        await StartApplicantContainer(applicantId);
        setModal({
          isOpen: true,
          title: t('success', 'Success'),
          message: t('searchStartedSuccess', 'Search started successfully.'),
          type: 'success',
          showCancel: false
        });
      } else {
        await StopApplicantContainer(applicantId);
        setModal({
          isOpen: true,
          title: t('success', 'Success'),
          message: t('searchStoppedSuccess', 'Search stopped successfully.'),
          type: 'success',
          showCancel: false
        });
      }
      
      setRefreshFlag(flag => !flag);
    } catch (error) {
      setModal({
        isOpen: true,
        title: t('error', 'Error'),
        message: t('errorPerformingAction', 'Error performing action.'),
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
        title: t('copied', 'Copied'),
        message: t('emailCopied', 'Email copied to clipboard'),
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
        title: t('copied', 'Copied'),
        message: t('passwordCopied', 'Password copied to clipboard'),
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
    const statusTranslations = {
      'Running': t('running', 'Running'),
      'Stopped': t('stopped', 'Stopped'),
      'Error': t('error', 'Error'),
      'Completed': t('completed', 'Completed'),
    };

    const statusStyles = {
      'Running': { background: '#2196f3', color: '#fff' },
      'Stopped': { background: '#ff9800', color: '#fff' },
      'Error': { background: '#f44336', color: '#fff' },
      'Completed': { background: '#4caf50', color: '#fff' },
    };

    const style = statusStyles[status] || { background: '#9e9e9e', color: '#fff' };

    return (
      <span className="applicant-view-badge" style={{ background: style.background, color: style.color }}>
        {statusTranslations[status] || status}
      </span>
    );
  };

  const renderBooleanBadge = (value) => (
    <span className="applicant-view-badge" style={{
      background: value ? '#4caf50' : '#e0e0e0',
      color: value ? '#fff' : '#888'
    }}>
      {value ? t('active', 'Active') : t('inactive', 'Inactive')}
    </span>
  );

  if (loading) {
    return (
      <>
        <HamburgerMenu />
        <div className="applicant-view-container">
          <div className="applicant-view-loading">
            <i className="fas fa-spinner fa-spin"></i>
            <p>{t('loadingApplicantDetails', 'Loading applicant details...')}</p>
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
            <p>{t('applicantNotFound', 'Applicant not found')}</p>
            {permissions.canManageApplicants() && (
              <button onClick={() => navigate('/applicants')} className="applicant-view-btn">
                {t('backToApplicants', 'Back to Applicants')}
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
              {permissions.canManageApplicants() ? t('applicantDetails', 'Applicant Details') : t('myAppointment', 'My Appointment')}
            </h1>
            <p className="applicant-view-subtitle">
              {permissions.canManageApplicants() ? t('viewManageApplicantInfo', 'View and manage applicant information') : t('viewManageAppointment', 'View and manage your appointment search')}
            </p>
          </div>
          <div className="applicant-view-header-actions">
            {permissions.canManageApplicants() && (
              <button onClick={() => navigate('/applicants')} className="applicant-view-btn applicant-view-btn-secondary">
                <i className="fas fa-arrow-left"></i>
                {t('back', 'Back')}
              </button>
            )}
            <button onClick={handleEdit} className="applicant-view-btn applicant-view-btn-primary">
              <i className="fas fa-edit"></i>
              {t('edit', 'Edit')}
            </button>
            {permissions.canManageApplicants() && (
              <button onClick={handleDelete} className="applicant-view-btn" style={{ background: '#f44336', color: '#fff' }}>
                <i className="fas fa-trash-alt"></i>
                {t('delete', 'Delete')}
              </button>
            )}
          </div>
        </div>

        <div className="applicant-view-content">

          {/* Basic Information Section */}
          <div className="applicant-view-section">
            <h2 className="applicant-view-section-title">
              <i className="fas fa-user"></i>
              {t('basicInformation', 'Basic Information')}
            </h2>
            
            <div className="applicant-view-grid">
              <div className="applicant-view-field">
                <label>{t('fullName', 'Full Name')}</label>
                <div className="applicant-view-value">{data.name || 'N/A'}</div>
              </div>

              {permissions.canManageApplicants() && (
                <div className="applicant-view-field">
                  <label>{t('applicantStatus', 'Applicant Status')}</label>
                  <div className="applicant-view-value">
                    {renderBooleanBadge(data.applicant_active)}
                  </div>
                </div>
              )}

              <div className="applicant-view-field">
                <label>{t('searchStatus', 'Search Status')}</label>
                <div className="applicant-view-value" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {renderStatusBadge(data.search_status)}
                  <button 
                    onClick={handleToggleSearch} 
                    className={`applicant-view-action-btn ${data.search_status === 'Stopped' ? 'start' : 'stop'}`}
                    style={{ margin: 0, minWidth: '140px' }}
                  >
                    <i className={data.search_status === 'Stopped' ? 'fas fa-play-circle' : 'fas fa-stop-circle'}></i>
                    {data.search_status === 'Stopped' ? t('startSearch', 'Start Search') : t('stopSearch', 'Stop Search')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Visa Appointment System Credentials Section */}
          <div className="applicant-view-section">
            <h2 className="applicant-view-section-title">
              <i className="fas fa-key"></i>
              {t('visaCredentials', 'Visa Appointment System Credentials')}
            </h2>
            
            <div className="applicant-view-grid">
              <div className="applicant-view-field">
                <label>{t('visaEmail', 'Visa Appointment System Email')}</label>
                <div className="applicant-view-value applicant-view-value-code" style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                  <span>{data.ais_username || 'N/A'}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleCopyEmail} className="applicant-view-action-btn" style={{ margin: 0, padding: '6px 12px', fontSize: '0.9rem' }} title={t('copyEmail', 'Copy Email')}>
                      <i className="fas fa-copy"></i>
                    </button>
                    <button onClick={handleCopyPassword} className="applicant-view-action-btn" style={{ margin: 0, padding: '6px 12px', fontSize: '0.9rem' }} title={t('copyPassword', 'Copy Password')}>
                      <i className="fas fa-key"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div className="applicant-view-field">
                <label>{t('scheduleId', 'Schedule ID')}</label>
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
              {t('targetDates', 'Target Dates')}
            </h2>
            
            {!permissions.canManageApplicants() && data.target_start_mode === 'days' && data.target_start_days === '120' && (
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
            
            <div className="applicant-view-grid">
              {data.target_start_mode === 'date' && (
                <div className="applicant-view-field">
                  <label>{t('targetStartDate', 'Target Start Date')}</label>
                  <div className="applicant-view-value">{data.target_start_date || 'N/A'}</div>
                </div>
              )}

              {data.target_start_mode === 'days' && (
                <div className="applicant-view-field">
                  {permissions.canManageApplicants() || data.target_start_days !== '120' ? (
                    <>
                      <label>{t('targetStartDays', 'Target Start Days')}</label>
                      <div className="applicant-view-value" style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <span>{data.target_start_days || 'N/A'} {t('days', 'days')}</span>
                        {data.target_start_days && (
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
                            {t('startDate', 'Start date')}: {formatDate(getSearchStartDate(data.target_start_days))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <label>{t('searchStartsIn', 'Search Starts In')}</label>
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
                          {t('startDate', 'Start date')}: {formatDate(getSearchStartDate(data.target_start_days))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="applicant-view-field">
                <label>{t('targetEndDate', 'Target End Date')}</label>
                {!permissions.canManageApplicants() && data.target_end_date ? (
                  <>
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
                        <i className="fas fa-calendar-check" style={{ marginRight: '8px', color: '#6b7280' }}></i>
                        {formatEndDate(data.target_end_date)}
                      </div>
                      <div style={{
                        marginTop: '8px',
                        paddingTop: '8px',
                        borderTop: '1px solid #d1d5db',
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        lineHeight: '1.5'
                      }}>
                        <i className="fas fa-info-circle" style={{ marginRight: '6px' }}></i>
                        {t('targetEndDateExplanationView', 'Esta es la fecha máxima en que aceptarías una cita. La búsqueda buscará citas disponibles entre 4 meses desde ahora y esta fecha.')}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="applicant-view-value">{data.target_end_date || 'N/A'}</div>
                )}
              </div>
            </div>
          </div>

          {/* Target Cities Section */}
          {cities.length > 0 && (
            <div className="applicant-view-section">
              <h2 className="applicant-view-section-title">
                <i className="fas fa-map-marker-alt"></i>
                {t('targetCities', 'Target Cities')}
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
                        <strong>{t('searchAllCities', 'Search in all cities:')}</strong> {t('searchPerformedAllCities', 'The search will be performed in all available cities for this country.')}
                      </p>
                      {!permissions.canManageApplicants() && (
                        <p style={{ margin: '0.5rem 0 0 0', color: '#0369a1', fontSize: '0.9rem' }}>
                          💎 <strong>{t('premiumUsers', 'Premium users')}</strong> {t('canSelectSpecificCities', 'can select specific cities for their search.')}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Reserved Appointments Section */}
          {(data.consul_appointment_date || data.asc_appointment_date) && (
            <div className="applicant-view-section">
              <h2 className="applicant-view-section-title">
                <i className="fas fa-calendar-check"></i>
                {t('reservedAppointments', 'Reserved Appointments')}
              </h2>
              
              <div className="applicant-view-grid">
                <div className="applicant-view-field">
                  <label>{t('consulateAppointmentDate', 'Consulate Appointment Date')}</label>
                  <div className="applicant-view-value">{data.consul_appointment_date || t('notSet', 'Not set')}</div>
                </div>

                <div className="applicant-view-field">
                  <label>{t('ascAppointmentDate', 'ASC Appointment Date')}</label>
                  <div className="applicant-view-value">{data.asc_appointment_date || t('notSet', 'Not set')}</div>
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
