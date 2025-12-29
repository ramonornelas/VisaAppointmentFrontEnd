import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import HamburgerMenu from "../common/HamburgerMenu";
import Modal from "../common/Modal";
import {
  ApplicantSearch,
  GetApplicantPassword,
  StartApplicantContainer,
  StopApplicantContainer,
  ApplicantUpdate,
  ApplicantDetails,
  // UserDetails, getRoles - not used in this component
  ApplicantDelete,
} from "../../services/APIFunctions";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../utils/AuthContext";
import "../../index.css";
import "./Applicants.css";
import { permissions } from "../../utils/permissions";
import FastVisaMetrics from "../../utils/FastVisaMetrics";

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
    title: "",
    message: "",
    type: "info",
    onConfirm: null,
    showCancel: false,
  });

  // Initialize metrics tracker
  const metrics = useMemo(() => new FastVisaMetrics(), []);

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

  // Check if user can manage applicants and redirect accordingly
  useEffect(() => {
    const checkUserPermissions = async () => {
      if (!fastVisaUserId) return;

      try {
        // Users who cannot manage applicants should not access the applicants list
        if (!permissions.canManageApplicants()) {
          // Fetch applicants for this user
          const applicants = await ApplicantSearch(fastVisaUserId);

          if (applicants && applicants.length > 0) {
            // Redirect to first applicant details
            const firstApplicantId = applicants[0].id;
            console.log(
              "[Applicants] User cannot manage applicants, redirecting to applicant:",
              firstApplicantId
            );
            navigate(`/view-applicant/${firstApplicantId}`);
          } else {
            // Redirect to create applicant
            console.log(
              "[Applicants] User cannot manage applicants, redirecting to create applicant"
            );
            navigate("/applicant-form");
          }
        }
      } catch (error) {
        console.error("[Applicants] Error checking user permissions:", error);
      }
    };

    if (isAuthenticated && fastVisaUserId) {
      checkUserPermissions();
    }
  }, [isAuthenticated, fastVisaUserId, navigate]);

  useEffect(() => {
    if (!isAuthenticated) {
      document.body.classList.remove("menu-open");
      navigate("/");
      return;
    }

    // Track page view
    metrics.trackPageView();

    // Set user ID if available
    if (fastVisaUserId) {
      metrics.setUserId(fastVisaUserId);
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

        // Track error
        await metrics.trackCustomEvent("error_encountered", {
          page: "applicants",
          error: "fetch_applicants_failed",
          errorMessage: error.message,
          timestamp: new Date().toISOString(),
        });
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
    metrics,
  ]);

  const handleRegisterApplicant = () => {
    // Track button click
    metrics.trackButtonClick("register-applicant-btn", "Register Applicant");

    navigate("/applicant-form");
  };

  const handleEditApplicant = (id) => {
    // Track button click
    metrics.trackButtonClick("edit-applicant-btn", "Edit Applicant");

    navigate(`/applicant-form?id=${id}`);
  };

  const handleView = (id) => {
    // Track button click
    metrics.trackButtonClick("view-applicant-btn", "View Applicant Details");

    sessionStorage.setItem("applicant_userid", id);
    navigate(`/ViewApplicant`);
  };

  const handleAction = async (id, isActive) => {
    // Track button click
    const action = isActive === "Stopped" ? "start_search" : "stop_search";
    metrics.trackButtonClick(
      `${action}-btn`,
      action === "start_search" ? "Start Search" : "Stop Search"
    );

    try {
      if (isActive === "Stopped") {
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
            title: t("limitReached", "Limit Reached"),
            message: t(
              "concurrentLimitMessage",
              `You have reached your concurrent applicants limit ({limit}).\nTo start a new applicant, please end one of your currently running applicants first.`
            ).replace("{limit}", concurrentLimit),
            type: "warning",
            showCancel: false,
          });

          // Track concurrent limit reached
          await metrics.trackCustomEvent("concurrent_limit_reached", {
            applicantId: id,
            concurrentLimit: concurrentLimit,
            runningCount: runningCount,
            timestamp: new Date().toISOString(),
          });

          return;
        }
        // Start search using API function
        await StartApplicantContainer(id);
        setModal({
          isOpen: true,
          title: t("success", "Success"),
          message: t("searchStartedSuccess", "Search started successfully."),
          type: "success",
          showCancel: false,
        });

        // Track search started
        await metrics.trackCustomEvent("search_started", {
          applicantId: id,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Stop search using API function
        await StopApplicantContainer(id);
        setModal({
          isOpen: true,
          title: t("success", "Success"),
          message: t("searchStoppedSuccess", "Search stopped successfully."),
          type: "success",
          showCancel: false,
        });

        // Track search stopped
        await metrics.trackCustomEvent("search_stopped", {
          applicantId: id,
          timestamp: new Date().toISOString(),
        });
      }
      setRefreshFlag((flag) => !flag);
    } catch (error) {
      setModal({
        isOpen: true,
        title: t("error", "Error"),
        message: t("errorPerformingAction", "Error performing action."),
        type: "error",
        showCancel: false,
      });
      console.error(error);

      // Track error
      await metrics.trackCustomEvent("error_encountered", {
        page: "applicants",
        action: isActive === "Stopped" ? "start_search" : "stop_search",
        applicantId: id,
        error: "action_failed",
        errorMessage: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleCopyPassword = async (id) => {
    // Track button click
    metrics.trackButtonClick("copy-password-btn", "Copy Password");

    try {
      const response = await GetApplicantPassword(id);
      const password = response.password;
      await navigator.clipboard.writeText(password);
      setModal({
        isOpen: true,
        title: t("copied", "Copied"),
        message: t("passwordCopied", "Password copied to clipboard"),
        type: "success",
        showCancel: false,
      });

      // Track password copied
      await metrics.trackCustomEvent("password_copied", {
        applicantId: id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error copying password:", error);

      // Track error
      await metrics.trackCustomEvent("error_encountered", {
        page: "applicants",
        action: "copy_password",
        applicantId: id,
        error: "copy_password_failed",
        errorMessage: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleCopyEmail = async (id) => {
    // Track button click
    metrics.trackButtonClick("copy-email-btn", "Copy Email");

    try {
      const response = await ApplicantDetails(id);
      const email = response.ais_username;
      await navigator.clipboard.writeText(email);
      setModal({
        isOpen: true,
        title: t("copied", "Copied"),
        message: t("emailCopied", "Email copied to clipboard"),
        type: "success",
        showCancel: false,
      });

      // Track email copied
      await metrics.trackCustomEvent("email_copied", {
        applicantId: id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error copying email:", error);

      // Track error
      await metrics.trackCustomEvent("error_encountered", {
        page: "applicants",
        action: "copy_email",
        applicantId: id,
        error: "copy_email_failed",
        errorMessage: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleResetStatus = async (id) => {
    // Track button click
    metrics.trackButtonClick("reset-status-btn", "Clear Status");

    try {
      const response = await ApplicantUpdate(id, {
        search_status: "Stopped",
        container_id: null,
        container_start_datetime: null,
      });
      if (response) {
        setModal({
          isOpen: true,
          title: t("success", "Success"),
          message: t("statusClearedSuccess", "Status cleared successfully."),
          type: "success",
          showCancel: false,
        });
        setRefreshFlag((flag) => !flag);

        // Track status reset
        await metrics.trackCustomEvent("status_reset", {
          applicantId: id,
          timestamp: new Date().toISOString(),
        });
      } else {
        setModal({
          isOpen: true,
          title: t("error", "Error"),
          message: t("failedToClearStatus", "Failed to clear status."),
          type: "error",
          showCancel: false,
        });

        // Track error
        await metrics.trackCustomEvent("error_encountered", {
          page: "applicants",
          action: "reset_status",
          applicantId: id,
          error: "reset_status_failed",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error clearing status:", error);
      setModal({
        isOpen: true,
        title: t("error", "Error"),
        message: t("errorClearingStatus", "Error clearing status."),
        type: "error",
        showCancel: false,
      });

      // Track error
      await metrics.trackCustomEvent("error_encountered", {
        page: "applicants",
        action: "reset_status",
        applicantId: id,
        error: "reset_status_exception",
        errorMessage: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleDeleteApplicant = async (id) => {
    // Track button click
    metrics.trackButtonClick("delete-applicant-btn", "Delete Applicant");

    setModal({
      isOpen: true,
      title: t("deleteApplicant", "Delete Applicant"),
      message: t(
        "deleteApplicantConfirm",
        "Are you sure you want to delete this applicant?"
      ),
      type: "warning",
      showCancel: true,
      onConfirm: async () => {
        try {
          // Check if search is running
          const applicantData = await ApplicantDetails(id);
          const isSearchRunning =
            applicantData &&
            (applicantData.search_status === "Running" ||
              applicantData.search_active === true);

          if (isSearchRunning) {
            // Ask to stop search first
            setModal({
              isOpen: true,
              title: t("searchInProgress", "Search in Progress"),
              message: t(
                "stopSearchBeforeDeleting",
                "Search is in progress. Do you want to stop the search before deleting?"
              ),
              type: "warning",
              showCancel: true,
              onConfirm: async () => {
                try {
                  await StopApplicantContainer(id);
                  setModal({
                    isOpen: true,
                    title: t("searchStopped", "Search Stopped"),
                    message: t(
                      "searchStoppedApplicantDeleted",
                      "Search stopped. The applicant will now be deleted."
                    ),
                    type: "info",
                    showCancel: false,
                    onConfirm: async () => {
                      try {
                        const response = await ApplicantDelete(id);
                        if (response && response.success) {
                          setModal({
                            isOpen: true,
                            title: t("success", "Success"),
                            message: t(
                              "applicantDeletedSuccessfully",
                              "Applicant deleted successfully."
                            ),
                            type: "success",
                            showCancel: false,
                          });
                          setRefreshFlag((flag) => !flag);

                          // Track applicant deleted
                          await metrics.trackCustomEvent("applicant_deleted", {
                            applicantId: id,
                            searchWasRunning: true,
                            timestamp: new Date().toISOString(),
                          });
                        } else {
                          setModal({
                            isOpen: true,
                            title: t("error", "Error"),
                            message: t(
                              "unexpectedResponseDeleting",
                              "Unexpected response when deleting applicant."
                            ),
                            type: "error",
                            showCancel: false,
                          });

                          // Track error
                          await metrics.trackCustomEvent("error_encountered", {
                            page: "applicants",
                            action: "delete_applicant",
                            applicantId: id,
                            error: "delete_failed",
                            timestamp: new Date().toISOString(),
                          });
                        }
                      } catch (error) {
                        console.error("Error deleting applicant:", error);
                        setModal({
                          isOpen: true,
                          title: t("error", "Error"),
                          message: t(
                            "failedToDeleteApplicant",
                            "Failed to delete applicant. Please try again."
                          ),
                          type: "error",
                          showCancel: false,
                        });

                        // Track error
                        await metrics.trackCustomEvent("error_encountered", {
                          page: "applicants",
                          action: "delete_applicant",
                          applicantId: id,
                          error: "delete_exception",
                          errorMessage: error.message,
                          timestamp: new Date().toISOString(),
                        });
                      }
                    },
                  });
                } catch (error) {
                  console.error("Error stopping search or deleting:", error);
                  setModal({
                    isOpen: true,
                    title: t("error", "Error"),
                    message: t(
                      "failedToStopSearchOrDelete",
                      "Failed to stop search or delete applicant. Please try again."
                    ),
                    type: "error",
                    showCancel: false,
                  });

                  // Track error
                  await metrics.trackCustomEvent("error_encountered", {
                    page: "applicants",
                    action: "stop_search_before_delete",
                    applicantId: id,
                    error: "stop_search_failed",
                    errorMessage: error.message,
                    timestamp: new Date().toISOString(),
                  });
                }
              },
            });
          } else {
            // Search not running, proceed to delete
            try {
              const response = await ApplicantDelete(id);
              if (response && response.success) {
                setModal({
                  isOpen: true,
                  title: t("success", "Success"),
                  message: t(
                    "applicantDeletedSuccessfully",
                    "Applicant deleted successfully."
                  ),
                  type: "success",
                  showCancel: false,
                });
                setRefreshFlag((flag) => !flag);

                // Track applicant deleted
                await metrics.trackCustomEvent("applicant_deleted", {
                  applicantId: id,
                  searchWasRunning: false,
                  timestamp: new Date().toISOString(),
                });
              } else {
                setModal({
                  isOpen: true,
                  title: t("error", "Error"),
                  message: t(
                    "unexpectedResponseDeleting",
                    "Unexpected response when deleting applicant."
                  ),
                  type: "error",
                  showCancel: false,
                });

                // Track error
                await metrics.trackCustomEvent("error_encountered", {
                  page: "applicants",
                  action: "delete_applicant",
                  applicantId: id,
                  error: "delete_failed",
                  timestamp: new Date().toISOString(),
                });
              }
            } catch (error) {
              console.error("Error in ApplicantDelete:", error);
              setModal({
                isOpen: true,
                title: t("error", "Error"),
                message: t(
                  "errorDeletingApplicant",
                  "Error deleting applicant."
                ),
                type: "error",
                showCancel: false,
              });

              // Track error
              await metrics.trackCustomEvent("error_encountered", {
                page: "applicants",
                action: "delete_applicant",
                applicantId: id,
                error: "delete_exception",
                errorMessage: error.message,
                timestamp: new Date().toISOString(),
              });
            }
          }
        } catch (error) {
          console.error("Error checking applicant status:", error);
          setModal({
            isOpen: true,
            title: t("error", "Error"),
            message: t("errorDeletingApplicant", "Error deleting applicant."),
            type: "error",
            showCancel: false,
          });

          // Track error
          await metrics.trackCustomEvent("error_encountered", {
            page: "applicants",
            action: "check_applicant_status",
            applicantId: id,
            error: "check_status_failed",
            errorMessage: error.message,
            timestamp: new Date().toISOString(),
          });
        }
      },
    });
  };

  const renderBooleanValue = (value) => (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "12px",
        fontWeight: 600,
        fontSize: "0.95em",
        color: value ? "#fff" : "#888",
        background: value ? "#4caf50" : "#e0e0e0",
        letterSpacing: "0.5px",
        minWidth: 60,
        textAlign: "center",
      }}
    >
      {value ? t("active", "Active") : t("inactive", "Inactive")}
    </span>
  );

  const renderSearchStatusBadge = (status) => {
    const statusTranslations = {
      Running: t("running", "Running"),
      Stopped: t("stopped", "Stopped"),
      Error: t("error", "Error"),
      Completed: t("completed", "Completed"),
    };

    const statusStyles = {
      Running: {
        background: "#2196f3",
        color: "#fff",
      },
      Stopped: {
        background: "#ff9800",
        color: "#fff",
      },
      Error: {
        background: "#f44336",
        color: "#fff",
      },
      Completed: {
        background: "#4caf50",
        color: "#fff",
      },
    };

    const style = statusStyles[status] || {
      background: "#9e9e9e",
      color: "#fff",
    };

    return (
      <span
        style={{
          display: "inline-block",
          padding: "2px 10px",
          borderRadius: "12px",
          fontWeight: 600,
          fontSize: "0.95em",
          color: style.color,
          background: style.background,
          letterSpacing: "0.5px",
          minWidth: 60,
          textAlign: "center",
        }}
      >
        {statusTranslations[status] || status}
      </span>
    );
  };

  // Inline button renderers were removed because they were not used

  return (
    <>
      <HamburgerMenu />
      <div className="applicants-main-container">
        <h2 className="applicants-title">{t("applicants", "Applicants")}</h2>
        <div className="applicants-filters-bar">
          <div className="applicants-filters">
            <div
              className="toggle-switch"
              data-title={t("onlyActive", "Filter only active")}
              onClick={() => setFilterActive(!filterActive)}
            >
              <div
                className={`switch-track${filterActive ? " active" : ""}`}
              ></div>
              <div
                className={`switch-thumb${filterActive ? " active" : ""}`}
              ></div>
            </div>
            <label>{t("onlyActive", "Only Active")}</label>
            <div
              className="toggle-switch"
              data-title={t("onlyRunning", "Filter only Running")}
              onClick={() => setFilterRunning(!filterRunning)}
            >
              <div
                className={`switch-track${filterRunning ? " active" : ""}`}
              ></div>
              <div
                className={`switch-thumb${filterRunning ? " active" : ""}`}
              ></div>
            </div>
            <label>{t("onlyRunning", "Only Running")}</label>
            {canViewAllApplicants && allRegisteredUsers.length > 0 && (
              <>
                <label
                  htmlFor="registeredByFilter"
                  style={{ marginLeft: "48px" }}
                >
                  {t("registeredBy", "Registered by")}:
                </label>
                <select
                  id="registeredByFilter"
                  value={registeredByFilter}
                  onChange={(e) => setRegisteredByFilter(e.target.value)}
                  style={{
                    minWidth: 120,
                    padding: "4px 8px",
                    borderRadius: 5,
                    border: "1px solid #e3eaf3",
                  }}
                >
                  <option value="">{t("all", "All")}</option>
                  {allRegisteredUsers.map((username) => (
                    <option key={username} value={username}>
                      {username}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              className="applicants-register-btn"
              onClick={handleRegisterApplicant}
            >
              <i className="fas fa-user-plus" style={{ marginRight: 8 }}></i>
              {t("registerApplicant", "Register Applicant")}
            </button>
          </div>
        </div>
        <div className="applicants-table-container">
          <table className="applicants-table">
            <thead>
              <tr>
                <th>{t("aisId", "AIS ID")}</th>
                <th>{t("aisUsername", "AIS Username")}</th>
                <th>{t("name", "Name")}</th>
                <th>{t("applicantStatus", "Applicant Status")}</th>
                <th>{t("searchStatus", "Search Status")}</th>
                <th>{t("targetEndDate", "Target End Date")}</th>
                {canViewAllApplicants && (
                  <th>{t("registeredBy", "Registered By")}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data && data.length > 0 ? (
                data.map((item, index) => (
                  <tr key={item.id || index}>
                    {includeFields.map((field) => (
                      <td
                        key={`${item.id}-${field}`}
                        style={{ textAlign: "left", verticalAlign: "top" }}
                      >
                        {field === "applicant_active" ? (
                          renderBooleanValue(item[field])
                        ) : field === "search_status" ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            {renderSearchStatusBadge(item[field])}
                            <div style={{ display: "flex", gap: "4px" }}>
                              <button
                                className="applicants-action-btn"
                                data-title={
                                  item.search_status === "Stopped"
                                    ? t("startSearch", "Start Search")
                                    : t("stopSearch", "Stop Search")
                                }
                                onClick={() =>
                                  handleAction(item.id, item.search_status)
                                }
                                style={{ padding: "4px 8px", fontSize: "12px" }}
                              >
                                <i
                                  className={
                                    item.search_status === "Stopped"
                                      ? "fas fa-play-circle"
                                      : "fas fa-stop-circle"
                                  }
                                ></i>
                              </button>
                              {canClearStatus && (
                                <button
                                  className="applicants-action-btn"
                                  data-title={t("clearStatus", "Clear Status")}
                                  onClick={() => handleResetStatus(item.id)}
                                  style={{
                                    padding: "4px 8px",
                                    fontSize: "12px",
                                  }}
                                >
                                  <i className="fas fa-eraser"></i>
                                </button>
                              )}
                            </div>
                          </div>
                        ) : field === "ais_schedule_id" ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleView(item.id)}
                              className="applicants-id-link"
                              aria-label={t(
                                "clickToViewDetails",
                                "Click to view details"
                              )}
                              data-title={t(
                                "clickToViewDetails",
                                "Click to view details"
                              )}
                              title={t(
                                "clickToViewDetails",
                                "Click to view details"
                              )}
                            >
                              {item[field]}
                            </button>
                            <div style={{ display: "flex", gap: "4px" }}>
                              <button
                                className="applicants-action-btn"
                                data-title={t("edit", "Edit")}
                                onClick={() => handleEditApplicant(item.id)}
                                style={{
                                  padding: "6px 10px",
                                  fontSize: "14px",
                                }}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="applicants-action-btn"
                                data-title={t(
                                  "deleteApplicant",
                                  "Delete Applicant"
                                )}
                                onClick={() => handleDeleteApplicant(item.id)}
                                style={{
                                  padding: "6px 10px",
                                  fontSize: "14px",
                                  color: "#f44336",
                                }}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        ) : field === "ais_username" ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <span>{item[field]}</span>
                            <div style={{ display: "flex", gap: "4px" }}>
                              <button
                                className="applicants-action-btn"
                                data-title={t("copyEmail", "Copy Email")}
                                onClick={() => handleCopyEmail(item.id)}
                                style={{ padding: "4px 8px", fontSize: "12px" }}
                              >
                                <i className="fas fa-copy"></i>
                              </button>
                              <button
                                className="applicants-action-btn"
                                data-title={t("copyPassword", "Copy Password")}
                                onClick={() => handleCopyPassword(item.id)}
                                style={{ padding: "4px 8px", fontSize: "12px" }}
                              >
                                <i className="fas fa-key"></i>
                              </button>
                            </div>
                          </div>
                        ) : (
                          item[field]
                        )}
                      </td>
                    ))}
                    {canViewAllApplicants && (
                      <td
                        key={`${item.id}-registeredby`}
                        style={{ textAlign: "left", verticalAlign: "middle" }}
                      >
                        <span>{item.fastVisa_username || ""}</span>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={canViewAllApplicants ? 7 : 6}
                    style={{ textAlign: "center", padding: "40px 20px" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#888",
                        gap: "15px",
                      }}
                    >
                      <i
                        className="fas fa-users"
                        style={{ fontSize: "48px", color: "#ddd" }}
                      ></i>
                      <div
                        style={{
                          fontSize: "18px",
                          fontWeight: "500",
                          color: "#666",
                        }}
                      >
                        {t("noApplicantsFound", "No applicants found")}
                      </div>
                      <div style={{ fontSize: "14px", color: "#999" }}>
                        {filterActive || filterRunning || registeredByFilter
                          ? t(
                              "adjustFilters",
                              "Try adjusting your filters or register a new applicant to get started."
                            )
                          : t(
                              "clickToAddFirst",
                              "Click 'Register Applicant' to add your first applicant."
                            )}
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
};

export default Applicants;
