import React, { useState } from "react";
import {
  Card,
  Space,
  Typography,
  Switch,
  InputNumber,
  Alert,
  DatePicker,
  Grid,
} from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const DateRangeSelector = ({ formData, setFormData, errors, formatDate }) => {
  const { t } = useTranslation();

  const [usePreparationDays, setUsePreparationDays] = useState(false);

  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const today = dayjs();

  const handleRangeChange = (dates) => {
    if (!dates) {
      setFormData((prev) => ({
        ...prev,
        targetStartDate: "",
        targetEndDate: "",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      targetStartDate: dates[0].format("YYYY-MM-DD"),
      targetEndDate: dates[1].format("YYYY-MM-DD"),
    }));
  };

  return (
    <Card
      style={{ width: "100%", marginBottom: 24 }}
      title={
        <Space>
          <CalendarOutlined />
          <Typography.Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>
            {t(
              "dateRangeWhenICanAttend",
              "Date range when I can attend my appointment",
            )}
          </Typography.Title>
        </Space>
      }
    >
      <Space orientation="vertical" size={16} style={{ width: "100%" }}>
        {/* Calendar */}

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: isMobile ? "100%" : 340,
              marginBottom: 6,
              fontSize: "0.8rem",
              color: "#8c8c8c",
            }}
          >
            <span>{t("startDate", "Start date")}</span>
            <span>{t("endDate", "End date")}</span>
          </div>
          <RangePicker
            style={{ width: isMobile ? "100%" : 340 }}
            value={
              formData.targetStartDate && formData.targetEndDate
                ? [
                    dayjs(formData.targetStartDate),
                    dayjs(formData.targetEndDate),
                  ]
                : null
            }
            onChange={handleRangeChange}
            disabledDate={(current) =>
              current && current < today.startOf("day")
            }
            placeholder={[
              t("startDate", "Start date"),
              t("endDate", "End date"),
            ]}
          />
        </div>

        {errors?.targetStartDate && (
          <Alert type="error" title={errors.targetStartDate} />
        )}

        {errors?.targetEndDate && (
          <Alert type="error" title={errors.targetEndDate} />
        )}

        {/* Advanced options */}

        <div>
          <div style={{ marginTop: 12 }}>
            <Space align="center" wrap>
              <Switch
                checked={usePreparationDays}
                onChange={(val) => {
                  setUsePreparationDays(val);

                  if (!val) {
                    setFormData((prev) => ({
                      ...prev,
                      targetStartDays: 0,
                    }));
                  }
                }}
              />

              <Text>{t("prepDaysPart1")}</Text>

              <InputNumber
                min={0}
                max={90}
                value={usePreparationDays ? (formData.targetStartDays ?? 0) : 0}
                disabled={!usePreparationDays}
                style={{ width: 70 }}
                onChange={(v) =>
                  setFormData((prev) => ({
                    ...prev,
                    targetStartDays: v,
                  }))
                }
              />

              <Text>{t("prepDaysPart2")}</Text>
            </Space>

            {/* Appointment explanation */}

            <Alert
              style={{ marginTop: 16 }}
              type="info"
              showIcon
              title={t(
                "importantAppointments",
                "Important: About Your Appointments",
              )}
              description={
                <>
                  {t(
                    "consularExplanation",
                    "The dates you select apply to your consular appointment (visa interview).",
                  )}
                  <br />
                  {t(
                    "ascExplanation",
                    "Your CAS/ASC appointment (biometrics) will be automatically scheduled before your consular appointment, as close as possible to it.",
                  )}
                  <br />
                  {t(
                    "ascNote",
                    "Note: The CAS/ASC date may fall before your selected start date.",
                  )}
                </>
              }
            />
          </div>
        </div>
      </Space>
    </Card>
  );
};

export default DateRangeSelector;
