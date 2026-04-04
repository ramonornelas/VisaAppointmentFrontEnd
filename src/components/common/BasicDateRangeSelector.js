import React from "react";
import { Alert, Input, Space } from "antd";
import { useTranslation } from "react-i18next";

const BasicDateRangeSelector = ({
  searchStartDate,
  minEndDate,
  isMobile,
  readOnly = false,
  formData = {},
  handleInputChange,
}) => {
  const { t } = useTranslation();
  const maxBoxWidth = isMobile ? "100%" : 340;

  const targetStartDate = formData.targetStartDate
    ? (function() {
        try {
          return new Date(formData.targetStartDate).toISOString().split("T")[0];
        } catch {
          return searchStartDate.toISOString().split("T")[0];
        }
      })()
    : searchStartDate.toISOString().split("T")[0];
  const targetEndDate = formData.targetEndDate
    ? (function() {
        try {
          return new Date(formData.targetEndDate).toISOString().split("T")[0];
        } catch {
          return minEndDate;
        }
      })()
    : minEndDate;

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Alert
        type="info"
        showIcon
        message={t(
          "basicPlanDateRestriction",
          "Basic plan: the earliest appointment you can schedule will always be 120 days from today.",
        )}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
          maxWidth: maxBoxWidth,
          marginBottom: 6,
          fontSize: "0.8rem",
          color: "#8c8c8c",
        }}
      >
        <span>{t("startDate", "Start date")}</span>
        <span>{t("endDate", "End date")}</span>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          width: "100%",
          maxWidth: maxBoxWidth,
        }}
      >
        <Input
          type="date"
          value={targetStartDate}
          disabled
          style={{
            textAlign: "center",
            backgroundColor: "#f5f5f5",
          }}
        />
        <div style={{ display: "flex", alignItems: "center" }}>→</div>
        {readOnly ? (
          <Input
            type="date"
            value={targetEndDate}
            disabled
            style={{ width: "100%" }}
          />
        ) : (
          <Input
            type="date"
            name="targetEndDate"
            value={formData.targetEndDate || ""}
            onChange={handleInputChange}
            min={minEndDate}
            style={{ width: "100%" }}
          />
        )}
      </div>

      <Alert
        type="info"
        showIcon
        message={t("importantAppointments", "Important: About Your Appointments")}
        description={
          <>
            {t(
              "consularExplanation",
              "The dates you select apply to your consular appointment (visa interview).",
            )}
            <br />
            {t(
              "ascExplanation",
              "Your CAS/ASC appointment (biometrics) will be automatically scheduled before your consular appointment.",
            )}
            <br />
            {t(
              "ascNote",
              "Note: The CAS/ASC date may fall before your selected start date.",
            )}
          </>
        }
      />
    </Space>
  );
};

export default BasicDateRangeSelector;