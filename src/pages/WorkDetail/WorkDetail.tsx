import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NavBar, Tabs, Card, Button, Input, TextArea, Toast, Dialog, Tag } from 'antd-mobile';
import { mockWorks } from '@/mocks';
import { formatPrice } from '@/utils';
import type { WorkStatus } from '@/types/work';
import './WorkDetail.css';

export const WorkDetail: React.FC = () => {
  const { workId } = useParams<{ workId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('detail');

  // 查找作品
  const work = mockWorks.find(w => w.id === workId);

  // 编辑表单状态
  const [editForm, setEditForm] = useState({
    title: work?.title || '',
    price: work?.price || 0,
    description: work?.description || '',
  });

  if (!work) {
    return (
      <div className="work-detail-page">
        <NavBar onBack={() => navigate(-1)}>作品详情</NavBar>
        <div className="work-detail-empty">
          <div className="empty-icon">📦</div>
          <div className="empty-text">作品不存在</div>
          <Button color="primary" onClick={() => navigate(-1)}>返回</Button>
        </div>
      </div>
    );
  }

  // 获取状态标签
  const getStatusTag = (status: WorkStatus) => {
    const statusConfig: Record<WorkStatus, { text: string; color: string }> = {
      pending: { text: '审核中', color: 'warning' },
      approved: { text: '已上架', color: 'success' },
      rejected: { text: '已拒绝', color: 'danger' },
      offline: { text: '已下架', color: 'default' },
    };
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 处理下架
  const handleOffline = () => {
    Dialog.confirm({
      content: '确定要下架该作品吗？',
      onConfirm: async () => {
        Toast.show({ content: '下架成功', icon: 'success' });
        navigate(-1);
      },
    });
  };

  // 处理发布
  const handlePublish = () => {
    Dialog.confirm({
      content: '确定要重新上架该作品吗？',
      onConfirm: async () => {
        Toast.show({ content: '上架成功', icon: 'success' });
        navigate(-1);
      },
    });
  };

  // 处理删除
  const handleDelete = () => {
    Dialog.confirm({
      content: '确定要删除该作品吗？删除后无法恢复。',
      onConfirm: async () => {
        Toast.show({ content: '删除成功', icon: 'success' });
        navigate(-1);
      },
    });
  };

  // 保存编辑
  const handleSaveEdit = () => {
    if (!editForm.title.trim()) {
      Toast.show({ content: '请输入作品标题', icon: 'fail' });
      return;
    }
    if (editForm.price <= 0 || isNaN(editForm.price)) {
      Toast.show({ content: '请输入有效的价格', icon: 'fail' });
      return;
    }
    if (editForm.price < 1 || editForm.price > 9999) {
      Toast.show({ content: '价格范围：1-9999元', icon: 'fail' });
      return;
    }
    // 验证价格最多2位小数
    if (!/^\d+(\.\d{1,2})?$/.test(editForm.price.toString())) {
      Toast.show({ content: '价格最多保留2位小数', icon: 'fail' });
      return;
    }
    
    Toast.show({ content: '保存成功', icon: 'success' });
    setActiveTab('detail');
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditForm({
      title: work.title,
      price: work.price,
      description: work.description || '',
    });
    setActiveTab('detail');
  };

  return (
    <div className="work-detail-page">
      <NavBar onBack={() => navigate(-1)}>作品详情</NavBar>

      <div className="work-detail-content">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* 详情标签页 */}
          <Tabs.Tab title="详情" key="detail">
            <div className="work-detail-tab">
              {/* 作品封面 */}
              <Card className="work-detail-cover-card">
                <img 
                  src={work.coverUrl} 
                  alt={work.title} 
                  className="work-detail-cover"
                />
                {work.videoUrl && (
                  <div className="work-detail-play-icon">▶</div>
                )}
              </Card>

              {/* 基本信息 */}
              <Card className="work-detail-info-card">
                <div className="work-detail-header">
                  <h2 className="work-detail-title">{work.title}</h2>
                  {getStatusTag(work.status)}
                </div>

                <div className="work-detail-info-list">
                  <div className="work-detail-info-item">
                    <span className="label">价格：</span>
                    <span className="value price">{formatPrice(work.price * 100)}</span>
                  </div>
                  <div className="work-detail-info-item">
                    <span className="label">销量：</span>
                    <span className="value">{work.sales}次</span>
                  </div>
                  <div className="work-detail-info-item">
                    <span className="label">收益：</span>
                    <span className="value earnings">{formatPrice(work.earnings * 100)}</span>
                  </div>
                  <div className="work-detail-info-item">
                    <span className="label">创建时间：</span>
                    <span className="value">{new Date(work.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="work-detail-info-item">
                    <span className="label">更新时间：</span>
                    <span className="value">{new Date(work.updatedAt).toLocaleString()}</span>
                  </div>
                </div>

                {work.description && (
                  <div className="work-detail-description">
                    <div className="label">作品描述：</div>
                    <div className="value">{work.description}</div>
                  </div>
                )}

                {work.status === 'rejected' && work.rejectedReason && (
                  <div className="work-detail-reject-reason">
                    <div className="label">拒绝原因：</div>
                    <div className="value">{work.rejectedReason}</div>
                  </div>
                )}
              </Card>

              {/* 操作按钮 */}
              <div className="work-detail-actions">
                {work.status === 'approved' && (
                  <>
                    <Button block color="primary" onClick={() => setActiveTab('edit')}>
                      编辑作品
                    </Button>
                    <Button block fill="outline" onClick={handleOffline}>
                      下架作品
                    </Button>
                  </>
                )}

                {work.status === 'offline' && (
                  <>
                    <Button block color="primary" onClick={handlePublish}>
                      重新上架
                    </Button>
                    <Button block fill="outline" color="danger" onClick={handleDelete}>
                      删除作品
                    </Button>
                  </>
                )}

                {work.status === 'rejected' && (
                  <>
                    <Button block color="primary" onClick={() => setActiveTab('edit')}>
                      修改后重新提交
                    </Button>
                    <Button block fill="outline" color="danger" onClick={handleDelete}>
                      删除作品
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Tabs.Tab>

          {/* 编辑标签页 */}
          <Tabs.Tab title="编辑" key="edit">
            <div className="work-edit-tab">
              <Card className="work-edit-card">
                <div className="work-edit-form">
                  <div className="form-item">
                    <div className="form-label">作品标题</div>
                    <Input
                      placeholder="请输入作品标题"
                      value={editForm.title}
                      onChange={(val) => setEditForm({ ...editForm, title: val })}
                      maxLength={50}
                    />
                  </div>

                  <div className="form-item">
                    <div className="form-label">作品价格（元）</div>
                    <Input
                      type="number"
                      placeholder="请输入价格"
                      value={editForm.price.toString()}
                      onChange={(val) => setEditForm({ ...editForm, price: parseFloat(val) || 0 })}
                    />
                    <div className="form-hint">价格范围：1-9999元</div>
                  </div>

                  <div className="form-item">
                    <div className="form-label">作品描述</div>
                    <TextArea
                      placeholder="请输入作品描述"
                      value={editForm.description}
                      onChange={(val) => setEditForm({ ...editForm, description: val })}
                      maxLength={500}
                      rows={5}
                      showCount
                    />
                  </div>
                </div>
              </Card>

              <div className="work-edit-actions">
                <Button block color="primary" onClick={handleSaveEdit}>
                  保存修改
                </Button>
                <Button block fill="outline" onClick={handleCancelEdit}>
                  取消
                </Button>
              </div>
            </div>
          </Tabs.Tab>

          {/* 数据标签页 */}
          <Tabs.Tab title="数据" key="data">
            <div className="work-data-tab">
              {/* 数据概览 */}
              <Card className="work-data-overview-card">
                <div className="work-data-overview-title">数据概览</div>
                <div className="work-data-overview-grid">
                  <div className="work-data-overview-item">
                    <div className="value">{work.sales}</div>
                    <div className="label">销量</div>
                  </div>
                  <div className="work-data-overview-item">
                    <div className="value">{formatPrice(work.earnings * 100)}</div>
                    <div className="label">收益</div>
                  </div>
                  <div className="work-data-overview-item">
                    <div className="value">{work.views || 0}</div>
                    <div className="label">浏览量</div>
                  </div>
                  <div className="work-data-overview-item">
                    <div className="value">
                      {work.views ? ((work.sales / work.views) * 100).toFixed(1) : 0}%
                    </div>
                    <div className="label">转化率</div>
                  </div>
                </div>
              </Card>

              {/* 销售趋势 */}
              <Card className="work-data-chart-card">
                <div className="work-data-chart-title">销售趋势</div>
                <div className="work-data-chart-placeholder">
                  <div className="placeholder-icon">📊</div>
                  <div className="placeholder-text">图表功能开发中</div>
                </div>
              </Card>

              {/* 用户反馈 */}
              <Card className="work-data-feedback-card">
                <div className="work-data-feedback-title">用户反馈</div>
                <div className="work-data-feedback-placeholder">
                  <div className="placeholder-icon">💬</div>
                  <div className="placeholder-text">暂无用户反馈</div>
                </div>
              </Card>
            </div>
          </Tabs.Tab>
        </Tabs>
      </div>
    </div>
  );
};

export default WorkDetail;
