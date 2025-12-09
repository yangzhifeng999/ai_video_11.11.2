import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, ProgressCircle, Button, Toast, Dialog } from 'antd-mobile';
import { NavBar } from '@/components/NavBar';
import { Loading } from '@/components/Loading';
import { Empty } from '@/components/Empty';
import { BottomTabBar } from '@/components/BottomTabBar';
import { CreateModal } from '@/pages/CreateModal';
import { orderService } from '@/services/orderService';
import { formatPrice, formatDate } from '@/utils';
import type { IOrder, OrderStatus } from '@/types';
import { useRequireAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import './Purchased.css';

const statusTabs: { key: OrderStatus | 'all' | 'failed_refunded'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'processing', label: '制作中' },
  { key: 'completed', label: '已完成' },
  { key: 'failed_refunded', label: '已退款/失败' },
];

// 根据支付方式格式化价格显示
const formatOrderPrice = (order: IOrder): string => {
  if (order.paymentMethod === 'points') {
    // 积分支付，显示积分数量
    return `${order.price} 积分`;
  } else {
    // 微信/支付宝支付，显示金额
    return formatPrice(order.price * 100);
  }
};

export const Purchased: React.FC = () => {
  const { isAuthenticated } = useRequireAuth();
  const navigate = useNavigate();
  const [activeStatus, setActiveStatus] = useState<OrderStatus | 'all' | 'failed_refunded'>('all');
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // 处理特殊的"已退款/失败"状态
      let statusParam: OrderStatus | undefined = undefined;
      if (activeStatus !== 'all' && activeStatus !== 'failed_refunded') {
        statusParam = activeStatus as OrderStatus;
      }
      
      const response = await orderService.getOrderList({
        status: statusParam,
      });
      
      // 如果是"已退款/失败"标签，前端筛选
      if (activeStatus === 'failed_refunded') {
        setOrders(response.list.filter(o => o.status === 'refunded' || o.status === 'failed'));
      } else {
        setOrders(response.list);
      }
    } catch (error) {
      Toast.show({ content: '获取订单列表失败' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 只有登录后才获取订单列表
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [activeStatus, isAuthenticated]);

  const handleCancel = async (orderId: string) => {
    try {
      await orderService.cancelOrder(orderId);
      Toast.show({ content: '取消成功' });
      fetchOrders();
    } catch (error) {
      Toast.show({ content: '取消失败' });
    }
  };


  return (
    <div className="purchased-page">
      <NavBar 
        title="我的订单" 
        onBack={() => navigate(ROUTES.HOME)}
      />
      <div className="purchased-content">
        {/* 顶部状态筛选标签 */}
        <div className="purchased-status-tabs">
          <Tabs activeKey={activeStatus} onChange={(key) => setActiveStatus(key as OrderStatus | 'all')}>
            {statusTabs.map((tab) => (
              <Tabs.Tab title={tab.label} key={tab.key} />
            ))}
          </Tabs>
        </div>

        {/* 中部内容列表区域 */}
        <div className="purchased-list-container">
          {loading ? (
            <Loading />
          ) : orders.length === 0 ? (
            <Empty 
              icon="🛒"
              description={
                <div>
                  <div style={{ fontSize: '16px', marginBottom: '8px' }}>暂无订单</div>
                  <div style={{ fontSize: '14px', color: '#999' }}>快去首页挑选喜欢的视频吧</div>
                </div>
              }
            />
          ) : (
            <div className="purchased-list">
              {orders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onCancel={handleCancel} 
                  onRefresh={fetchOrders}
                  onOpenCreateModal={() => setCreateModalVisible(true)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 底部导航栏 */}
      <BottomTabBar />

      {/* 创作功能弹窗 */}
      <CreateModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
      />
    </div>
  );
};

interface OrderCardProps {
  order: IOrder;
  onCancel: (orderId: string) => void;
  onRefresh: () => void;
  onOpenCreateModal?: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onOpenCreateModal }) => {
  const navigate = useNavigate();

  const handleViewResult = () => {
    if (order.resultVideoUrl && order.id) {
      // 跳转到成品视频播放页
      navigate(`/result-video/${order.id}`);
    } else {
      Toast.show({ content: '视频生成中，请稍后查看' });
    }
  };

  const handleDownloadVideo = async () => {
    if (!order.resultVideoUrl) {
      Toast.show({ content: '视频不存在' });
      return;
    }

    try {
      Toast.show({ content: '正在下载视频...' });
      
      // 创建一个隐藏的 a 标签来触发下载
      const link = document.createElement('a');
      link.href = order.resultVideoUrl;
      link.download = `${order.itemTitle}_${order.id}.mp4`; // 设置下载文件名
      link.style.display = 'none';
      
      // 如果是跨域视频，需要先 fetch 然后创建 blob URL
      try {
        const response = await fetch(order.resultVideoUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 释放 blob URL
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        
        Toast.show({ content: '下载成功！', icon: 'success' });
      } catch (fetchError) {
        // 如果 fetch 失败（可能是跨域或其他原因），尝试直接下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Toast.show({ content: '下载已开始', icon: 'success' });
      }
    } catch (error) {
      console.error('下载视频失败:', error);
      Toast.show({ content: '下载失败，请稍后重试' });
    }
  };

  const handleShareToWechat = () => {
    Dialog.confirm({
      title: '分享到微信',
      content: (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ marginBottom: '12px' }}>请选择分享方式</div>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px' }}>
            <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => {
              Toast.show({ content: '正在唤起微信发送给好友...' });
              // TODO: 调用微信SDK分享到好友
              Dialog.clear();
            }}>
              <div style={{ fontSize: '36px' }}>👥</div>
              <div style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>发送给好友</div>
            </div>
            <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => {
              Toast.show({ content: '正在唤起微信分享到朋友圈...' });
              // TODO: 调用微信SDK分享到朋友圈
              Dialog.clear();
            }}>
              <div style={{ fontSize: '36px' }}>⭕</div>
              <div style={{ fontSize: '12px', marginTop: '8px', color: '#666' }}>分享到朋友圈</div>
            </div>
          </div>
        </div>
      ),
      confirmText: '取消',
      onConfirm: () => {},
    });
  };

  const handleRetry = () => {
    // 打开创作弹窗，让用户重新选择创作方式
    if (onOpenCreateModal) {
      onOpenCreateModal();
    }
  };

  // 制作中卡片 - 新设计
  if (order.status === 'processing') {
    return (
      <div className="order-card processing-card">
        <div className="order-card-header">
          <div className="status-badge processing">
            <span className="status-dot"></span>
            制作中
          </div>
          <div className="order-time">{formatDate(order.createdAt)}</div>
        </div>
        
        <div className="order-card-body">
          <div className="video-preview">
            {order.itemCover ? (
              <img src={order.itemCover} alt={order.itemTitle} />
            ) : (
              <div className="video-placeholder">
                <span className="icon">🎬</span>
              </div>
            )}
            <div className="processing-overlay">
              <ProgressCircle percent={order.progress || 0} style={{ '--size': '50px', '--track-width': '4px' }}>
                <span className="progress-text">{(order.progress || 0).toFixed(0)}%</span>
              </ProgressCircle>
            </div>
          </div>
          
          <div className="order-info">
            <h3 className="order-title">{order.itemTitle}</h3>
            <div className="order-meta">
              <span className="meta-item">
                <span className="meta-icon">⏱️</span>
                预计还需 {order.estimatedTime || '10-30分钟'}
              </span>
            </div>
            <div className="order-price">
              <span className="price-label">支付金额</span>
              <span className="price-value">{formatOrderPrice(order)}</span>
            </div>
          </div>
        </div>

        {/* 取消"取消订单"按钮 */}
      </div>
    );
  }

  // 已完成卡片 - 新设计
  if (order.status === 'completed') {
    return (
      <div className="order-card completed-card">
        <div className="order-card-header">
          <div className="status-badge completed">
            <span className="status-icon">✓</span>
            已完成
          </div>
          <div className="order-time">{formatDate(order.createdAt)}</div>
        </div>
        
        <div className="order-card-body">
          <div className="video-preview" onClick={handleViewResult} style={{ cursor: 'pointer' }}>
            {order.itemCover ? (
              <img src={order.itemCover} alt={order.itemTitle} />
            ) : (
              <div className="video-placeholder">
                <span className="icon">📹</span>
              </div>
            )}
            <div className="play-overlay">
              <div className="play-button">
                <span className="play-icon">▶</span>
              </div>
            </div>
          </div>
          
          <div className="order-info">
            <h3 className="order-title">{order.itemTitle}</h3>
            <div className="order-meta">
              <span className="meta-item">
                <span className="meta-icon">🎬</span>
                视频已生成
              </span>
            </div>
            <div className="order-price">
              <span className="price-label">支付金额</span>
              <span className="price-value">{formatOrderPrice(order)}</span>
            </div>
          </div>
        </div>

        <div className="order-card-footer">
          <Button 
            size="small" 
            fill="outline" 
            className="secondary-btn"
            onClick={handleDownloadVideo}
          >
            下载视频
          </Button>
          <Button 
            size="small" 
            color="success"
            className="primary-btn"
            onClick={handleShareToWechat}
          >
            分享至微信
          </Button>
        </div>
      </div>
    );
  }

  // 已退款/失败卡片 - 新设计
  if (order.status === 'refunded' || order.status === 'failed') {
    const isRefunded = order.status === 'refunded';
    const statusLabel = isRefunded ? '已退款' : '制作失败';
    const statusIcon = isRefunded ? '↩️' : '⚠️';
    
    return (
      <div className="order-card failed-card">
        <div className="order-card-header">
          <div className={`status-badge ${order.status}`}>
            <span className="status-icon">{statusIcon}</span>
            {statusLabel}
          </div>
          <div className="order-time">{formatDate(order.createdAt)}</div>
        </div>
        
        <div className="order-card-body">
          <div className="video-preview">
            {order.itemCover ? (
              <img src={order.itemCover} alt={order.itemTitle} />
            ) : (
              <div className="video-placeholder">
                <span className="icon">📹</span>
              </div>
            )}
            <div className="failed-overlay">
              <span className="failed-icon">{statusIcon}</span>
            </div>
          </div>
          
          <div className="order-info">
            <h3 className="order-title">{order.itemTitle}</h3>
            {order.refundReason && (
              <div className="failure-reason">
                <span className="reason-icon">ℹ️</span>
                <span className="reason-text">{order.refundReason}</span>
              </div>
            )}
            <div className="order-price">
              <span className="price-label">{isRefunded ? '退款金额' : '支付金额'}</span>
              <span className="price-value refund">
                {formatOrderPrice(order)}
              </span>
            </div>
          </div>
        </div>

        <div className="order-card-footer">
          <Button 
            size="small" 
            fill="outline" 
            className="secondary-btn"
            onClick={() => {
              Toast.show({ content: order.refundReason || '制作失败，已自动退款' });
            }}
          >
            查看详情
          </Button>
          <Button 
            size="small" 
            color="primary"
            className="primary-btn"
            onClick={handleRetry}
          >
            重新制作
          </Button>
        </div>
      </div>
    );
  }

  return null;
};

