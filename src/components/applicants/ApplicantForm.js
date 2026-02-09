import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../utils/AuthContext";
import FastVisaMetrics from "../../utils/FastVisaMetrics";
import { permissions } from "../../utils/permissions";
import { ALL_CITIES } from "../../utils/cities";
import {
  ApplicantDetails,
  ApplicantUpdate,
  authenticateAIS,
  createApplicant,
} from "../../services/APIFunctions";
import HamburgerMenu from "../common/HamburgerMenu";
import {
  Card,
  Button,
  Space,
  Form,
  Input,
  Select,
  Switch,
  Radio,
  InputNumber,
  Typography,
  Alert,
  Grid,
  Spin,
  Popover,
  message as antMessage,
} from "antd";
import {
  KeyOutlined,
  CalendarOutlined,
  EditOutlined,
  UserAddOutlined,
  CloseOutlined,
  SaveOutlined,
  CheckOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import "./ApplicantForm.css";

const { useBreakpoint } = Grid;
const { Title, Text } = Typography;

const ApplicantForm = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // Initialize metrics tracker
  const metrics = useMemo(() => new FastVisaMetrics(), []);

  const applicantId = searchParams.get("id");
  const isEditMode = !!applicantId;

  const btnSize = isMobile ? "large" : "middle";
  const cardContentStyle = isMobile
    ? { display: "flex", flexDirection: "column", gap: 16, width: "100%" }
    : {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 16,
        width: "100%",
      };

  // Session data
  const fastVisaUserId = sessionStorage.getItem("fastVisa_userid");
  const fastVisaUsername = sessionStorage.getItem("fastVisa_username");
  const countryCode = sessionStorage.getItem("country_code");

  // Determine initial targetStartDays based on user permissions
  const initialTargetStartDays = permissions.canManageApplicants()
    ? "1"
    : "120";

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    aisEmail: "",
    aisPassword: "",
    aisScheduleId: "",
    numberOfApplicants: "1",
    applicantActive: true,
    targetStartMode: "days",
    targetStartDays: initialTargetStartDays, // Basic users: 120 days, Admins: 1 day
    targetStartDate: "",
    targetEndDate: "",
    selectedCities: [],
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [cities, setCities] = useState([]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [aisAuthSuccess, setAisAuthSuccess] = useState(false);
  const [applicantsList, setApplicantsList] = useState([]);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [showTargetDatesTooltip, setShowTargetDatesTooltip] = useState(false);
  const [credentialsExpanded, setCredentialsExpanded] = useState(true);

  // Track page view when component mounts
  useEffect(() => {
    metrics.trackPageView();

    // Set user ID if available
    if (fastVisaUserId) {
      metrics.setUserId(fastVisaUserId);
    }

    // Track custom event for applicant form page visit
    metrics.trackCustomEvent("applicant_form_page_visit", {
      page: "applicant_form",
      mode: isEditMode ? "edit" : "create",
      applicantId: applicantId || null,
      timestamp: new Date().toISOString(),
    });
  }, [applicantId, fastVisaUserId, isEditMode, metrics]);

  // Format date for display
  const formatDate = (date) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString(i18n.language, options);
  };

  // Calculate minimum end date (210 days from today) for basic users
  const getMinEndDate = () => {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 210);
    return minDate.toISOString().split("T")[0];
  };

  // Calculate search start date based on days
  const getSearchStartDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight to avoid timezone issues
    const startDate = new Date(today);
    const daysToAdd = parseInt(formData.targetStartDays) || 3;
    startDate.setDate(startDate.getDate() + daysToAdd);
    return startDate;
  };

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Load cities (normalize country code for lookup: keys in ALL_CITIES are e.g. 'es-mx', 'es-hn')
  useEffect(() => {
    const key = countryCode?.trim();
    const normalizedKey = key ? key.toLowerCase() : "";
    const availableCities = ALL_CITIES[key] || ALL_CITIES[normalizedKey] || [];
    setCities(availableCities);

    // Auto-select if only one city
    if (availableCities.length === 1) {
      setFormData((prev) => ({
        ...prev,
        selectedCities: [availableCities[0].city_code],
      }));
    }
  }, [countryCode]);

  // Load applicant data in edit mode
  useEffect(() => {
    if (isEditMode && applicantId) {
      setLoading(true);
      ApplicantDetails(applicantId)
        .then((data) => {
          if (data) {
            // For basic users (non-admins), force targetStartDays to 120 if in days mode
            const startDays = data.target_start_days || "3";
            const finalStartDays =
              !permissions.canSearchUnlimited() &&
              data.target_start_mode === "days"
                ? "120"
                : startDays;

            setFormData({
              name: data.name || "",
              aisEmail: data.ais_username || "",
              aisPassword: "", // Never pre-fill password
              aisScheduleId: data.ais_schedule_id || "",
              numberOfApplicants: data.number_of_applicants || "1",
              applicantActive: data.applicant_active ?? true,
              targetStartMode: data.target_start_mode || "date",
              targetStartDays: finalStartDays,
              targetStartDate: data.target_start_date || "",
              targetEndDate: data.target_end_date || "",
              selectedCities: data.target_city_codes
                ? data.target_city_codes
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [],
            });

            // Collapse credentials section if applicant already has email data
            if (data.ais_username) {
              setCredentialsExpanded(false);
            }
          }
        })
        .catch((error) => {
          console.error("Error loading applicant:", error);
          setSubmitError(
            t("failedToLoadApplicant", "Failed to load applicant data")
          );
        })
        .finally(() => setLoading(false));
    }
  }, [isEditMode, applicantId, t]);

  // Check if tooltip should be shown for premium users
  useEffect(() => {
    if (permissions.canSearchUnlimited()) {
      const tooltipShown = localStorage.getItem("target_dates_tooltip_shown");
      if (!tooltipShown) {
        setShowTargetDatesTooltip(true);
      }
    }
  }, []);

  // Form handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Function to authenticate Visa credentials and get schedule info
  const handleAuthenticateAIS = async () => {
    // Track button click
    metrics.trackButtonClick("authenticate-ais-btn", "Authenticate AIS");

    // Track custom event for AIS authentication attempt
    metrics.trackCustomEvent("ais_authentication_attempt", {
      timestamp: new Date().toISOString(),
    });

    // Validate email and password first
    const newErrors = {};
    if (!formData.aisEmail.trim()) {
      newErrors.aisEmail = t(
        "visaEmailRequired",
        "Visa Appointment System Email is required"
      );
    } else if (!/\S+@\S+\.\S+/.test(formData.aisEmail)) {
      newErrors.aisEmail = t(
        "pleaseEnterValidEmail",
        "Please enter a valid email"
      );
    }
    if (!formData.aisPassword.trim()) {
      newErrors.aisPassword = t(
        "visaPasswordRequired",
        "Visa Appointment System Password is required"
      );
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      // Track validation error
      metrics.trackCustomEvent("ais_authentication_validation_error", {
        errors: Object.keys(newErrors),
        timestamp: new Date().toISOString(),
      });

      return;
    }

    setIsAuthenticating(true);
    setAisAuthSuccess(false);
    setApplicantsList([]);
    setSelectedApplicant(null);

    try {
      const result = await authenticateAIS({
        username: formData.aisEmail,
        password: formData.aisPassword,
        //  country_code: countryCode,
      });

      if (
        !result ||
        !result.applicants ||
        result.applicants.length === 0 ||
        result.error === "invalid_credentials"
      ) {
        setErrors({
          ...errors,
          aisEmail: t(
            "invalidCredentials",
            "Credenciales inválidas. Verifica tu correo y contraseña."
          ),
        });
        setFormData((prev) => ({
          ...prev,
          aisScheduleId: "",
          numberOfApplicants: "1",
        }));

        metrics.trackCustomEvent("ais_authentication_failed", {
          error: "invalid_credentials",
          timestamp: new Date().toISOString(),
        });

        return;
      }

      const applicants = result.applicants;
      setApplicantsList(applicants);

      if (applicants.length === 1) {
        setSelectedApplicant(applicants[0]);
        setFormData((prev) => ({
          ...prev,
          name: applicants[0].applicant_name || prev.name,
          aisScheduleId: applicants[0].schedule_id,
          numberOfApplicants: "1",
        }));
      } else {
        setSelectedApplicant(null);
        setFormData((prev) => ({
          ...prev,
          aisScheduleId: "",
          numberOfApplicants: "1",
        }));
      }

      setAisAuthSuccess(true);
      setErrors({});

      metrics.trackCustomEvent("ais_authentication_success", {
        applicantsCount: applicants.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("AIS authentication error:", error);
      setErrors({
        ...errors,
        aisEmail: t(
          "invalidCredentials",
          "Credenciales inválidas. Verifica tu correo y contraseña."
        ),
      });
      setFormData((prev) => ({
        ...prev,
        aisScheduleId: "",
        numberOfApplicants: "1",
      }));

      metrics.trackCustomEvent("ais_authentication_error", {
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSelectApplicant = (applicant) => {
    setSelectedApplicant(applicant);
    setFormData((prev) => ({
      ...prev,
      name: applicant.applicant_name || prev.name,
      aisScheduleId: applicant.schedule_id,
      numberOfApplicants: "1",
    }));
  };

  const formatApplicantDate = (dateVal) => {
    if (dateVal == null || dateVal === "") return "N/A";
    return dateVal;
  };

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = t("nameRequired", "Name is required");
    }

    if (!formData.aisEmail.trim()) {
      newErrors.aisEmail = t(
        "visaEmailRequired",
        "Visa Appointment System Email is required"
      );
    } else if (!/\S+@\S+\.\S+/.test(formData.aisEmail)) {
      newErrors.aisEmail = t(
        "pleaseEnterValidEmail",
        "Please enter a valid email"
      );
    }

    // Schedule ID and number of applicants will be auto-filled from Visa
    // No need to validate manually entered values anymore

    if (formData.targetStartMode === "days" && !formData.targetStartDays) {
      newErrors.targetStartDays = t(
        "startDaysRequired",
        "Required when using days mode"
      );
    }

    if (formData.targetStartMode === "date" && !formData.targetStartDate) {
      newErrors.targetStartDate = t(
        "startDateRequired",
        "Required when using date mode"
      );
    }

    if (!formData.targetEndDate) {
      newErrors.targetEndDate = t(
        "endDateRequired",
        "Target end date is required"
      );
    }

    if (cities.length > 1 && formData.selectedCities.length === 0) {
      newErrors.selectedCities = t(
        "cityRequired",
        "Please select at least one city"
      );
    }

    if (
      (!isEditMode && !selectedApplicant) ||
      (applicantsList.length > 0 && !selectedApplicant)
    ) {
      newErrors.selectedApplicant = t(
        "selectApplicant",
        "Please select an applicant from the list"
      );
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    // Track form submit attempt
    metrics.trackFormSubmit("applicant-form", false); // false initially, will update on success

    // Track custom event for form submission attempt
    metrics.trackCustomEvent("applicant_form_submit_attempt", {
      mode: isEditMode ? "edit" : "create",
      applicantId: applicantId || null,
      targetStartMode: formData.targetStartMode,
      targetStartDays: formData.targetStartDays,
      selectedCitiesCount: formData.selectedCities.length,
      timestamp: new Date().toISOString(),
    });

    if (!validateForm()) {
      // Track validation error
      metrics.trackCustomEvent("applicant_form_validation_error", {
        mode: isEditMode ? "edit" : "create",
        errors: Object.keys(errors),
        timestamp: new Date().toISOString(),
      });

      return;
    }

    setLoading(true);

    const selected = selectedApplicant;
    const payload = {
      ais_schedule_id: formData.aisScheduleId,
      ais_username: formData.aisEmail,
      name: formData.name,
      number_of_applicants: formData.numberOfApplicants,
      applicant_active: formData.applicantActive,
      target_start_mode: formData.targetStartMode,
      target_start_days:
        formData.targetStartMode === "days" ? formData.targetStartDays : "-",
      target_start_date:
        formData.targetStartMode === "date" ? formData.targetStartDate : "-",
      target_end_date: formData.targetEndDate,
      target_city_codes: formData.selectedCities.join(","),
      target_country_code: countryCode,
    };

    if (selected) {
      payload.ais_schedule_id = selected.schedule_id;
      payload.name = selected.applicant_name || formData.name;
      payload.passport = selected.passport || "";
      payload.ds_160_id = selected.ds_160_id || "";
      payload.consul_appointment_date = selected.consul_appointment_date ?? "";
      payload.asc_appointment_date = selected.asc_appointment_date ?? "";
    }

    // Add password if provided (optional in edit mode, required for create)
    if (formData.aisPassword.trim()) {
      payload.ais_password = formData.aisPassword;
    }

    try {
      if (isEditMode) {
        await ApplicantUpdate(applicantId, payload);

        metrics.trackFormSubmit("applicant-form", true);
        metrics.trackCustomEvent("applicant_updated", {
          applicantId: applicantId,
          targetStartMode: formData.targetStartMode,
          targetStartDays: formData.targetStartDays,
          selectedCitiesCount: formData.selectedCities.length,
          timestamp: new Date().toISOString(),
        });

        antMessage.success(
          t("updatedSuccessfully", "Solicitante actualizado exitosamente")
        );
        if (permissions.canManageApplicants()) {
          navigate("/applicants");
        } else {
          navigate(`/view-applicant/${applicantId}`);
        }
      } else {
        // Create new applicant - password is required
        if (!formData.aisPassword.trim()) {
          setSubmitError(
            t(
              "passwordRequiredForNewApplicants",
              "Password is required for new applicants"
            )
          );
          setLoading(false);

          // Track validation error
          metrics.trackCustomEvent("applicant_form_validation_error", {
            mode: "create",
            error: "password_required",
            timestamp: new Date().toISOString(),
          });

          return;
        }

        const createPayload = {
          ...payload,
          ais_password: formData.aisPassword,
          fastVisa_userid: fastVisaUserId,
          fastVisa_username: fastVisaUsername,
          passport: selected?.passport ?? "",
          ds_160_id: selected?.ds_160_id ?? "",
          consul_appointment_date: selected?.consul_appointment_date ?? "",
          asc_appointment_date: selected?.asc_appointment_date ?? "",
          container_id: "",
          container_start_datetime: "",
          container_stop_datetime: "",
          app_start_time: "",
        };

        const newApplicant = await createApplicant(createPayload);

        if (!newApplicant) {
          throw new Error(
            t("failedToCreateApplicant", "Failed to create applicant")
          );
        }

        // Track successful creation
        metrics.trackFormSubmit("applicant-form", true);
        metrics.trackCustomEvent("applicant_created", {
          applicantId: newApplicant.id,
          targetStartMode: formData.targetStartMode,
          targetStartDays: formData.targetStartDays,
          selectedCitiesCount: formData.selectedCities.length,
          timestamp: new Date().toISOString(),
        });

        antMessage.success(
          t("applicantCreatedSuccess", "Applicant created successfully.")
        );
        if (permissions.canManageApplicants()) {
          navigate("/applicants");
        } else {
          navigate(`/view-applicant/${newApplicant.id}`);
        }
      }
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitError(
        isEditMode
          ? t("failedToUpdateApplicant", "Failed to update applicant")
          : t("failedToCreateApplicant", "Failed to create applicant")
      );

      // Track submission error
      metrics.trackCustomEvent("applicant_form_submit_error", {
        mode: isEditMode ? "edit" : "create",
        applicantId: applicantId || null,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEditMode) {
    return (
      <>
        <HamburgerMenu />
        <div
          className="applicant-form-container-ant"
          style={{
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
            overflowX: "hidden",
          }}
        >
          <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
            <Spin
              size="large"
              tip={t("loadingApplicant", "Loading applicant data...")}
            />
          </div>
        </div>
      </>
    );
  }

  const handleCancel = () => {
    metrics.trackButtonClick(
      "cancel-applicant-form-header-btn",
      "Cancel Applicant Form (Header)"
    );
    if (permissions.canManageApplicants()) navigate("/applicants");
    else if (isEditMode) navigate(`/view-applicant/${applicantId}`);
    else navigate("/");
  };

  return (
    <>
      <HamburgerMenu />
      <div
        className="applicant-form-container-ant"
        style={{
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          overflowX: "hidden",
          fontSize: isMobile ? 16 : undefined,
        }}
      >
        <div
          style={{
            marginBottom: 24,
            paddingBottom: 24,
            borderBottom: "2px solid #e3eaf3",
          }}
        >
          <Space
            direction={isMobile ? "vertical" : "horizontal"}
            align={isMobile ? "stretch" : "start"}
            wrap
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <div>
              <Title
                level={2}
                style={{
                  margin: 0,
                  color: "#2C6BA0",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {!permissions.canManageApplicants() ? (
                  <CalendarOutlined />
                ) : isEditMode ? (
                  <EditOutlined />
                ) : (
                  <UserAddOutlined />
                )}
                {!permissions.canManageApplicants()
                  ? t("myAppointment", "My Appointment")
                  : isEditMode
                  ? t("editApplicant", "Edit Applicant")
                  : t("newApplicant", "New Applicant")}
              </Title>
              <Text type="secondary" style={{ display: "block", marginTop: 4 }}>
                {isEditMode
                  ? permissions.canManageApplicants()
                    ? t(
                        "updateApplicantInfo",
                        "Update the information for this applicant"
                      )
                    : t(
                        "updateAppointmentSettings",
                        "Update your appointment search settings"
                      )
                  : t(
                      "fillDetailsToRegister",
                      "Fill in the details to register a new applicant"
                    )}
              </Text>
            </div>
            <Space
              wrap
              size={8}
              direction={isMobile ? "vertical" : "horizontal"}
              style={{ width: isMobile ? "100%" : undefined }}
            >
              {isEditMode && permissions.canManageApplicants() && (
                <Space align="center">
                  <Switch
                    checked={formData.applicantActive}
                    onChange={(checked) =>
                      handleInputChange({
                        target: {
                          name: "applicantActive",
                          type: "checkbox",
                          checked,
                        },
                      })
                    }
                    checkedChildren={t("active", "Active")}
                    unCheckedChildren={t("inactive", "Inactive")}
                  />
                </Space>
              )}
              <Button
                icon={<CloseOutlined />}
                onClick={handleCancel}
                disabled={loading}
                size={btnSize}
              >
                {t("cancel", "Cancel")}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                form="applicant-form"
                icon={
                  loading ? null : isEditMode ? (
                    <SaveOutlined />
                  ) : (
                    <CheckOutlined />
                  )
                }
                loading={loading}
                disabled={
                  loading ||
                  (!isEditMode && !selectedApplicant) ||
                  (applicantsList.length > 0 && !selectedApplicant)
                }
                size={btnSize}
              >
                {loading
                  ? isEditMode
                    ? t("updating", "Updating...")
                    : t("creating", "Creating...")
                  : isEditMode
                  ? t("updateApplicant", "Update Applicant")
                  : t("createApplicant", "Create Applicant")}
              </Button>
            </Space>
          </Space>
        </div>

        <form
          id="applicant-form"
          onSubmit={handleSubmit}
          style={{ width: "100%" }}
        >
          <Form layout="vertical">
            {submitError && (
              <Alert
                type="error"
                showIcon
                message={submitError}
                style={{ marginBottom: 16 }}
                closable
                onClose={() => setSubmitError("")}
              />
            )}

            {/* Visa Credentials Section */}
            <Card
              style={{ width: "100%", maxWidth: "100%", marginBottom: 24 }}
              title={
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => setCredentialsExpanded(!credentialsExpanded)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setCredentialsExpanded(!credentialsExpanded);
                    }
                  }}
                  style={{
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  <Space>
                    <KeyOutlined />
                    <Typography.Title
                      style={{ margin: 0 }}
                      level={isMobile ? 5 : 4}
                      strong
                    >
                      {t(
                        "aisCredentials",
                        "Visa Appointment System Credentials"
                      )}
                    </Typography.Title>
                    {!credentialsExpanded && formData.aisEmail && (
                      <Typography.Text
                        type="success"
                        style={{ fontSize: "0.875rem" }}
                      >
                        ({t("configured", "Configured")})
                      </Typography.Text>
                    )}
                  </Space>
                </span>
              }
              extra={
                <Button
                  type="text"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCredentialsExpanded(!credentialsExpanded);
                  }}
                  icon={
                    credentialsExpanded ? (
                      <ArrowUpOutlined />
                    ) : (
                      <ArrowDownOutlined />
                    )
                  }
                >
                  {credentialsExpanded
                    ? t("collapse", "Collapse")
                    : t("expand", "Expand")}
                </Button>
              }
            >
              {credentialsExpanded && (
                <>
                  <div style={cardContentStyle}>
                    <Form.Item
                      label={
                        <Typography.Title
                          type="secondary"
                          level={5}
                          style={{
                            margin: 0,
                            display: "block",
                          }}
                        >
                          {t(
                            "visaAppointmentSystemEmail",
                            "Visa Appointment System Email"
                          )}{" "}
                          <Text type="danger">*</Text>
                        </Typography.Title>
                      }
                      validateStatus={errors.aisEmail ? "error" : ""}
                      help={errors.aisEmail}
                    >
                      <Input
                        type="email"
                        id="aisEmail"
                        name="aisEmail"
                        value={formData.aisEmail}
                        onChange={(e) => {
                          handleInputChange(e);
                          setAisAuthSuccess(false);
                          setApplicantsList([]);
                          setSelectedApplicant(null);
                        }}
                        disabled={isAuthenticating}
                        placeholder="visa@example.com"
                        size={btnSize}
                      />
                    </Form.Item>
                    <Form.Item
                      label={
                        <Typography.Title
                          type="secondary"
                          level={5}
                          style={{
                            margin: 0,
                            display: "block",
                          }}
                        >
                          {" "}
                          {t(
                            "visaAppointmentSystemPassword",
                            "Visa Appointment System Password"
                          )}
                        </Typography.Title>
                      }
                      validateStatus={errors.aisPassword ? "error" : ""}
                      help={errors.aisPassword}
                    >
                      <Input.Password
                        id="aisPassword"
                        name="aisPassword"
                        value={formData.aisPassword}
                        onChange={(e) => {
                          handleInputChange(e);
                          setAisAuthSuccess(false);
                          setApplicantsList([]);
                          setSelectedApplicant(null);
                        }}
                        disabled={isAuthenticating}
                        placeholder={
                          isEditMode
                            ? t(
                                "leaveEmptyToKeepPassword",
                                "Leave empty to keep current password"
                              )
                            : t(
                                "enterVisaPassword",
                                "Enter Visa Appointment System password"
                              )
                        }
                        size={btnSize}
                      />
                    </Form.Item>
                  </div>
                  <div style={{ marginBottom: "12px" }}>
                    <Button
                      type="primary"
                      onClick={handleAuthenticateAIS}
                      disabled={
                        isAuthenticating ||
                        !formData.aisEmail ||
                        !formData.aisPassword
                      }
                      loading={isAuthenticating}
                      icon={<KeyOutlined />}
                      size={btnSize}
                      style={
                        aisAuthSuccess
                          ? {
                              backgroundColor: "#52c41a",
                              borderColor: "#52c41a",
                              color: "#fff",
                            }
                          : undefined
                      }
                    >
                      {aisAuthSuccess
                        ? t(
                            "authenticationSuccessful",
                            "Authentication Successful"
                          )
                        : t("authenticate", "Authenticate")}
                    </Button>
                    <Text
                      type="secondary"
                      style={{
                        display: "block",
                        marginTop: 8,
                        fontSize: "0.875rem",
                      }}
                    >
                      {t(
                        "clickToVerifyCredentials",
                        "Click to verify your Visa Appointment System credentials and automatically retrieve your Schedule ID"
                      )}
                    </Text>
                  </div>
                  <div style={cardContentStyle}>
                    <Form.Item
                      label={
                        <Typography.Title
                          type="secondary"
                          level={5}
                          style={{
                            margin: 0,
                            display: "block",
                          }}
                        >
                          {t("aisScheduleId", "Schedule ID")}{" "}
                        </Typography.Title>
                      }
                    >
                      <Input
                        id="aisScheduleId"
                        value={formData.aisScheduleId}
                        readOnly
                        disabled
                        placeholder={t(
                          "autoFilledAfterAuth",
                          "Auto-filled after authentication"
                        )}
                        size={btnSize}
                      />
                      <Text
                        type="secondary"
                        style={{
                          fontSize: "0.75rem",
                          display: "block",
                          marginTop: 4,
                        }}
                      >
                        {t(
                          "autoFilledAfterAuth",
                          "This field is automatically filled after authenticating with Visa Appointment System"
                        )}
                      </Text>
                    </Form.Item>
                    <Form.Item
                      label={
                        <Typography.Title
                          type="secondary"
                          level={5}
                          style={{
                            margin: 0,
                            display: "block",
                          }}
                        >
                          {t("fullName", "Full Name")}
                        </Typography.Title>
                      }
                      validateStatus={errors.name ? "error" : ""}
                      help={errors.name}
                    >
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder={t(
                          "autoFilledAfterAuth",
                          "Auto-filled after authentication"
                        )}
                        size={btnSize}
                      />
                      <Text
                        type="secondary"
                        style={{
                          fontSize: "0.75rem",
                          display: "block",
                          marginTop: 4,
                        }}
                      >
                        {t(
                          "nameAutoFilledInfo",
                          "This field is automatically filled after authenticating with Visa Appointment System"
                        )}
                      </Text>
                    </Form.Item>
                  </div>
                  {/* Applicant list (after AIS auth) */}

                  {applicantsList.length > 0 && (
                    <div>
                      <Typography.Title
                        type="secondary"
                        level={5}
                        style={{
                          margin: 0,
                          display: "block",
                          marginBottom: 8,
                        }}
                      >
                        {t("selectApplicant", "Select an applicant")}
                      </Typography.Title>
                      {applicantsList.length === 1 && (
                        <Alert
                          type="info"
                          showIcon
                          message={t(
                            "oneApplicantFound",
                            "Se encontró 1 solicitante asociado a esta cuenta"
                          )}
                          style={{ marginBottom: 16 }}
                        />
                      )}
                      {errors.selectedApplicant && (
                        <Alert
                          type="error"
                          showIcon
                          message={errors.selectedApplicant}
                          style={{ marginBottom: 16 }}
                        />
                      )}
                      <div
                        style={{
                          maxHeight: 320,
                          overflowY: "auto",
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        <Radio.Group
                          value={
                            selectedApplicant
                              ? selectedApplicant.schedule_id
                              : undefined
                          }
                          style={{ width: "100%" }}
                          onChange={(e) => {
                            const app = applicantsList.find(
                              (a) => a.schedule_id === e.target.value
                            );
                            if (app) handleSelectApplicant(app);
                          }}
                        >
                          <Space
                            direction="vertical"
                            size={12}
                            style={{ width: "100%" }}
                          >
                            {applicantsList.map((app) => (
                              <Card
                                key={app.schedule_id}
                                size="small"
                                hoverable
                                onClick={() => handleSelectApplicant(app)}
                                style={{
                                  cursor: "pointer",
                                  borderColor:
                                    selectedApplicant?.schedule_id ===
                                    app.schedule_id
                                      ? "#1890ff"
                                      : "#d9d9d9",
                                  borderWidth:
                                    selectedApplicant?.schedule_id ===
                                    app.schedule_id
                                      ? 2
                                      : 1,
                                  backgroundColor:
                                    selectedApplicant?.schedule_id ===
                                    app.schedule_id
                                      ? "#e6f7ff"
                                      : undefined,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 12,
                                  }}
                                >
                                  <Radio
                                    value={app.schedule_id}
                                    style={{ marginTop: 4 }}
                                  />
                                  <Space
                                    direction="vertical"
                                    size={4}
                                    style={{ flex: 1 }}
                                  >
                                    <Text strong>
                                      {t("applicantName", "Applicant name")}:{" "}
                                      {app.applicant_name || "—"}
                                    </Text>
                                    <Text type="secondary">
                                      {t("passport", "Passport")}:{" "}
                                      {app.passport || "—"}
                                    </Text>
                                    <Text type="secondary">
                                      {t(
                                        "ds160Confirmation",
                                        "DS-160 confirmation"
                                      )}
                                      : {app.ds_160_id || "—"}
                                    </Text>
                                    <Text type="secondary">
                                      {t(
                                        "consulAppointmentDate",
                                        "Consul appointment date"
                                      )}
                                      :{" "}
                                      {formatApplicantDate(
                                        app.consul_appointment_date
                                      )}
                                    </Text>
                                    <Text type="secondary">
                                      {t(
                                        "ascAppointmentDate",
                                        "ASC appointment date"
                                      )}
                                      :{" "}
                                      {formatApplicantDate(
                                        app.asc_appointment_date
                                      )}
                                    </Text>
                                  </Space>
                                </div>
                              </Card>
                            ))}
                          </Space>
                        </Radio.Group>
                      </div>
                      {selectedApplicant && (
                        <Alert
                          type="success"
                          showIcon
                          message={t(
                            "selectedApplicantSummary",
                            "Selected applicant"
                          )}
                          description={
                            <Space direction="vertical" size={0}>
                              <Text>
                                {selectedApplicant.applicant_name} •{" "}
                                {t("passport", "Passport")}:{" "}
                                {selectedApplicant.passport} •{" "}
                                {t("ds160Confirmation", "DS-160")}:{" "}
                                {selectedApplicant.ds_160_id}
                              </Text>
                            </Space>
                          }
                          style={{ marginTop: 16 }}
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </Card>

            {/* Target Dates Section */}
            <Card
              style={{ width: "100%", maxWidth: "100%", marginBottom: 24 }}
              title={
                <Space>
                  <CalendarOutlined />
                  <Typography.Title
                    style={{ margin: 0 }}
                    level={isMobile ? 5 : 4}
                    strong
                  >
                    {t("targetDates", "Target Dates")}
                  </Typography.Title>
                  <Popover
                    content={t(
                      "targetDatesTooltip",
                      "Here you can configure your search start date."
                    )}
                    open={showTargetDatesTooltip}
                    onOpenChange={(open) => {
                      setShowTargetDatesTooltip(open);
                      if (!open) {
                        localStorage.setItem(
                          "target_dates_tooltip_shown",
                          "true"
                        );
                      }
                    }}
                    trigger="click"
                  >
                    <InfoCircleOutlined
                      style={{ cursor: "pointer", fontSize: 16 }}
                    />
                  </Popover>
                </Space>
              }
            >
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                {!permissions.canSearchUnlimited() &&
                  formData.targetStartMode === "days" &&
                  formData.targetStartDays === "120" && (
                    <Alert
                      type="info"
                      showIcon
                      icon={<InfoCircleOutlined />}
                      message={
                        <span>
                          <strong>
                            {t(
                              "basicUserSearchSettings",
                              "Basic User Search Settings:"
                            )}
                          </strong>{" "}
                          {t(
                            "searchWillStartIn",
                            "Your appointment search will start 4 months from today."
                          )}{" "}
                          <strong>
                            {t("premiumUpgradeNote", "Premium users")}
                          </strong>{" "}
                          {t(
                            "premiumUsersCanSearchTomorrow",
                            "can search for appointments starting from tomorrow."
                          )}{" "}
                          <a
                            href="/premium-upgrade"
                            onClick={(e) => {
                              e.preventDefault();
                              navigate("/premium-upgrade");
                              window.scrollTo(0, 0);
                            }}
                          >
                            {t("upgradeToPremium", "Upgrade to Premium")}
                          </a>
                        </span>
                      }
                    />
                  )}

                {permissions.canSearchUnlimited() && (
                  <Form.Item
                    style={{ marginBottom: 0 }}
                    label={
                      <Typography.Title
                        type="secondary"
                        level={5}
                        style={{
                          margin: 0,
                          display: "block",
                        }}
                      >
                        {t("startMode", "Start Mode")}{" "}
                      </Typography.Title>
                    }
                  >
                    <Radio.Group
                      name="targetStartMode"
                      value={formData.targetStartMode}
                      onChange={(e) =>
                        handleInputChange({
                          target: {
                            name: "targetStartMode",
                            value: e.target.value,
                          },
                        })
                      }
                      size={btnSize}
                    >
                      <Radio value="days">
                        {t("daysFromNow", "Days from Now")}
                      </Radio>
                      <Radio value="date">
                        {t("specificDate", "Specific Date")}
                      </Radio>
                    </Radio.Group>
                  </Form.Item>
                )}

                <div style={cardContentStyle}>
                  {formData.targetStartMode === "days" && (
                    <div>
                      {permissions.canSearchUnlimited() ? (
                        <>
                          <Form.Item
                            style={{ marginBottom: 0 }}
                            label={
                              <Typography.Title
                                type="secondary"
                                level={5}
                                style={{
                                  margin: 0,
                                  display: "block",
                                }}
                              >
                                {t("startAfterDays", "Start After (Days)")}{" "}
                                <Text type="danger">*</Text>
                              </Typography.Title>
                            }
                            validateStatus={
                              errors.targetStartDays ? "error" : ""
                            }
                            help={errors.targetStartDays}
                          >
                            <Space wrap>
                              <InputNumber
                                id="targetStartDays"
                                min={1}
                                value={
                                  formData.targetStartDays
                                    ? parseInt(formData.targetStartDays, 10)
                                    : undefined
                                }
                                onChange={(val) =>
                                  handleInputChange({
                                    target: {
                                      name: "targetStartDays",
                                      value: val != null ? String(val) : "",
                                    },
                                  })
                                }
                                size={btnSize}
                                style={{ width: 120 }}
                              />
                              {formData.targetStartDays && (
                                <Typography.Text strong type="success">
                                  {t("startDate", "Start date")}:{" "}
                                  {formatDate(getSearchStartDate())}
                                </Typography.Text>
                              )}
                            </Space>
                          </Form.Item>
                          <Alert
                            type="info"
                            showIcon
                            icon={<InfoCircleOutlined />}
                            message={t(
                              "targetStartDateExplanationView",
                              "This is the earliest date the system will start searching for available appointments."
                            )}
                            style={{ marginTop: 8 }}
                          />
                        </>
                      ) : (
                        <div
                          style={{
                            padding: 12,
                            background: "#fafafa",
                            border: "1px solid #f0f0f0",
                            borderRadius: 8,
                          }}
                        >
                          <Text strong>
                            {t("searchStartsIn", "Search Starts In")}
                          </Text>
                          <div style={{ marginTop: 8 }}>
                            <Text>
                              {t(
                                "fourMonthsFromToday",
                                "4 months from today (120 days)"
                              )}
                            </Text>
                            <div
                              style={{
                                marginTop: 8,
                                paddingTop: 8,
                                borderTop: "1px solid #f0f0f0",
                              }}
                            >
                              <Text strong>
                                {t("startDate", "Start date")}:{" "}
                                {formatDate(getSearchStartDate())}
                              </Text>
                            </div>
                            <Alert
                              type="info"
                              showIcon
                              icon={<InfoCircleOutlined />}
                              message={t(
                                "targetStartDateExplanationView",
                                "This is the earliest date the system will start searching for available appointments."
                              )}
                              style={{ marginTop: 12 }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {formData.targetStartMode === "date" && (
                    <Form.Item
                      label={
                        <Typography.Title
                          type="secondary"
                          level={5}
                          style={{
                            margin: 0,
                            display: "block",
                          }}
                        >
                          {t("targetStartDate", "Target Start Date")}
                          <Text type="danger">*</Text>
                        </Typography.Title>
                      }
                      validateStatus={errors.targetStartDate ? "error" : ""}
                      help={errors.targetStartDate}
                    >
                      <Input
                        type="date"
                        id="targetStartDate"
                        name="targetStartDate"
                        value={formData.targetStartDate}
                        onChange={handleInputChange}
                        size={btnSize}
                        style={{ width: "100%", maxWidth: 240 }}
                      />
                      <Alert
                        type="info"
                        showIcon
                        icon={<InfoCircleOutlined />}
                        message={t(
                          "targetStartDateExplanationView",
                          "This is the earliest date the system will start searching for available appointments."
                        )}
                        style={{ marginTop: 8 }}
                      />
                    </Form.Item>
                  )}

                  <Form.Item
                    label={
                      <Typography.Title
                        type="secondary"
                        level={5}
                        style={{
                          margin: 0,
                          display: "block",
                        }}
                      >
                        {t("targetEndDate", "Target End Date")}
                        <Text type="danger">*</Text>
                      </Typography.Title>
                    }
                    validateStatus={errors.targetEndDate ? "error" : ""}
                    help={errors.targetEndDate}
                  >
                    <Input
                      type="date"
                      id="targetEndDate"
                      name="targetEndDate"
                      value={formData.targetEndDate}
                      onChange={handleInputChange}
                      min={
                        !permissions.canSearchUnlimited()
                          ? getMinEndDate()
                          : undefined
                      }
                      size={btnSize}
                      style={{ width: "100%", maxWidth: 240 }}
                    />
                    <Alert
                      type="info"
                      showIcon
                      icon={<InfoCircleOutlined />}
                      message={t(
                        "targetEndDateExplanation",
                        "This is the latest date you would accept for an appointment. The search will look for appointments between 4 months from now and this date. Minimum: 210 days from today."
                      )}
                      style={{ marginTop: 8 }}
                    />
                  </Form.Item>
                </div>
              </Space>
            </Card>

            {/* Target Cities Section */}
            <Card
              style={{ width: "100%", maxWidth: "100%", marginBottom: 24 }}
              title={
                <Space>
                  <EnvironmentOutlined />
                  <Typography.Title
                    style={{ margin: 0 }}
                    level={isMobile ? 5 : 4}
                    strong
                  >
                    {t("targetCities", "Target Cities")}
                  </Typography.Title>
                  {cities.length > 1 && <Text type="danger">*</Text>}
                </Space>
              }
            >
              {cities.length === 0 ? (
                <Alert
                  type="info"
                  showIcon
                  icon={<EnvironmentOutlined />}
                  title={t(
                    "noCitiesForCountry",
                    "No cities available for your country"
                  )}
                  description={t(
                    "noCitiesForCountryDescription",
                    "Soon you'll be able to select specific cities. We'll notify you when it's ready."
                  )}
                />
              ) : cities.length === 1 ? (
                <Space>
                  <Text strong>{cities[0].city_name}</Text>
                  <Text type="secondary">({cities[0].city_code})</Text>
                </Space>
              ) : (
                <Form.Item
                  validateStatus={errors.selectedCities ? "error" : ""}
                  help={errors.selectedCities}
                >
                  <Select
                    mode="multiple"
                    placeholder={t("selectCities", "Select cities")}
                    value={formData.selectedCities}
                    onChange={(vals) => {
                      const next = vals || [];
                      setFormData((prev) => ({
                        ...prev,
                        selectedCities: next,
                      }));
                      setErrors((prev) => ({
                        ...prev,
                        selectedCities:
                          next.length > 0
                            ? ""
                            : t(
                                "cityRequired",
                                "Please select at least one city"
                              ),
                      }));
                    }}
                    size={btnSize}
                    style={{ width: "100%" }}
                    options={cities.map((c) => ({
                      label: `${c.city_name} (${c.city_code})`,
                      value: c.city_code,
                    }))}
                    optionFilterProp="label"
                    allowClear
                  />
                </Form.Item>
              )}
            </Card>

            {/* Form Actions */}
            <Space wrap size={8} style={{ marginTop: 24, marginBottom: 24 }}>
              <Button
                icon={<CloseOutlined />}
                onClick={handleCancel}
                disabled={loading}
                size={btnSize}
              >
                {t("cancel", "Cancel")}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                form="applicant-form"
                icon={
                  loading ? null : isEditMode ? (
                    <SaveOutlined />
                  ) : (
                    <CheckOutlined />
                  )
                }
                loading={loading}
                disabled={loading}
                size={btnSize}
              >
                {loading
                  ? isEditMode
                    ? t("updating", "Updating...")
                    : t("creating", "Creating...")
                  : isEditMode
                  ? t("updateApplicant", "Update Applicant")
                  : t("createApplicant", "Create Applicant")}
              </Button>
            </Space>
          </Form>
        </form>
      </div>
    </>
  );
};

export default ApplicantForm;
