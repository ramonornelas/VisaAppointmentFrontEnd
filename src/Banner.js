import BannerImage from './banner.jpg';
import './Index.css';

const Banner = () => {
  return (
    <div className="banner-container">
      <img src={BannerImage} alt="Banner" className="banner-image"/>
    </div>
  );
};

export default Banner;
