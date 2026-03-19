import { useEffect, useState } from "react";
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
import { permissions } from "../../utils/permissions";

const { Text } = Typography;
const { RangePicker } = DatePicker;

const DateRangeSelector = ({
  formData,
  setFormData,
  errors,
  readOnly = false,
}) => {
  const { t } = useTranslation();

  const [usePreparationDays, setUsePreparationDays] = useState(
    (formData?.targetStartDays ?? 0) > 0,
  );

  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const today = dayjs();

  const minStartDate = permissions.canSearchUnlimited()
    ? today
    : today.add(120, "day");

  const isBasicUser = !permissions.canSearchUnlimited();

  useEffect(() => {
    if (isBasicUser) {
      setFormData((prev) => ({
        ...prev,
        targetStartDays: 120,
      }));
    }
  }, [isBasicUser, setFormData]);

  const handleRangeChange = (dates) => {
    if (readOnly) return;

    if (!dates) {
      setFormData((prev) => ({
        ...prev,
        targetStartDate: "",
        targetEndDate: "",
      }));
      return;
    }

    if (isBasicUser) {
      setFormData((prev) => ({
        ...prev,
        targetStartDate: minStartDate.format("YYYY-MM-DD"),
        targetEndDate: dates[1]?.format("YYYY-MM-DD"),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        targetStartDate: dates[0].format("YYYY-MM-DD"),
        targetEndDate: dates[1].format("YYYY-MM-DD"),
      }));
    }
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
              isBasicUser
                ? [
                    minStartDate,
                    formData?.targetEndDate
                      ? dayjs(formData.targetEndDate)
                      : null,
                  ]
                : formData?.targetStartDate && formData?.targetEndDate
                  ? [
                      dayjs(formData.targetStartDate),
                      dayjs(formData.targetEndDate),
                    ]
                  : null
            }
            onChange={handleRangeChange}
            disabled={readOnly}
            disabledDate={(current) =>
              current && current < minStartDate.startOf("day")
            }
            defaultPickerValue={[minStartDate, minStartDate]}
            placeholder={[
              t("startDate", "Start date"),
              t("endDate", "End date"),
            ]}
          />
          {!permissions.canSearchUnlimited() && (
            <Alert
              style={{ marginTop: 16 }}
              type="info"
              showIcon
              title={t(
                "basicPlanDateRestriction",
                "In the basic plan, the earliest appointment you can schedule will always be 120 days away.",
              )}
            />
          )}
        </div>

        {errors?.targetStartDate && (
          <Alert type="error" title={errors.targetStartDate} />
        )}

        {errors?.targetEndDate && (
          <Alert type="error" title={errors.targetEndDate} />
        )}

        {/* Preparation Days */}

        <div>
          <div style={{ marginTop: 12 }}>
            {!isBasicUser && (
              <Space align="center" wrap>
                <Switch
                  checked={usePreparationDays}
                  disabled={readOnly}
                  onChange={(val) => {
                    if (readOnly) return;

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
                  value={
                    usePreparationDays ? (formData?.targetStartDays ?? 0) : 0
                  }
                  disabled={!usePreparationDays || readOnly}
                  style={{ width: 70 }}
                  onChange={(v) => {
                    if (readOnly) return;

                    setFormData((prev) => ({
                      ...prev,
                      targetStartDays: v,
                    }));
                  }}
                />

                <Text>{t("prepDaysPart2")}</Text>
              </Space>
            )}

            {/* Explanation */}

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
