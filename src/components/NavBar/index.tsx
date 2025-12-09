import { NavBar as AntdNavBar } from 'antd-mobile';
import { useNavigate } from 'react-router-dom';

interface NavBarProps {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

export const NavBar: React.FC<NavBarProps> = ({ title, onBack, right }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return <AntdNavBar onBack={handleBack} right={right}>{title || null}</AntdNavBar>;
};





