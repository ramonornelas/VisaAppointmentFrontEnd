import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Table,
  Card,
  Button,
  Tag,
  Space,
  Typography,
  Modal as AntModal,
  message,
  Empty,
  Switch,
  Select,
  InputNumber,
  Input,
  DatePicker,
  Grid,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
  TeamOutlined,
  SearchOutlined,
  CreditCardOutlined,
  StopOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import HamburgerMenu from "../common/HamburgerMenu";
import { permissions } from "../../utils/permissions";
import { getUsers, updateUser, getRoles, sendEmail } from "../../services/APIFunctions";
import { deleteUser } from "../../services/APIFunctions";
import { ALL_COUNTRIES } from "../../utils/countries";

const { Title } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;
const { Search } = Input;

const Users = () => {
  const { t } = useTranslation();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [editingKey, setEditingKey] = useState("");
  const [editData, setEditData] = useState({});
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [searchText, setSearchText] = useState("");
  
  // Subscription modal states
  const [subscriptionModalVisible, setSubscriptionModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [subscriptionDays, setSubscriptionDays] = useState(30);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState(null);
  const [maxApplicants, setMaxApplicants] = useState(2);
  const [useDays, setUseDays] = useState(true); // true = days, false = end date

  useEffect(() => {
    if (permissions.canManageUsers()) {
      setLoading(true);
      Promise.all([getUsers(), getRoles()])
        .then(([usersData, rolesData]) => {
          // Ordenar usuarios: primero los que tienen fecha (más recientes primero), luego los sin fecha
          const sortedUsers = [...usersData].sort((a, b) => {
            if (!a.created_at && !b.created_at) return 0;
            if (!a.created_at) return 1;
            if (!b.created_at) return -1;
            return dayjs(b.created_at).unix() - dayjs(a.created_at).unix();
          });
          setUsers(sortedUsers);
          setFilteredUsers(sortedUsers);
          setRoles(rolesData);
        })
        .catch((error) => {
          console.error("Error fetching data:", error);
          message.error(t("errorFetchingData", "Error fetching data"));
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [refreshFlag, t]);

  // Filter users based on search text
  useEffect(() => {
    if (!searchText) {
      setFilteredUsers(users);
      return;
    }

    const searchLower = searchText.toLowerCase();
    const filtered = users.filter((user) => {
      const username = user.username?.toLowerCase() || "";
      const name = user.name?.toLowerCase() || "";
      const phone = user.phone_number?.toLowerCase() || "";
      const country = ALL_COUNTRIES.find((c) => c.value === user.country_code)?.label?.toLowerCase() || "";
      const role = roles.find((r) => r.id === user.role_id)?.name?.toLowerCase() || "";

      return (
        username.includes(searchLower) ||
        name.includes(searchLower) ||
        phone.includes(searchLower) ||
        country.includes(searchLower) ||
        role.includes(searchLower)
      );
    });

    setFilteredUsers(filtered);
  }, [searchText, users, roles]);

  const isEditing = (record) => record.id === editingKey;

  const handleEdit = (record) => {
    setEditingKey(record.id);
    setEditData({ ...record });
  };

  const handleCancel = () => {
    setEditingKey("");
    setEditData({});
  };

  const handleSave = async () => {
    try {
      const { id, password, ...payload } = editData;
      await updateUser(id, payload);
      message.success(t("userUpdatedSuccess", "User updated successfully"));
      setEditingKey("");
      setEditData({});
      setRefreshFlag((flag) => !flag);
    } catch (error) {
      console.error("Error updating user:", error);
      message.error(t("errorUpdatingUser", "Error updating user"));
    }
  };

  const handleDeleteUser = (record) => {
    const userName = record.name || record.username;
    const userEmail = record.username;
    
    AntModal.confirm({
      title: t("deleteUser", "Delete User"),
      content: (
        <div>
          <p>{t("deleteUserConfirm", "Are you sure you want to delete this user? This action cannot be undone.")}</p>
          <div style={{ marginTop: 16, padding: 12, backgroundColor: "#f5f5f5", borderRadius: 4 }}>
            <strong>{t("name", "Name")}:</strong> {userName}
            <br />
            <strong>{t("email", "Email")}:</strong> {userEmail}
          </div>
        </div>
      ),
      okText: t("delete", "Delete"),
      okType: "danger",
      cancelText: t("cancel", "Cancel"),
      onOk: async () => {
        try {
          const result = await deleteUser(record.id);
          if (result && result.success) {
            message.success(t("userDeletedSuccess", "User deleted successfully"));
            setRefreshFlag((flag) => !flag);
          } else {
            message.error(t("failedToDeleteUser", "Failed to delete user."));
          }
        } catch (error) {
          console.error("Error deleting user:", error);
          message.error(t("errorDeletingUser", "Error deleting user."));
        }
      },
    });
  };

  const handleActivateSubscription = (record) => {
    setSelectedUser(record);
    setMaxApplicants(record.requested_concurrent_applicants || 2);

    if (record.requested_subscription_expires_at) {
      // Pre-fill with the exact expiry date the user requested
      setSubscriptionEndDate(dayjs(record.requested_subscription_expires_at));
      setUseDays(false);
    } else {
      setSubscriptionDays(30);
      setSubscriptionEndDate(null);
      setUseDays(true);
    }

    setSubscriptionModalVisible(true);
  };

  const buildPaymentConfirmationEmail = ({ name, planLabel, concurrentApplicants, expiresAt, language }) => {
    const formattedExpiry = dayjs(expiresAt).format("DD/MM/YYYY");
    const isEs = language === "es";

    const subject = isEs
      ? "FastVisa - Suscripción activada exitosamente"
      : "FastVisa - Subscription Activated Successfully";

    const bodyText = isEs
      ? `Hola ${name},\n\nTu suscripción ha sido activada exitosamente.\n\nPlan: ${planLabel}\nBúsquedas activas: ${concurrentApplicants}\nFecha de vencimiento: ${formattedExpiry}\n\nYa puedes iniciar sesión y comenzar a buscar citas.\n\nGracias por elegir FastVisa.\n`
      : `Hello ${name},\n\nYour subscription has been activated successfully.\n\nPlan: ${planLabel}\nActive searches: ${concurrentApplicants}\nExpires on: ${formattedExpiry}\n\nYou can now log in and start searching for appointments.\n\nThank you for choosing FastVisa.\n`;

    const htmlBody = isEs ? `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
    .header { background-color: #4caf50; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 26px; }
    .content { background-color: #f9f9f9; padding: 30px 20px; border: 1px solid #ddd; border-top: none; }
    .info-box { background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .detail-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .detail-table td { padding: 8px 12px; border-bottom: 1px solid #e0e0e0; }
    .detail-table td:first-child { font-weight: bold; color: #555; width: 40%; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>🎉 ¡Suscripción Activada!</h1></div>
    <div class="content">
      <p>Hola <strong>${name}</strong>,</p>
      <div class="info-box">
        <strong>✅ Tu suscripción ha sido activada exitosamente.</strong>
      </div>
      <table class="detail-table">
        <tr><td>Plan:</td><td>${planLabel}</td></tr>
        <tr><td>Búsquedas activas:</td><td>${concurrentApplicants}</td></tr>
        <tr><td>Vence el:</td><td>${formattedExpiry}</td></tr>
      </table>
      <p>Ya puedes iniciar sesión y comenzar a buscar citas de visa.</p>
      <p>Si tienes alguna pregunta, contáctanos en <a href="mailto:admin@orionscaled.com">admin@orionscaled.com</a></p>
      <p><strong>¡Gracias por elegir FastVisa!</strong></p>
    </div>
    <div class="footer"><p>&copy; 2026 FastVisa. Todos los derechos reservados.</p></div>
  </div>
</body>
</html>` : `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; }
    .header { background-color: #4caf50; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 26px; }
    .content { background-color: #f9f9f9; padding: 30px 20px; border: 1px solid #ddd; border-top: none; }
    .info-box { background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .detail-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .detail-table td { padding: 8px 12px; border-bottom: 1px solid #e0e0e0; }
    .detail-table td:first-child { font-weight: bold; color: #555; width: 40%; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>🎉 Subscription Activated!</h1></div>
    <div class="content">
      <p>Hello <strong>${name}</strong>,</p>
      <div class="info-box">
        <strong>✅ Your subscription has been activated successfully.</strong>
      </div>
      <table class="detail-table">
        <tr><td>Plan:</td><td>${planLabel}</td></tr>
        <tr><td>Active searches:</td><td>${concurrentApplicants}</td></tr>
        <tr><td>Expires on:</td><td>${formattedExpiry}</td></tr>
      </table>
      <p>You can now log in and start searching for visa appointments.</p>
      <p>If you have any questions, contact us at <a href="mailto:admin@orionscaled.com">admin@orionscaled.com</a></p>
      <p><strong>Thank you for choosing FastVisa!</strong></p>
    </div>
    <div class="footer"><p>&copy; 2026 FastVisa. All rights reserved.</p></div>
  </div>
</body>
</html>`;

    return { subject, bodyText, htmlBody };
  };

  const handleSubscriptionModalOk = async () => {
    try {
      let expirationDate;
      
      if (useDays) {
        // Calculate expiration date based on days
        expirationDate = dayjs().add(subscriptionDays, 'day').toISOString();
      } else {
        // Use the selected end date
        if (!subscriptionEndDate) {
          message.error(t("pleaseSelectEndDate", "Please select an end date"));
          return;
        }
        expirationDate = dayjs(subscriptionEndDate).toISOString();
      }

      // Update user with subscription data
      const updates = {
        trial_active: false,
        payment_pending: false,
        subscription_expires_at: expirationDate,
        concurrent_applicants: maxApplicants,
      };

      await updateUser(selectedUser.id, updates);
      
      // Send confirmation email to user (BCC admin)
      try {
        const userEmail = selectedUser.username; // username is the email
        const userName = selectedUser.name || selectedUser.username;
        const userLanguage = selectedUser.language || "es";
        const planLabel = `${maxApplicants} ${t("activeSearchesLabel", "Active searches")}`;

        const { subject, bodyText, htmlBody } = buildPaymentConfirmationEmail({
          name: userName,
          planLabel,
          concurrentApplicants: maxApplicants,
          expiresAt: expirationDate,
          language: userLanguage,
        });

        await sendEmail({
          recipient: userEmail,
          subject,
          message: bodyText,
          html_body: htmlBody,
          bcc: ["admin@orionscaled.com"],
        });
        console.log("[Users] Subscription confirmation email sent to", userEmail);
      } catch (emailErr) {
        // Non-blocking — log but don't surface to user
        console.error("[Users] Failed to send subscription confirmation email:", emailErr);
      }

      message.success(t("subscriptionActivatedSuccess", "Subscription activated successfully"));
      setSubscriptionModalVisible(false);
      setSelectedUser(null);
      setRefreshFlag((flag) => !flag);
    } catch (error) {
      console.error("Error activating subscription:", error);
      message.error(t("errorActivatingSubscription", "Error activating subscription"));
    }
  };

  const handleSubscriptionModalCancel = () => {
    setSubscriptionModalVisible(false);
    setSelectedUser(null);
  };

  const handleCancelSubscription = (record) => {
    const userName = record.name || record.username;
    
    AntModal.confirm({
      title: t("cancelSubscription", "Cancel Subscription"),
      content: (
        <div>
          <p>{t("cancelSubscriptionConfirm", "Are you sure you want to cancel this user's subscription? They will no longer be able to start new searches.")}</p>
          <div style={{ marginTop: 16, padding: 12, backgroundColor: "#f5f5f5", borderRadius: 4 }}>
            <strong>{t("user", "User")}:</strong> {userName}
          </div>
        </div>
      ),
      okText: t("cancelSubscription", "Cancel Subscription"),
      okType: "danger",
      cancelText: t("cancel", "Cancel"),
      onOk: async () => {
        try {
          // Set subscription to expire now
          const updates = {
            subscription_expires_at: dayjs().toISOString(),
          };

          await updateUser(record.id, updates);
          message.success(t("subscriptionCancelledSuccess", "Subscription cancelled successfully"));
          setRefreshFlag((flag) => !flag);
        } catch (error) {
          console.error("Error cancelling subscription:", error);
          message.error(t("errorCancellingSubscription", "Error cancelling subscription"));
        }
      },
    });
  };

  if (!permissions.canManageUsers()) {
    return (
      <div
        style={{
          padding: "120px 18px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <Empty description={t("accessDenied", "Access denied.")} />
      </div>
    );
  }

  const columns = [
    {
      title: <div>{t("username", "Username")}</div>,
      dataIndex: "username",
      key: "username",
      render: (text) => (
        <Space>
          <UserOutlined />
          <span>{text}</span>
        </Space>
      ),
    },
    {
      title: <div>{t("name", "Name")}</div>,
      dataIndex: "name",
      key: "name",
      render: (name, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Input
            value={editData.name || ""}
            onChange={(e) =>
              setEditData({ ...editData, name: e.target.value })
            }
            style={{ width: "100%" }}
            placeholder={t("enterFullName", "Enter name")}
          />
        ) : (
          name || "—"
        );
      },
    },
    {
      title: <div>{t("creation", "Creation")}</div>,
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => {
        if (!date) return "—";
        return dayjs(date).format("DD/MM/YYYY");
      },
      sorter: (a, b) => {
        // Los que tienen fecha van primero
        if (!a.created_at && !b.created_at) return 0;
        if (!a.created_at) return 1;
        if (!b.created_at) return -1;
        // Ambos tienen fecha, comparar normalmente
        return dayjs(a.created_at).unix() - dayjs(b.created_at).unix();
      },
    },
    {
      title: <div>{t("active", "Active")}</div>,
      dataIndex: "active",
      key: "active",
      render: (active, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Switch
            checked={editData.active}
            onChange={(checked) =>
              setEditData({ ...editData, active: checked })
            }
          />
        ) : (
          <Tag color={active ? "#4caf50" : "default"}>
            {active ? t("active", "Active") : t("inactive", "Inactive")}
          </Tag>
        );
      },
    },
    {
      title: <div>{t("subscriptionExpires", "Subscription Expires")}</div>,
      dataIndex: "subscription_expires_at",
      key: "subscription_expires_at",
      render: (date, record) => {
        const editable = isEditing(record);
        return editable ? (
          <DatePicker
            value={editData.subscription_expires_at ? dayjs(editData.subscription_expires_at) : null}
            onChange={(date, dateString) =>
              setEditData({ ...editData, subscription_expires_at: dateString })
            }
            format="YYYY-MM-DD"
            style={{ width: "100%" }}
          />
        ) : (
          date ? dayjs(date).format("DD/MM/YYYY") : "—"
        );
      },
    },
    {
      title: <div>{t("maxApplicants", "Max Applicants")}</div>,
      dataIndex: "concurrent_applicants",
      key: "concurrent_applicants",
      render: (count, record) => {
        const editable = isEditing(record);
        return editable ? (
          <InputNumber
            value={editData.concurrent_applicants}
            onChange={(value) =>
              setEditData({ ...editData, concurrent_applicants: value })
            }
            min={0}
            style={{ width: "100%" }}
          />
        ) : (
          count || "—"
        );
      },
    },
    {
      title: <div>{t("phoneNumber", "Phone Number")}</div>,
      dataIndex: "phone_number",
      key: "phone_number",
      render: (phone, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Input
            value={editData.phone_number || ""}
            onChange={(e) =>
              setEditData({ ...editData, phone_number: e.target.value })
            }
            style={{ width: "100%" }}
          />
        ) : (
          phone || "—"
        );
      },
    },
    {
      title: <div>{t("role", "Role")}</div>,
      dataIndex: "role_id",
      key: "role_id",
      render: (roleId, record) => {
        const editable = isEditing(record);
        const roleName = roles.find((r) => r.id === roleId)?.name || roleId;
        return editable ? (
          <Select
            value={editData.role_id || ""}
            onChange={(value) => setEditData({ ...editData, role_id: value })}
            style={{ width: "100%" }}
            placeholder={t("selectRole", "Select role")}
          >
            {roles.map((role) => (
              <Option key={role.id} value={role.id}>
                {role.name}
              </Option>
            ))}
          </Select>
        ) : (
          <Tag color="blue">{roleName}</Tag>
        );
      },
    },
    {
      title: <div>{t("accountStatus", "Account Status")}</div>,
      key: "account_status",
      render: (_, record) => {
        const editable = isEditing(record);
        if (editable) {
          return (
            <Space direction="vertical" size={4}>
              <Space size={8}>
                <span style={{ fontSize: "0.75rem", color: "#888" }}>
                  {t("inTrial", "In Trial")}:
                </span>
                <Switch
                  size="small"
                  checked={editData.trial_active}
                  onChange={(checked) =>
                    setEditData({ ...editData, trial_active: checked })
                  }
                />
              </Space>
              <Space size={8}>
                <span style={{ fontSize: "0.75rem", color: "#888" }}>
                  {t("pendingValidation", "Pending")}:
                </span>
                <Switch
                  size="small"
                  checked={editData.payment_pending}
                  onChange={(checked) =>
                    setEditData({ ...editData, payment_pending: checked })
                  }
                />
              </Space>
            </Space>
          );
        }
        const isExpired =
          record.subscription_expires_at &&
          dayjs(record.subscription_expires_at).isBefore(dayjs());
        if (record.payment_pending) {
          return (
            <Tag color="warning" icon={<ClockCircleOutlined />}>
              {t("pendingValidation", "Pending")}
            </Tag>
          );
        }
        if (record.trial_active) {
          return <Tag color="#ff9800">{t("inTrial", "In Trial")}</Tag>;
        }
        if (isExpired) {
          return <Tag color="red">{t("subscriptionExpired", "Subscription Expired")}</Tag>;
        }
        return <Tag color="green">{t("subscriptionStatusActive", "Active")}</Tag>;
      },
    },
    {
      title: <div>{t("actions", "Actions")}</div>,
      key: "actions",
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              size="small"
            >
              {t("save", "Save")}
            </Button>
            <Button icon={<CloseOutlined />} onClick={handleCancel} size="small">
              {t("cancel", "Cancel")}
            </Button>
          </Space>
        ) : (
          <Space>
            <Button
              type="text"
              icon={<CreditCardOutlined />}
              onClick={() => handleActivateSubscription(record)}
              size="small"
              style={{
                opacity: hoveredRowId === record.id ? 1 : 0,
                transition: "opacity 0.2s ease-in",
                pointerEvents: hoveredRowId === record.id ? "auto" : "none",
                color: "#1890ff",
              }}
              title={t("activateSubscription", "Activate Subscription")}
            />
            <Button
              type="text"
              icon={<StopOutlined />}
              onClick={() => handleCancelSubscription(record)}
              size="small"
              style={{
                opacity: hoveredRowId === record.id ? 1 : 0,
                transition: "opacity 0.2s ease-in",
                pointerEvents: hoveredRowId === record.id ? "auto" : "none",
                color: "#ff4d4f",
              }}
              title={t("cancelSubscription", "Cancel Subscription")}
            />
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              size="small"
              style={{
                opacity: hoveredRowId === record.id ? 1 : 0,
                transition: "opacity 0.2s ease-in",
                pointerEvents: hoveredRowId === record.id ? "auto" : "none",
              }}
            />
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteUser(record)}
              size="small"
              style={{
                opacity: hoveredRowId === record.id ? 1 : 0,
                transition: "opacity 0.2s ease-in",
                pointerEvents: hoveredRowId === record.id ? "auto" : "none",
              }}
            />
          </Space>
        );
      },
    },
  ];

  const emptyDescription = (
    <span>
      {t("noUsersFound", "No users found")}
      <br />
      <small>
        {t("noUsersAvailable", "No users available in the system.")}
      </small>
    </span>
  );

  const renderMobileCard = (record) => {
    const editable = isEditing(record);
    const roleName = roles.find((r) => r.id === record.role_id)?.name || record.role_id;

    return (
      <Card
        key={record.id}
        size="small"
        style={{
          marginBottom: 16,
          width: "100%",
          borderRadius: 8,
        }}
        styles={{
          body: { padding: "16px" },
        }}
      >
        {/* Header */}
        <div
          style={{
            marginBottom: 12,
            paddingBottom: 12,
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <Typography.Title level={4} style={{ margin: 0, fontWeight: 600 }}>
            <UserOutlined style={{ marginRight: 8 }} />
            {record.username}
          </Typography.Title>
          {record.name && (
            <Typography.Text type="secondary" style={{ fontSize: "0.875rem", display: "block" }}>
              {record.name}
            </Typography.Text>
          )}
          {record.created_at && (
            <Typography.Text type="secondary" style={{ fontSize: "0.75rem", display: "block", marginTop: 4 }}>
              {t("creation", "Creation")}: {dayjs(record.created_at).format("DD/MM/YYYY")}
            </Typography.Text>
          )}
        </div>

        {/* Name (editable) */}
        {editable && (
          <div style={{ marginBottom: 12 }}>
            <Typography.Text
              type="secondary"
              style={{ fontSize: "0.75rem", display: "block", marginBottom: 4 }}
            >
              {t("name", "Name")}
            </Typography.Text>
            <Input
              value={editData.name || ""}
              onChange={(e) =>
                setEditData({ ...editData, name: e.target.value })
              }
              style={{ width: "100%" }}
              placeholder={t("enterFullName", "Enter name")}
            />
          </div>
        )}

        {/* Status */}
        <div style={{ marginBottom: 12 }}>
          <Typography.Text
            type="secondary"
            style={{ fontSize: "0.75rem", display: "block", marginBottom: 4 }}
          >
            {t("active", "Active")}
          </Typography.Text>
          {editable ? (
            <Switch
              checked={editData.active}
              onChange={(checked) =>
                setEditData({ ...editData, active: checked })
              }
            />
          ) : (
            <Tag color={record.active ? "#4caf50" : "default"}>
              {record.active ? t("active", "Active") : t("inactive", "Inactive")}
            </Tag>
          )}
        </div>

        {/* Subscription Expires */}
        <div style={{ marginBottom: 12 }}>
          <Typography.Text
            type="secondary"
            style={{ fontSize: "0.75rem", display: "block", marginBottom: 4 }}
          >
            {t("subscriptionExpires", "Subscription Expires")}
          </Typography.Text>
          {editable ? (
            <DatePicker
              value={editData.subscription_expires_at ? dayjs(editData.subscription_expires_at) : null}
              onChange={(date, dateString) =>
                setEditData({ ...editData, subscription_expires_at: dateString })
              }
              format="YYYY-MM-DD"
              style={{ width: "100%" }}
            />
          ) : (
            <Typography.Text>
              {record.subscription_expires_at ? dayjs(record.subscription_expires_at).format("DD/MM/YYYY") : "—"}
            </Typography.Text>
          )}
        </div>

        {/* Max Applicants */}
        <div style={{ marginBottom: 12 }}>
          <Typography.Text
            type="secondary"
            style={{ fontSize: "0.75rem", display: "block", marginBottom: 4 }}
          >
            {t("maxApplicants", "Max Applicants")}
          </Typography.Text>
          {editable ? (
            <InputNumber
              value={editData.concurrent_applicants}
              onChange={(value) =>
                setEditData({ ...editData, concurrent_applicants: value })
              }
              min={0}
              style={{ width: "100%" }}
            />
          ) : (
            <Typography.Text>{record.concurrent_applicants || "—"}</Typography.Text>
          )}
        </div>

        {/* Phone Number */}
        <div style={{ marginBottom: 12 }}>
          <Typography.Text
            type="secondary"
            style={{ fontSize: "0.75rem", display: "block", marginBottom: 4 }}
          >
            {t("phoneNumber", "Phone Number")}
          </Typography.Text>
          {editable ? (
            <Input
              value={editData.phone_number || ""}
              onChange={(e) =>
                setEditData({ ...editData, phone_number: e.target.value })
              }
              style={{ width: "100%" }}
            />
          ) : (
            <Typography.Text>{record.phone_number || "—"}</Typography.Text>
          )}
        </div>

        {/* Role */}
        <div style={{ marginBottom: 12 }}>
          <Typography.Text
            type="secondary"
            style={{ fontSize: "0.75rem", display: "block", marginBottom: 4 }}
          >
            {t("role", "Role")}
          </Typography.Text>
          {editable ? (
            <Select
              value={editData.role_id || ""}
              onChange={(value) => setEditData({ ...editData, role_id: value })}
              style={{ width: "100%" }}
              placeholder={t("selectRole", "Select role")}
            >
              {roles.map((role) => (
                <Option key={role.id} value={role.id}>
                  {role.name}
                </Option>
              ))}
            </Select>
          ) : (
            <Tag color="blue">{roleName}</Tag>
          )}
        </div>

        {/* Account Status */}
        <div style={{ marginBottom: 12 }}>
          <Typography.Text
            type="secondary"
            style={{ fontSize: "0.75rem", display: "block", marginBottom: 4 }}
          >
            {t("accountStatus", "Account Status")}
          </Typography.Text>
          {editable ? (
            <Space direction="vertical" size={4}>
              <Space size={8}>
                <span style={{ fontSize: "0.75rem", color: "#888" }}>
                  {t("inTrial", "In Trial")}:
                </span>
                <Switch
                  size="small"
                  checked={editData.trial_active}
                  onChange={(checked) =>
                    setEditData({ ...editData, trial_active: checked })
                  }
                />
              </Space>
              <Space size={8}>
                <span style={{ fontSize: "0.75rem", color: "#888" }}>
                  {t("pendingValidation", "Pending")}:
                </span>
                <Switch
                  size="small"
                  checked={editData.payment_pending}
                  onChange={(checked) =>
                    setEditData({ ...editData, payment_pending: checked })
                  }
                />
              </Space>
            </Space>
          ) : (
            (() => {
              const isExpired =
                record.subscription_expires_at &&
                dayjs(record.subscription_expires_at).isBefore(dayjs());
              if (record.payment_pending) {
                return (
                  <Tag color="warning" icon={<ClockCircleOutlined />}>
                    {t("pendingValidation", "Pending")}
                  </Tag>
                );
              }
              if (record.trial_active) {
                return <Tag color="#ff9800">{t("inTrial", "In Trial")}</Tag>;
              }
              if (isExpired) {
                return <Tag color="red">{t("subscriptionExpired", "Expired")}</Tag>;
              }
              return <Tag color="green">{t("subscriptionStatusActive", "Active")}</Tag>;
            })()
          )}
        </div>

        {/* Actions */}
        <Space size={8} wrap style={{ width: "100%", justifyContent: "center" }}>
          {editable ? (
            <>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                size="middle"
              >
                {t("save", "Save")}
              </Button>
              <Button
                icon={<CloseOutlined />}
                onClick={handleCancel}
                size="middle"
              >
                {t("cancel", "Cancel")}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="default"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
                size="middle"
              >
                {t("edit", "Edit")}
              </Button>
              <Button
                type="default"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteUser(record)}
                size="middle"
              >
                {t("delete", "Delete")}
              </Button>
            </>
          )}
        </Space>
      </Card>
    );
  };

  return (
    <>
      <HamburgerMenu />
      <div
        style={{
          padding: "120px 18px 0px 18px",
          margin: "0 auto",
          backgroundColor: "#f5f5f5",
          minHeight: "100vh",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        <Card
          bordered={false}
          style={{
            marginBottom: 24,
            boxShadow:
              "0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)",
            maxWidth: "1580px",
            width: "100%",
            margin: "0 auto",
            padding: isMobile ? "12px" : "0px",
            boxSizing: "border-box",
            overflowX: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
              marginBottom: 20,
            }}
          >
            <Title
              level={2}
              style={{ marginBottom: 0, marginTop: 0, color: "#2C6BA0" }}
            >
              <TeamOutlined style={{ marginRight: 8 }} />
              {t("users", "Users")}
            </Title>
          </div>

          {/* Search Bar */}
          <div style={{ marginBottom: 20, width: isMobile ? "100%" : "auto" }}>
            <Search
              placeholder={t("searchUsers", "Search by username, name, phone, country, or role")}
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={(value) => setSearchText(value)}
              style={{ 
                width: isMobile ? "100%" : 500,
                maxWidth: "100%",
              }}
            />
          </div>

          {isMobile ? (
            loading ? (
              <div style={{ padding: "48px 0", textAlign: "center" }}>
                <Empty description={t("loading", "Loading...")} />
              </div>
            ) : filteredUsers.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  searchText
                    ? t("noUsersMatchSearch", "No users match your search")
                    : emptyDescription
                }
              />
            ) : (
              <Space orientation="vertical" size={0} style={{ width: "100%" }}>
                {filteredUsers.map((record) => renderMobileCard(record))}
              </Space>
            )
          ) : (
            <Table
              columns={columns}
              dataSource={filteredUsers}
              loading={loading}
              rowKey="id"
              tableLayout="auto"
              onRow={(record, index) => ({
                style: {
                  backgroundColor: index % 2 === 0 ? "#ffffff" : "#dbecfa1a",
                  transition: "background-color 0.2s ease",
                },
                onMouseEnter: () => setHoveredRowId(record.id),
                onMouseLeave: () => setHoveredRowId(null),
              })}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} ${t("of", "of")} ${total} ${t("users", "users")}`,
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      searchText
                        ? t("noUsersMatchSearch", "No users match your search")
                        : emptyDescription
                    }
                  />
                ),
              }}
              scroll={{ x: 1400 }}
            />
          )}
        </Card>

        {/* Subscription Activation Modal */}
        <AntModal
          title={t("activateSubscription", "Activate Subscription")}
          open={subscriptionModalVisible}
          onOk={handleSubscriptionModalOk}
          onCancel={handleSubscriptionModalCancel}
          okText={t("activate", "Activate")}
          cancelText={t("cancel", "Cancel")}
          width={500}
        >
          {selectedUser && (
            <div>
              <div style={{ marginBottom: 16, padding: 12, backgroundColor: "#f5f5f5", borderRadius: 4 }}>
                <strong>{t("user", "User")}:</strong> {selectedUser.name || selectedUser.username}
                {selectedUser.requested_concurrent_applicants && (
                  <div style={{ marginTop: 6 }}>
                    <strong>{t("requestedPlan", "Requested plan")}:</strong>{" "}
                    <Tag color="blue" icon={<TeamOutlined />}>
                      {selectedUser.requested_concurrent_applicants} {t("activeSearchesLabel", "Active searches")}
                    </Tag>
                  </div>
                )}
              </div>

              {/* Duration Type Selection */}
              <div style={{ marginBottom: 16 }}>
                <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                  {t("durationType", "Duration Type")}:
                </Typography.Text>
                <Select
                  value={useDays}
                  onChange={setUseDays}
                  style={{ width: '100%' }}
                >
                  <Option value={true}>{t("numberOfDays", "Number of Days")}</Option>
                  <Option value={false}>{t("subscriptionEndDate", "Subscription End Date")}</Option>
                </Select>
              </div>

              {/* Days or Date Picker */}
              {useDays ? (
                <div style={{ marginBottom: 16 }}>
                  <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                    {t("subscriptionDays", "Subscription Days")}:
                  </Typography.Text>
                  <InputNumber
                    min={1}
                    max={365}
                    value={subscriptionDays}
                    onChange={setSubscriptionDays}
                    style={{ width: '100%' }}
                  />
                  <Typography.Text type="secondary" style={{ fontSize: '0.875rem', display: 'block', marginTop: 4 }}>
                    {t("expiresOn", "Expires on")}: {dayjs().add(subscriptionDays, 'day').format('DD/MM/YYYY')}
                  </Typography.Text>
                </div>
              ) : (
                <div style={{ marginBottom: 16 }}>
                  <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                    {t("subscriptionEndDate", "Subscription End Date")}:
                  </Typography.Text>
                  <DatePicker
                    value={subscriptionEndDate}
                    onChange={setSubscriptionEndDate}
                    style={{ width: '100%' }}
                    format="DD/MM/YYYY"
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                  />
                </div>
              )}

              {/* Max Applicants */}
              <div style={{ marginBottom: 16 }}>
                <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                  {t("maxApplicants", "Max Applicants")}:
                </Typography.Text>
                <Select
                  value={maxApplicants}
                  onChange={setMaxApplicants}
                  style={{ width: '100%' }}
                >
                  <Option value={2}>2</Option>
                  <Option value={5}>5</Option>
                  <Option value={10}>10</Option>
                </Select>
              </div>
            </div>
          )}
        </AntModal>
      </div>
    </>
  );
};

export default Users;
