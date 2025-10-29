import React, { useEffect, useState } from 'react';
import Banner from './Banner';
import HamburgerMenu from './HamburgerMenu';
import Footer from './Footer';
import PremiumBanner from './PremiumBanner';
import { UserDetails } from './APIFunctions';
import { useNavigate } from 'react-router-dom';   
import { useAuth } from './utils/AuthContext';
import { APP_TITLE } from './constants';

import LanguageSelector from './LanguageSelector';

const Home = () => {
    const [userData, setUserData] = useState(null);
    const fastVisa_userid = sessionStorage.getItem("fastVisa_userid");
    const [username, setUsername] = useState(null);
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) {
            document.body.classList.remove('menu-open');
            navigate('/');
            return;
        }
        
        const fetchUserData = async () => {
            try {
                const data = await UserDetails(fastVisa_userid);
                setUserData(data);
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        if (fastVisa_userid) {
            fetchUserData();
        }
    }, [isAuthenticated, fastVisa_userid, navigate]);

    useEffect(() => {
        if (userData) {
            setUsername(userData.username);
        }
    }, [userData]);

    const filteredUserData = userData ? Object.fromEntries(
        Object.entries(userData).filter(([key]) => key !== 'password' && key !== 'username')
    ) : null;

    return (
        <div className="page-container">
            <div className="content-wrap">
            <HamburgerMenu />
            <div style={{ marginBottom: '5px' }}></div>
            <LanguageSelector />
            <Banner />
            <div style={{ marginBottom: '5px' }}></div>
            <PremiumBanner />
            <p className="username-right">{username}</p>
            <h2>{APP_TITLE}</h2>
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
            </div>
            <Footer />
        </div>
    );
};

export default Home;
