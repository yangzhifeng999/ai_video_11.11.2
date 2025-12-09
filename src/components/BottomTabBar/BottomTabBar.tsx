import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TabBar } from 'antd-mobile';
import { CreateModal } from '@/pages/CreateModal';
import { ROUTES } from '@/constants/routes';
import './BottomTabBar.css';

export const BottomTabBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // 根据当前路径确定激活的tab
  const getActiveKey = () => {
    const path = location.pathname;
    if (path === ROUTES.HOME) return 'home';
    if (path === ROUTES.PURCHASED) return 'purchased';
    if (path === ROUTES.MESSAGES) return 'messages';
    if (path === ROUTES.PROFILE) return 'profile';
    return 'home';
  };

  const handleTabChange = (key: string) => {
    if (key === 'create') {
      setCreateModalVisible(true);
    } else if (key === 'home') {
      navigate(ROUTES.HOME);
    } else if (key === 'purchased') {
      navigate(ROUTES.PURCHASED);
    } else if (key === 'messages') {
      navigate(ROUTES.MESSAGES);
    } else if (key === 'profile') {
      navigate(ROUTES.PROFILE);
    }
  };

  return (
    <>
      <div className="bottom-tab-bar-wrapper">
        <TabBar activeKey={getActiveKey()} onChange={handleTabChange}>
          <TabBar.Item key="home" icon={<span>🏠</span>} title="首页" />
          <TabBar.Item key="purchased" icon={<span>🛒</span>} title="已购" />
          <TabBar.Item key="create" icon={<span>➕</span>} title="创作" />
          <TabBar.Item key="messages" icon={<span>💬</span>} title="消息" />
          <TabBar.Item key="profile" icon={<span>👤</span>} title="我的" />
        </TabBar>
      </div>

      {/* 创作功能弹窗 */}
      <CreateModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
      />
    </>
  );
};

