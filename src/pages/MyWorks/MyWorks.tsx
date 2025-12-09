import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NavBar, Tabs, Card, Tag, Empty, Button, Toast, Popup, Input, TextArea, Dialog, DotLoading } from 'antd-mobile';
import { CloseOutline } from 'antd-mobile-icons';
import { BottomTabBar } from '@/components/BottomTabBar';
import { VideoCover } from '@/components/VideoCover';
import { videoService } from '@/services/videoService';
import { ROUTES } from '@/constants/routes';
import type { WorkStatus, IWork } from '@/types';
import { useUserStore } from '@/store/userStore';
import './MyWorks.css';

const MyWorks: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useUserStore();
  
  // 从 location.state 获取初始 tab，默认为 'pending'
  const getInitialTab = (): WorkStatus | 'rejected_offline' => {
    const state = location.state as { filter?: WorkStatus | 'rejected_offline' } | null;
    if (state?.filter) {
      if (state.filter === 'rejected' || state.filter === 'offline') {
        return 'rejected_offline';
      }
      return state.filter;
    }
    return 'pending';
  };
  
  const [activeTab, setActiveTab] = useState<WorkStatus | 'rejected_offline'>(getInitialTab());
  const [works, setWorks] = useState<IWork[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 详情弹窗状态
  const [selectedWork, setSelectedWork] = useState<IWork | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // 编辑表单状态
  const [editForm, setEditForm] = useState({
    title: '',
    price: '',
    description: '',
  });
  
  // 价格范围状态
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0, duration: 0 });

  // 获取我的作品列表
  const fetchMyWorks = async () => {
    // 检查是否有 token（从 localStorage 获取）
    const token = localStorage.getItem('token');
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await videoService.getMyWorks();
      // 转换后端数据为前端格式
      const worksList: IWork[] = (response.list || []).map((item: any) => {
        // 将 reviewStatus/status 转换为前端 status 字段
        // 优先判断已上架状态
        let status: WorkStatus = 'pending';
        
        // 已上架状态：reviewStatus=published 或 status=published/approved
        if (item.reviewStatus === 'published' || 
            item.status === 'published' || 
            item.status === 'approved') {
          status = 'approved';
        } 
        // 已拒绝状态
        else if (item.reviewStatus === 'initial_rejected' || 
                 item.reviewStatus === 'rejected' ||
                 item.status === 'rejected') {
          status = 'rejected';
        } 
        // 已下架状态
        else if (item.reviewStatus === 'offline' || item.status === 'offline') {
          status = 'offline';
        } 
        // 审核中状态（包括各种中间状态）
        else if (
          item.reviewStatus && 
          (item.reviewStatus.includes('pending') || 
           item.reviewStatus === 'quoted' || 
           item.reviewStatus === 'production' || 
           item.reviewStatus === 'modifying' ||
           item.reviewStatus === 'merging')
        ) {
          status = 'pending';
        } 
        // 默认为审核中
        else if (item.status === 'pending' || item.status === 'processing') {
          status = 'pending';
        }
        
        // 调试：打印完整的状态信息
        console.log('作品状态映射:', {
          title: item.title,
          _id: item._id,
          reviewStatus: item.reviewStatus,
          status: item.status,
          '-> 前端status': status,
          '原始数据': item
        });

        return {
          id: item._id || item.id,
          title: item.title,
          type: item.comparisonVideoUrl ? 'video' : 'video',
          coverUrl: item.coverUrl || '/placeholder.png',
          videoUrl: item.videoUrl,
          price: item.price || 0,
          status,
          reviewStatus: item.reviewStatus,
          sales: item.orderCount || 0,
          views: item.viewCount || 0,
          earnings: (item.orderCount || 0) * (item.price || 0) * 0.7, // 假设70%分成
          rejectedReason: item.rejectReason,
          description: item.description,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt || item.createdAt,
        };
      });
      
      // 按创建时间倒序排列（最新的在前）
      worksList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      setWorks(worksList);
    } catch (error) {
      console.error('获取作品列表失败:', error);
      Toast.show({ content: '获取作品列表失败', icon: 'fail' });
    } finally {
      setLoading(false);
    }
  };

  // 处理路由参数和初始化
  useEffect(() => {
    const state = location.state as { workId?: string; filter?: WorkStatus | 'rejected_offline'; refresh?: boolean } | null;
    
    // 检查 filter 并更新 activeTab
    if (state?.filter) {
      const newTab = (state.filter === 'rejected' || state.filter === 'offline') 
        ? 'rejected_offline' 
        : state.filter;
      setActiveTab(newTab);
    }

    // 获取作品数据
    if (isAuthenticated) {
      fetchMyWorks();
    }
  }, [location.key, isAuthenticated]);

  // 单独处理打开指定作品详情（需要等待 works 数据加载完成）
  useEffect(() => {
    const state = location.state as { workId?: string } | null;
    
    if (state?.workId && works.length > 0 && !loading) {
      const work = works.find(w => w.id === state.workId);
      if (work) {
        // 根据作品状态自动切换到对应的 Tab
        if (work.status === 'rejected' || work.status === 'offline') {
          setActiveTab('rejected_offline');
        } else if (work.status === 'approved') {
          setActiveTab('approved');
        } else {
          setActiveTab('pending');
        }
        
        // 打开作品详情
        setTimeout(() => {
          handleWorkClick(work);
        }, 50);
        
        // 清除 state 防止重复触发
        window.history.replaceState({}, document.title);
      }
    }
  }, [works, loading, location.state]);

  // 根据状态筛选作品
  const filteredWorks = useMemo(() => {
    if (activeTab === 'rejected_offline') {
      return works.filter(w => w.status === 'rejected' || w.status === 'offline');
    }
    return works.filter(w => w.status === activeTab);
  }, [works, activeTab]);

  // 状态标签配置
  const getStatusTag = (status: WorkStatus) => {
    const statusConfig = {
      pending: { text: '审核中', color: 'warning' },
      approved: { text: '已上架', color: 'success' },
      rejected: { text: '已拒绝', color: 'danger' },
      offline: { text: '已下架', color: 'default' },
      published: { text: '已上架', color: 'primary' },
    };
    const config = statusConfig[status] || { text: '未知', color: 'default' };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 模拟计算价格范围
  const calculatePriceRange = (work: IWork) => {
    if (work.type === 'text') {
      return { min: 10, max: 500, duration: 0 };
    }

    const hash = work.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const duration = 30 + (hash % 270); 
    
    let min = 50, max = 100;
    if (duration < 60) {
      min = 30; max = 60;
    } else if (duration < 180) {
      min = 50; max = 100;
    } else if (duration < 300) {
      min = 80; max = 150;
    } else {
      min = 100; max = 200;
    }
    return { min, max, duration };
  };

  // 打开详情
  const handleWorkClick = (work: IWork) => {
    setSelectedWork(work);
    setDetailVisible(true);
    setIsEditing(false);
    
    setEditForm({
      title: work.title,
      price: work.price.toString(),
      description: work.description || '',
    });
    
    setPriceRange(calculatePriceRange(work));
  };

  // 关闭详情
  const handleCloseDetail = () => {
    setDetailVisible(false);
    setSelectedWork(null);
  };

  // 切换编辑模式
  const handleEditClick = () => {
    setIsEditing(true);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    if (selectedWork) {
      setEditForm({
        title: selectedWork.title,
        price: selectedWork.price.toString(),
        description: selectedWork.description || '',
      });
    }
    setIsEditing(false);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editForm.title.trim()) {
      Toast.show({ content: '请输入作品标题', icon: 'fail' });
      return;
    }
    
    const priceNum = parseFloat(editForm.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      Toast.show({ content: '请输入有效的价格', icon: 'fail' });
      return;
    }

    if (priceNum < priceRange.min || priceNum > priceRange.max) {
      Toast.show({ 
        content: `价格范围必须在 ¥${priceRange.min} - ¥${priceRange.max} 之间`, 
        icon: 'fail' 
      });
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(editForm.price)) {
      Toast.show({ content: '价格最多保留2位小数', icon: 'fail' });
      return;
    }

    if (!selectedWork) return;

    try {
      // 调用后端 API 更新作品
      await videoService.updateWork(selectedWork.id, {
        title: editForm.title,
        description: editForm.description,
        price: priceNum,
      });

      // 重新获取数据以确保同步
      await fetchMyWorks();
      setIsEditing(false);
      setDetailVisible(false);
      Toast.show({ content: '保存成功', icon: 'success' });
    } catch (error: any) {
      console.error('保存失败:', error);
      Toast.show({ 
        content: error?.response?.data?.message || '保存失败', 
        icon: 'fail' 
      });
    }
  };

  // 处理下架/删除/重新上架
  const handleStatusChange = (newStatus: WorkStatus, actionName: string) => {
    Dialog.confirm({
      content: `确定要${actionName}吗？`,
      onConfirm: async () => {
        if (!selectedWork) return;

        try {
          if (newStatus === 'deleted' as any) {
            // 调用后端 API 删除
            await videoService.deleteWork(selectedWork.id);
            
            // 从列表中移除
            setWorks(works.filter(w => w.id !== selectedWork.id));
            setDetailVisible(false);
            Toast.show({ content: `${actionName}成功`, icon: 'success' });
          } else {
            // 调用后端 API 更新状态
            await videoService.updateWorkStatus(
              selectedWork.id, 
              newStatus === 'offline' ? 'offline' : 'approved'
            );
            
            // 重新获取数据以确保状态同步
            await fetchMyWorks();
            setDetailVisible(false);
            Toast.show({ content: `${actionName}成功`, icon: 'success' });
          }
        } catch (error: any) {
          console.error(`${actionName}失败:`, error);
          Toast.show({ 
            content: error?.response?.data?.message || `${actionName}失败`, 
            icon: 'fail' 
          });
        }
      },
    });
  };

  return (
    <div className="my-works-page">
      <NavBar onBack={() => navigate(ROUTES.PROFILE)}>我的作品</NavBar>

      {/* 状态筛选标签 */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as WorkStatus | 'rejected_offline')}
        className="works-tabs"
      >
        <Tabs.Tab title="审核中" key="pending" />
        <Tabs.Tab title="已上架" key="approved" />
        <Tabs.Tab title="拒绝/下架" key="rejected_offline" />
      </Tabs>

      {/* 作品列表 */}
      <div className="works-list">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <DotLoading color="primary" />
            <div style={{ marginTop: 12, color: '#999' }}>加载中...</div>
          </div>
        ) : !isAuthenticated ? (
          <Empty
            description="请先登录查看您的作品"
            imageStyle={{ width: 128 }}
          />
        ) : filteredWorks.length === 0 ? (
          <Empty
            description="暂无作品"
            imageStyle={{ width: 128 }}
          />
        ) : (
          filteredWorks.map((work) => (
            <Card
              key={work.id}
              className="work-card"
              onClick={() => handleWorkClick(work)}
            >
              <div className="work-card-content-wrapper">
                <VideoCover 
                  videoUrl={work.videoUrl}
                  coverUrl={work.coverUrl !== '/placeholder.png' ? work.coverUrl : undefined}
                  alt={work.title}
                  className="work-card-cover"
                />
                
                <div className="work-card-info">
                  <div className="work-card-header-new">
                    <div className="work-title-new">{work.title}</div>
                    {getStatusTag(work.status)}
                  </div>

                  <div className="work-info-grid">
                    <div className="info-item">
                      价格：<span className="info-value-highlight">¥{work.price.toFixed(2)}</span>
                    </div>
                    <div className="info-item">
                      销量：{work.sales || 0}
                    </div>
                    <div className="info-item">
                      收益：<span className="info-value-green">¥{work.earnings?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="info-item">
                      更新：{new Date(work.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* 详情弹窗 */}
      <Popup
        visible={detailVisible}
        onMaskClick={handleCloseDetail}
        position="bottom"
        bodyStyle={{ height: '85vh' }}
        className="work-detail-popup"
      >
        <div className="popup-header">
          <span>{isEditing ? '编辑作品' : '作品详情'}</span>
          <span className="popup-close" onClick={handleCloseDetail}>
            <CloseOutline />
          </span>
        </div>

        <div className="popup-scroll-content">
          {selectedWork && (
            <>
              {!isEditing && (
                <Card className="detail-cover-card">
                  {selectedWork.videoUrl ? (
                    <video 
                      src={selectedWork.videoUrl} 
                      controls 
                      className="detail-video"
                      playsInline
                    />
                  ) : (
                    <>
                      <VideoCover 
                        videoUrl={selectedWork.videoUrl}
                        coverUrl={selectedWork.coverUrl !== '/placeholder.png' ? selectedWork.coverUrl : undefined}
                        alt={selectedWork.title}
                        className="detail-cover"
                      />
                      {selectedWork.type === 'video' && <div className="detail-play-icon">▶</div>}
                    </>
                  )}
                </Card>
              )}

              {isEditing ? (
                <div className="edit-form">
                  <div className="edit-field">
                    <div className="edit-label">作品标题</div>
                    <Input
                      value={editForm.title}
                      onChange={val => setEditForm({...editForm, title: val})}
                      placeholder="请输入标题"
                      maxLength={50}
                    />
                  </div>

                  <div className="edit-field">
                    <div className="edit-label">作品价格 (元)</div>
                    <div className="price-input-wrapper">
                      <span className="price-prefix">¥</span>
                      <Input
                        type="number"
                        value={editForm.price}
                        onChange={val => setEditForm({...editForm, price: val})}
                        placeholder="请输入价格"
                      />
                    </div>
                    <div className="price-range-hint">
                      <span>ℹ️</span>
                      {selectedWork.type === 'video' ? (
                        <span>根据视频时长({priceRange.duration}s)，合理价格范围为 ¥{priceRange.min} - ¥{priceRange.max}</span>
                      ) : (
                        <span>合理价格范围为 ¥{priceRange.min} - ¥{priceRange.max}</span>
                      )}
                    </div>
                  </div>

                  <div className="edit-field">
                    <div className="edit-label">作品描述</div>
                    <TextArea
                      value={editForm.description}
                      onChange={val => setEditForm({...editForm, description: val})}
                      placeholder="请输入描述"
                      rows={4}
                      showCount
                      maxLength={200}
                    />
                  </div>
                </div>
              ) : (
                <Card className="detail-info-card">
                  <div className="detail-title-section">
                    <div className="detail-title">{selectedWork.title}</div>
                    {getStatusTag(selectedWork.status)}
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">当前价格</span>
                    <span className="detail-value price">¥{selectedWork.price.toFixed(2)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">累计销量</span>
                    <span className="detail-value">{selectedWork.sales} 份</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">累计收益</span>
                    <span className="detail-value" style={{color: '#52c41a', fontWeight: 'bold'}}>
                      ¥{selectedWork.earnings.toFixed(2)}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">创建时间</span>
                    <span className="detail-value">{new Date(selectedWork.createdAt).toLocaleString()}</span>
                  </div>

                  {selectedWork.description && (
                    <div className="detail-desc">
                      <div className="detail-desc-label">作品描述</div>
                      <div className="detail-desc-content">{selectedWork.description}</div>
                    </div>
                  )}

                  {selectedWork.status === 'rejected' && selectedWork.rejectedReason && (
                    <div className="detail-desc" style={{borderColor: '#ff4d4f'}}>
                      <div className="detail-desc-label" style={{color: '#ff4d4f'}}>拒绝原因</div>
                      <div className="detail-desc-content" style={{background: '#fff1f0', color: '#cf1322'}}>
                        {selectedWork.rejectedReason}
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </>
          )}
        </div>

        {selectedWork && (
          <div className="popup-footer">
            {isEditing ? (
              <>
                <Button block fill="outline" onClick={handleCancelEdit} style={{flex: 1}}>
                  取消
                </Button>
                <Button block color="primary" onClick={handleSaveEdit} style={{flex: 1}}>
                  保存修改
                </Button>
              </>
            ) : (
              <>
                {selectedWork.status === 'approved' && (
                  <>
                    <Button block fill="outline" onClick={() => handleStatusChange('offline', '下架')} style={{flex: 1}}>
                      下架
                    </Button>
                    <Button block color="primary" onClick={handleEditClick} style={{flex: 2}}>
                      编辑信息
                    </Button>
                  </>
                )}
                {selectedWork.status === 'offline' && (
                  <>
                    <Button block fill="outline" color="danger" onClick={() => handleStatusChange('deleted' as any, '删除')} style={{flex: 1}}>
                      删除
                    </Button>
                    <Button block color="primary" onClick={() => handleStatusChange('approved', '上架')} style={{flex: 2}}>
                      重新上架
                    </Button>
                  </>
                )}
                {selectedWork.status === 'rejected' && (
                  <>
                    <Button block fill="outline" color="danger" onClick={() => handleStatusChange('deleted' as any, '删除')} style={{flex: 1}}>
                      删除
                    </Button>
                    <Button block color="primary" onClick={handleEditClick} style={{flex: 2}}>
                      修改重提
                    </Button>
                  </>
                )}
                {selectedWork.status === 'pending' && (
                   <Button block fill="outline" disabled style={{flex: 1}}>
                     审核中不可编辑
                   </Button>
                )}
              </>
            )}
          </div>
        )}
      </Popup>

      <BottomTabBar />
    </div>
  );
};

export default MyWorks;
