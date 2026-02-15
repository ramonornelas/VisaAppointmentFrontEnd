import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Result,
  Button,
  Spin,
  message as antMessage,
  Card,
  Layout,
  Typography,
  theme,
} from "antd";
import { LoadingOutlined, MailOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import {
  verifyEmail,
  resendVerificationEmail,
} from "../../services/APIFunctions";
import EnvironmentBadge from "../common/EnvironmentBadge";
import LanguageSelector from "../common/LanguageSelector";
import "./VerifyEmail.css";

const { Content } = Layout;
const { Title, Text } = Typography;
const { useToken } = theme;

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [status, setStatus] = useState("loading"); // loading, success, error, expired, already_verified
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState(null);
  const [resending, setResending] = useState(false);
  const { token } = useToken();

  // Helper to decode JWT and extract email
  const getEmailFromToken = (token) => {
    try {
      if (!token) return null;
      const base64Url = token.split(".")[1];
      if (!base64Url) return null;

      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
      console.log(JSON.parse(jsonPayload).email);
      return JSON.parse(jsonPayload).email;
    } catch (e) {
      console.error("Error decoding token:", e);
      return null;
    }
  };

  useEffect(() => {
    const token = searchParams.get("token");
    const mode = searchParams.get("mode");
    const email = searchParams.get("email");

    if (mode === "reminder" && email) {
      setUserEmail(email);
      setStatus("verification_required");
      return;
    }

    if (mode === "registration_success" && email) {
      setUserEmail(email);
      setStatus("registration_success");
      return;
    }

    if (!token) {
      setStatus("expired");
      return;
    }

    // Extract email from token immediately
    const tokenEmail = getEmailFromToken(token);
    if (tokenEmail) {
      setUserEmail(tokenEmail);
    }

    const verify = async () => {
      try {
        const response = await verifyEmail(token);

        if (response.success) {
          // Check if the message indicates already verified (backend returns 200 for this case)
          if (
            response.data &&
            response.data.message &&
            response.data.message.toLowerCase().includes("already verified")
          ) {
            setStatus("already_verified");
          } else {
            setStatus("success");
          }
        } else {
          // Handle specific error codes from backend
          const errorCode = response.errorCode;

          if (errorCode === "TOKEN_EXPIRED" || errorCode === "INVALID_TOKEN") {
            setStatus("expired");
          } else if (
            // Fallback to message matching if errorCode is missing
            response.error &&
            (response.error.toLowerCase().includes("expired") ||
              response.error.toLowerCase().includes("invalid"))
          ) {
            setStatus("expired");
          } else {
            setStatus("error");
            setMessage(response.error);
          }
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
      }
    };

    verify();
  }, [searchParams]);

  const handleLogin = () => {
    navigate("/login");
  };

  const handleResendEmail = async () => {
    if (!userEmail) return;

    setResending(true);
    try {
      const response = await resendVerificationEmail(userEmail);
      if (response.success) {
        antMessage.success(t("resendSuccess"));
      } else {
        antMessage.error(t("resendError"));
      }
    } catch (error) {
      antMessage.error(t("resendError"));
    } finally {
      setResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <Spin
              indicator={
                <LoadingOutlined
                  style={{ fontSize: 48, color: token.colorPrimary }}
                  spin
                />
              }
            />
            <Title
              level={3}
              style={{ marginTop: 24, color: token.colorPrimary }}
            >
              {t("verifyingEmail")}
            </Title>
          </div>
        );

      case "success":
        return (
          <Result
            status="success"
            title={t("emailVerified")}
            subTitle={t("emailVerifiedDesc")}
            extra={[
              <Button
                type="primary"
                key="login"
                size="large"
                onClick={handleLogin}
                style={{
                  minWidth: 200,
                  height: 48,
                  borderRadius: token.borderRadius,
                }}
              >
                {t("proceedToLogin")}
              </Button>,
            ]}
          />
        );

      case "already_verified":
        return (
          <Result
            status="info"
            title={t("emailAlreadyVerified")}
            subTitle={t("emailAlreadyVerifiedDesc")}
            extra={[
              <Button
                type="primary"
                key="login"
                size="large"
                onClick={handleLogin}
                style={{
                  minWidth: 200,
                  height: 48,
                  borderRadius: token.borderRadius,
                }}
              >
                {t("proceedToLogin")}
              </Button>,
            ]}
          />
        );

      case "registration_success":
        return (
          <Result
            status="success"
            title={t("registrationSuccessTitle")}
            subTitle={
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Text>{t("registrationSuccessDesc")}</Text>
                <Text strong style={{ fontSize: 16 }}>
                  {userEmail}
                </Text>
                <Text type="secondary">{t("checkInbox")}</Text>
              </div>
            }
            extra={[
              <div
                key="actions"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <Button
                  type="primary"
                  key="resend"
                  size="large"
                  onClick={handleResendEmail}
                  loading={resending}
                  icon={<MailOutlined />}
                  style={{
                    minWidth: 200,
                    height: 48,
                    borderRadius: token.borderRadius,
                  }}
                >
                  {t("resendVerification")}
                </Button>
                <Button
                  key="login"
                  size="large"
                  onClick={handleLogin}
                  style={{
                    minWidth: 200,
                    height: 48,
                    borderRadius: token.borderRadius,
                  }}
                >
                  {t("proceedToLogin")}
                </Button>
              </div>,
            ]}
          />
        );

      case "verification_required":
        return (
          <Result
            status="warning"
            title={t("verificationRequiredTitle")}
            subTitle={
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Text>{t("verificationRequiredDesc")}</Text>
                <Text strong style={{ fontSize: 16 }}>
                  {userEmail}
                </Text>
              </div>
            }
            extra={[
              <div
                key="actions"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <Button
                  type="primary"
                  key="resend"
                  size="large"
                  onClick={handleResendEmail}
                  loading={resending}
                  icon={<MailOutlined />}
                  style={{
                    minWidth: 200,
                    height: 48,
                    borderRadius: token.borderRadius,
                  }}
                >
                  {t("resendVerification")}
                </Button>
                <Button
                  key="login"
                  size="large"
                  onClick={handleLogin}
                  style={{
                    minWidth: 200,
                    height: 48,
                    borderRadius: token.borderRadius,
                  }}
                >
                  {t("backToLogin")}
                </Button>
              </div>,
            ]}
          />
        );

      case "expired":
        return (
          <Result
            status="warning"
            title={t("verificationExpired")}
            subTitle={t("verificationExpiredDesc")}
            extra={[
              <div
                key="actions"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                {userEmail && (
                  <Button
                    type="primary"
                    key="resend"
                    size="large"
                    onClick={handleResendEmail}
                    loading={resending}
                    icon={<MailOutlined />}
                    style={{
                      minWidth: 200,
                      height: 48,
                      borderRadius: token.borderRadius,
                    }}
                  >
                    {t("resendVerification")}
                  </Button>
                )}
                <Button
                  key="login"
                  size="large"
                  onClick={handleLogin}
                  style={{
                    minWidth: 200,
                    height: 48,
                    borderRadius: token.borderRadius,
                  }}
                >
                  {t("proceedToLogin")}
                </Button>
              </div>,
            ]}
          />
        );

      case "error":
      default:
        return (
          <Result
            status="error"
            title={t("verificationFailed")}
            subTitle={message || t("verificationError")}
            extra={[
              <Button
                type="primary"
                key="login"
                size="large"
                onClick={handleLogin}
                style={{
                  minWidth: 200,
                  height: 48,
                  borderRadius: token.borderRadius,
                }}
              >
                {t("proceedToLogin")}
              </Button>,
            ]}
          />
        );
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#f0f2f5" }}>
      <div className="verify-header-controls">
        <LanguageSelector />
      </div>
      <Content
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Card
          style={{
            width: "100%",
            maxWidth: 600,
            borderRadius: token.borderRadiusLG,
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
          bodyStyle={{ padding: 40 }}
        >
          <div style={{ marginBottom: 20, textAlign: "center" }}>
            <EnvironmentBadge />
          </div>
          {renderContent()}
        </Card>
      </Content>
    </Layout>
  );
};

export default VerifyEmail;
