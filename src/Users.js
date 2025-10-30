


import React, { useEffect, useState } from 'react';
import HamburgerMenu from './HamburgerMenu';
import { permissions } from './utils/permissions';
import { getUsers, updateUser, getRoles } from './APIFunctions';
import { deleteUser } from './APIFunctions';
import Modal from './Modal';
import './index.css';
import './Applicants.css';
import { ALL_COUNTRIES } from './utils/countries';

const Users = () => {
    const [users, setUsers] = useState([]);
    // Modal state for delete confirmation
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [pendingDeleteUserId, setPendingDeleteUserId] = useState(null);

    // Show modal when delete is requested
    const requestDeleteUser = (userId) => {
        setPendingDeleteUserId(userId);
        setShowDeleteModal(true);
    };

    // Confirm delete action
    const confirmDeleteUser = async () => {
        if (pendingDeleteUserId) {
            const result = await deleteUser(pendingDeleteUserId);
            setShowDeleteModal(false);
            setPendingDeleteUserId(null);
            if (result && result.success) {
                setRefreshFlag(flag => !flag);
            } else {
                // Show error modal (optional, for now use alert)
                alert('Failed to delete user.');
            }
        }
    };

    // Cancel delete action
    const cancelDeleteUser = () => {
        setShowDeleteModal(false);
        setPendingDeleteUserId(null);
    };
    const [roles, setRoles] = useState([]);
    const [editIndex, setEditIndex] = useState(null);
    const [editData, setEditData] = useState({});
    const [refreshFlag, setRefreshFlag] = useState(false);
    const fastVisaUsername = sessionStorage.getItem("fastVisa_username");

    useEffect(() => {
        if (permissions.canManageUsers()) {
            getUsers().then(setUsers);
            getRoles().then(setRoles);
        }
    }, [refreshFlag]);

    const handleEdit = (index) => {
        setEditIndex(index);
        setEditData({ ...users[index] });
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        // Remove id, password from payload
        const { id, password, ...payload } = editData;
        await updateUser(id, payload);
        setEditIndex(null);
        setRefreshFlag(flag => !flag);
    };

    if (!permissions.canManageUsers()) {
        return <div>Access denied.</div>;
    }

    return (
        <>
            <HamburgerMenu />
            <div className="applicants-main-container">
                <h2 className="applicants-title">Users</h2>
                <div className="applicants-table-container">
                    <table className="applicants-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Active</th>
                                <th>Country</th>
                                <th>Expiration Date</th>
                                <th>Concurrent Applicants</th>
                                <th>Phone Number</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users && users.length > 0 ? (
                                users.map((user, idx) => (
                                    <tr key={user.username}>
                                        <td>{user.username}</td>
                                        <td>
                                            {editIndex === idx ? (
                                                <input type="checkbox" name="active" checked={editData.active} onChange={handleChange} />
                                            ) : (
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '2px 10px',
                                                    borderRadius: '12px',
                                                    fontWeight: 600,
                                                    fontSize: '0.95em',
                                                    color: user.active ? '#fff' : '#888',
                                                    background: user.active ? '#4caf50' : '#e0e0e0',
                                                    letterSpacing: '0.5px',
                                                    minWidth: 60,
                                                    textAlign: 'center',
                                                }}>{user.active ? 'Active' : 'Inactive'}</span>
                                            )}
                                        </td>
                                        <td>
                                            {editIndex === idx ? (
                                                <select
                                                    name="country_code"
                                                    value={editData.country_code || ""}
                                                    onChange={handleChange}
                                                >
                                                    <option value="" disabled>Select country</option>
                                                    {ALL_COUNTRIES.map(opt => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                ALL_COUNTRIES.find(opt => opt.value === user.country_code)?.label || user.country_code
                                            )}
                                        </td>
                                        <td>{editIndex === idx ? (
                                            <input name="expiration_date" value={editData.expiration_date || ''} onChange={handleChange} type="date" />
                                        ) : user.expiration_date}</td>
                                        <td>{editIndex === idx ? (
                                            <input name="concurrent_applicants" value={editData.concurrent_applicants || ''} onChange={handleChange} type="number" />
                                        ) : user.concurrent_applicants}</td>
                                        <td>{editIndex === idx ? (
                                            <input name="phone_number" value={editData.phone_number || ''} onChange={handleChange} />
                                        ) : user.phone_number}</td>
                                        <td>{editIndex === idx ? (
                                            <select name="role_id" value={editData.role_id || ''} onChange={handleChange}>
                                                <option value="" disabled>Select role</option>
                                                {roles.map((role) => (
                                                    <option key={role.id} value={role.id}>{role.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            roles.length > 0
                                                ? (roles.find(r => r.id === user.role_id)?.name || user.role_id)
                                                : user.role_id
                                        )}
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            {editIndex === idx ? (
                                                <>
                                                    <button 
                                                        className="applicants-action-btn" 
                                                        onClick={handleSave}
                                                        title="Save"
                                                        style={{ padding: '4px 8px', fontSize: '12px', marginRight: '5px' }}
                                                    >
                                                        <i className="fas fa-save"></i>
                                                    </button>
                                                    <button 
                                                        className="applicants-action-btn" 
                                                        onClick={() => setEditIndex(null)}
                                                        title="Cancel"
                                                        style={{ padding: '4px 8px', fontSize: '12px', marginRight: '5px' }}
                                                    >
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button 
                                                        className="applicants-action-btn" 
                                                        onClick={() => handleEdit(idx)}
                                                        title="Edit"
                                                        style={{ padding: '4px 8px', fontSize: '12px', marginRight: '5px' }}
                                                    >
                                                        <i className="fas fa-edit"></i>
                                                    </button>
                                                    <button 
                                                        className="applicants-action-btn" 
                                                        onClick={() => requestDeleteUser(user.id)}
                                                        title="Delete"
                                                        style={{ padding: '4px 8px', fontSize: '12px', color: '#fff', background: '#e53935' }}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: "center", padding: "40px 20px" }}>
                                        <div style={{ 
                                            display: "flex", 
                                            flexDirection: "column", 
                                            alignItems: "center", 
                                            justifyContent: "center",
                                            color: "#888",
                                            gap: "15px"
                                        }}>
                                            <i className="fas fa-user-cog" style={{ fontSize: "48px", color: "#ddd" }}></i>
                                            <div style={{ fontSize: "18px", fontWeight: "500", color: "#666" }}>
                                                No users found
                                            </div>
                                            <div style={{ fontSize: "14px", color: "#999" }}>
                                                No users available in the system.
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        {/* Delete confirmation modal */}
        <Modal
            isOpen={showDeleteModal}
            title="Delete User"
            message="Are you sure you want to delete this user? This action cannot be undone."
            type="confirm"
            onClose={cancelDeleteUser}
            onConfirm={confirmDeleteUser}
            confirmText="Delete"
            cancelText="Cancel"
            showCancel={true}
        />
        </>
    );
};

export default Users;
