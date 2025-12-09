import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Badge, Toast, PullToRefresh, InfiniteScroll, DotLoading } from 'antd-mobile';
import { 
  BellOutline, 
  SoundOutline, 
  PayCircleOutline,
  MessageOutline
} from 'antd-mobile-icons';
import { BottomTabBar } from '@/components/BottomTabBar';
import { messageService, IMessage, MessageType, UnreadCountResponse } from '@/services/messageService';
import { useUserStore } from '@/store/userStore';
import './Messages.css';

export const Messages: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useUserStore();
  
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCountResponse>({
    total: 0,
    system: 0,
    order: 0,
    announcement: 0,
    interaction: 0,
  });
  const [activeType, setActiveType] = useState<MessageType | 'all'>('all');

  // 加载消息列表
  const loadMessages = async (pageNum: number = 1, refresh: boolean = false) => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      if (pageNum === 1) {
        setLoading(true);
      }

      const response = await messageService.getMessages({
        page: pageNum,
        pageSize: 20,
        type: activeType === 'all' ? undefined : activeType,
      });

      if (refresh || pageNum === 1) {
        setMessages(response.list);
      } else {
        setMessages(prev => [...prev, ...response.list]);
      }

      setHasMore(response.list.length >= 20);
      setPage(pageNum);
    } catch (error) {
      console.error('加载消息失败:', error);
      Toast.show({ content: '加载消息失败', icon: 'fail' });
    } finally {
      setLoading(false);
    }
  };

  // 加载未读数量
  const loadUnreadCount = async () => {
    if (!isAuthenticated) return;

    try {
      const counts = await messageService.getUnreadCount();
      setUnreadCounts(counts);
    } catch (error) {
      console.error('获取未读数量失败:', error);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadMessages(1);
    loadUnreadCount();
  }, [isAuthenticated, activeType]);

  const handleBack = () => {
    navigate(-1);
  };

  // 点击消息 - 只标记已读，不导航
  const handleMessageClick = async (msg: IMessage) => {
    // 标记已读
    if (!msg.read) {
      try {
        await messageService.markAsRead(msg.id);
        setMessages(prev => prev.map(m =>
          m.id === msg.id ? { ...m, read: true } : m
        ));
        // 更新未读数量
        setUnreadCounts(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1),
          [msg.type]: Math.max(0, prev[msg.type] - 1),
        }));
      } catch (error) {
        console.error('标记已读失败:', error);
      }
    }
    // 不导航，只标记已读
  };

  // 全部已读
  const handleMarkAllRead = async () => {
    if (!isAuthenticated) {
      Toast.show({ content: '请先登录', icon: 'fail' });
      return;
    }

    try {
      await messageService.markAllAsRead(activeType === 'all' ? undefined : activeType);
      setMessages(prev => prev.map(msg => ({ ...msg, read: true })));
      
      if (activeType === 'all') {
        setUnreadCounts({ total: 0, system: 0, order: 0, announcement: 0, interaction: 0 });
      } else {
        setUnreadCounts(prev => ({
          ...prev,
          total: prev.total - prev[activeType],
          [activeType]: 0,
        }));
      }
      
      Toast.show({ content: '全部已读', icon: 'success' });
    } catch (error) {
      console.error('标记全部已读失败:', error);
      Toast.show({ content: '操作失败', icon: 'fail' });
    }
  };

  // 下拉刷新
  const handleRefresh = async () => {
    await loadMessages(1, true);
    await loadUnreadCount();
  };

  // 加载更多
  const loadMore = async () => {
    if (!hasMore || loading) return;
    await loadMessages(page + 1);
  };

  // 切换分类
  const handleCategoryClick = (type: MessageType) => {
    if (activeType === type) {
      setActiveType('all');
    } else {
      setActiveType(type);
    }
    setPage(1);
    setMessages([]);
  };

  const CategoryCard = ({ type, title, icon, color }: { type: MessageType, title: string, icon: React.ReactNode, color: string }) => (
    <div 
      className={`category-card-v3 ${activeType === type ? 'active' : ''}`} 
      onClick={() => handleCategoryClick(type)}
    >
      <div className="category-icon-wrapper" style={{ background: color }}>
        {icon}
        {unreadCounts[type] > 0 && <Badge content={unreadCounts[type]} className="category-badge" />}
      </div>
      <span className="category-name">{title}</span>
    </div>
  );

  const getMessageIconColor = (type: MessageType) => {
    switch (type) {
      case 'system': return '#1890ff';
      case 'order': return '#52c41a';
      case 'announcement': return '#fa8c16';
      case 'interaction': return '#722ed1';
      default: return '#999';
    }
  };

  const getMessageIcon = (type: MessageType) => {
    switch (type) {
      case 'system': return <BellOutline />;
      case 'order': return <PayCircleOutline />;
      case 'announcement': return <SoundOutline />;
      case 'interaction': return <MessageOutline />;
      default: return <BellOutline />;
    }
  };

  // 未登录提示
  if (!isAuthenticated) {
    return (
      <div className="messages-page-v3">
        <NavBar 
          onBack={handleBack}
          style={{ '--border-bottom': 'none', background: '#fff' }}
        >
          消息中心
        </NavBar>
        <div className="empty-state" style={{ marginTop: 100 }}>
          <BellOutline style={{ fontSize: 48, color: '#ccc', marginBottom: 16 }} />
          <div>请先登录查看消息</div>
        </div>
        <BottomTabBar />
      </div>
    );
  }

  return (
    <div className="messages-page-v3">
      <NavBar 
        onBack={handleBack}
        right={
          unreadCounts.total > 0 ? (
            <span style={{ fontSize: 14, color: '#1890ff' }} onClick={handleMarkAllRead}>
              一键已读
            </span>
          ) : null
        }
        style={{ '--border-bottom': 'none', background: '#fff' }}
      >
        消息中心
        {unreadCounts.total > 0 && (
          <Badge content={unreadCounts.total} style={{ marginLeft: 8 }} />
        )}
      </NavBar>

      {/* 顶部宫格导航 */}
      <div className="categories-grid">
        <CategoryCard type="system" title="系统通知" icon={<BellOutline />} color="rgba(24, 144, 255, 0.1)" />
        <CategoryCard type="order" title="订单助手" icon={<PayCircleOutline />} color="rgba(82, 196, 26, 0.1)" />
        <CategoryCard type="interaction" title="互动消息" icon={<MessageOutline />} color="rgba(114, 46, 209, 0.1)" />
        <CategoryCard type="announcement" title="平台公告" icon={<SoundOutline />} color="rgba(250, 140, 22, 0.1)" />
      </div>

      {/* 最新消息列表 */}
      <div className="recent-messages-section">
        <div className="section-header">
          <span className="section-title">
            {activeType === 'all' ? '最新动态' : 
              activeType === 'system' ? '系统通知' :
              activeType === 'order' ? '订单消息' :
              activeType === 'interaction' ? '互动消息' : '平台公告'}
          </span>
          {activeType !== 'all' && (
            <span className="section-action" onClick={() => setActiveType('all')}>
              查看全部
            </span>
          )}
        </div>
        
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="message-list-v3">
            {loading && messages.length === 0 ? (
              <div className="loading-state">
                <DotLoading color="primary" />
                <span>加载中...</span>
              </div>
            ) : messages.length > 0 ? (
              <>
                {messages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`message-item-v3 ${!msg.read ? 'unread' : ''}`}
                    onClick={() => handleMessageClick(msg)}
                  >
                    <div className="item-icon" style={{ color: getMessageIconColor(msg.type) }}>
                      {getMessageIcon(msg.type)}
                      {!msg.read && <div className="item-badge-dot" />}
                    </div>
                    <div className="item-content">
                      <div className="item-top">
                        <span className="item-title">{msg.title}</span>
                        <span className="item-time">{msg.timestamp}</span>
                      </div>
                      <div className="item-desc">{msg.content}</div>
                    </div>
                  </div>
                ))}
                <InfiniteScroll loadMore={loadMore} hasMore={hasMore} />
              </>
            ) : (
              <div className="empty-state">
                <BellOutline style={{ fontSize: 40, color: '#ccc', marginBottom: 12 }} />
                <div>暂无消息</div>
              </div>
            )}
          </div>
        </PullToRefresh>
      </div>

      <BottomTabBar />
    </div>
  );
};
