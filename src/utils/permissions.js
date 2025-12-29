import { getUserPermissions } from "../services/APIFunctions";

export const hasPermission = (permissionName) => {
  const permissionsData = JSON.parse(
    sessionStorage.getItem("fastVisa_permissions") || "[]"
  );
  return permissionsData.some((p) => p.name === permissionName);
};

export const refreshPermissions = async () => {
  try {
    const fastVisaUserId = sessionStorage.getItem("fastVisa_userid");
    if (fastVisaUserId) {
      const permissionsData = await getUserPermissions(fastVisaUserId);
      if (permissionsData) {
        sessionStorage.setItem(
          "fastVisa_permissions",
          JSON.stringify(permissionsData)
        );
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error refreshing permissions:", error);
    return false;
  }
};

export const permissions = {
  canViewAllApplicants: () => hasPermission("view_all_applicants"),
  canManageApplicants: () => hasPermission("manage_applicants"),
  canManageUsers: () => hasPermission("manage_users"),
  canClearStatus: () => hasPermission("clear_status"),
  canSearchUnlimited: () => hasPermission("can_search_unlimited"),
};
