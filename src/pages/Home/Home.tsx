import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, Image, Toast, PullToRefresh, InfiniteScroll } from 'antd-mobile';
import { SearchOutline, UserOutline } from 'antd-mobile-icons';
import { VideoCard } from '@/components/VideoCard';
import { Empty } from '@/components/Empty';
import { BottomTabBar } from '@/components/BottomTabBar';
import { LoginModal } from '@/components/LoginModal';
import { useVideoList } from '@/hooks/useVideo';
import { useUserStore } from '@/store/userStore';
import type { VideoCategory } from '@/types';
import { ROUTES } from '@/constants/routes';
import './Home.css';

const categories: { key: VideoCategory; label: string }[] = [
  { key: 'comprehensive', label: '综合推荐' },
  { key: 'mother_baby', label: '母婴亲子' },
  { key: 'clothing', label: '时尚穿搭' },
  { key: 'general_merchandise', label: '居家百货' },
];

const bannerImages = [
  'https://picsum.photos/seed/banner1/750/300',
  'https://picsum.photos/seed/banner2/750/300',
  'https://picsum.photos/seed/banner3/750/300',
];

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<VideoCategory>('comprehensive');
  const [keyword, setKeyword] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { videos, loading, error, hasMore, loadMore, refresh } = useVideoList(activeCategory, keyword);
  const { user, isAuthenticated, loginModalVisible, setLoginModalVisible } = useUserStore();
  
  // 滚动状态，用于控制头部样式
  const [isScrolled, setIsScrolled] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (key: string) => {
    setActiveCategory(key as VideoCategory);
    // 切换分类时重置滚动位置
    if (pageRef.current) {
      pageRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 点击搜索框，聚焦输入框
  const handleSearchClick = () => {
    setSearchFocused(true);
    searchInputRef.current?.focus();
  };

  // 执行搜索（回车或点击搜索）
  const handleSearch = () => {
    if (!keyword.trim()) {
      Toast.show({ content: '请输入搜索关键词' });
      return;
    }
    setSearchFocused(false);
    Toast.show({ content: `搜索: ${keyword}` });
    // 滚动到顶部
    if (pageRef.current) {
      pageRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 点击用户图标 - 直接跳转到个人中心
  const handleUserClick = () => {
    navigate(ROUTES.PROFILE);
  };

  // 监听滚动事件
  useEffect(() => {
    const handleScroll = () => {
      if (pageRef.current) {
        setIsScrolled(pageRef.current.scrollTop > 10);
      }
    };

    const element = pageRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, []);

  return (
    <div className="home-container">
      {/* 顶部固定区域 */}
      <div className={`home-header-fixed ${isScrolled ? 'scrolled' : ''}`}>
        <div className="search-bar-wrapper">
          {/* LOGO */}
          <img 
            src="/logo-v3.svg" 
            alt="嘿哈" 
            className="home-logo"
            onClick={() => {
              if (pageRef.current) {
                pageRef.current.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          />
          
          {/* 搜索框 */}
          <div className={`search-input-box ${searchFocused ? 'focused' : ''}`}>
            <SearchOutline className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="search-input-field"
              placeholder="搜索你感兴趣的视频..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onFocus={handleSearchClick}
              onBlur={() => setSearchFocused(false)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                  searchInputRef.current?.blur();
                }
              }}
            />
          </div>

          {/* 用户图标 */}
          <div className="user-icon-wrapper" onClick={handleUserClick}>
            {isAuthenticated ? (
              <img 
                src={user?.avatar || 'https://picsum.photos/seed/default-user/36/36'} 
                alt="头像" 
                className="user-avatar-small"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/default-user/36/36';
                }}
              />
            ) : (
              <UserOutline className="user-icon" />
            )}
          </div>
        </div>
        
        {/* 分类标签栏 */}
        <div className="category-tabs">
          {categories.map((cat) => (
            <div
              key={cat.key}
              className={`category-item ${activeCategory === cat.key ? 'active' : ''}`}
              onClick={() => handleTabChange(cat.key)}
            >
              {cat.label}
              {activeCategory === cat.key && <div className="active-indicator" />}
            </div>
          ))}
        </div>
      </div>

      {/* 可滚动内容区域 */}
      <div className="home-scroll-area" ref={pageRef}>
        <PullToRefresh onRefresh={refresh}>
          {/* 标语区 */}
          <div className="slogan-section">
            <h1 className="slogan-title">无需包月 按次购买</h1>
            <p className="slogan-subtitle">海量优质视频模板，助力高效创作</p>
          </div>

          {/* 轮播图 */}
          <div className="banner-section">
            <Swiper autoplay loop indicatorProps={{ color: 'white' }} style={{ borderRadius: 12 }}>
              {bannerImages.map((img, index) => (
                <Swiper.Item key={index}>
                  <Image 
                    src={img} 
                    alt={`Banner ${index + 1}`} 
                    fit="cover" 
                    height={160}
                    style={{ borderRadius: 12 }}
                  />
                </Swiper.Item>
              ))}
            </Swiper>
          </div>

          {/* 视频列表 */}
          <div className="video-list-section">
            {error ? (
              <div className="error-state" onClick={refresh}>
                加载失败，点击重试
              </div>
            ) : videos.length === 0 && !loading ? (
              <Empty description="暂无视频数据" />
            ) : (
              <div className="video-masonry">
                {videos.map((video) => (
                  <div key={video.id} className="video-card-wrapper">
                    <VideoCard video={video} />
                  </div>
                ))}
              </div>
            )}
            
            <InfiniteScroll loadMore={loadMore} hasMore={hasMore} />
          </div>
          
          {/* 底部垫高，防止内容被 TabBar 遮挡 */}
          <div style={{ height: 60 }} />
        </PullToRefresh>
      </div>

      {/* 登录弹窗 */}
      <LoginModal 
        visible={loginModalVisible} 
        onClose={() => setLoginModalVisible(false)} 
      />

      <BottomTabBar />
    </div>
  );
};
