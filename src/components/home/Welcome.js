import React from 'react';
// Link import removed: not used
import { useTranslation } from 'react-i18next';

const Welcome = ({ name }) => {
  const { t } = useTranslation();

  return (
    <div>
      <div style={{ marginBottom: '5px' }}></div>
      <h2>{t('welcomeUser', { name })}</h2>
      <p>{t('registeredSuccessfully')}</p>
      <p>{t('loginToGetAppointment')}</p>
    </div>
  );
};

export default Welcome;
