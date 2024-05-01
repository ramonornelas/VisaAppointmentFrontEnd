import React, { useEffect, useState } from 'react';
import Banner from './Banner';
import HamburgerMenu from './HamburgerMenu';
import Footer from './Footer';
import { ApplicantDetails } from './APIFunctions';
import { useNavigate } from 'react-router-dom'; 
import './index.css';

const Applicants = () => {
    const [data, setData] = useState(null); // Changed 'Data' to lowercase as per convention
    const fastVisaUserId = sessionStorage.getItem("fastVisa_userid"); // Changed variable name to camelCase
    const fastVisaUsername = sessionStorage.getItem("fastVisa_username"); // Changed variable name to camelCase
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await ApplicantDetails(fastVisaUserId);
                setData(response);
            } catch (error) {
                console.error('Error fetching data:', error);
                // Optionally, you can provide feedback to the user about the error
            }
        };

        if (fastVisaUserId) {
            fetchData();
        }
    }, [fastVisaUserId]);

    const handleRegisterApplicant = () => {
        navigate('/RegisterApplicant');
    };

    const excludedFields = ['ais_password', 'fastVisa_userid', 'id']; 

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
                    {data && Object.keys(data[0]).filter(key => !excludedFields.includes(key)).map((key, index) => (
                        <th key={key} style={{ textAlign: 'left' }}>{key}</th> // Changed key to use the actual key instead of index
                    ))}
                    </tr>
                </thead>
                <tbody>
                    {data && data.map((item, rowIndex) => (
                        <tr key={item.id || rowIndex}> {/* Use a unique identifier if available */}
                            {Object.entries(item).filter(([key]) => !excludedFields.includes(key)).map(([key, value], cellIndex) => (
                                <td key={key + rowIndex} style={{ textAlign: 'left'}}>
                                    {typeof value === 'boolean' ? value.toString() : typeof value === 'object' ? JSON.stringify(value) : value}
                                </td> // Changed key to use a combination of key and rowIndex
                            ))}
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
