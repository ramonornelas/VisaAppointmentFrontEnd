import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import LanguageSelector from "../common/LanguageSelector";
import PreLoginHeader from "../common/PreLoginHeader";
import PreLoginFooter from "../common/PreLoginFooter";
import { getTranslatedCountries } from "../../utils/countries";
import { getRoles, createUser } from "../../services/APIFunctions";
import { Form, Input, Select, Button, Alert, Grid, Typography } from "antd";
import FastVisaMetrics from "../../utils/FastVisaMetrics";
import "./RegisterUser.css";

const { useBreakpoint } = Grid;

// Calculate expiration date (one month from now)
const getExpirationDate = () => {
  const now = new Date();
  const expirationDate = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate()
  );
  return expirationDate.toISOString().split("T")[0];
};

const UserRegistrationForm = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  // Initialize metrics tracker (stable)
  const metrics = useMemo(() => new FastVisaMetrics(), []);

  // Get translated countries list (stable)
  const countries = useMemo(() => getTranslatedCountries(t), [t]);

  // Ant Design Select options: { value, label, flag }
  const countryOptions = useMemo(
    () =>
      countries.map((c) => ({
        value: c.value,
        label: c.label,
        flag: c.flag,
      })),
    [countries]
  );

  const [roleId, setRoleId] = useState(null);
  const [concurrentApplicants, setConcurrentApplicants] = useState(null);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const [roleError, setRoleError] = useState("");
  const [apiError, setApiError] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);
  const formRef = useRef(form);
  formRef.current = form;

  // Track page view when component mounts
  useEffect(() => {
    metrics.trackPageView();

    // Track custom event for registration page visit
    metrics.trackCustomEvent("registration_page_visit", {
      page: "register",
      timestamp: new Date().toISOString(),
    });
  }, [metrics]);

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
              "[RegisterUser] Metrics error tracking location_detected:",
              err
            );
          }
        } else {
          // Don't show user any message when country is not supported; keep silent
          console.warn(
            "[RegisterUser] Detected country not supported by list:",
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
              "[RegisterUser] Metrics error tracking location_detected (no match):",
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
              "[RegisterUser] Reverse geocode failed, falling back to IP geo",
              err
            );
          }
        }
      } catch (geoErr) {
        console.warn("[RegisterUser] Geolocation error or denied", geoErr);
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
        console.warn("[RegisterUser] IP geolocation failed", ipErr);
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
  // Fetch roles and set role_id to the id of 'visa_agent'
  useEffect(() => {
    let isMounted = true;
    const fetchRoles = async () => {
      try {
        const roles = await getRoles();
        const basicRole = roles.find((role) => role.name === "visa_agent");
        if (basicRole) {
          if (isMounted) {
            setRoleId(basicRole.id);
            setConcurrentApplicants(1);
            setRolesLoaded(true);
          }
        } else {
          if (isMounted) {
            setRoleError(
              "Could not find the 'visa_agent' role. Please contact support."
            );
            setRolesLoaded(false);
          }
        }
      } catch (err) {
        if (isMounted) {
          setRoleError("Failed to load roles. Please try again later.");
          setRolesLoaded(false);
        }
      }
    };
    fetchRoles();
    return () => {
      isMounted = false;
    };
  }, []);

  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const btnSize = isMobile ? "large" : "middle";

  const handleSubmit = (values) => {
    setApiError("");

    metrics.trackFormSubmit("registration-form", false);
    metrics.trackCustomEvent("registration_attempt", {
      country: values.country_code,
      hasPhone: !!values.phone_number,
      language: i18n.language || "en",
      timestamp: new Date().toISOString(),
    });

    if (!rolesLoaded || !roleId) {
      setRoleError("Roles are still loading. Please wait.");
      metrics.trackCustomEvent("registration_error", {
        error: "roles_not_loaded",
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const submitData = {
      name: values.name,
      username: values.username,
      password: values.password,
      phone_number: values.phone_number || "",
      active: true,
      expiration_date: getExpirationDate(),
      country_code: values.country_code,
      role_id: roleId,
      concurrent_applicants: concurrentApplicants,
      email: values.username,
      sendEmail: true,
      includePassword: false,
      language: i18n.language || "en",
    };

    createUser(submitData)
      .then((result) => {
        if (result.success) {
          if (values.name) {
            sessionStorage.setItem("fastVisa_name", values.name);
          }
          navigate(
            `/verify-email?mode=registration_success&email=${encodeURIComponent(
              values.username
            )}`
          );
          metrics.trackFormSubmit("registration-form", true);
          metrics.trackCustomEvent("user_registered", {
            userName: values.name,
            userEmail: values.username,
            country: values.country_code,
            hasPhone: !!values.phone_number,
            language: i18n.language || "en",
            timestamp: new Date().toISOString(),
          });
        } else {
          setApiError(result.error || "Registration failed");
          metrics.trackCustomEvent("registration_error", {
            error: "api_error",
            errorMessage: result.error || "Registration failed",
            timestamp: new Date().toISOString(),
          });
        }
      })
      .catch((error) => {
        setApiError(error.message || "An unexpected error occurred");
        metrics.trackCustomEvent("registration_error", {
          error: "api_exception",
          errorMessage: error.message || "An unexpected error occurred",
          timestamp: new Date().toISOString(),
        });
      });
  };

  const handleCancel = () => {
    metrics.trackButtonClick("cancel-registration-btn", "Cancel Registration");
    navigate("/login");
  };

  return (
    <div className="page-container">
      <PreLoginHeader />
      <div className="content-wrap">
        <LanguageSelector />
        <div className="registration-container">
          <Typography.Title level={2} style={{ marginBottom: 16 }}>
            {t("register", "Register")}
          </Typography.Title>
          {roleError && (
            <Alert
              type="error"
              showIcon
              message={roleError}
              style={{ marginBottom: 16 }}
            />
          )}
          {apiError && (
            <Alert
              type="error"
              showIcon
              message={apiError}
              closable
              onClose={() => setApiError("")}
              style={{ marginBottom: 16 }}
            />
          )}
          <Form
            form={form}
            name="register"
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="on"
            className="registration-form"
            validateTrigger={["onChange", "onBlur"]}
            style={{ maxWidth: 400 }}
          >
            <Form.Item
              name="name"
              label={t("name", "Name")}
              rules={[
                {
                  required: true,
                  message: t("nameRequired", "Name is required"),
                },
              ]}
            >
              <Input size={btnSize} placeholder={t("name", "Name")} />
            </Form.Item>
            <Form.Item
              name="username"
              label={t("username", "E-mail")}
              rules={[
                {
                  required: true,
                  message: t("usernameRequired", "Email is required"),
                },
                {
                  type: "email",
                  message: t(
                    "invalidEmail",
                    "Please enter a valid email address"
                  ),
                },
              ]}
            >
              <Input
                size={btnSize}
                type="email"
                placeholder={t("username", "E-mail")}
              />
            </Form.Item>
            <Form.Item
              name="password"
              label={t("password", "Password")}
              rules={[
                {
                  required: true,
                  message: t("passwordRequired", "Password is required"),
                },
                {
                  min: 6,
                  message: t(
                    "passwordTooShort",
                    "Password must be at least 6 characters long"
                  ),
                },
              ]}
            >
              <Input.Password
                size={btnSize}
                placeholder={t("password", "Password")}
              />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label={t("confirmPassword", "Confirm Password")}
              dependencies={["password"]}
              rules={[
                {
                  required: true,
                  message: t(
                    "confirmPasswordRequired",
                    "Please confirm your password"
                  ),
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(
                        t("passwordsNotMatch", "Passwords do not match")
                      )
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                size={btnSize}
                placeholder={t("confirmPassword", "Confirm Password")}
              />
            </Form.Item>
            <Form.Item
              name="country_code"
              label={t("country", "Country")}
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
              <p
                style={{
                  color: "#6b7280",
                  marginTop: -8,
                  marginBottom: 16,
                  fontSize: "0.9rem",
                }}
              >
                <i
                  className="fas fa-spinner fa-spin"
                  style={{ marginRight: 8 }}
                />
                {t("detectingLocation", "Detecting your location...")}
              </p>
            )}
            <Form.Item
              name="phone_number"
              label={t("phoneNumber", "Phone Number")}
            >
              <Input
                size={btnSize}
                placeholder={t("phoneNumber", "Phone Number")}
              />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0, marginTop: 16 }}>
              <div
                className="button-row"
                style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
              >
                <Button size={btnSize} onClick={handleCancel}>
                  {t("cancel", "Cancel")}
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  size={btnSize}
                  disabled={!rolesLoaded || !roleId}
                >
                  {t("submit", "Submit")}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </div>
      </div>
      <PreLoginFooter />
    </div>
  );
};

export default UserRegistrationForm;
