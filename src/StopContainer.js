import React, { useEffect} from 'react';
import Banner from './Banner';
import HamburgerMenu from './HamburgerMenu';
import Footer from './Footer';
import { StopApplicantContainer } from './APIFunctions';
import { useNavigate } from 'react-router-dom';   
import { useAuth } from './utils/AuthContext';
import './index.css';

const StopContainer = () => {
    const fastVisaUsername = sessionStorage.getItem("fastVisa_username");
    const applicantUserId = sessionStorage.getItem("applicant_userid");
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) {
          document.body.classList.remove('menu-open');
          navigate('/');
          return;
        }

        const fetchData = async () => {
            try {
                await StopApplicantContainer(applicantUserId);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        if (applicantUserId) {
            fetchData();
        }
    }, [applicantUserId, isAuthenticated, navigate]);

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
            <p>Successfully sent request to stop container for applicant id: {applicantUserId}</p>
            <p>Search Status will change to "Inactive" upon completion</p>
            <p>Go back to Applicants and Refresh page for new status</p>
            <div style={{ marginBottom: '5px' }}></div>
            <button onClick={handleBack}>Back to Applicants</button>
            </div>
            <Footer />
        </div>
    );
};

export default StopContainer;
