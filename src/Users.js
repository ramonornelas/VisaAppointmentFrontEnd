
import React, { useEffect, useState } from 'react';
import Banner from './Banner';
import HamburgerMenu from './HamburgerMenu';
import Footer from './Footer';
import { permissions } from './utils/permissions';
import { getUsers, updateUser, getRoles } from './APIFunctions';
import './index.css';
import { ALL_COUNTRIES } from './utils/countries';

const Users = () => {
    const [users, setUsers] = useState([]);
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
        <div className="page-container">
            <div className="content-wrap">
                <HamburgerMenu />
                <div style={{ marginBottom: '5px' }}></div>
                <Banner />
                <div style={{ marginBottom: '5px' }}></div>
                <p className="username-right">{fastVisaUsername}</p>
                <h2>Users</h2>
                <div style={{ marginBottom: '5px' }}></div>
                <table className="table-content" style={{ textAlign: 'left' }}>
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Active</th>
                            <th>Country</th>
                            <th>Expiration Date</th>
                            <th>Concurrent Applicants</th>
                            <th>Phone Number</th>
                            <th>Role</th>
                            <th>Edit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, idx) => (
                            <tr key={user.username}>
                                <td>{user.username}</td>
                                <td>{editIndex === idx ? (
                                    <input type="checkbox" name="active" checked={editData.active} onChange={handleChange} />
                                ) : (user.active ? 'Yes' : 'No')}</td>
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
                                <td>
                                    {editIndex === idx ? (
                                        <>
                                            <button onClick={handleSave}>Save</button>
                                            <button onClick={() => setEditIndex(null)} style={{ marginLeft: '5px' }}>Cancel</button>
                                        </>
                                    ) : (
                                        <button onClick={() => handleEdit(idx)}>Edit</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Footer />
        </div>
    );
};

export default Users;
