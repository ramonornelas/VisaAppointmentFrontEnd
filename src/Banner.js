import BannerImage from './assets/banner.jpeg';
import './index.css';

const Banner = () => {
  return (
    <div className="banner-container">
      <img src={BannerImage} alt="Banner" className="banner-image"/>
    </div>
  );
};

export default Banner;
