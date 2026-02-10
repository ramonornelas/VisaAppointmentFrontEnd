import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Card,
  Alert,
  Space,
  Typography,
  Grid,
  message as antMessage,
} from "antd";
import { LockOutlined, CloseOutlined, SaveOutlined } from "@ant-design/icons";
import Banner from "../common/Banner";
import Footer from "../common/Footer";
import HamburgerMenu from "../common/HamburgerMenu";
import { changePassword } from "../../services/APIFunctions";
import FastVisaMetrics from "../../utils/FastVisaMetrics";
import "./ChangePassword.css";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const ChangePassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const metrics = useMemo(() => new FastVisaMetrics(), []);
  const fastVisa_userid = sessionStorage.getItem("fastVisa_userid");
  const fastVisa_username = sessionStorage.getItem("fastVisa_username");

  const btnSize = isMobile ? "large" : "middle";

  useEffect(() => {
    metrics.trackPageView();
    if (fastVisa_userid) {
      metrics.setUserId(fastVisa_userid);
    }
    metrics.trackCustomEvent("change_password_page_visit", {
      page: "change_password",
      timestamp: new Date().toISOString(),
    });
  }, [metrics, fastVisa_userid]);

  const handleSubmit = async (values) => {
    setError("");
    metrics.trackFormSubmit("change-password-form", false);
    metrics.trackCustomEvent("password_change_attempt", {
      timestamp: new Date().toISOString(),
    });

    setLoading(true);
    try {
      const response = await changePassword({
        userId: fastVisa_userid,
        username: fastVisa_username,
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      if (response && response.success) {
        metrics.trackFormSubmit("change-password-form", true);
        metrics.trackCustomEvent("password_changed_success", {
          timestamp: new Date().toISOString(),
        });
        antMessage.success(
          t("passwordChangedSuccess", "Password changed successfully")
        );
        form.resetFields();
        setTimeout(() => {
          navigate("/applicants");
        }, 1500);
      } else {
        const errMsg =
          response?.message ||
          t("failedToChangePassword", "Failed to change password");
        setError(errMsg);
        if (response?.message?.toLowerCase?.().includes("current")) {
          form.setFields([
            { name: "currentPassword", errors: [errMsg] },
          ]);
        }
        metrics.trackCustomEvent("password_change_failed", {
          error: errMsg,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Error changing password:", err);
      const errMsg = t(
        "errorChangingPassword",
        "An error occurred while changing password"
      );
      setError(errMsg);
      metrics.trackCustomEvent("password_change_error", {
        error: err.message || "Unknown error",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    metrics.trackButtonClick(
      "cancel-change-password-btn",
      "Cancel Change Password"
    );
    navigate(-1);
  };

  return (
    <div className="change-password-root">
      <HamburgerMenu />
      <div
        className="content-wrap"
        style={{
          paddingTop: 120,
          flex: 1,
          backgroundColor: "#f5f5f5",
        }}
      >
        <Banner />
        <div
          style={{
            padding: isMobile ? "0 16px 24px 16px" : "0 18px 24px 18px",
            margin: "0 auto",
            maxWidth: "100%",
            boxSizing: "border-box",
            overflowX: "hidden",
            fontSize: isMobile ? 16 : undefined,
          }}
        >
          <Card
            style={{
              maxWidth: 600,
              margin: "0 auto",
              boxShadow:
                "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)",
              padding: isMobile ? 16 : 24,
            }}
          >
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
              {t("changePassword", "Change Password")}
            </Title>
            <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
              {t(
                "changePasswordDescription",
                "Enter your current password and choose a new one"
              )}
            </Text>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              validateTrigger={["onChange", "onBlur"]}
            >
              <Form.Item
                name="currentPassword"
                label={t("currentPassword", "Current Password")}
                rules={[
                  {
                    required: true,
                    message: t(
                      "currentPasswordRequired",
                      "Current password is required"
                    ),
                  },
                ]}
              >
                <Input.Password
                  size={btnSize}
                  disabled={loading}
                  autoComplete="current-password"
                  placeholder={t("currentPassword", "Current Password")}
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label={t("newPassword", "New Password")}
                rules={[
                  {
                    required: true,
                    message: t(
                      "newPasswordRequired",
                      "New password is required"
                    ),
                  },
                  {
                    min: 6,
                    message: t(
                      "passwordTooShort",
                      "Password must be at least 6 characters long"
                    ),
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (
                        !value ||
                        getFieldValue("currentPassword") !== value
                      ) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error(
                          t(
                            "newPasswordSameAsCurrent",
                            "New password must be different from current password"
                          )
                        )
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  size={btnSize}
                  disabled={loading}
                  autoComplete="new-password"
                  placeholder={t("enterPassword", "At least 6 characters")}
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label={t("confirmNewPassword", "Confirm New Password")}
                dependencies={["newPassword"]}
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
                      if (!value || getFieldValue("newPassword") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error(t("passwordsNotMatch", "Passwords do not match"))
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  size={btnSize}
                  disabled={loading}
                  autoComplete="new-password"
                  placeholder={t("confirmYourPassword", "Re-enter password")}
                />
              </Form.Item>

              {error && (
                <Alert
                  type="error"
                  showIcon
                  message={error}
                  closable
                  onClose={() => setError("")}
                  style={{ marginBottom: 16 }}
                />
              )}

              <Space
                size={8}
                direction={isMobile ? "vertical" : "horizontal"}
                style={{ width: isMobile ? "100%" : undefined, marginTop: 24 }}
              >
                <Button
                  icon={<CloseOutlined />}
                  onClick={handleCancel}
                  disabled={loading}
                  size={btnSize}
                  style={isMobile ? { width: "100%" } : undefined}
                >
                  {t("cancel", "Cancel")}
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={loading}
                  disabled={loading}
                  size={btnSize}
                  style={isMobile ? { width: "100%" } : undefined}
                >
                  {loading
                    ? t("updating", "Updating...")
                    : t("changePassword", "Change Password")}
                </Button>
              </Space>
            </Form>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ChangePassword;
