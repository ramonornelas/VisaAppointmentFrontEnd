import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Banner from './Banner';
import HamburgerMenu from './HamburgerMenu';
import Footer from './Footer';
import { ApplicantDetails } from './APIFunctions';
import UpdateApplicant from './UpdateApplicant';
import './index.css';
import { useAuth } from './utils/AuthContext';

const ViewApplicant = () => {
    const [data, setData] = useState(null); // Initialize as null to handle object data
    const fastVisaUsername = sessionStorage.getItem("fastVisa_username");
    const ApplicantUserId = sessionStorage.getItem("applicant_userid");
    const [isEditing, setIsEditing] = useState(false);
    const excludeFields = ['fastVisa_userid', 'ais_password', 'id'];
    const navigate = useNavigate();
    const [showAllFields, setShowAllFields] = useState(false);

    const toggleFieldsVisibility = () => {
        setShowAllFields(!showAllFields);
    };

    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) {
            document.body.classList.remove('menu-open');
            navigate('/');
            return;
        }
        const fetchData = async () => {
            try {
                const response = await ApplicantDetails(ApplicantUserId);
                if (response && typeof response === 'object') {
                    setData(response);
                } else {
                    console.error('Unexpected data format:', response);
                    setData(null); // Set to null in case of unexpected format
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setData(null); // Set to null in case of error
            }
        };

        if (ApplicantUserId) {
            fetchData();
        }
    }, [ApplicantUserId, isAuthenticated, navigate]);

    const handleEditApplicant = () => {
        setIsEditing(true);
    };

    const handleDeleteApplicant = () => {
        if (window.confirm('Are you sure you want to delete this applicant?')) {
            navigate(`/DeleteApplicant`);
        }
    };


    const renderBooleanValue = (value) => (
        <span>{value ? 'Active' : 'Inactive'}</span>
    );

    return (
        <div className="page-container">
            <div className="content-wrap">
                <HamburgerMenu />
                <div style={{ marginBottom: '5px' }}></div>
                <Banner />
                <div style={{ marginBottom: '5px' }}></div>
                <p className="username-right">{fastVisaUsername}</p>
                <h2>Applicant Details</h2>
                {isEditing ? (
                    <UpdateApplicant data={data} setIsEditing={setIsEditing} />
                ) : (
                    data ? (
                        <>
                            <div style={{ marginBottom: '5px' }}>
                                <button className={`toggle-button ${setShowAllFields ? 'active' : ''}`} onClick={toggleFieldsVisibility}>
                                    {showAllFields ? 'Only relevant fields' : 'Show all fields'}
                                </button>
                                &nbsp;
                                <button onClick={() => handleEditApplicant()}>Edit Applicant</button>
                                &nbsp;
                                <button onClick={() => handleDeleteApplicant()}>Delete Applicant</button>
                                &nbsp;
                                <button onClick={() => navigate('/Applicants')}>Back to Applicants</button>
                            </div>
                            {!showAllFields && (
                                <table className="table-content" style={{ textAlign: 'left' }}>
                                    <tbody>
                                        <tr key={'id'}>
                                            <td style={{ textAlign: 'left' }}>{'FastVisa ID'}</td>
                                            <td style={{ textAlign: 'left' }}>
                                                {data['id']}
                                            </td>
                                        </tr>
                                        <tr key={'applicant_active'}>
                                            <td style={{ textAlign: 'left' }}>{'Applicant Active'}</td>
                                            <td style={{ textAlign: 'left' }}>
                                                {data['applicant_active'] ? 'True' : 'False'}
                                            </td>
                                        </tr>
                                        <tr key={'ais_username'}>
                                            <td style={{ textAlign: 'left' }}>{'AIS Username'}</td>
                                            <td style={{ textAlign: 'left' }}>
                                                {data['ais_username']}
                                            </td>
                                        </tr>
                                        <tr key={'ais_schedule_id'}>
                                            <td style={{ textAlign: 'left' }}>{'AIS Schedule ID'}</td>
                                            <td style={{ textAlign: 'left' }}>
                                                {data['ais_schedule_id']}
                                            </td>
                                        </tr>
                                        <tr key={'name'}>
                                            <td style={{ textAlign: 'left' }}>{'Name'}</td>
                                            <td style={{ textAlign: 'left' }}>
                                                {data['name']}
                                            </td>
                                        </tr>
                                        <tr key={'number_of_applicants'}>
                                            <td style={{ textAlign: 'left' }}>{'Number of Applicants'}</td>
                                            <td style={{ textAlign: 'left' }}>
                                                {data['number_of_applicants']}
                                            </td>
                                        </tr>
                                        <tr key={'target_start_mode'}>
                                            <td style={{ textAlign: 'left' }}>{'Target Start Mode'}</td>
                                            <td style={{ textAlign: 'left' }}>
                                                {data['target_start_mode']}
                                            </td>
                                        </tr>
                                        {data['target_start_mode'] === 'days' && (
                                            <tr key={'target_start_days'}>
                                                <td style={{ textAlign: 'left' }}>{'Target Start Days'}</td>
                                                <td style={{ textAlign: 'left' }}>
                                                    {data['target_start_days']}
                                                </td>
                                            </tr>
                                        )}
                                        {data['target_start_mode'] === 'date' && (
                                            <tr key={'target_start_date'}>
                                                <td style={{ textAlign: 'left' }}>{'Target Start Date'}</td>
                                                <td style={{ textAlign: 'left' }}>
                                                    {data['target_start_date']}
                                                </td>
                                            </tr>
                                        )}
                                        <tr key={'target_end_date'}>
                                            <td style={{ textAlign: 'left' }}>{'Target End Date'}</td>
                                            <td style={{ textAlign: 'left' }}>
                                                {data['target_end_date']}
                                            </td>
                                        </tr>
                                        <tr key={'search_status'}>
                                            <td style={{ textAlign: 'left' }}>{'Search Status'}</td>
                                            <td style={{ textAlign: 'left' }}>
                                                {data['search_status']}
                                            </td>
                                        </tr>
                                        <tr key={'target_city_codes'}>
                                            <td style={{ textAlign: 'left' }}>{'Target City Codes'}</td>
                                            <td style={{ textAlign: 'left' }}>
                                                {data['target_city_codes']}
                                            </td>
                                        </tr>
                                        <tr key={'consul_appointment_date'}>
                                            <td style={{ textAlign: 'left' }}>{'Consulate Appointment Date'}</td>
                                            <td style={{ textAlign: 'left' }}>
                                                {data['consul_appointment_date']}
                                            </td>
                                        </tr>
                                        <tr key={'asc_appointment_date'}>
                                            <td style={{ textAlign: 'left' }}>{'ASC Appointment Date'}</td>
                                            <td style={{ textAlign: 'left' }}>
                                                {data['asc_appointment_date']}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                            {showAllFields && (
                                <table className="table-content" style={{ textAlign: 'left' }}>
                                    <tbody>
                                        {Object.keys(data)
                                            .filter(field => !excludeFields.includes(field)) // Exclude specified fields
                                            .map((field) => (
                                                <tr key={field}>
                                                    <td style={{ textAlign: 'left' }}>{field}</td>
                                                    <td style={{ textAlign: 'left' }}>
                                                        {(field === 'applicant_active' || field === 'search_active') ? renderBooleanValue(data[field]) : data[field]}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            )}
                        </>
                    ) : (
                        <p>No data available</p>
                    )
                )}
                <div style={{ marginBottom: '5px' }}></div>
            </div>
            <Footer />
        </div>
    );
};

export default ViewApplicant;
