import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
  Spin,
} from "antd";
import {
  LockOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  LoginOutlined,
} from "@ant-design/icons";
import PreLoginHeader from "../common/PreLoginHeader";
import PreLoginFooter from "../common/PreLoginFooter";
import LanguageSelector from "../common/LanguageSelector";
import EnvironmentBadge from "../common/EnvironmentBadge";
import { validateResetToken, resetPassword } from "../../services/APIFunctions";
import PasswordStrengthIndicator, { REQUIREMENTS, getStrength } from "../common/PasswordStrengthIndicator";
import "./ResetPassword.css";

const { Title, Text } = Typography;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ResetPassword = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Token validation state
  const [tokenStatus, setTokenStatus] = useState("loading"); // loading | valid | invalid | used | networkError
  const [tokenError, setTokenError] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Form state
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const token = searchParams.get("token") || "";

  // ---- Token validation on mount ----
  const validateToken = useCallback(async () => {
    if (!token) {
      setTokenStatus("invalid");
      setTokenError(
        t("resetTokenInvalid", "This password reset link has expired or is invalid.")
      );
      return;
    }
    setTokenStatus("loading");
    try {
      const result = await validateResetToken(token);
      if (result.success) {
        setUserEmail(result.data?.email || "");
        setTokenStatus("valid");
      } else if (result.error_code === "TOKEN_USED") {
        setTokenStatus("used");
        setTokenError(t("resetTokenUsed", "This password reset link has already been used."));
      } else {
        setTokenStatus("invalid");
        setTokenError(
          t("resetTokenInvalid", "This password reset link has expired or is invalid.")
        );
      }
    } catch {
      setTokenStatus("networkError");
      setTokenError(
        t("networkError", "Network error. Please check your connection and try again.")
      );
    }
  }, [token, t]);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  // ---- Countdown redirect after success ----
  useEffect(() => {
    if (!submitSuccess) return;
    if (countdown <= 0) {
      navigate("/login");
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [submitSuccess, countdown, navigate]);

  // ---- Password strength ----
  const metCount = getStrength(password);
  const isPasswordValid = metCount === REQUIREMENTS.length;
  const isConfirmValid = confirmPassword !== "" && password === confirmPassword;
  const canSubmit = isPasswordValid && isConfirmValid;

  // ---- Form submission ----
  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      const result = await resetPassword(token, password, i18n.language);
      if (result.success) {
        setSubmitSuccess(true);
      } else if (
        result.error_code === "TOKEN_INVALID" ||
        result.error_code === "TOKEN_USED"
      ) {
        setSubmitError(
          t("passwordReqExpiredDuringReset", "Your reset link has expired. Please request a new one.")
        );
        setTokenStatus("invalid");
      } else {
        setSubmitError(
          result.message ||
            t("networkError", "Network error. Please try again.")
        );
      }
    } catch {
      setSubmitError(
        t("networkError", "Network error. Please check your connection and try again.")
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  // ---- Render helpers ----

  const renderLoading = () => (
    <div style={{ textAlign: "center", padding: "32px 0" }}>
      <Spin
        indicator={<LoadingOutlined style={{ fontSize: 36 }} spin />}
        style={{ marginBottom: 16 }}
      />
      <br />
      <Text type="secondary">
        {t("resetPasswordValidating", "Validating your reset link...")}
      </Text>
    </div>
  );

  const renderTokenError = () => (
    <Result
      icon={
        <CloseCircleOutlined style={{ fontSize: 56, color: "#ff4d4f" }} />
      }
      title={
        <Title level={4} style={{ marginBottom: 0 }}>
          {tokenStatus === "used"
            ? t("resetTokenUsed", "This password reset link has already been used.")
            : t("resetTokenInvalid", "This password reset link has expired or is invalid.")}
        </Title>
      }
      subTitle={
        tokenStatus === "used" ? (
          <Text type="secondary">
            {t(
              "resetTokenUsedMessage",
              "If you need to reset your password again, please request a new link."
            )}
          </Text>
        ) : null
      }
      extra={[
        <Button key="new" type="primary" href="/forgot-password" block>
          {t("resetPasswordRequestNew", "Request New Reset Link")}
        </Button>,
        tokenStatus === "networkError" && (
          <Button key="retry" style={{ marginTop: 8 }} block onClick={validateToken}>
            {t("resetPasswordRetry", "Retry")}
          </Button>
        ),
      ]}
    />
  );

  const renderSuccess = () => (
    <Result
      icon={
        <CheckCircleOutlined style={{ fontSize: 56, color: "#52c41a" }} />
      }
      title={
        <Title level={4} style={{ marginBottom: 0 }}>
          {t("resetPasswordSuccessTitle", "Password Reset Successfully!")}
        </Title>
      }
      subTitle={
        <Space direction="vertical" size="small">
          <Text>
            {t(
              "resetPasswordSuccessMessage",
              "Your password has been changed. Redirecting to login..."
            )}
          </Text>
          <Text type="secondary">
            {t("resetPasswordRedirectingIn", "Redirecting in {{seconds}}...", {
              seconds: countdown,
            })}
          </Text>
        </Space>
      }
      extra={
        <Button type="primary" href="/login" block>
          {t("resetPasswordGoToLogin", "Go to Login")}
        </Button>
      }
    />
  );

  const renderForm = () => (
    <>
      <Title
        level={2}
        style={{
          margin: 0,
          marginBottom: 4,
          color: "#2C6BA0",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <LockOutlined />
        {t("resetPasswordTitle", "Create New Password")}
      </Title>
      {userEmail && (
        <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
          {userEmail}
        </Text>
      )}
      {!userEmail && (
        <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
          {t("resetPasswordSubtitle", "Enter and confirm your new password below.")}
        </Text>
      )}

      {submitError && (
        <Alert
          type="error"
          showIcon
          message={submitError}
          closable
          onClose={() => setSubmitError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      <Form layout="vertical" onFinish={handleSubmit}>
        {/* New Password */}
        <Form.Item
          label={t("resetPasswordNewPassword", "New Password")}
          validateStatus={
            password && !isPasswordValid
              ? "error"
              : password && isPasswordValid
              ? "success"
              : ""
          }
        >
          <Input.Password
            size="large"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onPressEnter={() => {
              if (canSubmit && !submitLoading) handleSubmit();
            }}
            placeholder={t("resetPasswordNewPasswordPlaceholder", "Enter new password")}
            prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
            disabled={submitLoading}
            autoFocus
            autoComplete="new-password"
          />
        </Form.Item>

        {/* Strength indicator */}
        <PasswordStrengthIndicator password={password} />

        {/* Confirm Password */}
        <Form.Item
          label={t("resetPasswordConfirmPassword", "Confirm New Password")}
          validateStatus={
            confirmPassword && !isConfirmValid
              ? "error"
              : confirmPassword && isConfirmValid
              ? "success"
              : ""
          }
          help={
            confirmPassword && !isConfirmValid
              ? t("passwordsDoNotMatch", "Passwords do not match")
              : confirmPassword && isConfirmValid
              ? t("passwordsMatch", "Passwords match")
              : ""
          }
        >
          <Input.Password
            size="large"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onPressEnter={() => {
              if (canSubmit && !submitLoading) handleSubmit();
            }}
            placeholder={t("resetPasswordConfirmPlaceholder", "Confirm new password")}
            prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
            disabled={submitLoading}
            autoComplete="new-password"
          />
        </Form.Item>

        <Space size={8} style={{ marginTop: 8 }}>
          <Button
            icon={<CloseCircleOutlined />}
            href="/forgot-password"
            disabled={submitLoading}
            size="large"
          >
            {t("resetPasswordRequestNew", "Request New Link")}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            icon={<LoginOutlined />}
            size="large"
            loading={submitLoading}
            disabled={!canSubmit || submitLoading}
          >
            {submitLoading
              ? t("resetPasswordSubmitting", "Resetting...")
              : t("resetPasswordSubmit", "Reset Password")}
          </Button>
        </Space>
      </Form>
    </>
  );

  return (
    <div className="login-root">
      <PreLoginHeader />
      <div className="content-wrap">
        <div className="reset-password-header-controls">
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
            style={{
              width: "100%",
              maxWidth: 520,
              boxShadow:
                "0 1px 2px 0 rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02)",
              padding: 24,
            }}
            bordered={false}
            className="login-container"
          >
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <div style={{ textAlign: "center" }}>
                <EnvironmentBadge />
              </div>

              {tokenStatus === "loading" && renderLoading()}
              {(tokenStatus === "invalid" ||
                tokenStatus === "used" ||
                tokenStatus === "networkError") &&
                renderTokenError()}
              {tokenStatus === "valid" && !submitSuccess && renderForm()}
              {submitSuccess && renderSuccess()}
            </Space>
          </Card>
        </div>
      </div>
      <PreLoginFooter />
    </div>
  );
};

export default ResetPassword;
