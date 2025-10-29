
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Banner from './Banner';
import Footer from './Footer';
import './LogIn.css';
import LanguageSelector from './LanguageSelector';

const LogIn = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { t } = useTranslation();
  const permissionsErrorMsg = t('permissionsErrorMsg', 'Please contact the administrator to grant you access to the system.');

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('https://w3a0pdhqul.execute-api.us-west-1.amazonaws.com/auth/login', {
        method: 'POST',
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.status === 200) {
        const searchuserresponse = await fetch('https://w3a0pdhqul.execute-api.us-west-1.amazonaws.com/users/search', {
          method: 'POST',
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ username }),
        });

        if (searchuserresponse.status === 200) {
          const searchuserdata = await searchuserresponse.json();
          const searchuserid = searchuserdata[0].id;
          const searchusername = searchuserdata[0].username;
          const countryCode = searchuserdata[0].country_code;
          const concurrentApplicants = searchuserdata[0].concurrent_applicants;
          const searchname = searchuserdata[0].name;
          sessionStorage.setItem("fastVisa_userid", searchuserid);
          sessionStorage.setItem("fastVisa_username", searchusername);
          sessionStorage.setItem("country_code", countryCode);
          sessionStorage.setItem("concurrent_applicants", concurrentApplicants);
          if (searchname) {
            sessionStorage.setItem("fastVisa_name", searchname);
          }

          // Fetch and store user permissions
          try {
            const permissionsResponse = await fetch(`https://w3a0pdhqul.execute-api.us-west-1.amazonaws.com/users/permissions/${searchuserid}`);
            if (permissionsResponse.status === 200) {
              const permissionsData = await permissionsResponse.json();
              sessionStorage.setItem("fastVisa_permissions", JSON.stringify(permissionsData));
            } else {
              setError(permissionsErrorMsg);
              return;
            }
          } catch (permError) {
            console.error('Error fetching permissions:', permError);
          }

          window.location.href = '/applicants'; // Redirect to applicants page since it's the only active page so far
        } else {
          throw new Error('Failed to fetch user data');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to log in');
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.message)
    }
  };

  return (
    <div className="login-root">
      <LanguageSelector />
      <div className="content-wrap">
        <Banner />
        <div className="login-container">
          <div style={{height: '24px'}}></div>

          {/* Try the app button - prominently placed before login */}
          <div style={{ textAlign: 'center', margin: '0 0 30px 0' }}>
            <button
              type="button"
              className="quick-start-button"
              onClick={() => window.location.href = '/quickstart'}
              style={{
                width: '100%',
                maxWidth: '340px',
                padding: '14px 24px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '17px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#059669';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 12px rgba(16, 185, 129, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#10b981';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 6px rgba(16, 185, 129, 0.3)';
              }}
            >
              ⚡ {t('tryAppNow', 'Try the app now')}
            </button>
            <p style={{ color: '#666', fontSize: '14px', marginTop: '8px', marginBottom: '0' }}>
              {t('noRegistrationRequired', 'No registration required')}
            </p>
            <p style={{ color: '#999', fontSize: '14px', marginBottom: '0' }}>
              {t('orLoginBelow', 'Or login to access all features')}
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} autoComplete="on">
            <div className="input-group">
              <label htmlFor="username" className="login-label">{t('username', 'E-mail')}</label>
              <input
                type="text"
                id="username"
                className="login-input"
                value={username}
                onChange={handleUsernameChange}
                autoComplete="username"
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="password" className="login-label">{t('password', 'Password')}</label>
              <input
                type="password"
                id="password"
                className="login-input"
                value={password}
                onChange={handlePasswordChange}
                autoComplete="current-password"
                required
              />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="login-button">{t('login', 'Log In')}</button>
          </form>
          <p className="register-link">{t('noAccount', "Don't have an account?")} <a href="/registeruser">{t('register', 'Register here')}</a></p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LogIn;
