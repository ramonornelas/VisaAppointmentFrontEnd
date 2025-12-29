import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Table,
  Button,
  Space,
  Tag,
  Switch,
  Select,
  Typography,
  Tooltip,
  Modal as AntModal,
  message,
  Empty,
} from "antd";
import {
  PlayCircleOutlined,
  StopOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  KeyOutlined,
  ClearOutlined,
  UserAddOutlined,
  EyeOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import HamburgerMenu from "../common/HamburgerMenu";
import {
  ApplicantSearch,
  GetApplicantPassword,
  StartApplicantContainer,
  StopApplicantContainer,
  ApplicantUpdate,
  ApplicantDetails,
  ApplicantDelete,
} from "../../services/APIFunctions";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../utils/AuthContext";
import { permissions } from "../../utils/permissions";
import FastVisaMetrics from "../../utils/FastVisaMetrics";

const { Title } = Typography;
const { Option } = Select;

const ApplicantsAntD = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [allRegisteredUsers, setAllRegisteredUsers] = useState([]);
  const [registeredByFilter, setRegisteredByFilter] = useState("");
  const [filterActive, setFilterActive] = useState(true);
  const [filterRunning, setFilterRunning] = useState(false);
  const fastVisaUserId = sessionStorage.getItem("fastVisa_userid");
  const navigate = useNavigate();
  const [refreshFlag, setRefreshFlag] = useState(false);

  // Initialize metrics tracker
  const metrics = useMemo(() => new FastVisaMetrics(), []);

  // Use centralized permissions utility
  const canViewAllApplicants = permissions.canViewAllApplicants();
  const canClearStatus = permissions.canClearStatus();

  // Check if user can manage applicants and redirect accordingly
  useEffect(() => {
    const checkUserPermissions = async () => {
      if (!fastVisaUserId) return;

      try {
        if (!permissions.canManageApplicants()) {
          const applicants = await ApplicantSearch(fastVisaUserId);

          if (applicants && applicants.length > 0) {
            const firstApplicantId = applicants[0].id;
            console.log(
              "[ApplicantsAntD] User cannot manage applicants, redirecting to applicant:",
              firstApplicantId
            );
            navigate(`/view-applicant/${firstApplicantId}`);
          } else {
            console.log(
              "[ApplicantsAntD] User cannot manage applicants, redirecting to create applicant"
            );
            navigate("/applicant-form");
          }
        }
      } catch (error) {
        console.error(
          "[ApplicantsAntD] Error checking user permissions:",
          error
        );
      }
    };

    if (isAuthenticated && fastVisaUserId) {
      checkUserPermissions();
    }
  }, [isAuthenticated, fastVisaUserId, navigate]);

  useEffect(() => {
    if (!isAuthenticated) {
      document.body.classList.remove("menu-open");
      navigate("/");
      return;
    }

    // Track page view
    metrics.trackPageView();

    if (fastVisaUserId) {
      metrics.setUserId(fastVisaUserId);
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        let response;
        if (canViewAllApplicants) {
          response = await ApplicantSearch(null);
        } else {
          response = await ApplicantSearch(fastVisaUserId);
        }

        if (Array.isArray(response)) {
          setAllRegisteredUsers([
            ...new Set(
              response.map((item) => item.fastVisa_username).filter(Boolean)
            ),
          ]);
        }

        let filteredData = response;
        if (filterActive) {
          filteredData = filteredData.filter(
            (item) => item.applicant_active === true
          );
        }
        if (filterRunning) {
          filteredData = filteredData.filter(
            (item) => item.search_status === "Running"
          );
        }
        if (canViewAllApplicants && registeredByFilter) {
          filteredData = filteredData.filter(
            (item) => item.fastVisa_username === registeredByFilter
          );
        }
        setData(filteredData);
      } catch (error) {
        console.error("Error fetching data:", error);
        message.error(t("errorFetchingData", "Error fetching data"));

        await metrics.trackCustomEvent("error_encountered", {
          page: "applicants_antd",
          error: "fetch_applicants_failed",
          errorMessage: error.message,
          timestamp: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    if (fastVisaUserId) {
      fetchData();
    }
  }, [
    isAuthenticated,
    fastVisaUserId,
    filterActive,
    filterRunning,
    registeredByFilter,
    canViewAllApplicants,
    navigate,
    refreshFlag,
    metrics,
    t,
  ]);

  const handleRegisterApplicant = () => {
    metrics.trackButtonClick("register-applicant-btn", "Register Applicant");
    navigate("/applicant-form");
  };

  const handleEditApplicant = (id) => {
    metrics.trackButtonClick("edit-applicant-btn", "Edit Applicant");
    navigate(`/applicant-form?id=${id}`);
  };

  const handleView = (id) => {
    metrics.trackButtonClick("view-applicant-btn", "View Applicant Details");
    sessionStorage.setItem("applicant_userid", id);
    navigate(`/ViewApplicant`);
  };

  const handleAction = async (id, isActive) => {
    const action = isActive === "Stopped" ? "start_search" : "stop_search";
    metrics.trackButtonClick(
      `${action}-btn`,
      action === "start_search" ? "Start Search" : "Stop Search"
    );

    try {
      if (isActive === "Stopped") {
        const concurrentLimit = parseInt(
          sessionStorage.getItem("concurrent_applicants")
        );
        const applicantsResponse = await ApplicantSearch(fastVisaUserId);
        const runningCount = applicantsResponse.filter(
          (a) => a.search_status === "Running"
        ).length;

        if (runningCount >= concurrentLimit) {
          AntModal.warning({
            title: t("limitReached", "Limit Reached"),
            content: t(
              "concurrentLimitMessage",
              `You have reached your concurrent applicants limit ({limit}).\nTo start a new applicant, please end one of your currently running applicants first.`
            ).replace("{limit}", concurrentLimit),
          });

          await metrics.trackCustomEvent("concurrent_limit_reached", {
            applicantId: id,
            concurrentLimit: concurrentLimit,
            runningCount: runningCount,
            timestamp: new Date().toISOString(),
          });

          return;
        }

        await StartApplicantContainer(id);
        message.success(
          t("searchStartedSuccess", "Search started successfully.")
        );

        await metrics.trackCustomEvent("search_started", {
          applicantId: id,
          timestamp: new Date().toISOString(),
        });
      } else {
        await StopApplicantContainer(id);
        message.success(
          t("searchStoppedSuccess", "Search stopped successfully.")
        );

        await metrics.trackCustomEvent("search_stopped", {
          applicantId: id,
          timestamp: new Date().toISOString(),
        });
      }
      setRefreshFlag((flag) => !flag);
    } catch (error) {
      message.error(t("errorPerformingAction", "Error performing action."));
      console.error(error);

      await metrics.trackCustomEvent("error_encountered", {
        page: "applicants_antd",
        action: isActive === "Stopped" ? "start_search" : "stop_search",
        applicantId: id,
        error: "action_failed",
        errorMessage: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleCopyPassword = async (id) => {
    metrics.trackButtonClick("copy-password-btn", "Copy Password");

    try {
      const response = await GetApplicantPassword(id);
      const password = response.password;
      await navigator.clipboard.writeText(password);
      message.success(t("passwordCopied", "Password copied to clipboard"));

      await metrics.trackCustomEvent("password_copied", {
        applicantId: id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error copying password:", error);
      message.error(t("errorCopyingPassword", "Error copying password"));

      await metrics.trackCustomEvent("error_encountered", {
        page: "applicants_antd",
        action: "copy_password",
        applicantId: id,
        error: "copy_password_failed",
        errorMessage: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleCopyEmail = async (id) => {
    metrics.trackButtonClick("copy-email-btn", "Copy Email");

    try {
      const response = await ApplicantDetails(id);
      const email = response.ais_username;
      await navigator.clipboard.writeText(email);
      message.success(t("emailCopied", "Email copied to clipboard"));

      await metrics.trackCustomEvent("email_copied", {
        applicantId: id,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error copying email:", error);
      message.error(t("errorCopyingEmail", "Error copying email"));

      await metrics.trackCustomEvent("error_encountered", {
        page: "applicants_antd",
        action: "copy_email",
        applicantId: id,
        error: "copy_email_failed",
        errorMessage: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleResetStatus = async (id) => {
    metrics.trackButtonClick("reset-status-btn", "Clear Status");

    try {
      const response = await ApplicantUpdate(id, {
        search_status: "Stopped",
        container_id: null,
        container_start_datetime: null,
      });

      if (response) {
        message.success(
          t("statusClearedSuccess", "Status cleared successfully.")
        );
        setRefreshFlag((flag) => !flag);

        await metrics.trackCustomEvent("status_reset", {
          applicantId: id,
          timestamp: new Date().toISOString(),
        });
      } else {
        message.error(t("failedToClearStatus", "Failed to clear status."));

        await metrics.trackCustomEvent("error_encountered", {
          page: "applicants_antd",
          action: "reset_status",
          applicantId: id,
          error: "reset_status_failed",
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error clearing status:", error);
      message.error(t("errorClearingStatus", "Error clearing status."));

      await metrics.trackCustomEvent("error_encountered", {
        page: "applicants_antd",
        action: "reset_status",
        applicantId: id,
        error: "reset_status_exception",
        errorMessage: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleDeleteApplicant = async (id) => {
    metrics.trackButtonClick("delete-applicant-btn", "Delete Applicant");

    AntModal.confirm({
      title: t("deleteApplicant", "Delete Applicant"),
      content: t(
        "deleteApplicantConfirm",
        "Are you sure you want to delete this applicant?"
      ),
      okText: t("yes", "Yes"),
      okType: "danger",
      cancelText: t("no", "No"),
      onOk: async () => {
        try {
          const applicantData = await ApplicantDetails(id);
          const isSearchRunning =
            applicantData &&
            (applicantData.search_status === "Running" ||
              applicantData.search_active === true);

          if (isSearchRunning) {
            AntModal.confirm({
              title: t("searchInProgress", "Search in Progress"),
              content: t(
                "stopSearchBeforeDeleting",
                "Search is in progress. Do you want to stop the search before deleting?"
              ),
              okText: t("yes", "Yes"),
              cancelText: t("no", "No"),
              onOk: async () => {
                try {
                  await StopApplicantContainer(id);
                  const response = await ApplicantDelete(id);

                  if (response && response.success) {
                    message.success(
                      t(
                        "applicantDeletedSuccessfully",
                        "Applicant deleted successfully."
                      )
                    );
                    setRefreshFlag((flag) => !flag);

                    await metrics.trackCustomEvent("applicant_deleted", {
                      applicantId: id,
                      searchWasRunning: true,
                      timestamp: new Date().toISOString(),
                    });
                  } else {
                    message.error(
                      t(
                        "unexpectedResponseDeleting",
                        "Unexpected response when deleting applicant."
                      )
                    );
                  }
                } catch (error) {
                  console.error("Error stopping search or deleting:", error);
                  message.error(
                    t(
                      "failedToStopSearchOrDelete",
                      "Failed to stop search or delete applicant. Please try again."
                    )
                  );
                }
              },
            });
          } else {
            try {
              const response = await ApplicantDelete(id);

              if (response && response.success) {
                message.success(
                  t(
                    "applicantDeletedSuccessfully",
                    "Applicant deleted successfully."
                  )
                );
                setRefreshFlag((flag) => !flag);

                await metrics.trackCustomEvent("applicant_deleted", {
                  applicantId: id,
                  searchWasRunning: false,
                  timestamp: new Date().toISOString(),
                });
              } else {
                message.error(
                  t(
                    "unexpectedResponseDeleting",
                    "Unexpected response when deleting applicant."
                  )
                );
              }
            } catch (error) {
              console.error("Error in ApplicantDelete:", error);
              message.error(
                t("errorDeletingApplicant", "Error deleting applicant.")
              );
            }
          }
        } catch (error) {
          console.error("Error checking applicant status:", error);
          message.error(
            t("errorDeletingApplicant", "Error deleting applicant.")
          );
        }
      },
    });
  };

  const getSearchStatusColor = (status) => {
    const colors = {
      Running: "blue",
      Stopped: "orange",
      Error: "red",
      Completed: "green",
    };
    return colors[status] || "default";
  };

  const columns = [
    {
      title: t("aisId", "AIS ID"),
      dataIndex: "ais_schedule_id",
      key: "ais_schedule_id",
      render: (text, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => handleView(record.id)}
            icon={<EyeOutlined />}
          >
            {text}
          </Button>
          <Tooltip title={t("edit", "Edit")}>
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEditApplicant(record.id)}
              size="small"
            />
          </Tooltip>
          <Tooltip title={t("deleteApplicant", "Delete Applicant")}>
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteApplicant(record.id)}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: t("aisUsername", "AIS Username"),
      dataIndex: "ais_username",
      key: "ais_username",
      render: (text, record) => (
        <Space>
          <span>{text}</span>
          <Tooltip title={t("copyEmail", "Copy Email")}>
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => handleCopyEmail(record.id)}
              size="small"
            />
          </Tooltip>
          <Tooltip title={t("copyPassword", "Copy Password")}>
            <Button
              type="text"
              icon={<KeyOutlined />}
              onClick={() => handleCopyPassword(record.id)}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: t("name", "Name"),
      dataIndex: "name",
      key: "name",
    },
    {
      title: t("applicantStatus", "Applicant Status"),
      dataIndex: "applicant_active",
      key: "applicant_active",
      render: (active) => (
        <Tag color={active ? "success" : "default"}>
          {active ? t("active", "Active") : t("inactive", "Inactive")}
        </Tag>
      ),
    },
    {
      title: t("searchStatus", "Search Status"),
      dataIndex: "search_status",
      key: "search_status",
      render: (status, record) => (
        <Space>
          <Tag color={getSearchStatusColor(status)}>
            {t(status.toLowerCase(), status)}
          </Tag>
          <Tooltip
            title={
              status === "Stopped"
                ? t("startSearch", "Start Search")
                : t("stopSearch", "Stop Search")
            }
          >
            <Button
              type="text"
              icon={
                status === "Stopped" ? <PlayCircleOutlined /> : <StopOutlined />
              }
              onClick={() => handleAction(record.id, status)}
              size="small"
            />
          </Tooltip>
          {canClearStatus && (
            <Tooltip title={t("clearStatus", "Clear Status")}>
              <Button
                type="text"
                icon={<ClearOutlined />}
                onClick={() => handleResetStatus(record.id)}
                size="small"
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: t("targetEndDate", "Target End Date"),
      dataIndex: "target_end_date",
      key: "target_end_date",
    },
  ];

  // Add Registered By column if user can view all applicants
  if (canViewAllApplicants) {
    columns.push({
      title: t("registeredBy", "Registered By"),
      dataIndex: "fastVisa_username",
      key: "fastVisa_username",
    });
  }

  return (
    <>
      <HamburgerMenu />
      <div
        style={{
          padding: "120px 32px 0 32px",
          maxWidth: "100%",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Title level={2} style={{ marginBottom: 0, marginTop: 0 }}>
              <UsergroupAddOutlined style={{ marginRight: 8 }} />
              {t("applicants", "Applicants")}
            </Title>
          </div>
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={handleRegisterApplicant}
            size="large"
          >
            {t("registerApplicant", "Register Applicant")}
          </Button>
        </div>

        <Space style={{ marginBottom: 16 }} size="large" wrap>
          <Space>
            <span>{t("onlyActive", "Only Active")}:</span>
            <Switch checked={filterActive} onChange={setFilterActive} />
          </Space>

          <Space>
            <span>{t("onlyRunning", "Only Running")}:</span>
            <Switch checked={filterRunning} onChange={setFilterRunning} />
          </Space>

          {canViewAllApplicants && allRegisteredUsers.length > 0 && (
            <Space>
              <span>{t("registeredBy", "Registered by")}:</span>
              <Select
                value={registeredByFilter}
                onChange={setRegisteredByFilter}
                style={{ minWidth: 150 }}
                placeholder={t("all", "All")}
                allowClear
              >
                <Option value="">{t("all", "All")}</Option>
                {allRegisteredUsers.map((username) => (
                  <Option key={username} value={username}>
                    {username}
                  </Option>
                ))}
              </Select>
            </Space>
          )}
        </Space>

        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} ${t("of", "of")} ${total} ${t(
                "items",
                "items"
              )}`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    {t("noApplicantsFound", "No applicants found")}
                    <br />
                    <small>
                      {filterActive || filterRunning || registeredByFilter
                        ? t(
                            "adjustFilters",
                            "Try adjusting your filters or register a new applicant to get started."
                          )
                        : t(
                            "clickToAddFirst",
                            "Click 'Register Applicant' to add your first applicant."
                          )}
                    </small>
                  </span>
                }
              />
            ),
          }}
          scroll={{ x: "max-content" }}
        />
      </div>
    </>
  );
};

export default ApplicantsAntD;
