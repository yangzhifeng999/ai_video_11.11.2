import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NavBar, Card, List, Button } from 'antd-mobile';
import { RightOutline } from 'antd-mobile-icons';
import { useUserStore } from '@/store/userStore';
import { BottomTabBar } from '@/components/BottomTabBar';
import { Empty } from '@/components/Empty';
import { LoginModal } from '@/components/LoginModal';
import { VideoCover } from '@/components/VideoCover';
import { videoService } from '@/services/videoService';
import { ROUTES } from '@/constants/routes';
import { mockWorks, mockEarningStats } from '@/mocks';
import { formatPrice } from '@/utils';
import './Profile.css';

// 用户统计数据类型
interface UserStats {
  totalWorks: number;
  approvedWorks: number;
  pendingWorks: number;
  offlineWorks: number;
  points: number;
  totalEarnings: number;
  totalSales: number;
}

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useUserStore();
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    totalWorks: 0,
    approvedWorks: 0,
    pendingWorks: 0,
    offlineWorks: 0,
    points: 0,
    totalEarnings: 0,
    totalSales: 0,
  });
  const [recentWorks, setRecentWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 判断是否从底部导航进入（不需要返回按钮）
  const showBackButton = !location.state?.fromBottomNav;

  // 获取用户统计数据
  const fetchUserStats = async () => {
    if (!isAuthenticated) {
      // 未登录时使用默认值
      setUserStats({
        totalWorks: 0,
        approvedWorks: 0,
        pendingWorks: 0,
        offlineWorks: 0,
        points: 0,
        totalEarnings: 0,
        totalSales: 0,
      });
      setRecentWorks([]);
      return;
    }

    try {
      setLoading(true);
      
      // 获取所有作品数据
      const response = await videoService.getMyWorks({ pageSize: 100 });
      const works = response.list || [];
      
      // 计算统计数据
      const stats: UserStats = {
        totalWorks: works.length,
        approvedWorks: works.filter((w: any) => w.status === 'published' || w.status === 'approved').length,
        pendingWorks: works.filter((w: any) => 
          w.status === 'pending' || 
          (w.reviewStatus && (
            w.reviewStatus.includes('pending') || 
            w.reviewStatus === 'quoted' || 
            w.reviewStatus === 'production' || 
            w.reviewStatus === 'modifying'
          ))
        ).length,
        offlineWorks: works.filter((w: any) => w.status === 'offline' || w.status === 'rejected').length,
        points: user?.points || 0,
        totalEarnings: works.reduce((sum: number, w: any) => sum + ((w.orderCount || 0) * (w.price || 0) * 0.7), 0),
        totalSales: works.reduce((sum: number, w: any) => sum + (w.orderCount || 0), 0),
      };
      
      setUserStats(stats);
      
      // 获取最近3个作品，并映射状态
      const recent = [...works]
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)
        .map((work: any) => {
          // 状态映射
          let status = 'pending';
          if (work.status === 'published' || work.status === 'approved') {
            status = 'approved';
          } else if (work.status === 'rejected') {
            status = 'rejected';
          } else if (work.status === 'offline') {
            status = 'offline';
          }
          
          return {
            id: work._id || work.id,
            title: work.title,
            coverUrl: work.coverUrl,
            videoUrl: work.videoUrl,
            price: work.price || 0,
            status,
            sales: work.orderCount || 0,
            earnings: (work.orderCount || 0) * (work.price || 0) * 0.7,
            createdAt: work.createdAt,
          };
        });
      setRecentWorks(recent);
    } catch (error) {
      console.error('获取用户统计数据失败:', error);
      // 失败时使用备用数据
      setRecentWorks(mockWorks.slice(0, 3));
    } finally {
      setLoading(false);
    }
  };

  // 初始加载和登录状态变化时获取数据
  useEffect(() => {
    fetchUserStats();
  }, [isAuthenticated, user]);

  // 页面显示时刷新数据（从其他页面返回时）
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserStats();
    }
  }, [location.pathname]);

  // 计算用户等级（基于作品数量）
  const getUserLevel = () => {
    const totalWorks = userStats.totalWorks;
    if (totalWorks >= 50) return 'Lv.10 顶级创作者';
    if (totalWorks >= 30) return 'Lv.8 资深创作者';
    if (totalWorks >= 20) return 'Lv.6 高级创作者';
    if (totalWorks >= 10) return 'Lv.4 中级创作者';
    if (totalWorks >= 5) return 'Lv.2 初级创作者';
    return 'Lv.1 新手创作者';
  };

  // 获取状态配置（文字和颜色）
  const getStatusConfig = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: '审核中', color: '#ff8f1f' },
      approved: { text: '已上架', color: '#00b578' },
      rejected: { text: '已拒绝', color: '#ff3141' },
      offline: { text: '已下架', color: '#999' },
    };
    return statusMap[status] || { text: status, color: '#999' };
  };

  // 跳转到作品详情
  const handleWorkClick = (workId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    // 跳转到我的作品页面，并自动打开该作品的详情
    navigate(ROUTES.WORKS, { state: { workId } });
  };

  return (
    <div className="profile-page">
      <NavBar 
        onBack={showBackButton ? () => navigate(ROUTES.HOME) : undefined}
        right={
          <div className="profile-settings-icon" onClick={() => navigate(ROUTES.SETTINGS)}>
            ⚙️
          </div>
        }
      >
        我的
      </NavBar>

      <div className="profile-content">
        {/* 用户信息卡片 */}
        <Card className="profile-user-card">
          <div className="profile-user-info">
            <img
              src={user?.avatar && user.avatar.length > 0 ? user.avatar : "https://picsum.photos/seed/user/80/80"}
              alt="用户头像"
              className="profile-user-avatar"
              onClick={() => isAuthenticated && navigate(ROUTES.PROFILE_EDIT)}
              onError={(e) => {
                console.log('头像加载失败:', user?.avatar);
                e.currentTarget.src = "https://picsum.photos/seed/user/80/80";
              }}
            />
            <div className="profile-user-details">
              {isAuthenticated ? (
                <>
                  <div className="profile-user-name">
                    {user?.nickname || '创作者用户'}
                  </div>
                  <div className="profile-user-level">{getUserLevel()}</div>
                  <Button
                    size="small"
                    onClick={() => navigate(ROUTES.PROFILE_EDIT)}
                    style={{ marginTop: '8px' }}
                  >
                    编辑资料
                  </Button>
                </>
              ) : (
                <>
                  <div className="profile-user-name" style={{ color: '#999' }}>
                    未登录
                  </div>
                  <div className="profile-user-level" style={{ color: '#ccc' }}>
                    登录后查看等级
                  </div>
                  <Button
                    size="small"
                    color="primary"
                    onClick={() => setLoginModalVisible(true)}
                    style={{ marginTop: '8px' }}
                  >
                    立即登录
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* 统计数据卡片 - 2x2 网格，可点击 */}
        <div className="profile-stats-grid">
          <div 
            className="profile-stat-card" 
            onClick={() => navigate(ROUTES.WORKS, { state: { filter: 'approved' } })}
          >
            <div className="profile-stat-value">{userStats.totalWorks}</div>
            <div className="profile-stat-label">作品数量</div>
          </div>
          <div 
            className="profile-stat-card" 
            onClick={() => navigate(ROUTES.POINTS)}
          >
            <div className="profile-stat-value">{userStats.points}</div>
            <div className="profile-stat-label">我的积分</div>
          </div>
          <div 
            className="profile-stat-card" 
            onClick={() => navigate(ROUTES.WORKS, { state: { filter: 'approved' } })}
          >
            <div className="profile-stat-value">{userStats.approvedWorks}</div>
            <div className="profile-stat-label">上架中</div>
          </div>
          <div 
            className="profile-stat-card" 
            onClick={() => navigate(ROUTES.WORKS, { state: { filter: 'pending' } })}
          >
            <div className="profile-stat-value">{userStats.pendingWorks}</div>
            <div className="profile-stat-label">审核中</div>
          </div>
        </div>

        {/* 收益与提现卡片 */}
        <Card 
          className="profile-earnings-card" 
          onClick={() => navigate(ROUTES.EARNINGS)}
        >
          <div className="profile-earnings-header">
            <div className="profile-earnings-title">
              💰 收益与提现
            </div>
            <RightOutline />
          </div>
          <div className="profile-earnings-stats">
            <div className="profile-earnings-item">
              <div className="profile-earnings-label">本月收益</div>
              <div className="profile-earnings-value">¥{mockEarningStats.monthEarnings.toFixed(2)}</div>
            </div>
            <div className="profile-earnings-divider"></div>
            <div className="profile-earnings-item">
              <div className="profile-earnings-label">可提现</div>
              <div className="profile-earnings-value earnings-highlight">
                ¥{mockEarningStats.availableBalance.toFixed(2)}
              </div>
            </div>
          </div>
        </Card>

        {/* 我的作品列表 */}
        <Card className="profile-works-card">
          <div 
            className="profile-works-header"
            onClick={() => navigate(ROUTES.WORKS, { state: { filter: 'approved' } })}
            style={{ cursor: 'pointer' }}
          >
            <div className="profile-works-title">📦 我的作品</div>
            <RightOutline style={{ color: '#999' }} />
          </div>
          
          {recentWorks.length === 0 ? (
            <Empty 
              icon="📦"
              description={
                <div>
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>还没有作品哦</div>
                  <div style={{ fontSize: '14px', color: '#999' }}>快去上传你的创意吧</div>
                </div>
              }
              action={
                <Button 
                  color="primary" 
                  size="small"
                  onClick={() => navigate(ROUTES.HOME)}
                >
                  立即上传
                </Button>
              }
            />
          ) : (
            <>
              <List>
                {recentWorks.map((work) => {
                  const statusConfig = getStatusConfig(work.status);
                  return (
                    <List.Item
                      key={work.id}
                      prefix={
                        <div className="profile-work-cover">
                          <VideoCover
                            videoUrl={work.videoUrl}
                            coverUrl={work.coverUrl}
                            alt={work.title}
                            style={{ 
                              width: '60px', 
                              height: '45px', 
                              borderRadius: '4px', 
                            }}
                          />
                        </div>
                      }
                      description={
                        <div className="profile-work-meta">
                          <span style={{ color: statusConfig.color }}>
                            {statusConfig.text}
                          </span>
                          <span>¥{work.price.toFixed(2)}</span>
                          <span>销量：{work.sales}</span>
                          {work.earnings > 0 && (
                            <span style={{ color: '#ff6b6b', fontWeight: 500 }}>
                              收益：{formatPrice(work.earnings * 100)}
                            </span>
                          )}
                        </div>
                      }
                      onClick={(e) => handleWorkClick(work.id, e)}
                    >
                      <div className="profile-work-title">{work.title}</div>
                    </List.Item>
                  );
                })}
              </List>
              
              <div className="profile-works-footer">
                <Button
                  fill="none"
                  block
                  onClick={() => navigate(ROUTES.WORKS, { state: { filter: 'approved' } })}
                  style={{ color: '#667eea' }}
                >
                  查看全部作品 →
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* 登录弹窗 */}
      <LoginModal 
        visible={loginModalVisible} 
        onClose={() => setLoginModalVisible(false)} 
      />

      {/* 底部导航栏 */}
      <BottomTabBar />
    </div>
  );
};
