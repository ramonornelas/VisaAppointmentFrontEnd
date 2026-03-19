import React from "react";
import { Space, Typography, Button, Switch } from "antd";
import {
  CalendarOutlined,
  EditOutlined,
  UserAddOutlined,
  CloseOutlined,
  SaveOutlined,
  CheckOutlined
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import { permissions } from "../../utils/permissions";

const { Title, Text } = Typography;

const ApplicantFormHeader = ({
  isMobile,
  isEditMode,
  formData,
  handleInputChange,
  handleCancel,
  loading,
  selectedApplicant,
  applicantsList,
  btnSize
}) => {

  const { t } = useTranslation();

  return (
    <div
      style={{
        marginBottom: 24,
        paddingBottom: 24,
        borderBottom: "2px solid #e3eaf3"
      }}
    >
      <Space
        direction={isMobile ? "vertical" : "horizontal"}
        align={isMobile ? "stretch" : "start"}
        wrap
        style={{
          width: "100%",
          justifyContent: "space-between"
        }}
      >

        {/* LEFT SIDE — TITLE */}

        <div>

          <Title
            level={2}
            style={{
              margin: 0,
              color: "#2C6BA0",
              display: "flex",
              alignItems: "center",
              gap: 8
            }}
          >

            {!permissions.canManageApplicants() ? (
              <CalendarOutlined />
            ) : isEditMode ? (
              <EditOutlined />
            ) : (
              <UserAddOutlined />
            )}

            {!permissions.canManageApplicants()
              ? t("myAppointment", "My Appointment")
              : isEditMode
                ? t("editApplicant", "Edit Applicant")
                : t("newApplicant", "New Applicant")}

          </Title>

          <Text type="secondary" style={{ display: "block", marginTop: 4 }}>

            {isEditMode
              ? permissions.canManageApplicants()
                ? t(
                    "updateApplicantInfo",
                    "Update the information for this applicant"
                  )
                : t(
                    "updateAppointmentSettings",
                    "Update your appointment search settings"
                  )
              : t(
                  "fillDetailsToRegister",
                  "Fill in the details to register a new applicant"
                )}

          </Text>

        </div>

        {/* RIGHT SIDE — ACTION BUTTONS */}

        <Space
          wrap
          size={8}
          direction={isMobile ? "vertical" : "horizontal"}
          style={{
            width: isMobile ? "100%" : undefined
          }}
        >

          {/* Active toggle (admin edit mode only) */}

          {isEditMode && permissions.canManageApplicants() && (

            <Space align="center">

              <Switch
                checked={formData.applicantActive}
                onChange={(checked) =>
                  handleInputChange({
                    target: {
                      name: "applicantActive",
                      type: "checkbox",
                      checked
                    }
                  })
                }
                checkedChildren={t("active", "Active")}
                unCheckedChildren={t("inactive", "Inactive")}
              />

            </Space>

          )}

          {/* Cancel button */}

          <Button
            icon={<CloseOutlined />}
            onClick={handleCancel}
            disabled={loading}
            size={btnSize}
          >
            {t("cancel", "Cancel")}
          </Button>

          {/* Submit button */}

          <Button
            type="primary"
            htmlType="submit"
            form="applicant-form"
            icon={
              loading
                ? null
                : isEditMode
                  ? <SaveOutlined />
                  : <CheckOutlined />
            }
            loading={loading}
            disabled={
              loading ||
              (!isEditMode && !selectedApplicant) ||
              (applicantsList.length > 0 && !selectedApplicant)
            }
            size={btnSize}
          >

            {loading
              ? isEditMode
                ? t("updating", "Updating...")
                : t("creating", "Creating...")
              : isEditMode
                ? t("updateApplicant", "Update Applicant")
                : t("createApplicant", "Create Applicant")}

          </Button>

        </Space>

      </Space>
    </div>
  );
};

export default ApplicantFormHeader;