import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import PreLoginHeader from "../common/PreLoginHeader";
import PreLoginFooter from "../common/PreLoginFooter";
import LanguageSelector from "../common/LanguageSelector";
import { getTranslatedCountries } from "../../utils/countries";
import { ALL_CITIES } from "../../utils/cities";
import FastVisaMetrics from "../../utils/FastVisaMetrics";
import {
  getRoles,
  authenticateAIS,
  notifyAdminAISFailure,
  createUser,
  searchUserByUsername,
  createApplicant,
  loginUser,
  getUserPermissions,
  StartApplicantContainer,
} from "../../services/APIFunctions";
import {
  Form,
  Input,
  Select,
  Button,
  Alert,
  Grid,
  Card,
  Radio,
  Space,
  Typography,
} from "antd";
import {
  KeyOutlined,
  GlobalOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  CloseOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import "./ApplicantForm.css";
import "../auth/RegisterUser.css";
import "../auth/LogIn.css";

const { useBreakpoint } = Grid;

const QuickStartApplicant = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [form] = Form.useForm();
  const formRef = useRef(form);
  formRef.current = form;
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const btnSize = isMobile ? "large" : "middle";
  const cardContentStyle = isMobile
    ? { display: "flex", flexDirection: "column", gap: 16, width: "100%" }
    : {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 16,
        width: "100%",
      };

  // Get translated countries list (stable reference)
  const countries = useMemo(() => getTranslatedCountries(t), [t]);
  const countryOptions = useMemo(
    () =>
      countries.map((c) => ({ value: c.value, label: c.label, flag: c.flag })),
    [countries]
  );
  const countryCode = Form.useWatch("country_code", form) || "";

  // Calculate minimum end date (210 days from today) - Updated Nov 2025
  const getMinEndDate = () => {
    const today = new Date();
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 210);
    return minDate.toISOString().split("T")[0];
  };
  const minEndDate = getMinEndDate();

  // Calculate search start date (120 days from today) - Updated Nov 2025
  const getSearchStartDate = () => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 120);
    return startDate;
  };
  const searchStartDate = getSearchStartDate();

  // Format date for display
  const formatDate = (date) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString(undefined, options);
  };

  const formatApplicantDate = (dateVal) => {
    if (dateVal == null || dateVal === "") return "N/A";
    return dateVal;
  };

  // Get expiration date (one month from now)
  const getExpirationDate = () => {
    const now = new Date();
    const expirationDate = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate()
    );
    return expirationDate.toISOString().split("T")[0];
  };

  // Generate a random password
  const generatePassword = () => {
    const length = 12;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [basicRoleId, setBasicRoleId] = useState(null);
  const [cities, setCities] = useState([]);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [aisApplicantsList, setAisApplicantsList] = useState([]);
  const [selectedAisApplicant, setSelectedAisApplicant] = useState(null);
  const [loadApplicantsLoading, setLoadApplicantsLoading] = useState(false);
  const [aisAuthError, setAisAuthError] = useState("");
  const [aisAuthSuccess, setAisAuthSuccess] = useState(false);

  // Initialize metrics tracker
  const metrics = useMemo(() => new FastVisaMetrics(), []);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [currentStep, setCurrentStep] = useState(1); // 1: form, 2: creating user, 3: creating applicant

  // Fetch basic_user role
  useEffect(() => {
    let isMounted = true;
    const fetchRoles = async () => {
      try {
        const roles = await getRoles();
        const basicRole = roles.find((role) => role.name === "basic_user");
        if (basicRole && isMounted) {
          setBasicRoleId(basicRole.id);
          setRolesLoaded(true);
        } else if (isMounted) {
          setSubmitError(
            "Could not find the basic_user role. Please contact support."
          );
        }
      } catch (err) {
        if (isMounted) {
          setSubmitError(
            "Failed to load configuration. Please try again later."
          );
        }
      }
    };
    fetchRoles();
    return () => {
      isMounted = false;
    };
  }, [countries, metrics]);

  // Load cities when country changes
  useEffect(() => {
    if (countryCode) {
      const availableCities = ALL_CITIES[countryCode] || [];
      setCities(availableCities);
      if (availableCities.length === 1) {
        formRef.current?.setFieldValue("selectedCities", [
          availableCities[0].city_code,
        ]);
      } else {
        formRef.current?.setFieldValue("selectedCities", []);
      }
    }
  }, [countryCode]);

  // Try to detect the user's country to pre-select a likely country value
  useEffect(() => {
    let isMounted = true;
    const detectCountry = async () => {
      if (typeof window === "undefined" || !navigator) return;
      setDetectingLocation(true);

      // Helper: set the country code (uppercase) if available in countries
      const setDetected = (countryCode, method = "geolocation") => {
        if (!isMounted || !countryCode) return;
        // store only for debugging - not shown to user
        const codeLower = countryCode.toLowerCase();
        // 1) Direct match by full value
        let found = countries.find(
          (c) => c.value && c.value.toLowerCase() === codeLower
        );
        // 2) Fallback: match by suffix (e.g., "es-mx" -> "mx")
        if (!found) {
          found = countries.find(
            (c) =>
              c.value && c.value.split("-").pop().toLowerCase() === codeLower
          );
        }
        if (found) {
          formRef.current?.setFieldValue("country_code", found.value);
          try {
            const uid = sessionStorage.getItem("fastVisa_userid");
            if (uid) metrics.setUserId(uid);
            metrics.trackCustomEvent("location_detected", {
              method,
              detected_code: countryCode,
              matched_value: found.value,
              timestamp: new Date().toISOString(),
            });
          } catch (err) {
            console.warn(
              "[QuickStart] Metrics error tracking location_detected:",
              err
            );
          }
        } else {
          // Don't show user any message when country is not supported; keep silent
          console.warn(
            "[QuickStart] Detected country not supported by list:",
            countryCode
          );
          try {
            const uid = sessionStorage.getItem("fastVisa_userid");
            if (uid) metrics.setUserId(uid);
            metrics.trackCustomEvent("location_detected", {
              method,
              detected_code: countryCode,
              matched_value: null,
              timestamp: new Date().toISOString(),
            });
          } catch (err) {
            console.warn(
              "[QuickStart] Metrics error tracking location_detected (no match):",
              err
            );
          }
        }
      };

      // 1) Try browser geolocation (more accurate) and reverse geocode using BigDataCloud
      try {
        if (navigator.geolocation) {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 8000,
            });
          });

          const { latitude, longitude } = pos.coords;

          try {
            const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
            const resp = await fetch(url);
            if (resp.ok) {
              const data = await resp.json();
              const countryCode =
                data && (data.countryCode || data.country_code);
              if (countryCode) {
                setDetected(countryCode, "geolocation");
                setDetectingLocation(false);
                return;
              }
            }
          } catch (err) {
            // Ignore and fallback
            console.warn(
              "[QuickStart] Reverse geocode failed, falling back to IP geo",
              err
            );
          }
        }
      } catch (geoErr) {
        console.warn("[QuickStart] Geolocation error or denied", geoErr);
      }

      // 2) Fallback to IP-based lookup (less accurate but widely supported)
      try {
        const resp = await fetch("https://ipapi.co/json/");
        if (resp.ok) {
          const data = await resp.json();
          const countryCode = data && (data.country || data.country_code);
          if (countryCode) {
            setDetected(countryCode, "ip");
            setDetectingLocation(false);
            return;
          }
        }
      } catch (ipErr) {
        console.warn("[QuickStart] IP geolocation failed", ipErr);
      }

      // fallback: no visible error — user picks manually
      setDetectingLocation(false);
    };

    // Run detection only once on mount
    detectCountry();
    return () => {
      isMounted = false;
    };
  }, [countries, metrics]);

  const loadAisApplicants = async () => {
    const aisEmail = form.getFieldValue("aisEmail");
    const aisPassword = form.getFieldValue("aisPassword");
    const country_code = form.getFieldValue("country_code");
    setAisAuthError("");
    if (!aisEmail?.trim() || !aisPassword?.trim() || !country_code) {
      setAisAuthError(
        t(
          "aisCredentialsRequired",
          "Please enter AIS email, password and select country first."
        )
      );
      return;
    }
    setLoadApplicantsLoading(true);
    setAisApplicantsList([]);
    setSelectedAisApplicant(null);
    setAisAuthSuccess(false);
    try {
      const data = await authenticateAIS({
        username: aisEmail,
        password: aisPassword,
        country_code,
      });
      if (data && data.applicants && data.applicants.length > 0) {
        setAisApplicantsList(data.applicants);
        setAisAuthSuccess(true);
        if (data.applicants.length === 1) {
          setSelectedAisApplicant(data.applicants[0]);
        }
      } else {
        setAisAuthSuccess(false);
        setAisAuthError(
          data?.error
            ? t(
                "invalidCredentials",
                "Invalid credentials. Please check your email and password."
              )
            : t("noAisApplicants", "No applicants found for this account.")
        );
      }
    } catch (err) {
      setAisAuthSuccess(false);
      setAisAuthError(
        t(
          "invalidCredentials",
          "Invalid credentials. Please check your email and password."
        )
      );
    } finally {
      setLoadApplicantsLoading(false);
    }
  };

  const handleSelectApplicant = (applicant) => {
    setSelectedAisApplicant(applicant);
  };

  const handleSubmit = async (values) => {
    setSubmitError("");

    if (!rolesLoaded || !basicRoleId) {
      setSubmitError(
        t("loadingConfig", "Configuration is still loading. Please wait.")
      );
      return;
    }

    if (
      cities.length > 0 &&
      aisApplicantsList.length > 1 &&
      !selectedAisApplicant
    ) {
      setSubmitError(
        t(
          "selectAisApplicant",
          "Please load and select an applicant from the list."
        )
      );
      return;
    }

    // Scroll to top to see loading progress
    window.scrollTo({ top: 0, behavior: "smooth" });

    setLoading(true);

    try {
      const generatedPassword = generatePassword();
      console.log("[QuickStart] Step 0: Password generated");

      let username, userName, aisScheduleId, numberOfApplicants;

      if (cities.length > 0) {
        username = values.aisEmail;
        const applicant =
          selectedAisApplicant ||
          (aisApplicantsList.length === 1 ? aisApplicantsList[0] : null);
        if (applicant) {
          userName = applicant.applicant_name || username;
          aisScheduleId = applicant.schedule_id || "-";
          numberOfApplicants = "1";
          console.log("[QuickStart] Using selected/loaded AIS applicant:", {
            userName,
            aisScheduleId,
          });
        } else {
          try {
            const aisUserInfo = await authenticateAIS({
              username: values.aisEmail,
              password: values.aisPassword,
              country_code: values.country_code,
            });
            if (
              aisUserInfo &&
              aisUserInfo.applicants &&
              aisUserInfo.applicants.length > 0
            ) {
              const first = aisUserInfo.applicants[0];
              userName = first.applicant_name || username;
              aisScheduleId = first.schedule_id || "-";
              numberOfApplicants = "1";
            } else {
              userName = username;
              aisScheduleId = "-";
              numberOfApplicants = "1";
              await notifyAdminAISFailure({
                username: values.aisEmail,
                ais_username: values.aisEmail,
                country_code: values.country_code,
              });
            }
          } catch (aisError) {
            console.error("[QuickStart] AIS authentication error:", aisError);
            await notifyAdminAISFailure({
              username: values.aisEmail,
              ais_username: values.aisEmail,
              country_code: values.country_code,
            });
            userName = username;
            aisScheduleId = "-";
            numberOfApplicants = "1";
          }
        }
      } else {
        username = values.aisEmail || `user_${Date.now()}@fastvisa.com`;
        userName = username;
        aisScheduleId = "-";
        numberOfApplicants = "1";
        console.log(
          "[QuickStart] Country has no cities, using default values:",
          { username, userName }
        );
      }

      // Step 1: Create User
      setCurrentStep(2);
      console.log("[QuickStart] Step 1: Creating user with payload:", {
        name: userName,
        username,
        country_code: values.country_code,
        role_id: basicRoleId,
      });

      const userPayload = {
        name: userName,
        username: username,
        email: username,
        password: generatedPassword,
        phone_number: values.phone_number || "",
        active: true,
        expiration_date: getExpirationDate(),
        country_code: values.country_code,
        role_id: basicRoleId,
        sendEmail: true,
        includePassword: true,
        language: i18n.language || "en",
      };

      const userResult = await createUser(userPayload);
      console.log("[QuickStart] User creation result:", userResult);

      if (!userResult.success) {
        console.error("[QuickStart] User creation failed:", userResult.error);
        throw new Error(
          userResult.error ||
            t("userCreationFailed", "Failed to create user account")
        );
      }
      console.log("[QuickStart] User created successfully");

      // Get the created user's ID
      console.log("[QuickStart] Searching for user:", username);
      const userData = await searchUserByUsername(username);
      console.log("[QuickStart] User search result:", userData);

      if (!userData || userData.length === 0) {
        console.error("[QuickStart] User search failed - no user found");
        throw new Error(t("userSearchFailed", "Failed to retrieve user data"));
      }

      const userId = userData[0].id;
      const retrievedUserName = userData[0].name;
      console.log("[QuickStart] User found:", { userId, retrievedUserName });

      // Step 2: Create Applicant
      setCurrentStep(3);
      console.log("[QuickStart] Step 2: Creating applicant");

      const applicantPayload = {
        fastVisa_userid: userId,
        fastVisa_username: username,
        name: userName,
        ais_username: values.aisEmail || "-",
        ais_password: cities.length > 0 ? values.aisPassword : "-",
        ais_schedule_id: aisScheduleId,
        number_of_applicants: numberOfApplicants,
        applicant_active: true,
        target_start_mode: "days",
        target_start_days: "120",
        target_start_date: "-",
        target_end_date: values.targetEndDate,
        target_city_codes: (values.selectedCities || []).join(","),
        target_country_code: values.country_code,
        consul_appointment_date: "",
        asc_appointment_date: "",
        container_id: "",
        container_start_datetime: "",
        container_stop_datetime: "",
        app_start_time: "",
      };

      console.log("[QuickStart] Applicant payload:", applicantPayload);
      const applicantData = await createApplicant(applicantPayload);
      console.log("[QuickStart] Applicant creation result:", applicantData);

      if (!applicantData || !applicantData.id) {
        console.error(
          "[QuickStart] Failed to create applicant - no ID returned"
        );
        // If we can't get the applicant ID, we can't continue to the view page
        throw new Error(
          t("applicantCreationFailed", "Failed to create applicant")
        );
      }

      const applicantId = applicantData.id;
      console.log("[QuickStart] Applicant created successfully:", applicantId);

      // Step 3: Log in the user automatically
      console.log("[QuickStart] Step 3: Logging in user");
      const loginResult = await loginUser(username, generatedPassword);
      console.log("[QuickStart] Login result:", loginResult);

      if (!loginResult || !loginResult.success) {
        console.warn(
          "[QuickStart] Auto-login failed, but user and applicant were created successfully"
        );
        // Continue anyway - user can log in manually
      } else {
        console.log("[QuickStart] Login successful");
      }

      // Store session data
      console.log("[QuickStart] Storing session data");
      sessionStorage.setItem("fastVisa_userid", userId);
      sessionStorage.setItem("fastVisa_username", username);
      sessionStorage.setItem("country_code", values.country_code);
      sessionStorage.setItem("fastVisa_name", retrievedUserName);

      // Fetch and store user permissions (optional - don't fail if this errors)
      console.log("[QuickStart] Fetching user permissions");
      try {
        const permissionsData = await getUserPermissions(userId);
        console.log("[QuickStart] Permissions data:", permissionsData);
        if (permissionsData) {
          sessionStorage.setItem(
            "fastVisa_permissions",
            JSON.stringify(permissionsData)
          );
        }
      } catch (permError) {
        console.warn(
          "[QuickStart] Failed to fetch permissions, but continuing:",
          permError
        );
      }

      // Step 4: Start the container for the applicant (optional - don't fail if this errors)
      console.log("[QuickStart] Step 4: Starting container");
      try {
        await StartApplicantContainer(applicantId);
        console.log("[QuickStart] Container started successfully");
      } catch (containerError) {
        console.warn(
          "[QuickStart] Failed to start container, but continuing:",
          containerError
        );
      }

      // Redirect to applicant details page
      console.log("[QuickStart] Redirecting to applicant view:", applicantId);
      window.location.href = `/view-applicant/${applicantId}`;
    } catch (error) {
      console.error("[QuickStart] ❌ ERROR in quick start flow:", error);
      console.error("[QuickStart] Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      setSubmitError(
        error.message || t("unexpectedError", "An unexpected error occurred")
      );
      setCurrentStep(1);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="login-root">
        <PreLoginHeader />
        <div className="content-wrap">
          <LanguageSelector />
          <div
            className="applicant-form-container"
            style={{ minHeight: "100vh" }}
          >
            <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <div style={{ marginBottom: "2rem" }}>
                <i
                  className="fas fa-spinner fa-spin"
                  style={{ fontSize: "3rem", color: "#2563eb" }}
                ></i>
              </div>
              {currentStep === 2 && (
                <>
                  <h2>{t("registeringUser", "Creating your account...")}</h2>
                  <p style={{ color: "#666", marginTop: "1rem" }}>
                    {t(
                      "pleaseWait",
                      "Please wait while we set up your account"
                    )}
                  </p>
                </>
              )}
              {currentStep === 3 && (
                <>
                  <h2>
                    {t("startingSearch", "Starting appointment search...")}
                  </h2>
                  <p style={{ color: "#666", marginTop: "1rem" }}>
                    {t(
                      "almostDone",
                      "Almost done! Setting up your appointment search"
                    )}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
        <PreLoginFooter />
      </div>
    );
  }

  return (
    <div className="login-root">
      <PreLoginHeader />
      <div className="content-wrap">
        <LanguageSelector />
        <div
          className="applicant-form-container"
          style={{ minHeight: "100vh" }}
        >
          <Space direction="vertical" size={8} style={{ marginBottom: 24 }}>
            <Space align="center">
              <ThunderboltOutlined style={{ fontSize: 28, color: "#10b981" }} />
              <Typography.Title
                level={2}
                strong
                style={{ margin: 0, color: "#2C6BA0" }}
              >
                {t("quickStart", "Quick Start")}
              </Typography.Title>
            </Space>
            <Typography.Text type="secondary" style={{ fontSize: 15 }}>
              {t(
                "quickStartDescription",
                "Start using the app immediately. We'll create your account automatically."
              )}
            </Typography.Text>
          </Space>

          <Form
            form={form}
            id="quick-start-form"
            onFinish={handleSubmit}
            onValuesChange={(changedValues) => {
              if (
                "aisEmail" in changedValues ||
                "aisPassword" in changedValues
              ) {
                setAisAuthSuccess(false);
                setAisApplicantsList([]);
                setSelectedAisApplicant(null);
                setAisAuthError("");
              }
            }}
            layout="vertical"
            initialValues={{ targetEndDate: minEndDate, selectedCities: [] }}
            validateTrigger={["onChange", "onBlur"]}
          >
            {submitError && (
              <Alert
                type="error"
                showIcon
                message={submitError}
                closable
                onClose={() => setSubmitError("")}
                style={{ marginBottom: 16 }}
                className="applicant-form-error-banner"
              />
            )}

            <Card
              style={{ width: "100%", maxWidth: "100%", marginBottom: 24 }}
              title={
                <Space>
                  <GlobalOutlined />
                  <Typography.Title
                    style={{ margin: 0 }}
                    level={isMobile ? 5 : 4}
                    strong
                  >
                    {t("basicInfo", "Basic Information")}
                  </Typography.Title>
                </Space>
              }
            >
              <div style={cardContentStyle}>
                <Form.Item
                  name="country_code"
                  label={
                    <Typography.Title
                      type="secondary"
                      level={5}
                      style={{ margin: 0, display: "block" }}
                    >
                      {t("country", "Country")}
                    </Typography.Title>
                  }
                  rules={[
                    {
                      required: true,
                      message: t(
                        "countryRequired",
                        "Country selection is required"
                      ),
                    },
                  ]}
                >
                  <Select
                    size={btnSize}
                    placeholder={t("selectCountry", "Select a country")}
                    options={countryOptions}
                    showSearch
                    optionFilterProp="label"
                    optionRender={(option) => (
                      <span>
                        <span style={{ marginRight: 8 }}>{option.flag}</span>
                        {option.label}
                      </span>
                    )}
                    style={{ width: "100%" }}
                  />
                </Form.Item>
                {detectingLocation && (
                  <Typography.Text
                    type="secondary"
                    style={{ marginTop: -8, fontSize: "0.9rem" }}
                  >
                    <i
                      className="fas fa-spinner fa-spin"
                      style={{ marginRight: 8 }}
                    />
                    {t("detectingLocation", "Detecting your location...")}
                  </Typography.Text>
                )}
                <Form.Item
                  name="phone_number"
                  label={
                    <Typography.Title
                      type="secondary"
                      level={5}
                      style={{ margin: 0, display: "block" }}
                    >
                      {t("phoneNumber", "Phone Number")}{" "}
                      {t("optional", "(Optional)")}
                    </Typography.Title>
                  }
                >
                  <Input
                    size={btnSize}
                    placeholder={t("enterPhone", "Optional")}
                  />
                </Form.Item>
              </div>
            </Card>

            <Card
              style={{ width: "100%", maxWidth: "100%", marginBottom: 24 }}
              title={
                <Space>
                  <KeyOutlined />
                  <Typography.Title
                    style={{ margin: 0 }}
                    level={isMobile ? 5 : 4}
                    strong
                  >
                    {t("aisCredentials", "AIS Appointment System Credentials")}
                  </Typography.Title>
                </Space>
              }
            >
              <Typography.Text
                type="secondary"
                style={{
                  display: "block",
                  fontSize: "0.95rem",
                  marginBottom: 16,
                  lineHeight: 1.5,
                }}
              >
                {t(
                  "aisCredentialsInfo",
                  "Enter your AIS login credentials. We will automatically retrieve your schedule ID and number of applicants from the AIS system."
                )}
              </Typography.Text>
              <div style={cardContentStyle}>
                <Form.Item
                  name="aisEmail"
                  label={t("aisEmail", "AIS Email")}
                  rules={
                    cities.length > 0
                      ? [
                          {
                            required: true,
                            message: t(
                              "aisEmailRequired",
                              "AIS Email is required"
                            ),
                          },
                          {
                            type: "email",
                            message: t(
                              "invalidEmail",
                              "Please enter a valid email"
                            ),
                          },
                        ]
                      : []
                  }
                >
                  <Input
                    size={btnSize}
                    type="email"
                    placeholder="ais@example.com"
                  />
                </Form.Item>

                <Form.Item
                  name="aisPassword"
                  label={
                    <Typography.Title
                      type="secondary"
                      level={5}
                      style={{ margin: 0, display: "block" }}
                    >
                      {t("aisPassword", "AIS Password")}
                    </Typography.Title>
                  }
                  rules={
                    cities.length > 0
                      ? [
                          {
                            required: true,
                            message: t(
                              "aisPasswordRequired",
                              "AIS Password is required"
                            ),
                          },
                        ]
                      : []
                  }
                  className="applicant-form-field"
                >
                  <Input.Password
                    size={btnSize}
                    placeholder={t("enterAisPassword", "Enter AIS password")}
                  />
                </Form.Item>
              </div>

              {cities.length > 0 && (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <Button
                      type="primary"
                      size={btnSize}
                      icon={<KeyOutlined />}
                      loading={loadApplicantsLoading}
                      onClick={loadAisApplicants}
                      disabled={
                        loadApplicantsLoading ||
                        !form.getFieldValue("aisEmail")?.trim() ||
                        !form.getFieldValue("aisPassword")?.trim()
                      }
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
                    <Typography.Text
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
                    </Typography.Text>
                  </div>
                  {aisAuthError && (
                    <Alert
                      type="error"
                      showIcon
                      message={aisAuthError}
                      closable
                      onClose={() => setAisAuthError("")}
                      style={{ marginBottom: 12 }}
                    />
                  )}
                  {aisApplicantsList.length > 0 && (
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
                      {aisApplicantsList.length === 1 && (
                        <Alert
                          type="info"
                          showIcon
                          message={t(
                            "oneApplicantFound",
                            "1 applicant found for this account."
                          )}
                          style={{ marginBottom: 16 }}
                        />
                      )}
                      {aisApplicantsList.length > 1 &&
                        !selectedAisApplicant && (
                          <Alert
                            type="error"
                            showIcon
                            message={t(
                              "selectApplicant",
                              "Please select an applicant from the list"
                            )}
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
                          value={selectedAisApplicant?.schedule_id}
                          style={{ width: "100%" }}
                          onChange={(e) => {
                            const app = aisApplicantsList.find(
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
                            {aisApplicantsList.map((app) => (
                              <Card
                                key={app.schedule_id}
                                size="small"
                                hoverable
                                onClick={() => handleSelectApplicant(app)}
                                style={{
                                  cursor: "pointer",
                                  borderColor:
                                    selectedAisApplicant?.schedule_id ===
                                    app.schedule_id
                                      ? "#1890ff"
                                      : "#d9d9d9",
                                  borderWidth:
                                    selectedAisApplicant?.schedule_id ===
                                    app.schedule_id
                                      ? 2
                                      : 1,
                                  backgroundColor:
                                    selectedAisApplicant?.schedule_id ===
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
                                    <Typography.Text strong>
                                      {t("applicantName", "Applicant name")}:{" "}
                                      {app.applicant_name || "—"}
                                    </Typography.Text>
                                    <Typography.Text type="secondary">
                                      {t("passport", "Passport")}:{" "}
                                      {app.passport || "—"}
                                    </Typography.Text>
                                    <Typography.Text type="secondary">
                                      {t(
                                        "ds160Confirmation",
                                        "DS-160 confirmation"
                                      )}
                                      : {app.ds_160_id || "—"}
                                    </Typography.Text>
                                    <Typography.Text type="secondary">
                                      {t(
                                        "consulAppointmentDate",
                                        "Consul appointment date"
                                      )}
                                      :{" "}
                                      {formatApplicantDate(
                                        app.consul_appointment_date
                                      )}
                                    </Typography.Text>
                                    <Typography.Text type="secondary">
                                      {t(
                                        "ascAppointmentDate",
                                        "ASC appointment date"
                                      )}
                                      :{" "}
                                      {formatApplicantDate(
                                        app.asc_appointment_date
                                      )}
                                    </Typography.Text>
                                  </Space>
                                </div>
                              </Card>
                            ))}
                          </Space>
                        </Radio.Group>
                      </div>
                      {selectedAisApplicant && (
                        <Alert
                          type="success"
                          showIcon
                          message={t(
                            "selectedApplicantSummary",
                            "Selected applicant"
                          )}
                          style={{ marginTop: 16 }}
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </Card>

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
                </Space>
              }
            >
              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                <Alert
                  type="info"
                  showIcon
                  message={
                    <span>
                      <strong>
                        {t(
                          "basicUserSearchInfo",
                          "Basic User Search Settings:"
                        )}
                      </strong>{" "}
                      {t(
                        "basicUserSearchDesc",
                        "Your appointment search will start 4 months from today."
                      )}{" "}
                      <strong>
                        {t("premiumUpgradeNote", "Premium users")}
                      </strong>{" "}
                      {t(
                        "premiumCanSearchTomorrow",
                        "can search for appointments starting from tomorrow."
                      )}
                    </span>
                  }
                />
                <div style={cardContentStyle}>
                  <div>
                    <Typography.Title
                      type="secondary"
                      level={5}
                      style={{ margin: 0, marginBottom: 8, display: "block" }}
                    >
                      {t("searchStartsIn", "Search Starts In")}
                    </Typography.Title>
                    <Card size="small" style={{ background: "#fafafa" }}>
                      <Space
                        direction="vertical"
                        size={8}
                        style={{ width: "100%" }}
                      >
                        <Space>
                          <ClockCircleOutlined style={{ color: "#6b7280" }} />
                          <Typography.Text strong>
                            {t(
                              "fourMonthsFromToday",
                              "4 months from today (120 days)"
                            )}
                          </Typography.Text>
                        </Space>
                        <Typography.Text type="secondary">
                          <CalendarOutlined style={{ marginRight: 8 }} />
                          {t("startDate", "Start date")}:{" "}
                          {formatDate(searchStartDate)}
                        </Typography.Text>
                        <Typography.Text
                          type="secondary"
                          style={{
                            fontSize: "0.875rem",
                            display: "block",
                            marginTop: 4,
                          }}
                        >
                          <InfoCircleOutlined style={{ marginRight: 6 }} />
                          {t(
                            "targetStartDateExplanationView",
                            "This is the earliest date the system will start searching for available appointments."
                          )}
                        </Typography.Text>
                      </Space>
                    </Card>
                  </div>

                  <Form.Item
                    name="targetEndDate"
                    label={
                      <Typography.Title
                        type="secondary"
                        level={5}
                        style={{ margin: 0, display: "block" }}
                      >
                        {t("targetEndDate", "Target End Date")}
                      </Typography.Title>
                    }
                    rules={[
                      {
                        required: true,
                        message: t(
                          "endDateRequired",
                          "Target end date is required"
                        ),
                      },
                      () => ({
                        validator(_, value) {
                          if (!value || value >= minEndDate)
                            return Promise.resolve();
                          return Promise.reject(
                            new Error(
                              t(
                                "endDateMinimum",
                                "Target end date must be at least 210 days from today"
                              )
                            )
                          );
                        },
                      }),
                    ]}
                  >
                    <Input
                      size={btnSize}
                      type="date"
                      min={minEndDate}
                      style={{ width: "100%" }}
                    />
                    <Typography.Text
                      type="secondary"
                      style={{
                        fontSize: "0.75rem",
                        display: "block",
                        marginTop: 4,
                      }}
                    >
                      {t(
                        "targetEndDateExplanation",
                        "This is the latest date you would accept for an appointment. The search will look for appointments between 4 months from now and this date."
                      )}
                    </Typography.Text>
                  </Form.Item>
                </div>
              </Space>
            </Card>

            {countryCode && cities.length > 0 && (
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
                    {cities.length > 1 && (
                      <Typography.Text type="danger">*</Typography.Text>
                    )}
                  </Space>
                }
              >
                {cities.length === 1 ? (
                  <Space>
                    <Typography.Text strong>
                      {cities[0].city_name}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      ({cities[0].city_code})
                    </Typography.Text>
                  </Space>
                ) : (
                  <Form.Item
                    name="selectedCities"
                    rules={
                      cities.length > 1
                        ? [
                            {
                              required: true,
                              type: "array",
                              min: 1,
                              message: t(
                                "cityRequired",
                                "Please select at least one city"
                              ),
                            },
                          ]
                        : []
                    }
                  >
                    <Select
                      size={btnSize}
                      mode="multiple"
                      placeholder={t(
                        "cityRequired",
                        "Please select at least one city"
                      )}
                      options={cities.map((c) => ({
                        value: c.city_code,
                        label: `${c.city_name} (${c.city_code})`,
                      }))}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                )}
              </Card>
            )}

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
                size={btnSize}
                loading={loading}
                disabled={loading || !rolesLoaded}
                icon={<ThunderboltOutlined />}
                style={{ backgroundColor: "#10b981", borderColor: "#10b981" }}
              >
                {loading
                  ? t("processing", "Processing...")
                  : t("startNow", "Start Now")}
              </Button>
            </Space>
          </Form>
        </div>
      </div>
      <PreLoginFooter />
    </div>
  );
};

export default QuickStartApplicant;
