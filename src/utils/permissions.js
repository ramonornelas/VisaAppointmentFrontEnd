export const hasPermission = (permissionName) => {
    const permissionsData = JSON.parse(sessionStorage.getItem('fastVisa_permissions') || '[]');
    return permissionsData.some((p) => p.name === permissionName);
};

export const permissions = {
    canViewAllApplicants: () => hasPermission('view_all_applicants'),
    canManageApplicants: () => hasPermission('manage_applicants'),
    canManageUsers: () => hasPermission('manage_users'),
    canResetStatus: () => hasPermission('reset_status')
};
