import React, { useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import Banner from './Banner';
import HamburgerMenu from './HamburgerMenu';
import Footer from './Footer';
import { ApplicantDelete } from './APIFunctions';  
import { useAuth } from './utils/AuthContext';
import './index.css';

const DeleteApplicant = () => {
    const { isAuthenticated } = useAuth();
    const fastVisaUsername = sessionStorage.getItem("fastVisa_username");
    const ApplicantUserId = sessionStorage.getItem("applicant_userid");
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAuthenticated) {
          document.body.classList.remove('menu-open');
          navigate('/');
          return;
        }

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
    }, [ApplicantUserId, isAuthenticated, navigate]);

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
            <p className="username-right">{fastVisaUsername}</p>
            <h2>Applicants</h2>
            <p>Deleted Applicant with applicant id: {ApplicantUserId}</p>
            <div style={{ marginBottom: '5px' }}></div>
            <button onClick={handleBack}>Back to Applicants</button>
            </div>
            <Footer />
        </div>
    );
};

export default DeleteApplicant;
