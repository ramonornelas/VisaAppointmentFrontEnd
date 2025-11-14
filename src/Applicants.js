import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import Banner from "./Banner";
import HamburgerMenu from "./HamburgerMenu";
import Modal from "./Modal";
import {
  ApplicantSearch,
  GetApplicantPassword,
  StartApplicantContainer,
  StopApplicantContainer,
  ApplicantUpdate,
  ApplicantDetails,
  UserDetails,
  getRoles,
  ApplicantDelete,
} from "./APIFunctions";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./utils/AuthContext";
import "./index.css";
import "./Applicants.css";
import { permissions } from "./utils/permissions";

const Applicants = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState(null);
  const [allRegisteredUsers, setAllRegisteredUsers] = useState([]);
  const [registeredByFilter, setRegisteredByFilter] = useState("");
  const [filterActive, setFilterActive] = useState(true);
  const [filterRunning, setFilterRunning] = useState(false);
  const fastVisaUserId = sessionStorage.getItem("fastVisa_userid");
  const navigate = useNavigate();
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    showCancel: false
  });

  // Define the included fields
  const includeFields = [
    "ais_schedule_id",
    "ais_username",
    "name",
    "applicant_active",
    "search_status",
    "target_end_date",
  ];
  // Use centralized permissions utility
  const canViewAllApplicants = permissions.canViewAllApplicants();
  const canClearStatus = permissions.canClearStatus();

  // Check if user is basic_user and redirect accordingly
  useEffect(() => {
    const checkUserRole = async () => {
      if (!fastVisaUserId) return;
      
      try {
        const [userData, rolesData] = await Promise.all([
          UserDetails(fastVisaUserId),
          getRoles()
        ]);

        if (userData && rolesData) {
          const currentRole = rolesData.find(role => role.id === userData.role_id);
          const roleName = currentRole ? currentRole.name : 'unknown';
          
          console.log('[Applicants] User role:', roleName);
          
          // Basic users should not access the applicants list
          if (roleName === 'basic_user') {
            // Fetch applicants for this user
            const applicants = await ApplicantSearch(fastVisaUserId);
            
            if (applicants && applicants.length > 0) {
              // Redirect to first applicant details
              const firstApplicantId = applicants[0].id;
              console.log('[Applicants] Basic user redirecting to applicant:', firstApplicantId);
              navigate(`/view-applicant/${firstApplicantId}`);
            } else {
              // Redirect to create applicant
              console.log('[Applicants] Basic user redirecting to create applicant');
              navigate('/applicant-form');
            }
          }
        }
      } catch (error) {
        console.error('[Applicants] Error checking user role:', error);
      }
    };

    if (isAuthenticated && fastVisaUserId) {
      checkUserRole();
    }
  }, [isAuthenticated, fastVisaUserId, navigate]);

  useEffect(() => {
    if (!isAuthenticated) {
      document.body.classList.remove("menu-open");
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        let response;
        if (canViewAllApplicants) {
          response = await ApplicantSearch(null);
        } else {
          response = await ApplicantSearch(fastVisaUserId);
        }
        // Guardar todos los usuarios únicos para el dropdown
        if (Array.isArray(response)) {
          setAllRegisteredUsers([
            ...new Set(
              response.map((item) => item.fastVisa_username).filter(Boolean)
            ),
          ]);
        }
        let filteredData = response;
        if (filterActive) {
          filteredData = filteredData.filter(
            (item) => item.applicant_active === true
          );
        }
        if (filterRunning) {
          filteredData = filteredData.filter(
            (item) => item.search_status === "Running"
          );
        }
        // Filtrar por Registered By si el usuario es admin y el filtro está seleccionado
        if (canViewAllApplicants && registeredByFilter) {
          filteredData = filteredData.filter(
            (item) => item.fastVisa_username === registeredByFilter
          );
        }
        setData(filteredData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (fastVisaUserId) {
      fetchData();
    }
  }, [
    isAuthenticated,
    fastVisaUserId,
    filterActive,
    filterRunning,
    registeredByFilter,
    canViewAllApplicants,
    navigate,
    refreshFlag,
  ]);

  const handleRegisterApplicant = () => {
    navigate("/applicant-form");
  };

  const handleEditApplicant = (id) => {
    navigate(`/applicant-form?id=${id}`);
  };

  const handleView = (id) => {
    sessionStorage.setItem("applicant_userid", id);
    navigate(`/ViewApplicant`);
  };

  const handleAction = async (id, isActive) => {
    try {
      if (isActive === "Inactive") {
        // Check concurrent limit
        const concurrentLimit = parseInt(
          sessionStorage.getItem("concurrent_applicants")
        );
        const applicantsResponse = await ApplicantSearch(fastVisaUserId);
        const runningCount = applicantsResponse.filter(
          (a) => a.search_status === "Running"
        ).length;
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
        // Start search using API function
        await StartApplicantContainer(id);
        setModal({
          isOpen: true,
          title: t('success', 'Success'),
          message: t('searchStartedSuccess', 'Search started successfully.'),
          type: 'success',
          showCancel: false
        });
      } else {
        // Stop search using API function
        await StopApplicantContainer(id);
        setModal({
          isOpen: true,
          title: t('success', 'Success'),
          message: t('searchStoppedSuccess', 'Search stopped successfully.'),
          type: 'success',
          showCancel: false
        });
      }
      setRefreshFlag((flag) => !flag);
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

  const handleCopyPassword = async (id) => {
    try {
      const response = await GetApplicantPassword(id);
      const password = response.password;
      await navigator.clipboard.writeText(password);
      setModal({
        isOpen: true,
        title: t('copied', 'Copied'),
        message: t('passwordCopied', 'Password copied to clipboard'),
        type: 'success',
        showCancel: false
      });
    } catch (error) {
      console.error("Error copying password:", error);
    }
  };

  const handleCopyEmail = async (id) => {
    try {
      const response = await ApplicantDetails(id);
      const email = response.ais_username;
      await navigator.clipboard.writeText(email);
      setModal({
        isOpen: true,
        title: t('copied', 'Copied'),
        message: t('emailCopied', 'Email copied to clipboard'),
        type: 'success',
        showCancel: false
      });
    } catch (error) {
      console.error("Error copying email:", error);
    }
  };

  const handleResetStatus = async (id) => {
    try {
      const response = await ApplicantUpdate(id, {
        search_status: "Inactive",
        container_id: null,
        container_start_datetime: null,
      });
      if (response) {
        setModal({
          isOpen: true,
          title: t('success', 'Success'),
          message: t('statusClearedSuccess', 'Status cleared successfully.'),
          type: 'success',
          showCancel: false
        });
        setRefreshFlag((flag) => !flag);
      } else {
        setModal({
          isOpen: true,
          title: t('error', 'Error'),
          message: t('failedToClearStatus', 'Failed to clear status.'),
          type: 'error',
          showCancel: false
        });
      }
    } catch (error) {
      console.error("Error clearing status:", error);
      setModal({
        isOpen: true,
        title: t('error', 'Error'),
        message: t('errorClearingStatus', 'Error clearing status.'),
        type: 'error',
        showCancel: false
      });
    }
  };

  const handleDeleteApplicant = async (id) => {
    setModal({
      isOpen: true,
      title: t('deleteApplicant', 'Delete Applicant'),
      message: t('deleteApplicantConfirm', 'Are you sure you want to delete this applicant?'),
      type: 'warning',
      showCancel: true,
      onConfirm: async () => {
        try {
          // Check if search is running
          const applicantData = await ApplicantDetails(id);
          const isSearchRunning = applicantData && (applicantData.search_status === "Running" || applicantData.search_active === true);
          
          if (isSearchRunning) {
            // Ask to stop search first
            setModal({
              isOpen: true,
              title: t('searchInProgress', 'Search in Progress'),
              message: t('stopSearchBeforeDeleting', 'Search is in progress. Do you want to stop the search before deleting?'),
              type: 'warning',
              showCancel: true,
              onConfirm: async () => {
                try {
                  await StopApplicantContainer(id);
                  setModal({
                    isOpen: true,
                    title: t('searchStopped', 'Search Stopped'),
                    message: t('searchStoppedApplicantDeleted', 'Search stopped. The applicant will now be deleted.'),
                    type: 'info',
                    showCancel: false,
                    onConfirm: async () => {
                      try {
                        const response = await ApplicantDelete(id);
                        if (response && response.success) {
                          setModal({
                            isOpen: true,
                            title: t('success', 'Success'),
                            message: t('applicantDeletedSuccessfully', 'Applicant deleted successfully.'),
                            type: 'success',
                            showCancel: false
                          });
                          setRefreshFlag((flag) => !flag);
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
                        console.error("Error deleting applicant:", error);
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
                  console.error("Error stopping search or deleting:", error);
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
          } else {
            // Search not running, proceed to delete
            try {
              const response = await ApplicantDelete(id);
              if (response && response.success) {
                setModal({
                  isOpen: true,
                  title: t('success', 'Success'),
                  message: t('applicantDeletedSuccessfully', 'Applicant deleted successfully.'),
                  type: 'success',
                  showCancel: false
                });
                setRefreshFlag((flag) => !flag);
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
              console.error("Error in ApplicantDelete:", error);
              setModal({
                isOpen: true,
                title: t('error', 'Error'),
                message: t('errorDeletingApplicant', 'Error deleting applicant.'),
                type: 'error',
                showCancel: false
              });
            }
          }
        } catch (error) {
          console.error("Error checking applicant status:", error);
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


  const renderBooleanValue = (value) => (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: '12px',
      fontWeight: 600,
      fontSize: '0.95em',
      color: value ? '#fff' : '#888',
      background: value ? '#4caf50' : '#e0e0e0',
      letterSpacing: '0.5px',
      minWidth: 60,
      textAlign: 'center',
    }}>{value ? t('active', 'Active') : t('inactive', 'Inactive')}</span>
  );

  const renderSearchStatusBadge = (status) => {
    const statusStyles = {
      'Running': {
        background: '#2196f3',
        color: '#fff',
      },
      'Inactive': {
        background: '#e0e0e0',
        color: '#888',
      },
      'Stopped': {
        background: '#ff9800',
        color: '#fff',
      },
      'Error': {
        background: '#f44336',
        color: '#fff',
      },
      'Completed': {
        background: '#4caf50',
        color: '#fff',
      },
    };

    const style = statusStyles[status] || { background: '#9e9e9e', color: '#fff' };

    return (
      <span style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '12px',
        fontWeight: 600,
        fontSize: '0.95em',
        color: style.color,
        background: style.background,
        letterSpacing: '0.5px',
        minWidth: 60,
        textAlign: 'center',
      }}>{status}</span>
    );
  };

  const renderActionButton = (id, isActive) => (
    <td key={`toggle-${id}`} style={{ textAlign: "center" }}>
      <button
        className="applicants-action-btn"
        title={isActive === "Inactive" ? t('startSearch', 'Start Search') : t('stopSearch', 'Stop Search')}
        onClick={() => handleAction(id, isActive)}
      >
        <i className={isActive === "Inactive" ? "fas fa-play-circle" : "fas fa-stop-circle"}></i>
      </button>
    </td>
  );

  const renderViewButton = (id) => (
    <td key={`edit-${id}`} style={{ textAlign: "center" }}>
      <button
        className="applicants-action-btn"
        title={t('viewDetails', 'View Details')}
        onClick={() => handleView(id)}
      >
        <i className="fas fa-eye"></i>
      </button>
    </td>
  );

  const renderPasswordButton = (id) => (
    <td key={`password-${id}`} style={{ textAlign: "center" }}>
      <button
        className="applicants-action-btn"
        title={t('copyPassword', 'Copy Password')}
        onClick={() => handleCopyPassword(id)}
      >
        <i className="fas fa-key"></i>
      </button>
    </td>
  );

  const renderEmailButton = (id) => (
    <td key={`email-${id}`} style={{ textAlign: "center" }}>
      <button
        className="applicants-action-btn"
        title={t('copyEmail', 'Copy Email')}
        onClick={() => handleCopyEmail(id)}
      >
        <i className="fas fa-envelope"></i>
      </button>
    </td>
  );

  const renderResetStatusButton = (id) => (
    <td key={`reset-${id}`} style={{ textAlign: "center" }}>
      <button
        className="applicants-action-btn"
        title={t('clearStatus', 'Clear Status')}
        onClick={() => handleResetStatus(id)}
      >
        <i className="fas fa-eraser"></i>
      </button>
    </td>
  );

  return (
    <>
      <HamburgerMenu />
      <div className="applicants-main-container">
        <h2 className="applicants-title">{t('applicants', 'Applicants')}</h2>
        <div className="applicants-filters-bar">
        <div className="applicants-filters">
          <div className="toggle-switch" title={t('onlyActive', 'Filter only active')} onClick={() => setFilterActive(!filterActive)}>
            <div className={`switch-track${filterActive ? " active" : ""}`}></div>
            <div className={`switch-thumb${filterActive ? " active" : ""}`}></div>
          </div>
          <label>{t('onlyActive', 'Only Active')}</label>
          <div className="toggle-switch" title={t('onlyRunning', 'Filter only Running')} onClick={() => setFilterRunning(!filterRunning)}>
            <div className={`switch-track${filterRunning ? " active" : ""}`}></div>
            <div className={`switch-thumb${filterRunning ? " active" : ""}`}></div>
          </div>
          <label>{t('onlyRunning', 'Only Running')}</label>
          {canViewAllApplicants && allRegisteredUsers.length > 0 && (
            <>
              <label htmlFor="registeredByFilter" style={{ marginLeft: '48px' }}>{t('registeredBy', 'Registered by')}:</label>
              <select
                id="registeredByFilter"
                value={registeredByFilter}
                onChange={(e) => setRegisteredByFilter(e.target.value)}
                style={{ minWidth: 120, padding: '4px 8px', borderRadius: 5, border: '1px solid #e3eaf3' }}
              >
                <option value="">{t('all', 'All')}</option>
                {allRegisteredUsers.map((username) => (
                  <option key={username} value={username}>
                    {username}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="applicants-register-btn" onClick={handleRegisterApplicant}>
            <i className="fas fa-user-plus" style={{marginRight: 8}}></i>{t('registerApplicant', 'Register Applicant')}
          </button>
        </div>
      </div>
      <div className="applicants-table-container">
        <table className="applicants-table">
          <thead>
            <tr>
              <th>{t('aisId', 'AIS ID')}</th>
              <th>{t('aisUsername', 'AIS Username')}</th>
              <th>{t('name', 'Name')}</th>
              <th>{t('applicantStatus', 'Applicant Status')}</th>
              <th>{t('searchStatus', 'Search Status')}</th>
              <th>{t('targetEndDate', 'Target End Date')}</th>
              {canViewAllApplicants && <th>{t('registeredBy', 'Registered By')}</th>}
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((item, index) => (
                <tr key={item.id || index}>
                  {includeFields.map((field) => (
                    <td key={`${item.id}-${field}`} style={{ textAlign: "left", verticalAlign: "top" }}>
                      {field === "applicant_active"
                        ? renderBooleanValue(item[field])
                        : field === "search_status"
                        ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {renderSearchStatusBadge(item[field])}
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                className="applicants-action-btn"
                                title={item.search_status === "Inactive" ? t('startSearch', 'Start Search') : t('stopSearch', 'Stop Search')}
                                onClick={() => handleAction(item.id, item.search_status)}
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                              >
                                <i className={item.search_status === "Inactive" ? "fas fa-play-circle" : "fas fa-stop-circle"}></i>
                              </button>
                              {canClearStatus && (
                                <button
                                  className="applicants-action-btn"
                                  title={t('clearStatus', 'Clear Status')}
                                  onClick={() => handleResetStatus(item.id)}
                                  style={{ padding: '4px 8px', fontSize: '12px' }}
                                >
                                  <i className="fas fa-eraser"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        )
                        : field === "ais_schedule_id"
                        ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handleView(item.id);
                              }}
                              className="applicants-id-link"
                              title="Click to view details"
                            >
                              {item[field]}
                            </a>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                className="applicants-action-btn"
                                title={t('edit', 'Edit')}
                                onClick={() => handleEditApplicant(item.id)}
                                style={{ padding: '6px 10px', fontSize: '14px' }}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="applicants-action-btn"
                                title={t('deleteApplicant', 'Delete Applicant')}
                                onClick={() => handleDeleteApplicant(item.id)}
                                style={{ padding: '6px 10px', fontSize: '14px', color: '#f44336' }}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        )
                        : field === "ais_username"
                        ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{item[field]}</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                className="applicants-action-btn"
                                title={t('copyEmail', 'Copy Email')}
                                onClick={() => handleCopyEmail(item.id)}
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                              >
                                <i className="fas fa-copy"></i>
                              </button>
                              <button
                                className="applicants-action-btn"
                                title={t('copyPassword', 'Copy Password')}
                                onClick={() => handleCopyPassword(item.id)}
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                              >
                                <i className="fas fa-key"></i>
                              </button>
                            </div>
                          </div>
                        )
                        : item[field]}
                    </td>
                  ))}
                  {canViewAllApplicants && (
                    <td key={`${item.id}-registeredby`} style={{ textAlign: "left", verticalAlign: "middle" }}>
                      <span>{item.fastVisa_username || ""}</span>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={canViewAllApplicants ? 7 : 6} style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center", 
                    justifyContent: "center",
                    color: "#888",
                    gap: "15px"
                  }}>
                    <i className="fas fa-users" style={{ fontSize: "48px", color: "#ddd" }}></i>
                    <div style={{ fontSize: "18px", fontWeight: "500", color: "#666" }}>
                      {t('noApplicantsFound', 'No applicants found')}
                    </div>
                    <div style={{ fontSize: "14px", color: "#999" }}>
                      {filterActive || filterRunning || registeredByFilter
                        ? t('adjustFilters', 'Try adjusting your filters or register a new applicant to get started.')
                        : t('clickToAddFirst', "Click 'Register Applicant' to add your first applicant.")}
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
}

export default Applicants;
