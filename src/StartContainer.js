import React, { useEffect, useState } from 'react';
import Banner from './Banner';
import HamburgerMenu from './HamburgerMenu';
import Footer from './Footer';
import { StartApplicantContainer } from './APIFunctions';
import { useNavigate } from 'react-router-dom'; 
import './index.css';

const StartContainer = () => {
    const [data, setData] = useState(null); 
    const fastVisaUsername = sessionStorage.getItem("fastVisa_username");
    const applicantUserId = sessionStorage.getItem("applicant_userid");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await StartApplicantContainer(applicantUserId);
                setData(response);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        if (applicantUserId) {
            fetchData();
        }
    }, [applicantUserId]);

    const handleBack = () => {
        navigate('/applicants');
    };

    return (
        <div className="page-container">
            <div className="content-wrap">
            <HamburgerMenu />
            <div style={{ marginBottom: '5px' }}></div>
            <Banner />
            <div style={{ marginBottom: '5px' }}></div>
            <h2>Fast Visa Scheduler</h2>
            <p>Welcome, {fastVisaUsername}</p>
            <h3>Applicants</h3>
            <p>Successfully sent request to start container for applicant id: {applicantUserId}</p>
            <p>Search Status will change to "Running" upon completion</p>
            <p>Go back to Applicants and Refresh page for new status</p>
            <p>Response: {data}</p>
            <div style={{ marginBottom: '5px' }}></div>
            <button onClick={handleBack}>Back to Applicants</button>
            </div>
            <Footer />
        </div>
    );
};

export default StartContainer;
