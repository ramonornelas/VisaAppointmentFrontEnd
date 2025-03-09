import React, { useEffect, useState } from 'react';
import Banner from './Banner';
import HamburgerMenu from './HamburgerMenu';
import Footer from './Footer';
import { ApplicantSearch, GetApplicantPassword } from './APIFunctions';
import { useNavigate } from 'react-router-dom'; 
import { useAuth } from './utils/AuthContext';
import './index.css';

const Applicants = () => {
    const { isAuthenticated } = useAuth();
    const [data, setData] = useState(null); 
    const [filterActive, setFilterActive] = useState(true);
    const fastVisaUserId = sessionStorage.getItem("fastVisa_userid"); 
    const fastVisaUsername = sessionStorage.getItem("fastVisa_username"); 
    const navigate = useNavigate();
    
    // Define the included fields
    const includeFields = ['ais_schedule_id', 'ais_username', 'name', 'applicant_active', 'target_end_date', 'search_status'];
    
    useEffect(() => {
        if (!isAuthenticated) {
            document.body.classList.remove('menu-open');
            navigate('/');
            return;
        }

        const fetchData = async () => {
            try {
                const response = await ApplicantSearch(fastVisaUserId);
                const filteredData = filterActive 
                    ? response.filter(item => item.applicant_active === true) 
                    : response;
                setData(filteredData);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
    
        if (fastVisaUserId) {
            fetchData();
        }
    }, [isAuthenticated, fastVisaUserId, filterActive, navigate]);

    const handleRegisterApplicant = () => {
        navigate('/RegisterApplicant');
    };

    const handleView = (id) => {
        sessionStorage.setItem("applicant_userid", id);
        navigate(`/ViewApplicant`);
    };

    const handleAction = (id, isActive) => {
        sessionStorage.setItem("applicant_userid", id);
        const destination = isActive === 'Inactive' ? '/StartContainer' : '/StopContainer';
        navigate(destination);
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
            <button 
                className={`toggle-button ${filterActive ? 'active' : ''}`} 
                onClick={() => setFilterActive(!filterActive)}
            >
                {filterActive ? 'View all applicants' : 'Only active applicants'}
            </button>
            <div style={{ marginBottom: '5px' }}></div>
            <table className="table-content" style={{ textAlign: 'left' }}>
                <thead>
                    <tr>                        
                        <th>AIS ID</th>
                        <th>AIS Username</th>
                        <th>Name</th>
                        <th>Applicant Status</th>
                        <th>Target End Date</th>
                        <th>Search Status</th>
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
