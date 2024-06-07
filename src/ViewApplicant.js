import React, { useEffect, useState } from 'react';
import Banner from './Banner';
import HamburgerMenu from './HamburgerMenu';
import Footer from './Footer';
import { ApplicantDetails } from './APIFunctions';
import UpdateApplicant from './UpdateApplicant';
import './index.css';

const ViewApplicant = () => {
    const [data, setData] = useState(null); // Initialize as null to handle object data
    const fastVisaUsername = sessionStorage.getItem("fastVisa_username");
    const ApplicantUserId = sessionStorage.getItem("applicant_userid");
    const [isEditing, setIsEditing] = useState(false);
    const excludeFields = ['fastVisa_userid', 'ais_password', 'id'];

    useEffect(() => {
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
    }, [ApplicantUserId]);

    const handleEditApplicant = () => {
        setIsEditing(true);
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
                <h2>Fast Visa Scheduler</h2>
                <p>Welcome, {fastVisaUsername}</p>
                <h3>Applicant Details</h3>
                {isEditing ? (
                    <UpdateApplicant data={data} setIsEditing={setIsEditing} />
                ) : (
                    data ? (
                        <>
                            <table className="table-content" style={{ textAlign: 'left' }}>
                                <thead>
                                    <tr>
                                        <th>Field</th>
                                        <th>Value</th>
                                    </tr>
                                </thead>
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
                            <button onClick={() => handleEditApplicant()}>Edit Applicant</button>
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
