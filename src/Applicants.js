import React, { useEffect, useState } from "react";
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
} from "./APIFunctions";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./utils/AuthContext";
import "./index.css";
import "./Applicants.css";
import { permissions } from "./utils/permissions";

const Applicants = () => {
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
  const canResetStatus = permissions.canResetStatus();

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
            title: 'Limit Reached',
            message: `You have reached your concurrent applicants limit (${concurrentLimit}).\nTo start a new applicant, please end one of your currently running applicants first.`,
            type: 'warning',
            showCancel: false
          });
          return;
        }
        // Start search using API function
        await StartApplicantContainer(id);
        setModal({
          isOpen: true,
          title: 'Success',
          message: 'Search started successfully.',
          type: 'success',
          showCancel: false
        });
      } else {
        // Stop search using API function
        await StopApplicantContainer(id);
        setModal({
          isOpen: true,
          title: 'Success',
          message: 'Search stopped successfully.',
          type: 'success',
          showCancel: false
        });
      }
      setRefreshFlag((flag) => !flag);
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

  const handleCopyPassword = async (id) => {
    try {
      const response = await GetApplicantPassword(id);
      const password = response.password;
      await navigator.clipboard.writeText(password);
      setModal({
        isOpen: true,
        title: 'Copied',
        message: 'Password copied to clipboard',
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
        title: 'Copied',
        message: 'Email copied to clipboard',
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
          title: 'Success',
          message: 'Status reset successfully.',
          type: 'success',
          showCancel: false
        });
        setRefreshFlag((flag) => !flag);
      } else {
        setModal({
          isOpen: true,
          title: 'Error',
          message: 'Failed to reset status.',
          type: 'error',
          showCancel: false
        });
      }
    } catch (error) {
      console.error("Error resetting status:", error);
      setModal({
        isOpen: true,
        title: 'Error',
        message: 'Error resetting status.',
        type: 'error',
        showCancel: false
      });
    }
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
    }}>{value ? "Active" : "Inactive"}</span>
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
        title={isActive === "Inactive" ? "Start Search" : "Stop Search"}
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
        title="View Details"
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
        title="Copy Password"
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
        title="Copy Email"
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
        title="Reset Status"
        onClick={() => handleResetStatus(id)}
      >
        <i className="fas fa-undo"></i>
      </button>
    </td>
  );

  return (
    <>
      <HamburgerMenu />
      <div className="applicants-main-container">
        <h2 className="applicants-title">Applicants</h2>
        <div className="applicants-filters-bar">
        <div className="applicants-filters">
          <div className="toggle-switch" title="Filter only active" onClick={() => setFilterActive(!filterActive)}>
            <div className={`switch-track${filterActive ? " active" : ""}`}></div>
            <div className={`switch-thumb${filterActive ? " active" : ""}`}></div>
          </div>
          <label>Only Active</label>
          <div className="toggle-switch" title="Filter only Running" onClick={() => setFilterRunning(!filterRunning)}>
            <div className={`switch-track${filterRunning ? " active" : ""}`}></div>
            <div className={`switch-thumb${filterRunning ? " active" : ""}`}></div>
          </div>
          <label>Only Running</label>
          {canViewAllApplicants && allRegisteredUsers.length > 0 && (
            <>
              <label htmlFor="registeredByFilter" style={{ marginLeft: '48px' }}>Registered by:</label>
              <select
                id="registeredByFilter"
                value={registeredByFilter}
                onChange={(e) => setRegisteredByFilter(e.target.value)}
                style={{ minWidth: 120, padding: '4px 8px', borderRadius: 5, border: '1px solid #e3eaf3' }}
              >
                <option value="">All</option>
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
            <i className="fas fa-user-plus" style={{marginRight: 8}}></i>Register Applicant
          </button>
        </div>
      </div>
      <div className="applicants-table-container">
        <table className="applicants-table">
          <thead>
            <tr>
              <th>AIS ID</th>
              <th>AIS Username</th>
              <th>Name</th>
              <th>Applicant Status</th>
              <th>Search Status</th>
              <th>Target End Date</th>
              {canViewAllApplicants && <th>Registered By</th>}
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((item, index) => (
                <tr key={item.id || index}>
                  {includeFields.map((field) => (
                    <td key={`${item.id}-${field}`} style={{ textAlign: "left" }}>
                      {field === "applicant_active"
                        ? renderBooleanValue(item[field])
                        : field === "search_status"
                        ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {renderSearchStatusBadge(item[field])}
                            <button
                              className="applicants-action-btn"
                              title={item.search_status === "Inactive" ? "Start Search" : "Stop Search"}
                              onClick={() => handleAction(item.id, item.search_status)}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                            >
                              <i className={item.search_status === "Inactive" ? "fas fa-play-circle" : "fas fa-stop-circle"}></i>
                            </button>
                            {canResetStatus && (
                              <button
                                className="applicants-action-btn"
                                title="Reset Status"
                                onClick={() => handleResetStatus(item.id)}
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                              >
                                <i className="fas fa-undo"></i>
                              </button>
                            )}
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
                            <button
                              className="applicants-action-btn"
                              title="Edit with new form"
                              onClick={() => handleEditApplicant(item.id)}
                              style={{ padding: '6px 10px', fontSize: '14px' }}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                          </div>
                        )
                        : field === "ais_username"
                        ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{item[field]}</span>
                            <button
                              className="applicants-action-btn"
                              title="Copy Email"
                              onClick={() => handleCopyEmail(item.id)}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                            >
                              <i className="fas fa-copy"></i>
                            </button>
                            <button
                              className="applicants-action-btn"
                              title="Copy Password"
                              onClick={() => handleCopyPassword(item.id)}
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                            >
                              <i className="fas fa-key"></i>
                            </button>
                          </div>
                        )
                        : item[field]}
                    </td>
                  ))}
                  {canViewAllApplicants && (
                    <td key={`${item.id}-registeredby`} style={{ textAlign: "left" }}>
                      {item.fastVisa_username || ""}
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
                      No applicants found
                    </div>
                    <div style={{ fontSize: "14px", color: "#999" }}>
                      {filterActive || filterRunning || registeredByFilter
                        ? "Try adjusting your filters or register a new applicant to get started."
                        : "Click 'Register Applicant' to add your first applicant."}
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
