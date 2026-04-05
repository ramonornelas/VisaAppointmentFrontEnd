import React, { useState } from "react";
import { Alert, Input, Space, DatePicker, Typography } from "antd";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const BasicDateRangeSelector = ({
  searchStartDate,
  minEndDate,
  isMobile,
  readOnly = false,
  formData = {},
  handleInputChange,
}) => {
  const { t, i18n } = useTranslation();
  const maxBoxWidth = isMobile ? "100%" : 340;

  const dateFormat = i18n.language.startsWith("es") ? "DD/MM/YYYY" : "MM/DD/YYYY";

  const targetEndDate = formData.targetEndDate
    ? dayjs(formData.targetEndDate)
    : null;

  const [pickerKey, setPickerKey] = useState(0);

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

      <div style={{ width: "100%", maxWidth: maxBoxWidth }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 6,
            fontSize: "0.8rem",
            color: "#8c8c8c",
          }}
        >
          <span style={{ flex: 1 }}>{t("startDate", "Start date")}</span>
          <span style={{ visibility: "hidden" }}>→</span>
          <span style={{ flex: 1 }}>{t("endDate", "End date")}</span>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
          }}
        >
          <Typography.Text
            style={{
              display: "flex",
              alignItems: "center",
              padding: "4px 11px",
              border: "1px solid #d9d9d9",
              borderRadius: 6,
              backgroundColor: "#f5f5f5",
              color: "rgba(0, 0, 0, 0.45)",
              whiteSpace: "nowrap",
              flex: 1,
            }}
          >
            {dayjs(searchStartDate).format(dateFormat)}
          </Typography.Text>
          <div style={{ display: "flex", alignItems: "center" }}>→</div>
          {readOnly ? (
            <DatePicker
              value={targetEndDate}
              format={dateFormat}
              disabled
              style={{ flex: 1 }}
            />
          ) : (
            <DatePicker
              key={pickerKey}
              value={targetEndDate}
              format={dateFormat}
              placeholder={dateFormat}
              defaultPickerValue={dayjs(minEndDate)}
              disabledDate={(current) => current && current < dayjs(minEndDate).startOf("day")}
              onChange={(date) => {
                if (!date) setPickerKey((k) => k + 1);
                handleInputChange({
                  target: {
                    name: "targetEndDate",
                    value: date ? date.format("YYYY-MM-DD") : "",
                  },
                });
              }}
              style={{ flex: 1 }}
            />
          )}
        </div>
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