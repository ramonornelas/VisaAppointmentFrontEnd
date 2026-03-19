import React from "react";
import {
  Card,
  Space,
  Typography,
  Button,
  Form,
  Input,
  Tooltip,
  Row,
  Col,
} from "antd";
import {
  KeyOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import ApplicantSelector from "./ApplicantSelector";

const { Text, Title } = Typography;

const VisaCredentialsPanel = ({
  isMobile,
  btnSize,
  formData,
  setFormData,
  errors,
  setErrors,
  isAuthenticating,
  aisAuthSuccess,
  applicantsList,
  selectedApplicant,
  setApplicantsList,
  setSelectedApplicant,
  credentialsExpanded,
  setCredentialsExpanded,
  handleInputChange,
  handleAuthenticateAIS,
  handleSelectApplicant,
  formatApplicantDate,
  isEditMode,
}) => {
  const { t } = useTranslation();

  return (
    <Card
      style={{ width: "100%", marginBottom: 24 }}
      title={
        <span
          role="button"
          tabIndex={0}
          onClick={() => setCredentialsExpanded(!credentialsExpanded)}
          style={{
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <Space>
            <KeyOutlined />

            <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>
              {t("aisCredentials", "Visa Appointment System Credentials")}
            </Title>

            {!credentialsExpanded && formData.aisEmail && (
              <Text type="success">({t("configured", "Configured")})</Text>
            )}
          </Space>
        </span>
      }
      extra={
        <Button
          type="text"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setCredentialsExpanded(!credentialsExpanded);
          }}
          icon={
            credentialsExpanded ? <ArrowUpOutlined /> : <ArrowDownOutlined />
          }
        >
          {credentialsExpanded
            ? t("collapse", "Collapse")
            : t("expand", "Expand")}
        </Button>
      }
    >
      {credentialsExpanded && (
        <>
          {/* EMAIL + PASSWORD */}

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                layout="vertical"
                label={
                  <Title level={5} style={{ margin: 0 }}>
                    {t(
                      "visaAppointmentSystemEmail",
                      "Visa Appointment System Email",
                    )}{" "}
                    <Text type="danger">*</Text>
                  </Title>
                }
                validateStatus={errors.aisEmail ? "error" : ""}
                help={errors.aisEmail}
              >
                <Input
                  name="aisEmail"
                  type="email"
                  value={formData.aisEmail}
                  onChange={(e) => {
                    handleInputChange(e);
                    setApplicantsList([]);
                    setSelectedApplicant(null);
                  }}
                  disabled={isAuthenticating}
                  placeholder="visa@example.com"
                  size={isMobile ? "large" : btnSize}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                layout="vertical"
                label={
                  <Title level={5} style={{ margin: 0 }}>
                    {t(
                      "visaAppointmentSystemPassword",
                      "Visa Appointment System Password",
                    )}
                  </Title>
                }
                validateStatus={errors.aisPassword ? "error" : ""}
                help={errors.aisPassword}
              >
                <Input.Password
                  name="aisPassword"
                  value={formData.aisPassword}
                  onChange={(e) => {
                    handleInputChange(e);
                    setApplicantsList([]);
                    setSelectedApplicant(null);
                  }}
                  disabled={isAuthenticating}
                  placeholder={
                    isEditMode
                      ? t(
                          "leaveEmptyToKeepPassword",
                          "Leave empty to keep current password",
                        )
                      : t(
                          "enterVisaPassword",
                          "Enter Visa Appointment System password",
                        )
                  }
                  size={isMobile ? "large" : btnSize}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* AUTHENTICATE BUTTON */}

          <div style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              onClick={handleAuthenticateAIS}
              disabled={
                isAuthenticating || !formData.aisEmail || !formData.aisPassword
              }
              loading={isAuthenticating}
              icon={<KeyOutlined />}
              size={isMobile ? "large" : btnSize}
              style={{
                width: isMobile ? "100%" : undefined,
                ...(aisAuthSuccess
                  ? {
                      backgroundColor: "#52c41a",
                      borderColor: "#52c41a",
                      color: "#fff",
                    }
                  : {}),
              }}
            >
              {aisAuthSuccess
                ? t("authenticationSuccessful", "Authentication Successful")
                : t("authenticate", "Authenticate")}
            </Button>

            <Text
              type="secondary"
              style={{
                display: "block",
                marginTop: 8,
                fontSize: isMobile ? "0.8rem" : "0.875rem",
              }}
            >
              {t(
                "clickToVerifyCredentials",
                "Click to verify your Visa Appointment System credentials and automatically retrieve your Schedule ID",
              )}
            </Text>
          </div>

          {/* SCHEDULE ID + NAME */}

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                layout="vertical"
                label={
                  <Title level={5} style={{ margin: 0 }}>
                    {t("aisScheduleId", "Schedule ID")}
                  </Title>
                }
              >
                <Tooltip
                  title={t(
                    "autoFilledAfterAuth",
                    "This field is automatically filled after authentication",
                  )}
                  trigger={["hover", "click"]}
                >
                  <span>
                    <Input
                      value={formData.aisScheduleId}
                      disabled
                      readOnly
                      size={isMobile ? "large" : btnSize}
                      placeholder={t(
                        "autoFilledAfterAuth",
                        "Auto-filled after authentication",
                      )}
                    />
                  </span>
                </Tooltip>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                layout="vertical"
                label={
                  <Title level={5} style={{ margin: 0 }}>
                    {t("fullName", "Full Name")}
                  </Title>
                }
              >
                <Tooltip
                  title={t(
                    "autoFilledAfterAuth",
                    "This field is automatically filled after authentication",
                  )}
                  trigger={["hover", "click"]}
                >
                  <span>
                    <Input
                      value={formData.name}
                      disabled
                      readOnly
                      size={isMobile ? "large" : btnSize}
                    />
                  </span>
                </Tooltip>
              </Form.Item>
            </Col>
          </Row>

          {/* APPLICANT SELECTOR */}

          <ApplicantSelector
            applicantsList={applicantsList}
            selectedApplicant={selectedApplicant}
            errors={errors}
            handleSelectApplicant={handleSelectApplicant}
            formatApplicantDate={formatApplicantDate}
          />
        </>
      )}
    </Card>
  );
};

export default VisaCredentialsPanel;
