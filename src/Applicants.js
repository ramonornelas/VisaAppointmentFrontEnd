import React, { useEffect, useState } from 'react';
import Banner from './Banner';
import HamburgerMenu from './HamburgerMenu';
import Footer from './Footer';
import { ApplicantSearch } from './APIFunctions';
import { useNavigate } from 'react-router-dom'; 
import './index.css';

const Applicants = () => {
    const [data, setData] = useState(null); 
    const fastVisaUserId = sessionStorage.getItem("fastVisa_userid"); 
    const fastVisaUsername = sessionStorage.getItem("fastVisa_username"); 
    const navigate = useNavigate();
    
    // Define the included fields
    const includeFields = ['ais_schedule_id', 'ais_username', 'applicant_active']; // Add more fields as needed

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await ApplicantSearch(fastVisaUserId);
                setData(response);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        if (fastVisaUserId) {
            fetchData();
        }
    }, [fastVisaUserId]);

    const handleRegisterApplicant = () => {
        navigate('/RegisterApplicant');
    };

    const handleView = (id) => {
        sessionStorage.setItem("applicant_userid", id);
        navigate(`/ViewApplicant`);
    };

    const handleAction = (id, isActive) => {
        const destination = isActive === 'Active' ? `/StartContainer/${id}` : `/StopContainer/${id}`;
        navigate(destination);
    };

    const renderViewButton = (id) => (
        <td key={`edit-${id}`} style={{ textAlign: 'left' }}>
            <button onClick={() => handleView(id)}>Details</button>
        </td>
    );

    const renderBooleanValue = (value) => (
        <span>{value ? 'Active' : 'Inactive'}</span>
    );

    const renderActionButton = (id, isActive) => (
        <td key={`toggle-${id}`} style={{ textAlign: 'left' }}>
            <button onClick={() => handleAction(id, isActive)}>
                {isActive ? 'Stop' : 'Start'}
            </button>
        </td>
    );

    return (
        <div className="table-container">
            <HamburgerMenu />
            <div style={{ marginBottom: '5px' }}></div>
            <Banner />
            <div style={{ marginBottom: '5px' }}></div>
            <h2>Fast Visa Scheduler</h2>
            <p>Welcome, {fastVisaUsername}</p>
            <h3>Applicants</h3>
            <table className="table-content" style={{ textAlign: 'left' }}>
                <thead>
                    <tr>                        
                        <th>AIS ID</th>
                        <th>AIS Username</th>
                        <th>Applicant Status</th>
                        <th>Action</th>
                        <th>View</th>
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
                            {renderActionButton(item.id, item.applicant_active)}
                            {renderViewButton(item.id)}
                        </tr>
                    ))}
                </tbody>
            </table>
            <div style={{ marginBottom: '5px' }}></div>
            <button onClick={handleRegisterApplicant}>Register Applicant</button>
            <Footer />
        </div>
    );
};

export default Applicants;
