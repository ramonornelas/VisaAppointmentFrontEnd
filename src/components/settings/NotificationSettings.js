import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Select,
  Space,
  Typography,
  Grid,
  message as antMessage,
} from "antd";
import { BellOutlined, CloseOutlined, SaveOutlined } from "@ant-design/icons";
import Banner from "../common/Banner";
import Footer from "../common/Footer";
import HamburgerMenu from "../common/HamburgerMenu";
import { UserDetails, updateNotificationSettings } from "../../services/APIFunctions";
import FastVisaMetrics from "../../utils/FastVisaMetrics";
import "./NotificationSettings.css";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const DEFAULT_FREQUENCY = 120;

const MainContainer = ({ children }) => (
  <div className="main-centered-container">
    <HamburgerMenu />
    <Banner />
    {children}
  </div>
);

const NotificationSettings = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [frequencyMinutes, setFrequencyMinutes] = useState(DEFAULT_FREQUENCY);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const metrics = useMemo(() => new FastVisaMetrics(), []);
  const userId = sessionStorage.getItem("fastVisa_userid");

  const btnSize = isMobile ? "large" : "middle";

  useEffect(() => {
    metrics.trackPageView();
    if (userId) {
      metrics.setUserId(userId);
    }
    metrics.trackCustomEvent("notification_settings_page_visit", {
      page: "notification_settings",
      timestamp: new Date().toISOString(),
    });

    const fetchUserDetails = async () => {
      if (!userId) {
        setInitialLoading(false);
        return;
      }
      try {
        const data = await UserDetails(userId);
        const savedFrequency = data?.notification_frequency_minutes;
        if (savedFrequency !== undefined && savedFrequency !== null) {
          setFrequencyMinutes(Number(savedFrequency));
        } else {
          setFrequencyMinutes(DEFAULT_FREQUENCY);
        }
      } catch (err) {
        console.error("Error fetching user details:", err);
        setFrequencyMinutes(DEFAULT_FREQUENCY);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUserDetails();
  }, [metrics, userId]);

  const handleSave = async () => {
    metrics.trackButtonClick("save-notification-settings-btn", "Save Notification Settings");
    metrics.trackCustomEvent("notification_settings_save_attempt", {
      frequency_minutes: frequencyMinutes,
      timestamp: new Date().toISOString(),
    });

    setLoading(true);
    try {
      await updateNotificationSettings(userId, frequencyMinutes);
      metrics.trackCustomEvent("notification_settings_save_success", {
        frequency_minutes: frequencyMinutes,
        timestamp: new Date().toISOString(),
      });
      antMessage.success(t("settingsSaved", "Settings saved successfully"));
    } catch (err) {
      console.error("Error saving notification settings:", err);
      metrics.trackCustomEvent("notification_settings_save_error", {
        error: err.message || "Unknown error",
        timestamp: new Date().toISOString(),
      });
      antMessage.error(
        t("errorSavingSettings", "An error occurred while saving settings")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    metrics.trackButtonClick("cancel-notification-settings-btn", "Cancel Notification Settings");
    navigate("/applicants");
  };

  const frequencyOptions = [
    { value: 30,   label: t("every30Minutes", "Every 30 minutes") },
    { value: 60,   label: t("everyHour",      "Every hour") },
    { value: 120,  label: t("every2Hours",    "Every 2 hours") },
    { value: 240,  label: t("every4Hours",    "Every 4 hours") },
    { value: 480,  label: t("every8Hours",    "Every 8 hours") },
    { value: 1440, label: t("every24Hours",   "Every 24 hours") },
  ];

  return (
    <div className="page-container">
      <MainContainer>
        <div className="notification-settings-container">
          <Card
            style={{
              boxShadow:
                "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)",
              padding: isMobile ? 16 : 24,
            }}
          >
            <Title
              level={2}
              style={{
                margin: 0,
                marginBottom: 24,
                color: "#2C6BA0",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <BellOutlined />
              {t("settings", "Settings")}
            </Title>
            <div className="notification-settings-field">
              <Text strong style={{ display: "block", marginBottom: 4 }}>
                {t("progressNotificationFrequency", "Check Frequency")}
              </Text>
              <Text type="secondary" style={{ display: "block", marginBottom: 8, fontSize: 13 }}>
                {t(
                  "progressNotificationDescription",
                  "Configure how often you want to receive progress notifications for your applicants"
                )}
              </Text>
              <Select
                value={initialLoading ? undefined : frequencyMinutes}
                onChange={setFrequencyMinutes}
                loading={initialLoading}
                disabled={loading || initialLoading}
                size={btnSize}
                options={frequencyOptions}
                className="notification-frequency-select"
              />
            </div>

            <Space
              size={8}
              style={{
                width: isMobile ? "100%" : undefined,
                marginTop: 32,
                flexDirection: isMobile ? "column" : "row",
                display: "flex",
              }}
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
                icon={<SaveOutlined />}
                loading={loading}
                disabled={loading || initialLoading}
                onClick={handleSave}
                size={btnSize}
                style={isMobile ? { width: "100%" } : undefined}
              >
                {loading
                  ? t("saving", "Saving...")
                  : t("saveSettings", "Save Settings")}
              </Button>
            </Space>
          </Card>
        </div>
      </MainContainer>
      <Footer />
    </div>
  );
};

export default NotificationSettings;
