import React from "react";
import { Card, Space, Typography, Alert, Form, Select } from "antd";
import { EnvironmentOutlined } from "@ant-design/icons";
import { useTranslation } from "react-i18next";

const { Text, Title } = Typography;

const TargetCitiesSection = ({
  cities,
  formData,
  setFormData,
  errors,
  setErrors,
  btnSize,
  isMobile
}) => {

  const { t } = useTranslation();

  return (
    <Card
      style={{ width: "100%", maxWidth: "100%", marginBottom: 24 }}
      title={
        <Space>
          <EnvironmentOutlined />
          <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>
            {t("targetCities", "Target Cities")}
          </Title>
          {cities.length > 1 && <Text type="danger">*</Text>}
        </Space>
      }
    >

      {cities.length === 0 ? (
        <Alert
          type="info"
          showIcon
          message={t(
            "noCitiesForCountry",
            "No cities available for your country"
          )}
          description={t(
            "noCitiesForCountryDescription",
            "Soon you'll be able to select specific cities."
          )}
        />
      ) : cities.length === 1 ? (
        <Space>
          <Text strong>{cities[0].city_name}</Text>
          <Text type="secondary">({cities[0].city_code})</Text>
        </Space>
      ) : (
        <Form.Item
          validateStatus={errors.selectedCities ? "error" : ""}
          help={errors.selectedCities}
        >
          <Select
            mode="multiple"
            placeholder={t("selectCities", "Select cities")}
            value={formData.selectedCities}
            size={btnSize}
            style={{ width: "100%" }}
            options={cities.map((c) => ({
              label: `${c.city_name} (${c.city_code})`,
              value: c.city_code,
            }))}
            showSearch={{ optionFilterProp: "label" }}
            allowClear
            onChange={(vals) => {
              const next = vals || [];

              setFormData((prev) => ({
                ...prev,
                selectedCities: next
              }));

              setErrors((prev) => ({
                ...prev,
                selectedCities:
                  next.length > 0
                    ? ""
                    : t("cityRequired", "Please select at least one city")
              }));
            }}
          />
        </Form.Item>
      )}

    </Card>
  );
};

export default TargetCitiesSection;