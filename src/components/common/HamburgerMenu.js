// HamburgerMenu.js
import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../utils/AuthContext";
import { UserDetails, getRoles } from "../../services/APIFunctions";
import "./HamburgerMenu.css";
import EnvironmentBadge from "./EnvironmentBadge";

import { permissions } from "../../utils/permissions";

const HamburgerMenu = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userRole, setUserRole] = useState("");
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

  useEffect(() => {
    const checkUserRoleAndName = async () => {
      try {
        if (!fastVisa_userid || !isAuthenticated) {
          setShowUpgrade(false);
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
        }
      } catch (error) {
        console.error("Error checking user role or name:", error);
        setShowUpgrade(false);
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
                          <span style={{ color: "#888", fontSize: "0.95em" }}>
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
