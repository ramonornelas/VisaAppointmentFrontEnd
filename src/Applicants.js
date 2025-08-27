import React, { useEffect, useState } from 'react';
import Banner from './Banner';
import HamburgerMenu from './HamburgerMenu';
import Footer from './Footer';
import { ApplicantSearch, GetApplicantPassword } from './APIFunctions';
import { useNavigate } from 'react-router-dom'; 
import { useAuth } from './utils/AuthContext';
import './index.css';
import { permissions } from './utils/permissions';

const Applicants = () => {
    const { isAuthenticated } = useAuth();
    const [data, setData] = useState(null);
    const [allRegisteredUsers, setAllRegisteredUsers] = useState([]);
    const [registeredByFilter, setRegisteredByFilter] = useState('');
    const [filterActive, setFilterActive] = useState(true);
    const [filterRunning, setFilterRunning] = useState(true);
    const fastVisaUserId = sessionStorage.getItem("fastVisa_userid");
    const fastVisaUsername = sessionStorage.getItem("fastVisa_username");
    const navigate = useNavigate();


    // Define the included fields
    const includeFields = ['ais_schedule_id', 'ais_username', 'name', 'applicant_active', 'target_end_date', 'search_status'];
    // Use centralized permissions utility
    const canViewAllApplicants = permissions.canViewAllApplicants();

    useEffect(() => {
        if (!isAuthenticated) {
            document.body.classList.remove('menu-open');
            navigate('/');
            return;
        }

        const fetchData = async () => {
            try {
                let response;
                if (canViewAllApplicants) {
                    response = await ApplicantSearch(null);
                } else {
                    response = await ApplicantSearch(fastVisaUserId);
                }
                // Guardar todos los usuarios únicos para el dropdown
                if (Array.isArray(response)) {
                    setAllRegisteredUsers([...new Set(response.map(item => item.fastVisa_username).filter(Boolean))]);
                }
                let filteredData = response;
                if (filterActive) {
                    filteredData = filteredData.filter(item => item.applicant_active === true);
                }
                if (filterRunning) {
                    filteredData = filteredData.filter(item => item.search_status === 'Running');
                }
                // Filtrar por Registered By si el usuario es admin y el filtro está seleccionado
                if (canViewAllApplicants && registeredByFilter) {
                    filteredData = filteredData.filter(item => item.fastVisa_username === registeredByFilter);
                }
                setData(filteredData);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        if (fastVisaUsername || fastVisaUserId) {
            fetchData();
        }
    }, [isAuthenticated, fastVisaUserId, fastVisaUsername, filterActive, filterRunning, registeredByFilter, canViewAllApplicants, navigate]);

    const handleRegisterApplicant = () => {
        navigate('/RegisterApplicant');
    };

    const handleView = (id) => {
        sessionStorage.setItem("applicant_userid", id);
        navigate(`/ViewApplicant`);
    };

    const handleAction = async (id, isActive) => {
        sessionStorage.setItem("applicant_userid", id);
        if (isActive === 'Inactive') {
            // Only allow starting if concurrent limit not reached
            try {
                // Get concurrent limit from session storage
                const concurrentLimit = parseInt(sessionStorage.getItem("concurrent_applicants"));
                // Count currently running applicants
                const applicantsResponse = await fetch('https://w3a0pdhqul.execute-api.us-west-1.amazonaws.com/applicants/search', {
                    method: 'POST',
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ fastVisa_userid: fastVisaUserId })
                });
                if (applicantsResponse.status !== 200) throw new Error('Failed to fetch applicants');
                const applicants = await applicantsResponse.json();
                const runningCount = applicants.filter(a => a.search_status === 'Running').length;
                if (runningCount >= concurrentLimit) {
                    alert(`You have reached your concurrent applicants limit (${concurrentLimit}).\nTo start a new applicant, please end one of your currently running applicants first.`);
                    return;
                }
                navigate('/StartContainer');
            } catch (error) {
                alert('Error checking concurrent applicants limit.');
                console.error(error);
            }
        } else {
            navigate('/StopContainer');
        }
    };

    const handleCopyPassword = async (id) => {
        try {
            const response = await GetApplicantPassword(id);
            const password = response.password;
            await navigator.clipboard.writeText(password);
            alert('Password copied to clipboard');
        } catch (error) {
            console.error('Error copying password:', error);
        }
    };

    const renderViewButton = (id) => (
        <td key={`edit-${id}`} style={{ textAlign: 'left' }}>
            <button onClick={() => handleView(id)}>View Details</button>
        </td>
    );

    const renderBooleanValue = (value) => (
        <span>{value ? 'Active' : 'Inactive'}</span>
    );

    const renderActionButton = (id, isActive) => (
        <td key={`toggle-${id}`} style={{ textAlign: 'left' }}>
            <button onClick={() => handleAction(id, isActive)}>
                {(isActive === 'Inactive') ? 'Start Search' : 'Stop Search'}
            </button>
        </td>
    );

    const renderPasswordButton = (id) => (
        <td key={`password-${id}`} style={{ textAlign: 'left' }}>
            <button onClick={() => handleCopyPassword(id)}>
                <i className="fas fa-key"></i>
            </button>
        </td>
    );

    return (
        <div className="page-container">
            <div className="content-wrap">
            <HamburgerMenu />
            <div style={{ marginBottom: '5px' }}></div>
            <Banner />
            <div style={{ marginBottom: '5px' }}></div>
            <p className="username-right">{fastVisaUsername}</p>
            <h2>Applicants</h2>
            <div style={{ marginBottom: '5px' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                <div className="toggle-switch" title="Filter only active" onClick={() => setFilterActive(!filterActive)}>
                    <div className={`switch-track${filterActive ? ' active' : ''}`}></div>
                    <div className={`switch-thumb${filterActive ? ' active' : ''}`}></div>
                </div>
                <span style={{ fontWeight: 'bold' }}>
                    Only active
                </span>
                <div className="toggle-switch" title="Filter only Running" onClick={() => setFilterRunning(!filterRunning)}>
                    <div className={`switch-track${filterRunning ? ' active' : ''}`}></div>
                    <div className={`switch-thumb${filterRunning ? ' active' : ''}`}></div>
                </div>
                <span style={{ fontWeight: 'bold' }}>
                    Only Running
                </span>
            </div>
            {/* Dropdown para filtrar por Registered By solo para admin, en renglón aparte con más separación */}
            {canViewAllApplicants && allRegisteredUsers.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', marginTop: '20px' }}>
                    <label htmlFor="registeredByFilter" style={{ fontWeight: 'bold' }}>Registered by:&nbsp;</label>
                    <select
                        id="registeredByFilter"
                        value={registeredByFilter}
                        onChange={e => setRegisteredByFilter(e.target.value)}
                    >
                        <option value="">All</option>
                        {allRegisteredUsers.map(username => (
                            <option key={username} value={username}>{username}</option>
                        ))}
                    </select>
                </div>
            )}
            <table className="table-content" style={{ textAlign: 'left' }}>
                <thead>
                    <tr>
                        <th>AIS ID</th>
                        <th>AIS Username</th>
                        <th>Name</th>
                        <th>Applicant Status</th>
                        <th>Target End Date</th>
                        <th>Search Status</th>
                        {canViewAllApplicants && <th>Registered By</th>}
                        <th colSpan={3} style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {data && data.map((item, index) => (
                        <tr key={item.id || index}>
                            {includeFields.map((field) => (
                                <td key={`${item.id}-${field}`} style={{ textAlign: 'left' }}>
                                    {field === 'applicant_active' ? renderBooleanValue(item[field]) : item[field]}
                                </td>
                            ))}
                            {canViewAllApplicants && (
                                <td key={`${item.id}-registeredby`} style={{ textAlign: 'left' }}>
                                    {item.fastVisa_username || ''}
                                </td>
                            )}
                            {renderActionButton(item.id, item.search_status)}
                            {renderViewButton(item.id)}
                            {renderPasswordButton(item.id)}
                        </tr>
                    ))}
                </tbody>
            </table>
            <div style={{ marginBottom: '5px' }}></div>
            <button onClick={handleRegisterApplicant}>Register Applicant</button>
            </div>
            <Footer />
        </div>
    );
};

export default Applicants;
