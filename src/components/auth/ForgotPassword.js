import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Form,
  Input,
  Button,
  Alert,
  Card,
  Typography,
  Space,
  Result,
} from "antd";
import { MailOutlined, CheckCircleOutlined } from "@ant-design/icons";
import PreLoginHeader from "../common/PreLoginHeader";
import PreLoginFooter from "../common/PreLoginFooter";
import LanguageSelector from "../common/LanguageSelector";
import EnvironmentBadge from "../common/EnvironmentBadge";
import { forgotPassword } from "../../services/APIFunctions";
import "./ForgotPassword.css";

const { Title, Text } = Typography;

const ForgotPassword = () => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (values) => {
    setError(null);
    setLoading(true);
    try {
      const result = await forgotPassword(values.email.trim(), i18n.language);
      if (result.success) {
        setSubmitted(true);
      } else {
        // Only show an error if the backend explicitly returns a client error
        // (e.g., invalid email format). Never reveal user enumeration info.
        setError(
          result.message ||
            t("networkError", "Network error. Please try again.")
        );
      }
    } catch {
      setError(t("networkError", "Network error. Please check your connection and try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <PreLoginHeader />
      <div className="content-wrap">
        <div className="forgot-password-header-controls">
          <LanguageSelector />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
            padding: "24px 16px",
          }}
        >
          <Card
            style={{ width: "100%", maxWidth: 440 }}
            bordered={false}
            className="login-container"
          >
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <div style={{ textAlign: "center" }}>
                <EnvironmentBadge />
              </div>

              {submitted ? (
                /* ---- Success state ---- */
                <Result
                  icon={
                    <CheckCircleOutlined
                      style={{ fontSize: 56, color: "#52c41a" }}
                    />
                  }
                  title={
                    <Title level={4} style={{ marginBottom: 0 }}>
                      {t("forgotPasswordSuccessTitle", "Check Your Email")}
                    </Title>
                  }
                  subTitle={
                    <Space direction="vertical" size="small">
                      <Text>
                        {t(
                          "forgotPasswordSuccessMessage",
                          "If an account exists with this email, you will receive password reset instructions."
                        )}
                      </Text>
                      <Text type="secondary">
                        {t(
                          "forgotPasswordSuccessSpam",
                          "Please also check your spam folder."
                        )}
                      </Text>
                    </Space>
                  }
                  extra={[
                    <Button
                      key="login"
                      type="primary"
                      href="/login"
                      block
                    >
                      {t("forgotPasswordBackToLogin", "Back to Login")}
                    </Button>,
                    <Button
                      key="retry"
                      style={{ marginTop: 8 }}
                      block
                      onClick={() => setSubmitted(false)}
                    >
                      {t("forgotPasswordNewRequest", "Request Another Link")}
                    </Button>,
                  ]}
                />
              ) : (
                /* ---- Form state ---- */
                <>
                  <div style={{ textAlign: "center" }}>
                    <MailOutlined
                      style={{ fontSize: 40, color: "#1890ff", marginBottom: 8 }}
                    />
                    <Title level={4} style={{ marginBottom: 4 }}>
                      {t("forgotPasswordTitle", "Reset Your Password")}
                    </Title>
                    <Text type="secondary">
                      {t(
                        "forgotPasswordSubtitle",
                        "Enter your email address and we'll send you a link to reset your password."
                      )}
                    </Text>
                  </div>

                  {error && (
                    <Alert
                      type="error"
                      showIcon
                      message={error}
                      closable
                      onClose={() => setError(null)}
                    />
                  )}

                  <Form
                    name="forgot-password"
                    layout="vertical"
                    onFinish={handleSubmit}
                    autoComplete="off"
                  >
                    <Form.Item
                      name="email"
                      label={t("forgotPasswordEmailLabel", "Email Address")}
                      rules={[
                        {
                          required: true,
                          message: t(
                            "usernameRequired",
                            "Email is required"
                          ),
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
                        size="large"
                        disabled={loading}
                        placeholder={t(
                          "forgotPasswordEmailPlaceholder",
                          "Enter your email address"
                        )}
                        prefix={<MailOutlined style={{ color: "#bfbfbf" }} />}
                        autoFocus
                      />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 8 }}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        disabled={loading}
                        size="large"
                        block
                      >
                        {loading
                          ? t("forgotPasswordSending", "Sending...")
                          : t("forgotPasswordSubmit", "Send Reset Link")}
                      </Button>
                    </Form.Item>
                  </Form>

                  <div style={{ textAlign: "center" }}>
                    <a href="/login">
                      {t("forgotPasswordBackToLogin", "Back to Login")}
                    </a>
                  </div>
                </>
              )}
            </Space>
          </Card>
        </div>
      </div>
      <PreLoginFooter />
    </div>
  );
};

export default ForgotPassword;
