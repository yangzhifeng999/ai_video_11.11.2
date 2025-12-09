import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Card, Row, Col, Statistic, Button, message, Badge } from 'antd';
import { 
  UserOutlined, 
  VideoCameraOutlined, 
  ShoppingCartOutlined, 
  DollarOutlined, 
  LogoutOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { adminService } from '@/services/adminService';
import { ROUTES } from '@/constants/routes';
import type { DashboardStats, ReviewStats } from '@/types/admin';
import './AdminDashboard.css';

const { Header, Content } = Layout;

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);

  useEffect(() => {
    fetchStats();
    fetchReviewStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await adminService.getDashboard();
      setStats(data);
    } catch (error: any) {
      console.error('获取统计数据失败:', error);
      if (error?.response?.status === 401) {
        message.error('登录已过期，请重新登录');
        navigate(ROUTES.ADMIN_LOGIN);
      } else {
        message.error('获取统计数据失败');
      }
    }
  };

  const fetchReviewStats = async () => {
    try {
      const data = await adminService.getReviewStats();
      setReviewStats(data);
    } catch (error) {
      console.error('获取审核统计失败:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate(ROUTES.ADMIN_LOGIN);
    message.success('已退出登录');
  };

  return (
    <Layout className="admin-dashboard-layout">
      <Header className="admin-header">
        <div className="admin-header-content">
          <h2>管理后台</h2>
          <Button
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            退出登录
          </Button>
        </div>
      </Header>
      <Content className="admin-content">
        <div className="admin-dashboard-content">
          <h1 style={{ marginBottom: 24 }}>数据概览</h1>
          
          {stats && (
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="总用户数"
                    value={stats.totalUsers}
                    prefix={<UserOutlined />}
                    valueStyle={{ color: '#3f8600' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="活跃用户"
                    value={stats.activeUsers}
                    prefix={<UserOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="今日新增"
                    value={stats.newUsersToday}
                    prefix={<UserOutlined />}
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="总视频数"
                    value={stats.totalVideos}
                    prefix={<VideoCameraOutlined />}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="待审核"
                    value={reviewStats?.totalPending || stats.pendingReview || 0}
                    prefix={<AuditOutlined />}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="总订单数"
                    value={stats.totalOrders}
                    prefix={<ShoppingCartOutlined />}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="总收入"
                    value={stats.totalRevenue}
                    prefix={<DollarOutlined />}
                    precision={2}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
            </Row>
          )}

          <Card title="功能菜单" style={{ marginTop: 24 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Badge count={reviewStats?.totalPending || 0} offset={[-10, 10]}>
                  <Card
                    hoverable
                    onClick={() => navigate(ROUTES.ADMIN_REVIEW)}
                    style={{ textAlign: 'center', cursor: 'pointer' }}
                  >
                    <AuditOutlined style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }} />
                    <h3>内容审核</h3>
                    <p style={{ color: '#999' }}>审核用户提交的视频</p>
                  </Card>
                </Badge>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  onClick={() => navigate(ROUTES.ADMIN_VIDEOS)}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                >
                  <VideoCameraOutlined style={{ fontSize: 48, color: '#722ed1', marginBottom: 16 }} />
                  <h3>视频管理</h3>
                  <p style={{ color: '#999' }}>管理已上架视频</p>
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable
                  onClick={() => navigate(ROUTES.ADMIN_USERS)}
                  style={{ textAlign: 'center', cursor: 'pointer' }}
                >
                  <UserOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
                  <h3>用户管理</h3>
                  <p style={{ color: '#999' }}>查看和管理所有用户</p>
                </Card>
              </Col>
            </Row>
          </Card>

          {/* 待办事项 */}
          {reviewStats && (reviewStats.pendingInitial > 0 || reviewStats.pendingQuote > 0 || reviewStats.pendingFinal > 0) && (
            <Card title="待办事项" style={{ marginTop: 24 }}>
              <Row gutter={[16, 16]}>
                {reviewStats.pendingInitial > 0 && (
                  <Col xs={24} sm={12} md={8}>
                    <Card 
                      size="small" 
                      hoverable
                      onClick={() => navigate('/admin/review?status=pending_initial')}
                      style={{ borderLeft: '4px solid #ff4d4f' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>待初审</span>
                        <Badge count={reviewStats.pendingInitial} style={{ backgroundColor: '#ff4d4f' }} />
                      </div>
                    </Card>
                  </Col>
                )}
                {reviewStats.pendingQuote > 0 && (
                  <Col xs={24} sm={12} md={8}>
                    <Card 
                      size="small" 
                      hoverable
                      onClick={() => navigate('/admin/review?status=pending_quote')}
                      style={{ borderLeft: '4px solid #1890ff' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>待报价</span>
                        <Badge count={reviewStats.pendingQuote} style={{ backgroundColor: '#1890ff' }} />
                      </div>
                    </Card>
                  </Col>
                )}
                {reviewStats.production > 0 && (
                  <Col xs={24} sm={12} md={8}>
                    <Card 
                      size="small" 
                      hoverable
                      onClick={() => navigate('/admin/review?status=production')}
                      style={{ borderLeft: '4px solid #722ed1' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>制作中</span>
                        <Badge count={reviewStats.production} style={{ backgroundColor: '#722ed1' }} />
                      </div>
                    </Card>
                  </Col>
                )}
                {reviewStats.pendingFinal > 0 && (
                  <Col xs={24} sm={12} md={8}>
                    <Card 
                      size="small" 
                      hoverable
                      onClick={() => navigate('/admin/review?status=pending_final')}
                      style={{ borderLeft: '4px solid #faad14' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>待终审</span>
                        <Badge count={reviewStats.pendingFinal} style={{ backgroundColor: '#faad14' }} />
                      </div>
                    </Card>
                  </Col>
                )}
              </Row>
            </Card>
          )}
        </div>
      </Content>
    </Layout>
  );
};
