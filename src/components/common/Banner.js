import BannerImage from '../../assets/fastvisa-icon.png';
import '../../index.css';

const Banner = () => {
  return (
    <div className="banner-container">
      <img src={BannerImage} alt="Banner" className="banner-image"/>
    </div>
  );
};

export default Banner;
