import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Toast, Dialog } from 'antd-mobile';
import { NavBar } from '@/components/NavBar';
import { Loading } from '@/components/Loading';
import { USE_MOCK_DATA } from '@/constants/api';
import { ROUTES } from '@/constants/routes';
import { mockOrders } from '@/utils/mockData';
import { formatPrice, formatDate } from '@/utils';
import type { IOrder } from '@/types';
import './ResultVideo.css';

export const ResultVideo: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        
        if (USE_MOCK_DATA) {
          // Mock 模式：从 mockOrders 中查找订单
          await new Promise(resolve => setTimeout(resolve, 500));
          const foundOrder = mockOrders.find(o => o.id === orderId);
          
          if (foundOrder && foundOrder.status === 'completed') {
            setOrder(foundOrder);
          } else {
            Toast.show({ content: '订单不存在或未完成' });
            navigate(ROUTES.PURCHASED);
          }
        } else {
          // TODO: 调用真实API获取订单详情
          // const response = await orderService.getOrderDetail(orderId);
          // setOrder(response);
        }
      } catch (error) {
        Toast.show({ content: '获取订单信息失败' });
        navigate(ROUTES.PURCHASED);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, navigate]);


  const handleDownload = async () => {
    if (!order?.resultVideoUrl) {
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

  const handleRemake = () => {
    Dialog.confirm({
      title: '重新制作',
      content: '确定要使用此模板重新制作视频吗？',
      onConfirm: () => {
        if (order) {
          navigate(`${ROUTES.MAKE_VIDEO.replace(':videoId', order.itemId)}`);
        }
      },
    });
  };

  if (loading) {
    return <Loading text="加载中..." />;
  }

  if (!order) {
    return (
      <div className="result-video-error">
        <div className="result-video-error-text">订单不存在</div>
        <Button color="primary" onClick={() => navigate(ROUTES.PURCHASED)}>返回已购</Button>
      </div>
    );
  }

  return (
    <div className="result-video-page">
      <NavBar title="我的作品" onBack={() => navigate(ROUTES.PURCHASED)} />
      
      <div className="result-video-content">
        {/* 视频播放器 */}
        <div className="result-video-player-wrapper">
          <video
            ref={videoRef}
            src={order.resultVideoUrl}
            poster={order.itemCover}
            className="result-video-player"
            controls
            playsInline
          />
        </div>

        {/* 订单信息卡片 */}
        <div className="result-video-card">
          <div className="result-video-card-header">
            <h2 className="result-video-title">{order.itemTitle}</h2>
            <div className="result-video-status-badge">
              <span className="result-video-status-icon">✓</span>
              制作完成
            </div>
          </div>

          <div className="result-video-info-grid">
            <div className="result-video-info-item">
              <span className="result-video-info-label">订单编号</span>
              <span className="result-video-info-value">{order.id}</span>
            </div>
            <div className="result-video-info-item">
              <span className="result-video-info-label">支付金额</span>
              <span className="result-video-info-value result-video-price">
                {formatPrice(order.price * 100)}
              </span>
            </div>
            <div className="result-video-info-item">
              <span className="result-video-info-label">创建时间</span>
              <span className="result-video-info-value">{formatDate(order.createdAt)}</span>
            </div>
            <div className="result-video-info-item">
              <span className="result-video-info-label">支付方式</span>
              <span className="result-video-info-value">
                {order.paymentMethod === 'wechat' ? '微信支付' : 
                 order.paymentMethod === 'alipay' ? '支付宝' : '余额支付'}
              </span>
            </div>
          </div>
        </div>

        {/* 操作提示卡片 */}
        <div className="result-video-card">
          <h3 className="result-video-card-subtitle">💡 使用提示</h3>
          <div className="result-video-tips">
            <div className="result-video-tip-item">
              <span className="result-video-tip-icon">🎬</span>
              <span>视频已保存至您的账号，随时可以查看和下载</span>
            </div>
            <div className="result-video-tip-item">
              <span className="result-video-tip-icon">📱</span>
              <span>支持分享到微信好友和朋友圈</span>
            </div>
            <div className="result-video-tip-item">
              <span className="result-video-tip-icon">♻️</span>
              <span>如需重新制作，可点击下方"重新制作"按钮</span>
            </div>
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="result-video-footer">
        <Button
          size="large"
          fill="outline"
          className="result-video-footer-btn"
          onClick={handleDownload}
        >
          📥 下载视频
        </Button>
        <Button
          size="large"
          color="success"
          className="result-video-footer-btn"
          onClick={handleShareToWechat}
        >
          分享至微信
        </Button>
        <Button
          size="large"
          color="primary"
          className="result-video-footer-btn"
          onClick={handleRemake}
        >
          ♻️ 重新制作
        </Button>
      </div>
    </div>
  );
};


