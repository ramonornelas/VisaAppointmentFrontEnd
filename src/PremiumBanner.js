import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserDetails, getRoles } from './APIFunctions';
import './PremiumBanner.css';

const PremiumBanner = () => {
  const [shouldShowBanner, setShouldShowBanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const fastVisa_userid = sessionStorage.getItem('fastVisa_userid');

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        if (!fastVisa_userid) {
          setLoading(false);
          return;
        }

        const [userData, rolesData] = await Promise.all([
          UserDetails(fastVisa_userid),
          getRoles()
        ]);

        if (userData && rolesData) {
          const currentRole = rolesData.find(role => role.id === userData.role_id);
          const roleName = currentRole ? currentRole.name : 'unknown';
          
          // Show banner only for basic users
          setShouldShowBanner(roleName === 'basic_user' || roleName === 'unknown');
        }
      } catch (error) {
        console.error('Error checking user role:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [fastVisa_userid]);

  if (loading || !shouldShowBanner) {
    return null;
  }

  return (
    <div className="premium-banner">
      <div className="premium-banner-content">
        <div className="premium-banner-text">
          <span className="premium-icon">⭐</span>
          <span className="premium-message">
            Upgrade to Premium: Start searching as early as tomorrow + custom notifications!
          </span>
        </div>
        <Link to="/premium-upgrade" className="premium-banner-button">
          Upgrade Now - $10/month
        </Link>
      </div>
    </div>
  );
};

export default PremiumBanner;