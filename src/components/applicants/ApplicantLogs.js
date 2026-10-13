import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../utils/AuthContext";
import { getApplicantLogs } from "../../services/APIFunctions";
import HamburgerMenu from "../common/HamburgerMenu";
import {
  Alert,
  Button,
  Card,
  Empty,
  Grid,
  Input,
  Space,
  Table,
  Typography,
} from "antd";
import { ArrowLeftOutlined, FileTextOutlined } from "@ant-design/icons";
import "./ApplicantView.css";
import "../../index.css";

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const getLocalDate = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const normalizeLogRows = (response) => {
  let result = response;

  if (result && typeof result === "object" && typeof result.body === "string") {
    try {
      result = JSON.parse(result.body);
    } catch {
      result = result.body;
    }
  }

  if (result && typeof result === "object" && !Array.isArray(result)) {
    if (Array.isArray(result.logs)) {
      result = result.logs;
    } else if (Array.isArray(result.data)) {
      result = result.data;
    }
  }

  if (typeof result === "string") {
    return result
      .split(/\r?\n/)
      .filter(Boolean)
      .map((message) => ({ message }));
  }

  if (!Array.isArray(result)) {
    return result && typeof result === "object" ? [result] : [];
  }

  return result.map((entry) =>
    entry && typeof entry === "object" ? entry : { message: String(entry) },
  );
};

const ApplicantLogs = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const applicantId = sessionStorage.getItem("applicant_userid");
  const [filters, setFilters] = useState(() => ({
    start_date: getLocalDate(),
    start_time: "00:00:00",
    end_date: getLocalDate(),
    end_time: "23:59:59",
  }));
  const initialFilters = useRef(filters);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(Boolean(applicantId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const loadLogs = useCallback(
    async (searchFilters) => {
      if (!applicantId) {
        setError(
          t("applicantIdUnavailable", "No applicant is selected for these logs."),
        );
        setLogs([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const response = await getApplicantLogs({
          applicant_id: applicantId,
          start_date: searchFilters.start_date,
          start_time: searchFilters.start_time,
          end_date: searchFilters.end_date,
          end_time: searchFilters.end_time,
        });
        setLogs(normalizeLogRows(response));
      } catch (loadError) {
        console.error("Error loading applicant logs:", loadError);
        setLogs([]);
        setError(
          loadError.message ||
            t("failedToLoadApplicantLogs", "Failed to load applicant logs."),
        );
      } finally {
        setLoading(false);
      }
    },
    [applicantId, t],
  );

  useEffect(() => {
    loadLogs(initialFilters.current);
  }, [loadLogs]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((currentFilters) => ({ ...currentFilters, [name]: value }));
  };

  const handleSearch = (event) => {
    event.preventDefault();
    if (
      !filters.start_date ||
      !filters.start_time ||
      !filters.end_date ||
      !filters.end_time
    ) {
      setError(t("completeDateTimeRange", "Enter a complete date and time range."));
      return;
    }

    const startDateTime = `${filters.start_date}T${filters.start_time}`;
    const endDateTime = `${filters.end_date}T${filters.end_time}`;
    if (startDateTime > endDateTime) {
      setError(
        t("invalidDateTimeRange", "The start date and time must be before the end date and time."),
      );
      return;
    }

    loadLogs(filters);
  };

  const columns = [
    ...new Set(logs.flatMap((entry) => Object.keys(entry))),
  ].map((key) => ({
    title: key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase()),
    dataIndex: key,
    key,
    render: (value) =>
      value && typeof value === "object"
        ? JSON.stringify(value)
        : value == null
          ? ""
          : String(value),
  }));

  return (
    <>
      <HamburgerMenu />
      <main
        className="applicant-view-container"
        style={{
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            marginBottom: 24,
            paddingBottom: 24,
            borderBottom: "2px solid #e3eaf3",
          }}
        >
          <Space
            orientation={isMobile ? "vertical" : "horizontal"}
            align={isMobile ? "stretch" : "start"}
            wrap
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <div>
              <Title
                level={2}
                style={{
                  margin: 0,
                  color: "#2C6BA0",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <FileTextOutlined />
                {t("applicantLogs", "Applicant Logs")}
              </Title>
              <Text type="secondary" style={{ display: "block", marginTop: 4 }}>
                {t("viewApplicantLogs", "View logs for the selected applicant")}
              </Text>
            </div>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() =>
                navigate(
                  applicantId ? `/view-applicant/${applicantId}` : "/applicants",
                )
              }
            >
              {t("back", "Back")}
            </Button>
          </Space>
        </div>

        <Space orientation="vertical" size={16} style={{ width: "100%" }}>
          <Card title={t("logSearchRange", "Log search range")}>
            <form onSubmit={handleSearch}>
              <Space wrap size={[12, 12]}>
                <label style={{ display: "flex", flexDirection: "column" }}>
                  {t("startDate", "Start date")}
                  <Input
                    aria-label={t("startDate", "Start date")}
                    type="date"
                    style={{ minWidth: 180 }}
                    name="start_date"
                    value={filters.start_date}
                    onChange={handleFilterChange}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column" }}>
                  {t("startTime", "Start time")}
                  <Input
                    aria-label={t("startTime", "Start time")}
                    type="time"
                    step="1"
                    name="start_time"
                    value={filters.start_time}
                    onChange={handleFilterChange}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column" }}>
                  {t("endDate", "End date")}
                  <Input
                    aria-label={t("endDate", "End date")}
                    type="date"
                    style={{ minWidth: 180 }}
                    name="end_date"
                    value={filters.end_date}
                    onChange={handleFilterChange}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column" }}>
                  {t("endTime", "End time")}
                  <Input
                    aria-label={t("endTime", "End time")}
                    type="time"
                    step="1"
                    name="end_time"
                    value={filters.end_time}
                    onChange={handleFilterChange}
                  />
                </label>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {t("searchLogs", "Search logs")}
                </Button>
              </Space>
            </form>
          </Card>

          {error && <Alert type="error" showIcon message={error} />}

          <Card title={t("applicantLogs", "Applicant Logs")}>
            {logs.length ? (
              <Table
                dataSource={logs}
                columns={columns}
                loading={loading}
                rowKey={(record, index) =>
                  `${record.id ?? record.timestamp ?? "log"}-${index}`
                }
                scroll={{ x: "max-content" }}
                pagination={{ pageSize: 25, showSizeChanger: true }}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  loading
                    ? t("loadingLogs", "Loading logs...")
                    : t("noApplicantLogs", "No logs found for this range.")
                }
              />
            )}
          </Card>
        </Space>
      </main>
    </>
  );
};

export default ApplicantLogs;
