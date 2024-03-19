import React from 'react';
import BannerImage from './banner.png';
import './index.css';

const Banner = () => {
  return (
    <div className="banner-container">
      <img src={BannerImage} alt="Banner" className="banner-image"/>
    </div>
  );
};

export default Banner;
