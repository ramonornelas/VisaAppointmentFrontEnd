import React from "react";
import { Card, Radio, Space, Typography, Alert } from "antd";
import { useTranslation } from "react-i18next";

const { Text, Title } = Typography;

const ApplicantSelector = ({
  applicantsList,
  selectedApplicant,
  errors,
  handleSelectApplicant,
  formatApplicantDate
}) => {

  const { t } = useTranslation();

  if (!applicantsList || applicantsList.length === 0) return null;

  return (
    <div>

      <Title level={5}>
        {t("selectApplicant", "Select an applicant")}
      </Title>

      {applicantsList.length === 1 && (
        <Alert
          type="info"
          showIcon
          message={t(
            "oneApplicantFound",
            "1 applicant found for this account"
          )}
          style={{ marginBottom: 16 }}
        />
      )}

      {errors.selectedApplicant && (
        <Alert
          type="error"
          showIcon
          message={errors.selectedApplicant}
          style={{ marginBottom: 16 }}
        />
      )}

      <Radio.Group
        value={
          selectedApplicant
            ? selectedApplicant.schedule_id
            : undefined
        }
        style={{ width: "100%" }}
        onChange={(e) => {
          const app = applicantsList.find(
            (a) => a.schedule_id === e.target.value
          );
          if (app) handleSelectApplicant(app);
        }}
      >

        <Space
          orientation="vertical"
          size={12}
          style={{ width: "100%" }}
        >

          {applicantsList.map((app) => (

            <Card
              key={app.schedule_id}
              size="small"
              hoverable
              onClick={() => handleSelectApplicant(app)}
              style={{
                cursor: "pointer",
                borderColor:
                  selectedApplicant?.schedule_id === app.schedule_id
                    ? "#1890ff"
                    : "#d9d9d9",
                borderWidth:
                  selectedApplicant?.schedule_id === app.schedule_id
                    ? 2
                    : 1,
                backgroundColor:
                  selectedApplicant?.schedule_id === app.schedule_id
                    ? "#e6f7ff"
                    : undefined
              }}
            >

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12
                }}
              >

                <Radio
                  value={app.schedule_id}
                  style={{ marginTop: 4 }}
                />

                <Space
                  orientation="vertical"
                  size={4}
                  style={{ flex: 1 }}
                >

                  <Text strong>
                    {t("applicantName", "Applicant name")}:
                    {" "}
                    {app.applicant_name || "—"}
                  </Text>

                  <Text type="secondary">
                    {t("passport", "Passport")}:
                    {" "}
                    {app.passport || "—"}
                  </Text>

                  <Text type="secondary">
                    {t("ds160Confirmation", "DS-160 confirmation")}:
                    {" "}
                    {app.ds_160_id || "—"}
                  </Text>

                  <Text type="secondary">
                    {t("consulAppointmentDate", "Consul appointment date")}:
                    {" "}
                    {formatApplicantDate(app.consul_appointment_date)}
                  </Text>

                  <Text type="secondary">
                    {t("ascAppointmentDate", "ASC appointment date")}:
                    {" "}
                    {formatApplicantDate(app.asc_appointment_date)}
                  </Text>

                </Space>

              </div>

            </Card>

          ))}

        </Space>

      </Radio.Group>

      {selectedApplicant && (
        <Alert
          type="success"
          showIcon
          message={t(
            "selectedApplicantSummary",
            "Selected applicant"
          )}
          description={
            <Space orientation="vertical" size={0}>
              <Text>
                {selectedApplicant.applicant_name} •{" "}
                {t("passport", "Passport")}:
                {" "}
                {selectedApplicant.passport} •{" "}
                {t("ds160Confirmation", "DS-160")}:
                {" "}
                {selectedApplicant.ds_160_id}
              </Text>
            </Space>
          }
          style={{ marginTop: 16 }}
        />
      )}

    </div>
  );
};

export default ApplicantSelector;