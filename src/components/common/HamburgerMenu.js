// HamburgerMenu.js
import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../utils/AuthContext";
import { UserDetails, getRoles } from "../../services/APIFunctions";
import { Tag, Button, Divider } from "antd";
import { CreditCardOutlined, CalendarOutlined, TeamOutlined, ClockCircleOutlined, StarOutlined } from "@ant-design/icons";
import "./HamburgerMenu.css";
import EnvironmentBadge from "./EnvironmentBadge";
import TrialPaymentButton from "./TrialPaymentButton";

import { permissions } from "../../utils/permissions";

const HamburgerMenu = () => {
  const { t } = useTranslation();
  const { isAuthenticated, trialActive, subscriptionExpired, paymentPending } = useAuth();
  const location = useLocation();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userSubscriptionData, setUserSubscriptionData] = useState(null);
  const userMenuRef = useRef(null);
  const fastVisa_userid = sessionStorage.getItem("fastVisa_userid");
  const fastVisa_username = sessionStorage.getItem("fastVisa_username");
  const fastVisa_name = sessionStorage.getItem("fastVisa_name");

  // toggleMenu removed - menu remains always open in UI

  const toggleUserMenu = () => {
    setShowUserMenu((prev) => !prev);
  };
  // Close user menu when clicking outside
  useEffect(() => {
    if (!showUserMenu) return;
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  const getUserInitial = () => {
    if (fastVisa_name && fastVisa_name.trim().length > 0) {
      return fastVisa_name.charAt(0).toUpperCase();
    } else if (fastVisa_username && fastVisa_username.trim().length > 0) {
      return fastVisa_username.charAt(0).toUpperCase();
    }
    return "";
  };

  const mapRoleName = (roleName) => {
    const roleMap = {
      basic_user: t("basicUser", "Basic user"),
      visa_agent: t("visaAgent", "Visa agent"),
      administrator: t("administrator", "Administrator"),
      premium_user: t("premiumUser", "Premium user"),
    };
    return roleMap[roleName] || roleName;
  };

  const formatExpirationDate = (isoDate) => {
    if (!isoDate) return "—";
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getSubscriptionStatus = () => {
    if (!userSubscriptionData) return null;
    
    if (trialActive) {
      return {
        label: t("subscriptionStatusTrial", "Trial"),
        color: "#ff9800", // Orange
      };
    }
    
    if (subscriptionExpired) {
      return {
        label: t("subscriptionStatusExpired", "Expired"),
        color: "#f44336", // Red
      };
    }
    
    return {
      label: t("subscriptionStatusActive", "Active"),
      color: "#4caf50", // Green
    };
  };

  useEffect(() => {
    const checkUserRoleAndName = async () => {
      try {
        if (!fastVisa_userid || !isAuthenticated) {
          setShowUpgrade(false);
          setUserSubscriptionData(null);
          return;
        }

        const [userData, rolesData] = await Promise.all([
          UserDetails(fastVisa_userid),
          getRoles(),
        ]);

        if (userData && rolesData) {
          const currentRole = rolesData.find(
            (role) => role.id === userData.role_id
          );
          const roleName = currentRole ? currentRole.name : "unknown";
          setUserRole(roleName);
          setShowUpgrade(roleName === "basic_user");

          // Store user's name in sessionStorage if not already present
          if (
            userData.name &&
            sessionStorage.getItem("fastVisa_name") !== userData.name
          ) {
            sessionStorage.setItem("fastVisa_name", userData.name);
          }

          // Store subscription data
          setUserSubscriptionData({
            trial_active: userData.trial_active,
            subscription_expires_at: userData.subscription_expires_at,
            concurrent_applicants: userData.concurrent_applicants || 0,
          });
        }
      } catch (error) {
        console.error("Error checking user role or name:", error);
        setShowUpgrade(false);
        setUserSubscriptionData(null);
      }
    };

    checkUserRoleAndName();
  }, [fastVisa_userid, isAuthenticated]);

  useEffect(() => {
    // Menu is now always visible
    document.body.classList.add("menu-open");
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="hamburger-menu-icon">
      <nav className="menu open">
        <div className="menu-items">
          <div
            style={{
              padding: "12px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <EnvironmentBadge />
          </div>
          {/* Trial/Expired Payment Button - Left aligned for maximum visibility */}
          {location.pathname !== "/premium-upgrade" &&
            location.pathname !== "/subscription" && (
            <TrialPaymentButton
              trialActive={trialActive}
              subscriptionExpired={subscriptionExpired}
            />
            )}
          {showUpgrade && location.pathname !== "/premium-upgrade" && (
            <div className="menu-item premium-section">
              <Link to="/premium-upgrade" className="premium-link shiny-btn">
                <i className="fas fa-crown"></i>
                <span className="menu-text">
                  {t("upgradeToPremium", "Upgrade to Premium")}
                </span>
              </Link>
            </div>
          )}
          <div className="regular-menu-items">
            {permissions.canManageApplicants() && permissions.canManageUsers() ? (
              <Link
                to="/applicants"
                className={showUpgrade ? "first-after-premium" : ""}
                title={t("applicants", "Applicants")}
              >
                <i className="fas fa-users"></i>
              </Link>
            ) : !permissions.canManageApplicants() &&
              sessionStorage.getItem("applicant_userid") ? (
              <Link
                to={`/view-applicant/${sessionStorage.getItem(
                  "applicant_userid"
                )}`}
                className={showUpgrade ? "first-after-premium" : ""}
                title={t("myAppointment", "My Appointment")}
              >
                <i className="fas fa-calendar-check"></i>
              </Link>
            ) : null}
            {permissions.canManageUsers() && (
              <Link to="/users" title={t("users", "Users")}>
                <i className="fas fa-user-cog"></i>
              </Link>
            )}
            <div className="user-menu-container" ref={userMenuRef}>
              <div
                className="user-initial"
                onClick={toggleUserMenu}
                title={t("userMenu", "User Menu")}
              >
                {getUserInitial()}
              </div>
              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-info">
                    <div className="user-name">
                      {fastVisa_name && fastVisa_name.trim().length > 0 ? (
                        <>
                          <span style={{ fontWeight: "bold" }}>
                            {fastVisa_name}
                          </span>
                          <br />
                          <span style={{ color: "#888", fontSize: "1.1em" }}>
                            {fastVisa_username}
                          </span>
                        </>
                      ) : (
                        fastVisa_username || "User"
                      )}
                    </div>
                    <div className="user-role">
                      {mapRoleName(userRole)}
                      <br />
                      <a
                        href="/change-password"
                        className="change-password-text-link"
                      >
                        {t("changePassword", "Change Password")}
                      </a>
                    </div>
                  </div>

                  {/* Subscription Information Section */}
                  {userSubscriptionData && (
                    <>
                      <Divider style={{ margin: "8px 0" }} />
                      <div className="subscription-info-section">
                        <div className="subscription-info-title">
                          <StarOutlined style={{ marginRight: "6px" }} />
                          {t("subscriptionInfo", "Subscription")}
                        </div>
                        
                        <div className="subscription-info-item">
                          <span className="subscription-label">
                            {t("subscriptionStatus", "Status")}:
                          </span>
                          <Tag 
                            color={
                              trialActive ? "orange" : 
                              subscriptionExpired ? "red" : 
                              "green"
                            }
                            style={{ 
                              marginLeft: "auto",
                              fontWeight: "600"
                            }}
                          >
                            {getSubscriptionStatus()?.label}
                          </Tag>
                        </div>

                        <div className="subscription-info-item">
                          <CalendarOutlined style={{ color: "#666", marginRight: "6px" }} />
                          <span className="subscription-label">
                            {t("subscriptionExpiresAt", "Expires")}:
                          </span>
                          <span className="subscription-value">
                            {formatExpirationDate(userSubscriptionData.subscription_expires_at)}
                          </span>
                        </div>

                        <div className="subscription-info-item">
                          <TeamOutlined style={{ color: "#666", marginRight: "6px" }} />
                          <span className="subscription-label">
                            {t("subscriptionQuota", "Quota")}:
                          </span>
                          <span className="subscription-value">
                            {userSubscriptionData.concurrent_applicants}
                          </span>
                        </div>

                        {paymentPending && (
                          <div className="subscription-info-item" style={{ marginTop: 6 }}>
                            <Tag color="warning" icon={<ClockCircleOutlined />} style={{ marginLeft: 0 }}>
                              {t("pendingValidation", "Pending validation")}
                            </Tag>
                          </div>
                        )}

                        <Button
                          type="primary"
                          icon={<CreditCardOutlined />}
                          size="small"
                          block
                          style={{ 
                            marginTop: "10px",
                            background: "linear-gradient(135deg, #2c6ba0 0%, #1d4d73 100%)",
                            borderColor: "transparent"
                          }}
                          onClick={() => {
                            setShowUserMenu(false);
                            window.location.href = "/subscription";
                          }}
                        >
                          {t("payRenew", "Pay / Renew")}
                        </Button>
                      </div>
                      <Divider style={{ margin: "8px 0" }} />
                    </>
                  )}

                  <Link
                    to="/logout"
                    className="logout-link"
                    title={t("logout", "Log Out")}
                  >
                    <i className="fas fa-sign-out-alt"></i>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default HamburgerMenu;
