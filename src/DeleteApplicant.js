import React, { useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import Banner from './Banner';
import HamburgerMenu from './HamburgerMenu';
import Footer from './Footer';
import { ApplicantDelete } from './APIFunctions';
import './index.css';

const DeleteApplicant = () => {
    const fastVisaUsername = sessionStorage.getItem("fastVisa_username");
    const ApplicantUserId = sessionStorage.getItem("applicant_userid");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await ApplicantDelete(ApplicantUserId);
                if (response && typeof response === 'object') {
                } else {
                    console.error('Unexpected data format:', response);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        if (ApplicantUserId) {
            fetchData();
        }
    }, [ApplicantUserId]);

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
            <p>Deleted Applicant with applicant id: {ApplicantUserId}</p>
            <div style={{ marginBottom: '5px' }}></div>
            <button onClick={handleBack}>Back to Applicants</button>
            </div>
            <Footer />
        </div>
    );
};

export default DeleteApplicant;
