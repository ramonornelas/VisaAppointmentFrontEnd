import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import PreLoginHeader from "../common/PreLoginHeader";
import PreLoginFooter from "../common/PreLoginFooter";
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
import {
  Form,
  Input,
  Button,
  Alert,
  Spin,
  Grid,
  Card,
  Typography,
  Space,
  Steps,
} from "antd";

const { useBreakpoint } = Grid;
const { Title, Text } = Typography;

const LogIn = () => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const btnSize = isMobile ? "large" : "middle";
  const permissionsErrorMsg = t(
    "permissionsErrorMsg",
    "Please contact the administrator to grant you access to the system."
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

  const handleSubmit = async (values) => {
    const username = values.username;
    const password = values.password;
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
            JSON.stringify(permissionsData)
          );

          if (userData && rolesData) {
            const currentRole = rolesData.find(
              (role) => role.id === userData.role_id
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
          username
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
      <PreLoginHeader />
      <div className="content-wrap">
        <LanguageSelector />

        {/* Info Sidebar - Right side */}
        <div className="info-sidebar">
          <div
            className="info-sidebar-item"
            data-tooltip={t(
              "securityBenefitText",
              "Your data is encrypted and protected."
            )}
          >
            <div className="info-sidebar-icon">🔒</div>
            <div className="info-sidebar-tooltip">
              <strong>{t("securityBenefit", "Security")}</strong>
              <p>
                {t(
                  "securityBenefitText",
                  "Your data is encrypted and protected."
                )}
              </p>
            </div>
          </div>

          <div
            className="info-sidebar-item"
            data-tooltip={t(
              "globalCoverageText",
              "Compatible with embassies and consulates worldwide."
            )}
          >
            <div className="info-sidebar-icon">🌍</div>
            <div className="info-sidebar-tooltip">
              <strong>{t("globalCoverage", "Global Coverage")}</strong>
              <p>
                {t(
                  "globalCoverageText",
                  "Compatible with embassies and consulates worldwide."
                )}
              </p>
            </div>
          </div>

          <div
            className="info-sidebar-item info-sidebar-warning"
            data-tooltip={t(
              "moneyBackGuarantee",
              "We cannot guarantee finding a date as it depends on embassy availability, but if you don't get results within one month, we'll refund your money."
            )}
          >
            <div className="info-sidebar-icon">⚠️</div>
            <div className="info-sidebar-tooltip">
              <strong>{t("importantNote", "Important")}</strong>
              <p>
                {t(
                  "moneyBackGuarantee",
                  "We cannot guarantee finding a date as it depends on embassy availability, but if you don't get results within one month, we'll refund your money."
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="login-page-layout">
          <Card className="login-container" bordered={false}>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <div style={{ textAlign: "center" }}>
                <EnvironmentBadge />
              </div>
              <Space
                direction="vertical"
                size="small"
                style={{ width: "100%", textAlign: "center" }}
              >
                <div style={{ width: "100%", maxWidth: 340, margin: "0 auto" }}>
                  <Button
                    type="primary"
                    size={btnSize}
                    block
                    onClick={() => (window.location.href = "/quickstart")}
                    style={{
                      height: 48,
                      fontSize: 16,
                      fontWeight: 600,
                      backgroundColor: "#10b981",
                      borderColor: "#10b981",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = "#059669";
                      e.currentTarget.style.borderColor = "#059669";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = "#10b981";
                      e.currentTarget.style.borderColor = "#10b981";
                    }}
                  >
                    ⚡ {t("tryAppNow", "Try the app now")}
                  </Button>
                </div>
                <Text
                  type="secondary"
                  style={{ display: "block", fontSize: 14 }}
                >
                  {t("noRegistrationRequired", "No registration required")}
                </Text>
                <Text
                  type="secondary"
                  style={{ display: "block", fontSize: 14 }}
                >
                  {t("orLoginBelow", "Or login to access all features")}
                </Text>
              </Space>
              <Spin spinning={loading} tip={t("loggingIn", "Logging in...")}>
                <Form
                  name="login"
                  layout="vertical"
                  onFinish={handleSubmit}
                  autoComplete="on"
                  validateTrigger={["onChange", "onBlur"]}
                  style={{ maxWidth: 400, margin: "0 auto" }}
                >
                  <Form.Item
                    name="username"
                    label={t("username", "E-mail")}
                    rules={[
                      {
                        required: true,
                        message: t("usernameRequired", "Email is required"),
                      },
                    ]}
                  >
                    <Input
                      size={btnSize}
                      disabled={loading}
                      autoComplete="username"
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
                    ]}
                  >
                    <Input.Password
                      size={btnSize}
                      disabled={loading}
                      autoComplete="current-password"
                      placeholder={t("password", "Password")}
                    />
                  </Form.Item>
                  {/*  <div
                    style={{
                      marginTop: -8,
                      marginBottom: 16,
                      textAlign: "right",
                    }}
                  >
                    <a href="/forgot-password">
                      {t("forgotPassword", "Forgot password?")}
                    </a>
                  </div> */}
                  {error && (
                    <Alert
                      type="error"
                      showIcon
                      message={error}
                      closable
                      onClose={() => setError(null)}
                      style={{ marginBottom: 16 }}
                    />
                  )}
                  <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      disabled={loading}
                      size={btnSize}
                      block
                    >
                      {loading
                        ? t("loggingIn", "Logging in...")
                        : t("login", "Log In")}
                    </Button>
                  </Form.Item>
                </Form>
              </Spin>
              <div className="register-link" style={{ textAlign: "center" }}>
                <Text type="secondary">
                  {t("noAccount", "Don't have an account?")}{" "}
                  <a href="/registeruser">{t("register", "Register here")}</a>
                </Text>
              </div>
            </Space>
          </Card>

          <Card
            className="benefits-panel"
            bordered={false}
            style={{
              border: "4px solid transparent",
              borderImage:
                "linear-gradient(135deg, #0387cf 0%, #ff0204 50%, #0387cf 100%) 1",
            }}
          >
            <Title
              level={3}
              style={{
                marginBottom: 24,
                paddingBottom: 16,
                borderBottom: "2px solid #e2e8f0",
                color: "#5070a0",
                fontSize: "1.65rem",
                fontWeight: 700,
              }}
            >
              {t("howItWorks", "How does it work?")}
            </Title>
            <Steps
              orientation="vertical"
              size="small"
              current={-1}
              type="default"
              classNames={{
                itemTitle: "benefits-step-item-title",
                itemDescription: "benefits-step-item-description",
                itemContent: "benefits-step-item-content",
              }}
              items={[
                {
                  title: t("step1Title", "Continuous Monitoring"),
                  description: t(
                    "step1Desc",
                    "Our system monitors 24/7 the availability of American visa appointments at the consulates and date ranges you select."
                  ),
                },
                {
                  title: t("step2Title", "Regular Updates"),
                  description: t(
                    "step2Desc",
                    "We send you continuous notifications so you know how your search is progressing."
                  ),
                },
                {
                  title: t("step3Title", "Automatic Reservation"),
                  description: t(
                    "step3Desc",
                    "When we find a date that matches your criteria, we automatically make the reservation so no one else can take it."
                  ),
                },
              ]}
            />
          </Card>
        </div>
      </div>
      <PreLoginFooter />
    </div>
  );
};

export default LogIn;
