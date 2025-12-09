import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TabBar as AntdTabBar } from 'antd-mobile';
import { AppOutline, UnorderedListOutline, UserOutline } from 'antd-mobile-icons';
import { ROUTES } from '@/constants/routes';
import './TabBar.css';

export const TabBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      key: ROUTES.HOME,
      title: '首页',
      icon: <AppOutline />,
    },
    {
      key: ROUTES.MY_WORKS,
      title: '我的作品',
      icon: <UnorderedListOutline />,
    },
    {
      key: ROUTES.PROFILE,
      title: '我的',
      icon: <UserOutline />,
    },
  ];

  return (
    <div className="tab-bar-container">
      <AntdTabBar activeKey={location.pathname} onChange={(key) => navigate(key)}>
        {tabs.map((item) => (
          <AntdTabBar.Item key={item.key} icon={item.icon} title={item.title} />
        ))}
      </AntdTabBar>
    </div>
  );
};

