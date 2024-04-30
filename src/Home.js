import React, { useEffect, useState } from 'react';
import Banner from './Banner';
import HamburgerMenu from './HamburgerMenu';
import Footer from './Footer';
import { UserDetails } from './APIFunctions';

const Home = () => {
    const [userData, setUserData] = useState(null);
    const userId = sessionStorage.getItem("userId");
    const [username, setUsername] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const data = await UserDetails(userId);
                setUserData(data);
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        if (userId) {
            fetchUserData();
        }
    }, [userId]);

    useEffect(() => {
        if (userData) {
            setUsername(userData.username);
        }
    }, [userData]);

    const filteredUserData = userData ? Object.fromEntries(
        Object.entries(userData).filter(([key]) => key !== 'password' && key !== 'username')
    ) : null;

    return (
        <div>
            <HamburgerMenu />
            <div style={{ marginBottom: '5px' }}></div>
            <Banner />
            <div style={{ marginBottom: '5px' }}></div>
            <h2>Fast Visa Scheduler </h2>
            <p>Welcome, {username}</p>
            {filteredUserData && (
                <>
                    <h3>User Data:</h3>
                    <table style={{ textAlign: 'left' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left' }}>Field</th>
                                <th style={{ textAlign: 'left' }}>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            {Object.entries(filteredUserData).map(([key, value]) => (
                                <tr key={key}>
                                    <td style={{ textAlign: 'left' }}>{key}</td>
                                    <td style={{ textAlign: 'left' }}>{typeof value === 'boolean' ? value.toString() : value}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
            <Footer />
        </div>
    );
};

export default Home;
