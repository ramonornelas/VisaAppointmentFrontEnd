import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Banner from "../common/Banner";
import Footer from "../common/Footer";
import "./LogIn.css";
import LanguageSelector from "../common/LanguageSelector";
import EnvironmentBadge from "../common/EnvironmentBadge";
import { permissions } from "../../utils/permissions";
import FastVisaMetrics from "../../utils/FastVisaMetrics";
import {
  loginUser,
  searchUserByUsername,
  getUserPermissions,
  UserDetails,
  getRoles,
  ApplicantSearch,
} from "../../services/APIFunctions";
import { Spin } from "antd";

const LogIn = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const permissionsErrorMsg = t(
    "permissionsErrorMsg",
    "Please contact the administrator to grant you access to the system.",
  );

  // Initialize metrics tracker
  const metrics = useMemo(() => new FastVisaMetrics(), []);

  // Track page view when component mounts
  useEffect(() => {
    metrics.trackPageView();
    metrics.trackCustomEvent("login_page_visit", {
      page: "login",
      timestamp: new Date().toISOString(),
    });
  }, [metrics]);

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    await metrics.trackCustomEvent("login_attempt", {
      username: username,
      timestamp: new Date().toISOString(),
    });
    try {
      const [loginResponse, searchuserdata] = await Promise.all([
        loginUser(username, password),
        searchUserByUsername(username),
      ]);

      if (
        loginResponse.success &&
        searchuserdata &&
        searchuserdata.length > 0
      ) {
        const searchuserid = searchuserdata[0].id;
        const searchusername = searchuserdata[0].username;
        const countryCode = searchuserdata[0].country_code;
        const concurrentApplicants = searchuserdata[0].concurrent_applicants;
        const searchname = searchuserdata[0].name;
        sessionStorage.setItem("fastVisa_userid", searchuserid);
        sessionStorage.setItem("fastVisa_username", searchusername);
        sessionStorage.setItem("country_code", countryCode);
        sessionStorage.setItem("concurrent_applicants", concurrentApplicants);
        if (searchname) {
          sessionStorage.setItem("fastVisa_name", searchname);
        }
        metrics.setUserId(searchuserid);

        try {
          const [permissionsData, userData, rolesData] = await Promise.all([
            getUserPermissions(searchuserid),
            UserDetails(searchuserid),
            getRoles(),
          ]);

          if (!permissionsData) {
            setError(permissionsErrorMsg);
            await metrics.trackCustomEvent("login_failure", {
              username: username,
              reason: "no_permissions",
              timestamp: new Date().toISOString(),
            });
            setLoading(false);
            return;
          }

          sessionStorage.setItem(
            "fastVisa_permissions",
            JSON.stringify(permissionsData),
          );

          if (userData && rolesData) {
            const currentRole = rolesData.find(
              (role) => role.id === userData.role_id,
            );
            const roleName = currentRole ? currentRole.name : "unknown";
            await metrics.trackCustomEvent("login_success", {
              userId: searchuserid,
              username: username,
              role: roleName,
              countryCode: countryCode,
              timestamp: new Date().toISOString(),
            });
            if (!permissions.canManageApplicants()) {
              const applicants = await ApplicantSearch(searchuserid);
              if (applicants && applicants.length > 0) {
                const firstApplicantId = applicants[0].id;
                sessionStorage.setItem("applicant_userid", firstApplicantId);
                window.location.href = `/view-applicant/${firstApplicantId}`;
              } else {
                sessionStorage.removeItem("applicant_userid");
                window.location.href = "/applicant-form";
              }
            } else {
              sessionStorage.removeItem("applicant_userid");
              window.location.href = "/applicants";
            }
          } else {
            await metrics.trackCustomEvent("login_success", {
              userId: searchuserid,
              username: username,
              role: "unknown",
              timestamp: new Date().toISOString(),
            });
            window.location.href = "/applicants";
          }
        } catch (roleError) {
          console.error("Error determining user role:", roleError);
          await metrics.trackCustomEvent("login_failure", {
            username: username,
            reason: "role_error",
            error: roleError.message,
            timestamp: new Date().toISOString(),
          });
          window.location.href = "/applicants";
        }
      } else if (loginResponse.status === 403) {
        setLoading(false);
        window.location.href = `/verify-email?mode=reminder&email=${encodeURIComponent(
          username,
        )}`;
      } else {
        setLoading(false);
        throw new Error(loginResponse.error || "Failed to log in");
      }
    } catch (error) {
      setLoading(false);
      console.error("Error:", error);
      setError(error.message);

      // Track login failure
      await metrics.trackCustomEvent("login_failure", {
        username: username,
        reason: "authentication_error",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="login-root">
      <LanguageSelector />
      <div className="content-wrap">
        <Banner />

        {/* Info Sidebar - Right side */}
        <div className="info-sidebar">
          <div
            className="info-sidebar-item"
            data-tooltip={t(
              "securityBenefitText",
              "Your data is encrypted and protected.",
            )}
          >
            <div className="info-sidebar-icon">🔒</div>
            <div className="info-sidebar-tooltip">
              <strong>{t("securityBenefit", "Security")}</strong>
              <p>
                {t(
                  "securityBenefitText",
                  "Your data is encrypted and protected.",
                )}
              </p>
            </div>
          </div>

          <div
            className="info-sidebar-item"
            data-tooltip={t(
              "globalCoverageText",
              "Compatible with embassies and consulates worldwide.",
            )}
          >
            <div className="info-sidebar-icon">🌍</div>
            <div className="info-sidebar-tooltip">
              <strong>{t("globalCoverage", "Global Coverage")}</strong>
              <p>
                {t(
                  "globalCoverageText",
                  "Compatible with embassies and consulates worldwide.",
                )}
              </p>
            </div>
          </div>

          <div
            className="info-sidebar-item info-sidebar-warning"
            data-tooltip={t(
              "moneyBackGuarantee",
              "We cannot guarantee finding a date as it depends on embassy availability, but if you don't get results within one month, we'll refund your money.",
            )}
          >
            <div className="info-sidebar-icon">⚠️</div>
            <div className="info-sidebar-tooltip">
              <strong>{t("importantNote", "Important")}</strong>
              <p>
                {t(
                  "moneyBackGuarantee",
                  "We cannot guarantee finding a date as it depends on embassy availability, but if you don't get results within one month, we'll refund your money.",
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="login-page-layout">
          <div className="login-container">
            <div style={{ height: "24px" }}></div>
            <EnvironmentBadge style={{ margin: "0 auto 30px auto" }} />
            <div style={{ textAlign: "center", margin: "0 0 30px 0" }}>
              <button
                type="button"
                className="quick-start-button"
                onClick={() => (window.location.href = "/quickstart")}
                style={{
                  width: "100%",
                  maxWidth: "340px",
                  padding: "14px 24px",
                  backgroundColor: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "17px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 6px rgba(16, 185, 129, 0.3)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = "#059669";
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow =
                    "0 6px 12px rgba(16, 185, 129, 0.4)";
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = "#10b981";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow =
                    "0 4px 6px rgba(16, 185, 129, 0.3)";
                }}
              >
                ⚡ {t("tryAppNow", "Try the app now")}
              </button>
              <p
                style={{
                  color: "#666",
                  fontSize: "14px",
                  marginTop: "8px",
                  marginBottom: "0",
                }}
              >
                {t("noRegistrationRequired", "No registration required")}
              </p>
              <p style={{ color: "#999", fontSize: "14px", marginBottom: "0" }}>
                {t("orLoginBelow", "Or login to access all features")}
              </p>
            </div>
            <Spin spinning={loading} tip={t("loggingIn", "Logging in...")}>
              <form
                className="login-form"
                onSubmit={handleSubmit}
                autoComplete="on"
              >
                <div className="input-group">
                  <label htmlFor="username" className="login-label">
                    {t("username", "E-mail")}
                  </label>
                  <input
                    type="text"
                    id="username"
                    className="login-input"
                    value={username}
                    onChange={handleUsernameChange}
                    autoComplete="username"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="password" className="login-label">
                    {t("password", "Password")}
                  </label>
                  <input
                    type="password"
                    id="password"
                    className="login-input"
                    value={password}
                    onChange={handlePasswordChange}
                    autoComplete="current-password"
                    required
                    disabled={loading}
                  />
                </div>
                {error && <p className="login-error">{error}</p>}
                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                  style={loading ? { opacity: 0.7, pointerEvents: "none" } : {}}
                >
                  {loading
                    ? t("loggingIn", "Logging in...")
                    : t("login", "Log In")}
                </button>
              </form>
            </Spin>
            <p className="register-link">
              {t("noAccount", "Don't have an account?")}{" "}
              <a href="/registeruser">{t("register", "Register here")}</a>
            </p>
          </div>
          <div className="benefits-panel">
            <h2 className="benefits-title">
              {t("howItWorks", "How does it work?")}
            </h2>
            <div className="benefits-list">
              <div className="benefit-item">
                <div className="benefit-number">1</div>
                <div className="benefit-content">
                  <h3>{t("step1Title", "Continuous Monitoring")}</h3>
                  <p>
                    {t(
                      "step1Desc",
                      "Our system monitors 24/7 the availability of American visa appointments at the consulates and date ranges you select.",
                    )}
                  </p>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-number">2</div>
                <div className="benefit-content">
                  <h3>{t("step2Title", "Regular Updates")}</h3>
                  <p>
                    {t(
                      "step2Desc",
                      "We send you continuous notifications so you know how your search is progressing.",
                    )}
                  </p>
                </div>
              </div>

              <div className="benefit-item">
                <div className="benefit-number">3</div>
                <div className="benefit-content">
                  <h3>{t("step3Title", "Automatic Reservation")}</h3>
                  <p>
                    {t(
                      "step3Desc",
                      "When we find a date that matches your criteria, we automatically make the reservation so no one else can take it.",
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LogIn;
