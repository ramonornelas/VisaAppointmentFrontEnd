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
import { Button, Space, Alert, Grid, Spin, message as antMessage } from "antd";
import { CloseOutlined, SaveOutlined, CheckOutlined } from "@ant-design/icons";
import ApplicantFormHeader from "./ApplicantFormHeader";
import VisaCredentialsPanel from "./VisaCredentialsPanel";
import DateRangeSelector from "../common/DateRangeSelector";
import BasicDateRangeSelector from "../common/BasicDateRangeSelector";
import TargetCitiesSection from "./TargetCitiesSection";
import "./ApplicantForm.css";

const { useBreakpoint } = Grid;

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

  // Session data
  const fastVisaUserId = sessionStorage.getItem("fastVisa_userid");
  const fastVisaUsername = sessionStorage.getItem("fastVisa_username");
  const countryCode = sessionStorage.getItem("country_code");

  const canSearchUnlimited = permissions.canSearchUnlimited();

  const getSearchStartDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 120);
    return d;
  };

  const getMinEndDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 210);
    return d.toISOString().split("T")[0];
  };

  const searchStartDate = getSearchStartDate();
  const minEndDate = getMinEndDate();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    aisEmail: "",
    aisPassword: "",
    aisScheduleId: "",
    numberOfApplicants: "1",
    applicantActive: true,
    targetStartDays: 0, // Basic users: 120 days, Admins: 1 day
    targetStartDate: "",
    targetEndDate: minEndDate,
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
            t("failedToLoadApplicant", "Failed to load applicant data"),
          );
        })
        .finally(() => setLoading(false));
    }
  }, [isEditMode, applicantId, t]);

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
        "Visa Appointment System Email is required",
      );
    } else if (!/\S+@\S+\.\S+/.test(formData.aisEmail)) {
      newErrors.aisEmail = t(
        "pleaseEnterValidEmail",
        "Please enter a valid email",
      );
    }
    if (!formData.aisPassword.trim()) {
      newErrors.aisPassword = t(
        "visaPasswordRequired",
        "Visa Appointment System Password is required",
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
            "Credenciales inválidas. Verifica tu correo y contraseña.",
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
          "Credenciales inválidas. Verifica tu correo y contraseña.",
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
        "Visa Appointment System Email is required",
      );
    } else if (!/\S+@\S+\.\S+/.test(formData.aisEmail)) {
      newErrors.aisEmail = t(
        "pleaseEnterValidEmail",
        "Please enter a valid email",
      );
    }

    // Date range validation
    if (isEditMode && !formData.targetStartDate) {
      newErrors.targetStartDate = t(
        "startDateRequired",
        "Target start date is required",
      );
    }

    if (!formData.targetEndDate) {
      newErrors.targetEndDate = t(
        "endDateRequired",
        "Target end date is required",
      );
    }

    if (
      formData.targetStartDate &&
      formData.targetEndDate &&
      new Date(formData.targetEndDate) < new Date(formData.targetStartDate)
    ) {
      newErrors.targetEndDate = t(
        "invalidDateRange",
        "Target end date must be after target start date",
      );
    }

    if (cities.length > 1 && formData.selectedCities.length === 0) {
      newErrors.selectedCities = t(
        "cityRequired",
        "Please select at least one city",
      );
    }

    if (
      (!isEditMode && !selectedApplicant) ||
      (applicantsList.length > 0 && !selectedApplicant)
    ) {
      newErrors.selectedApplicant = t(
        "selectApplicant",
        "Please select an applicant from the list",
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

      target_start_date: isEditMode
        ? formData.targetStartDate
        : canSearchUnlimited && formData.targetStartDate
          ? formData.targetStartDate
          : searchStartDate.toISOString().split("T")[0],
      target_end_date: formData.targetEndDate || "",
      target_start_days: formData.targetStartDays || 0,

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
          targetStartDays: formData.targetStartDays,
          selectedCitiesCount: formData.selectedCities.length,
          timestamp: new Date().toISOString(),
        });

        antMessage.success(
          t("updatedSuccessfully", "Solicitante actualizado exitosamente"),
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
              "Password is required for new applicants",
            ),
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
            t("failedToCreateApplicant", "Failed to create applicant"),
          );
        }

        // Track successful creation
        metrics.trackFormSubmit("applicant-form", true);
        metrics.trackCustomEvent("applicant_created", {
          applicantId: newApplicant.id,
          targetStartDays: formData.targetStartDays,
          selectedCitiesCount: formData.selectedCities.length,
          timestamp: new Date().toISOString(),
        });

        antMessage.success(
          t("createdSuccessfully", "Applicant created successfully."),
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
          : t("failedToCreateApplicant", "Failed to create applicant"),
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
        <Spin
          size="large"
          fullscreen
          tip={t("loadingApplicantDetails", "Loading applicant details...")}
        />
      </>
    );
  }

  const handleCancel = () => {
    metrics.trackButtonClick(
      "cancel-applicant-form-header-btn",
      "Cancel Applicant Form (Header)",
    );
    if (permissions.canManageApplicants()) navigate("/applicants");
    else if (isEditMode) navigate(`/view-applicant/${applicantId}`);
    else navigate("/");
  };

  return (
    <>
      {/* Hamburger Menu Top Header */}
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
        {/* Applicant Header*/}
        <ApplicantFormHeader
          isMobile={isMobile}
          isEditMode={isEditMode}
          formData={formData}
          loading={loading}
          selectedApplicant={selectedApplicant}
          applicantsList={applicantsList}
          btnSize={btnSize}
          handleCancel={handleCancel}
          handleInputChange={handleInputChange}
        />

        {/* Applicant Form */}
        <form
          id="applicant-form"
          layout="vertical"
          onSubmit={handleSubmit}
          style={{ width: "100%" }}
        >
          {submitError && (
            <Alert
              type="error"
              showIcon
              title={submitError}
              style={{ marginBottom: 16 }}
              closable={{
                onClose: () => setSubmitError(""),
              }}
            />
          )}

          {/* Visa Credentials */}
          <VisaCredentialsPanel
            isMobile={isMobile}
            btnSize={btnSize}
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
            isAuthenticating={isAuthenticating}
            aisAuthSuccess={aisAuthSuccess}
            applicantsList={applicantsList}
            selectedApplicant={selectedApplicant}
            setApplicantsList={setApplicantsList}
            setSelectedApplicant={setSelectedApplicant}
            credentialsExpanded={credentialsExpanded}
            setCredentialsExpanded={setCredentialsExpanded}
            handleInputChange={handleInputChange}
            handleAuthenticateAIS={handleAuthenticateAIS}
            handleSelectApplicant={handleSelectApplicant}
            formatApplicantDate={formatApplicantDate}
            isEditMode={isEditMode}
          />

          {/* Target Dates Section */}
          {canSearchUnlimited ? (
            <DateRangeSelector
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              handleInputChange={handleInputChange}
              formatDate={formatDate}
            />
          ) : (
            <BasicDateRangeSelector
              searchStartDate={searchStartDate}
              minEndDate={minEndDate}
              isMobile={isMobile}
              formData={formData}
              handleInputChange={handleInputChange}
            />
          )}

          {/* Target Cities Section */}
          <TargetCitiesSection
            cities={cities}
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
            btnSize={btnSize}
            isMobile={isMobile}
          />

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
        </form>
      </div>
    </>
  );
};

export default ApplicantForm;
