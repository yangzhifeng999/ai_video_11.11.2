import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, Card, Image, Button, Toast } from 'antd-mobile';
import { NavBar } from '@/components/NavBar';
import { Empty } from '@/components/Empty';
import { CreateModal } from '@/pages/CreateModal';
import { mockWorks } from '@/mocks';
import { formatPrice } from '@/utils';
import type { WorkStatus } from '@/types/work';
import './Works.css';

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'approved', label: '已上架' },
  { key: 'pending', label: '审核中' },
  { key: 'offline', label: '已下架' },
];

export const Works: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  
  // 从路由参数获取初始筛选状态
  const initialFilter = (location.state as any)?.filter || 'all';
  const [activeStatus, setActiveStatus] = useState<string>(initialFilter);

  // 清除路由状态，避免刷新时保留筛选
  useEffect(() => {
    if (location.state) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // 统计数据
  const stats = {
    all: mockWorks.length,
    approved: mockWorks.filter(w => w.status === 'approved').length,
    pending: mockWorks.filter(w => w.status === 'pending').length,
    offline: mockWorks.filter(w => w.status === 'offline').length,
  };

  // 筛选作品
  const filteredWorks = activeStatus === 'all' 
    ? mockWorks 
    : mockWorks.filter(w => w.status === activeStatus);

  // 获取状态标签
  const getStatusLabel = (status: WorkStatus) => {
    const statusMap: Record<WorkStatus, string> = {
      pending: '审核中',
      approved: '已上架',
      rejected: '已拒绝',
      offline: '已下架',
    };
    return statusMap[status];
  };

  // 获取状态样式
  const getStatusClass = (status: WorkStatus) => {
    return `status-${status}`;
  };

  return (
    <div className="works-page">
      <NavBar 
        title="我的作品"
        right={
          <Button 
            size="small" 
            color="primary"
            onClick={() => setCreateModalVisible(true)}
          >
            + 上传
          </Button>
        }
      />
      
      <div className="works-content">
        {/* 统计卡片 */}
        <div className="works-stats">
          <div className="works-stat-item">
            <div className="works-stat-value">{stats.all}</div>
            <div className="works-stat-label">全部</div>
          </div>
          <div className="works-stat-item">
            <div className="works-stat-value">{stats.approved}</div>
            <div className="works-stat-label">上架中</div>
          </div>
          <div className="works-stat-item">
            <div className="works-stat-value">{stats.pending}</div>
            <div className="works-stat-label">审核中</div>
          </div>
        </div>

        {/* 状态筛选标签 */}
        <div className="works-status-tabs">
          <Tabs activeKey={activeStatus} onChange={(key) => setActiveStatus(key)}>
            {statusTabs.map((tab) => (
              <Tabs.Tab title={tab.label} key={tab.key} />
            ))}
          </Tabs>
        </div>

        {/* 作品列表 */}
        <div className="works-list-container">
          {filteredWorks.length === 0 ? (
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
                  size="large"
                  onClick={() => setCreateModalVisible(true)}
                >
                  立即上传
                </Button>
              }
            />
          ) : (
            <div className="works-list">
              {filteredWorks.map((work) => (
                <Card key={work.id} className="work-item">
                  {/* 封面图 */}
                  <div className="work-item-cover">
                    <Image 
                      src={work.coverUrl} 
                      alt={work.title} 
                      fit="cover"
                      lazy
                      style={{ width: '100%', height: '100%', borderRadius: '8px' }}
                    />
                    {work.videoUrl && (
                      <div className="work-item-play-icon">▶</div>
                    )}
                  </div>

                  {/* 作品信息 */}
                  <div className="work-item-info">
                    <div className="work-item-title">{work.title}</div>
                    
                    <div className="work-item-details">
                      <div className="work-item-detail-row">
                        <span className="work-item-detail-label">状态：</span>
                        <span className={`work-item-status ${getStatusClass(work.status)}`}>
                          {getStatusLabel(work.status)}
                        </span>
                      </div>
                      
                      <div className="work-item-detail-row">
                        <span className="work-item-detail-label">价格：</span>
                        <span className="work-item-price">{formatPrice(work.price * 100)}</span>
                      </div>
                      
                      <div className="work-item-detail-row">
                        <span className="work-item-detail-label">销量：</span>
                        <span>{work.sales}次</span>
                      </div>
                      
                      <div className="work-item-detail-row">
                        <span className="work-item-detail-label">收益：</span>
                        <span className="work-item-earnings">{formatPrice(work.earnings * 100)}</span>
                      </div>
                      
                      <div className="work-item-detail-row">
                        <span className="work-item-detail-label">
                          {work.status === 'offline' ? '下架时间：' : '上传时间：'}
                        </span>
                        <span className="work-item-time">
                          {new Date(work.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="work-item-actions">
                      {work.status === 'approved' && (
                        <>
                          <Button 
                            size="small" 
                            fill="outline"
                            onClick={() => navigate(`/works/${work.id}/edit`)}
                          >
                            编辑
                          </Button>
                          <Button 
                            size="small" 
                            fill="outline"
                            onClick={() => {
                              Toast.show({ content: '下架功能开发中' });
                            }}
                          >
                            下架
                          </Button>
                          <Button 
                            size="small" 
                            color="primary"
                            onClick={() => navigate(`/works/${work.id}`)}
                          >
                            查看数据
                          </Button>
                        </>
                      )}
                      
                      {work.status === 'pending' && (
                        <Button 
                          size="small" 
                          block
                          fill="outline"
                          onClick={() => navigate(`/works/${work.id}`)}
                        >
                          查看详情
                        </Button>
                      )}
                      
                      {work.status === 'offline' && (
                        <>
                          <Button 
                            size="small" 
                            color="primary"
                            onClick={() => {
                              Toast.show({ content: '重新上架功能开发中' });
                            }}
                          >
                            重新上架
                          </Button>
                          <Button 
                            size="small" 
                            fill="outline"
                            onClick={() => {
                              Toast.show({ content: '删除功能开发中' });
                            }}
                          >
                            删除
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 创作功能弹窗 */}
      <CreateModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
      />
    </div>
  );
};
