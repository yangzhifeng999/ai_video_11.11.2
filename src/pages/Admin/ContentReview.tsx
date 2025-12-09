import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Table,
  Input,
  Button,
  Tag,
  Space,
  message,
  Card,
  Row,
  Col,
  Image,
  Tabs,
  Tooltip,
  Empty,
  Badge,
  Modal,
  Statistic,
  Progress,
  Popover,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  HomeOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { adminService } from '@/services/adminService';
import { ROUTES } from '@/constants/routes';
import type { ReviewItem } from '@/types/admin';
import './ContentReview.css';

const { Header, Content } = Layout;
const { Search } = Input;

// 视频审核状态Tab
const VIDEO_STATUS_TABS = [
  { key: 'pending', label: '待审核' },
  { key: 'completed', label: '已完成' },
  { key: 'rejected', label: '已拒绝' },
];

// 文案审核状态Tab
const TEXT_STATUS_TABS = [
  { key: 'pending', label: '待审核' },
  { key: 'quoted', label: '已报价' },
  { key: 'paid', label: '已付款' },
  { key: 'orders', label: '订单' },
  { key: 'rejected', label: '已拒绝' },
];

// 订单子Tab
const ORDER_SUB_TABS = [
  { key: 'pending_delivery', label: '未交付' },
  { key: 'delivered', label: '已交付' },
];

export const ContentReview: React.FC = () => {
  const navigate = useNavigate();
  
  // 全局搜索
  const [globalKeyword, setGlobalKeyword] = useState('');
  
  // 视频审核状态
  const [videoTab, setVideoTab] = useState('pending');
  const [videoList, setVideoList] = useState<ReviewItem[]>([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoPagination, setVideoPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [selectedVideoKeys, setSelectedVideoKeys] = useState<React.Key[]>([]);
  
  // 文案审核状态
  const [textTab, setTextTab] = useState('pending');
  const [textOrderSubTab, setTextOrderSubTab] = useState('pending_delivery');
  const [textList, setTextList] = useState<ReviewItem[]>([]);
  const [textLoading, setTextLoading] = useState(false);
  const [textPagination, setTextPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [selectedTextKeys, setSelectedTextKeys] = useState<React.Key[]>([]);

  // 统计数据
  const [videoStats, setVideoStats] = useState({ pending: 0, completed: 0, rejected: 0, todayProcessed: 0 });
  const [textStats, setTextStats] = useState({ pending: 0, quoted: 0, paid: 0, pending_delivery: 0, delivered: 0, rejected: 0 });
  
  // 快速审核弹窗
  const [quickReviewModalVisible, setQuickReviewModalVisible] = useState(false);
  const [quickReviewType, setQuickReviewType] = useState<'approve' | 'reject'>('approve');
  const [quickReviewIds, setQuickReviewIds] = useState<string[]>([]);
  const [quickReviewLoading, setQuickReviewLoading] = useState(false);

  // 获取视频审核列表
  const fetchVideoList = useCallback(async (page = 1, keyword = globalKeyword, status = videoTab) => {
    try {
      setVideoLoading(true);
      
      // 根据Tab转换为后端审核状态
      let reviewStatus: string | undefined;
      if (status === 'pending') {
        reviewStatus = 'pending_initial';
      } else if (status === 'completed') {
        reviewStatus = 'published';
      } else if (status === 'rejected') {
        reviewStatus = 'initial_rejected';
      }
      
      const response = await adminService.getReviewList({
        page,
        pageSize: videoPagination.pageSize,
        keyword: keyword.trim() || undefined,
        contentType: 'video',
        reviewStatus,
      });
      
      setVideoList(response.list || []);
      setVideoPagination({
        ...videoPagination,
        current: response.page || page,
        total: response.total || 0,
      });
      setSelectedVideoKeys([]);
    } catch (error: any) {
      console.error('获取视频审核列表失败:', error);
      if (error?.response?.status === 401) {
        message.error('登录已过期，请重新登录');
        navigate(ROUTES.ADMIN_LOGIN);
      }
    } finally {
      setVideoLoading(false);
    }
  }, [globalKeyword, videoTab, videoPagination.pageSize, navigate]);

  // 获取文案审核列表
  const fetchTextList = useCallback(async (page = 1, keyword = globalKeyword, status = textTab, orderSub = textOrderSubTab) => {
    try {
      setTextLoading(true);
      
      // 根据Tab转换为后端审核状态
      let reviewStatus: string | undefined;
      if (status === 'pending') {
        reviewStatus = 'pending_quote';
      } else if (status === 'quoted') {
        reviewStatus = 'quoted';
      } else if (status === 'paid') {
        reviewStatus = 'production';
      } else if (status === 'orders') {
        reviewStatus = orderSub === 'pending_delivery' ? 'pending_confirm' : 'published';
      } else if (status === 'rejected') {
        reviewStatus = 'initial_rejected';
      }
      
      const response = await adminService.getReviewList({
        page,
        pageSize: textPagination.pageSize,
        keyword: keyword.trim() || undefined,
        contentType: 'text',
        reviewStatus,
      });
      
      console.log('文案审核API返回:', response);
      setTextList(response.list || []);
      setTextPagination({
        ...textPagination,
        current: response.page || page,
        total: response.total || 0,
      });
      setSelectedTextKeys([]);
    } catch (error: any) {
      console.error('获取文案审核列表失败:', error);
      if (error?.response?.status === 401) {
        message.error('登录已过期，请重新登录');
        navigate(ROUTES.ADMIN_LOGIN);
      }
    } finally {
      setTextLoading(false);
    }
  }, [globalKeyword, textTab, textOrderSubTab, textPagination.pageSize, navigate]);

  // 获取统计数据
  const fetchStats = async () => {
    try {
      const stats = await adminService.getReviewStats();
      setVideoStats({
        pending: stats.pendingInitial || 0,
        completed: stats.totalPublished || 0,
        rejected: 0,
        todayProcessed: stats.todayProcessed || 0,
      });
      setTextStats({
        pending: stats.pendingQuote || 0,
        quoted: stats.quoted || 0,
        paid: stats.production || 0,
        pending_delivery: stats.pendingConfirm || 0,
        delivered: 0,
        rejected: 0,
      });
    } catch (error) {
      console.error('获取统计失败:', error);
    }
  };

  useEffect(() => {
    fetchVideoList();
    fetchTextList();
    fetchStats();
  }, []);

  // 全局搜索
  const handleGlobalSearch = (value: string) => {
    setGlobalKeyword(value);
    setVideoPagination({ ...videoPagination, current: 1 });
    setTextPagination({ ...textPagination, current: 1 });
    fetchVideoList(1, value, videoTab);
    fetchTextList(1, value, textTab, textOrderSubTab);
  };

  // 视频Tab切换
  const handleVideoTabChange = (key: string) => {
    setVideoTab(key);
    setVideoPagination({ ...videoPagination, current: 1 });
    fetchVideoList(1, globalKeyword, key);
  };

  // 文案Tab切换
  const handleTextTabChange = (key: string) => {
    setTextTab(key);
    setTextPagination({ ...textPagination, current: 1 });
    if (key === 'orders') {
      fetchTextList(1, globalKeyword, key, textOrderSubTab);
    } else {
      fetchTextList(1, globalKeyword, key);
    }
  };

  // 订单子Tab切换
  const handleOrderSubTabChange = (key: string) => {
    setTextOrderSubTab(key);
    setTextPagination({ ...textPagination, current: 1 });
    fetchTextList(1, globalKeyword, 'orders', key);
  };

  const handleRefresh = () => {
    fetchVideoList(videoPagination.current, globalKeyword, videoTab);
    fetchTextList(textPagination.current, globalKeyword, textTab, textOrderSubTab);
    fetchStats();
    message.success('数据已刷新');
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate(ROUTES.ADMIN_LOGIN);
    message.success('已退出登录');
  };

  // 快捷审核 - 批量通过
  const handleBatchApprove = (type: 'video' | 'text') => {
    const keys = type === 'video' ? selectedVideoKeys : selectedTextKeys;
    if (keys.length === 0) {
      message.warning('请先选择要审核的内容');
      return;
    }
    setQuickReviewType('approve');
    setQuickReviewIds(keys.map(k => String(k)));
    setQuickReviewModalVisible(true);
  };

  // 快捷审核 - 批量拒绝
  const handleBatchReject = (type: 'video' | 'text') => {
    const keys = type === 'video' ? selectedVideoKeys : selectedTextKeys;
    if (keys.length === 0) {
      message.warning('请先选择要拒绝的内容');
      return;
    }
    setQuickReviewType('reject');
    setQuickReviewIds(keys.map(k => String(k)));
    setQuickReviewModalVisible(true);
  };

  // 执行快捷审核
  const handleQuickReviewConfirm = async () => {
    try {
      setQuickReviewLoading(true);
      
      for (const id of quickReviewIds) {
        if (quickReviewType === 'approve') {
          await adminService.initialReview(id, true);
        } else {
          await adminService.initialReview(id, false, '批量拒绝');
        }
      }
      
      message.success(`已${quickReviewType === 'approve' ? '通过' : '拒绝'} ${quickReviewIds.length} 项`);
      setQuickReviewModalVisible(false);
      setSelectedVideoKeys([]);
      setSelectedTextKeys([]);
      
      // 刷新数据
      fetchVideoList();
      fetchTextList();
      fetchStats();
    } catch (error: any) {
      message.error(error?.response?.data?.message || '操作失败');
    } finally {
      setQuickReviewLoading(false);
    }
  };

  // 单个快捷通过
  const handleQuickApprove = async (id: string) => {
    try {
      await adminService.initialReview(id, true);
      message.success('审核通过');
      fetchVideoList();
      fetchStats();
    } catch (error: any) {
      message.error(error?.response?.data?.message || '操作失败');
    }
  };

  // 单个快捷拒绝
  const handleQuickReject = async (id: string) => {
    Modal.confirm({
      title: '确认拒绝',
      icon: <ExclamationCircleOutlined />,
      content: '确定要拒绝此内容吗？',
      okText: '确认拒绝',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await adminService.initialReview(id, false, '审核不通过');
          message.success('已拒绝');
          fetchVideoList();
          fetchStats();
        } catch (error: any) {
          message.error(error?.response?.data?.message || '操作失败');
        }
      },
    });
  };

  // 视频预览弹窗
  const renderVideoPreview = (record: ReviewItem) => (
    <div style={{ width: 320 }}>
      <video 
        src={record.videoUrl} 
        controls 
        style={{ width: '100%', borderRadius: 8, background: '#000' }}
        poster={record.coverUrl}
      />
      <div style={{ padding: '8px 0' }}>
        <div style={{ fontWeight: 500 }}>{record.title}</div>
        <div style={{ fontSize: 12, color: '#999' }}>{record.description || '暂无描述'}</div>
      </div>
    </div>
  );

  // 计算等待时间
  const getWaitingTime = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    const hours = Math.floor((now - created) / (1000 * 60 * 60));
    if (hours < 1) return '刚刚提交';
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  };

  // 判断是否紧急（超过24小时）
  const isUrgent = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    return (now - created) > 24 * 60 * 60 * 1000;
  };

  // 视频审核表格列
  const videoColumns = [
    {
      title: '视频预览',
      dataIndex: 'coverUrl',
      key: 'coverUrl',
      width: 120,
      render: (url: string, record: ReviewItem) => (
        <Popover 
          content={() => renderVideoPreview(record)} 
          title="视频预览"
          trigger="hover"
          placement="right"
        >
          <div className="video-preview-cell" style={{ cursor: 'pointer' }}>
            {record.videoUrl ? (
              <div style={{ position: 'relative' }}>
                <video 
                  src={record.videoUrl} 
                  poster={url}
                  style={{ width: 100, height: 70, objectFit: 'cover', borderRadius: 4, background: '#000' }}
                  muted
                />
                <PlayCircleOutlined 
                  style={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    color: '#fff',
                    fontSize: 24,
                    textShadow: '0 0 4px rgba(0,0,0,0.5)'
                  }} 
                />
              </div>
            ) : (
              <Image
                src={url || '/placeholder.png'}
                alt="封面"
                width={100}
                height={70}
                style={{ objectFit: 'cover', borderRadius: 4 }}
                fallback="/placeholder.png"
                preview={false}
              />
            )}
          </div>
        </Popover>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string, record: ReviewItem) => (
        <div>
          <span className="video-title">{title || '未命名'}</span>
          {isUrgent(record.createdAt) && videoTab === 'pending' && (
            <Tag color="red" style={{ marginLeft: 4, fontSize: 10 }}>紧急</Tag>
          )}
        </div>
      ),
    },
    {
      title: '创作者',
      dataIndex: 'creator',
      key: 'creator',
      width: 100,
      render: (creator: ReviewItem['creator']) => (
        creator ? <span>{creator.nickname || '匿名'}</span> : '-'
      ),
    },
    {
      title: '等待时间',
      dataIndex: 'createdAt',
      key: 'waiting',
      width: 100,
      render: (time: string) => (
        <span style={{ color: isUrgent(time) ? '#ff4d4f' : '#666' }}>
          {getWaitingTime(time)}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: videoTab === 'pending' ? 180 : 80,
      render: (_: any, record: ReviewItem) => (
        <Space size="small">
          {videoTab === 'pending' && (
            <>
              <Tooltip title="快捷通过">
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleQuickApprove(record._id)}
                />
              </Tooltip>
              <Tooltip title="快捷拒绝">
                <Button
                  danger
                  size="small"
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleQuickReject(record._id)}
                />
              </Tooltip>
            </>
          )}
          <Tooltip title="详情">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/admin/review/${record._id}`)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 文案审核表格列
  const getTextColumns = () => {
    const baseColumns = [
      {
        title: '创意标题',
        dataIndex: 'title',
        key: 'title',
        ellipsis: true,
        render: (title: string, record: ReviewItem) => (
          <div>
            <span className="text-title">{title || '未命名'}</span>
            {isUrgent(record.createdAt) && textTab === 'pending' && (
              <Tag color="red" style={{ marginLeft: 4, fontSize: 10 }}>紧急</Tag>
            )}
          </div>
        ),
      },
      {
        title: '提交者',
        dataIndex: 'creator',
        key: 'creator',
        width: 100,
        render: (creator: ReviewItem['creator']) => (
          creator ? <span>{creator.nickname || '匿名'}</span> : '-'
        ),
      },
    ];

    // 根据不同Tab添加不同列
    if (textTab === 'quoted' || textTab === 'paid' || textTab === 'orders') {
      baseColumns.push({
        title: '报价',
        dataIndex: 'quotePrice',
        key: 'quotePrice',
        width: 80,
        render: (price: number) => price ? <span className="price">¥{price}</span> : '-',
      } as any);
    }

    if (textTab === 'orders') {
      baseColumns.push({
        title: '订单状态',
        dataIndex: 'reviewStatus',
        key: 'status',
        width: 90,
        render: (status: string) => {
          if (status === 'pending_confirm') {
            return <Tag color="warning">待交付</Tag>;
          } else if (status === 'published') {
            return <Tag color="success">已交付</Tag>;
          }
          return <Tag>{status}</Tag>;
        },
      } as any);
    }

    baseColumns.push({
      title: '等待时间',
      dataIndex: 'createdAt',
      key: 'waiting',
      width: 100,
      render: (time: string) => (
        <span style={{ color: isUrgent(time) ? '#ff4d4f' : '#666' }}>
          {getWaitingTime(time)}
        </span>
      ),
    } as any);

    baseColumns.push({
      title: '操作',
      key: 'actions',
      width: 80,
      render: (_: any, record: ReviewItem) => (
        <Tooltip title="处理">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/admin/review/${record._id}`)}
          >
            处理
          </Button>
        </Tooltip>
      ),
    } as any);

    return baseColumns;
  };

  // 视频行选择配置
  const videoRowSelection = {
    selectedRowKeys: selectedVideoKeys,
    onChange: (keys: React.Key[]) => setSelectedVideoKeys(keys),
  };

  // 文案行选择配置
  const textRowSelection = {
    selectedRowKeys: selectedTextKeys,
    onChange: (keys: React.Key[]) => setSelectedTextKeys(keys),
  };

  // 计算进度
  const totalPending = videoStats.pending + textStats.pending;
  const totalProcessed = videoStats.todayProcessed;

  return (
    <Layout className="content-review-layout">
      <Header className="admin-header">
        <div className="admin-header-content">
          <Space>
            <Button
              icon={<HomeOutlined />}
              onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}
            >
              返回首页
            </Button>
            <h2 style={{ color: '#fff', margin: 0 }}>内容审核</h2>
          </Space>
          <Space>
            {/* 全局搜索框 */}
            <Search
              placeholder="搜索标题/订单号/ID"
              allowClear
              onSearch={handleGlobalSearch}
              style={{ width: 250 }}
              prefix={<SearchOutlined />}
            />
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
            <Button
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              退出登录
            </Button>
          </Space>
        </div>
      </Header>
      
      <Content className="content-review-content">
        {/* 统计概览 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card className="stat-card stat-card-pending">
              <Statistic
                title="待处理"
                value={totalPending}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: totalPending > 0 ? '#faad14' : '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="stat-card stat-card-video">
              <Statistic
                title="视频待审"
                value={videoStats.pending}
                prefix={<VideoCameraOutlined />}
                valueStyle={{ color: videoStats.pending > 0 ? '#1890ff' : '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="stat-card stat-card-text">
              <Statistic
                title="文案待审"
                value={textStats.pending}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: textStats.pending > 0 ? '#722ed1' : '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="stat-card stat-card-today">
              <Statistic
                title="今日已处理"
                value={totalProcessed}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
              {totalPending > 0 && (
                <Progress 
                  percent={Math.round(totalProcessed / (totalProcessed + totalPending) * 100)} 
                  size="small"
                  style={{ marginTop: 8 }}
                />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={16} className="review-panels">
          {/* 左侧：视频审核 */}
          <Col span={12}>
            <Card 
              title={
                <Space>
                  <VideoCameraOutlined />
                  <span>视频审核</span>
                  <Badge count={videoStats.pending} style={{ marginLeft: 8 }} />
                </Space>
              }
              className="review-panel"
              extra={
                videoTab === 'pending' && selectedVideoKeys.length > 0 && (
                  <Space size="small">
                    <Button 
                      type="primary" 
                      size="small"
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleBatchApprove('video')}
                    >
                      批量通过 ({selectedVideoKeys.length})
                    </Button>
                    <Button 
                      danger 
                      size="small"
                      icon={<CloseCircleOutlined />}
                      onClick={() => handleBatchReject('video')}
                    >
                      批量拒绝
                    </Button>
                  </Space>
                )
              }
            >
              <Tabs
                activeKey={videoTab}
                onChange={handleVideoTabChange}
                size="small"
                items={VIDEO_STATUS_TABS.map(tab => ({
                  key: tab.key,
                  label: (
                    <span>
                      {tab.label}
                      {tab.key === 'pending' && videoStats.pending > 0 && (
                        <Badge count={videoStats.pending} size="small" style={{ marginLeft: 4 }} />
                      )}
                    </span>
                  ),
                }))}
              />
              
              {videoList.length > 0 ? (
                <Table
                  columns={videoColumns}
                  dataSource={videoList}
                  rowKey="_id"
                  loading={videoLoading}
                  rowSelection={videoTab === 'pending' ? videoRowSelection : undefined}
                  rowClassName={(record) => isUrgent(record.createdAt) && videoTab === 'pending' ? 'urgent-row' : ''}
                  pagination={{
                    ...videoPagination,
                    size: 'small',
                    showTotal: (total) => `共 ${total} 条`,
                    onChange: (page) => {
                      setVideoPagination({ ...videoPagination, current: page });
                      fetchVideoList(page, globalKeyword, videoTab);
                    },
                  }}
                  size="small"
                  scroll={{ x: 500 }}
                />
              ) : (
                <Empty description={videoLoading ? '加载中...' : '暂无数据'} />
              )}
            </Card>
          </Col>

          {/* 右侧：文案审核 */}
          <Col span={12}>
            <Card 
              title={
                <Space>
                  <FileTextOutlined />
                  <span>文案审核</span>
                  <Badge count={textStats.pending} style={{ marginLeft: 8 }} />
                </Space>
              }
              className="review-panel"
              extra={
                textTab === 'pending' && selectedTextKeys.length > 0 && (
                  <Space size="small">
                    <Button 
                      type="primary" 
                      size="small"
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleBatchApprove('text')}
                    >
                      批量通过 ({selectedTextKeys.length})
                    </Button>
                    <Button 
                      danger 
                      size="small"
                      icon={<CloseCircleOutlined />}
                      onClick={() => handleBatchReject('text')}
                    >
                      批量拒绝
                    </Button>
                  </Space>
                )
              }
            >
              <Tabs
                activeKey={textTab}
                onChange={handleTextTabChange}
                size="small"
                items={TEXT_STATUS_TABS.map(tab => ({
                  key: tab.key,
                  label: (
                    <span>
                      {tab.label}
                      {tab.key === 'pending' && textStats.pending > 0 && (
                        <Badge count={textStats.pending} size="small" style={{ marginLeft: 4 }} />
                      )}
                      {tab.key === 'quoted' && textStats.quoted > 0 && (
                        <Badge count={textStats.quoted} size="small" style={{ marginLeft: 4 }} />
                      )}
                    </span>
                  ),
                }))}
              />
              
              {/* 订单子Tab */}
              {textTab === 'orders' && (
                <div style={{ marginBottom: 12 }}>
                  <Tabs
                    activeKey={textOrderSubTab}
                    onChange={handleOrderSubTabChange}
                    size="small"
                    type="card"
                    items={ORDER_SUB_TABS.map(tab => ({
                      key: tab.key,
                      label: tab.label,
                    }))}
                  />
                </div>
              )}

              {textList.length > 0 ? (
                <Table
                  columns={getTextColumns()}
                  dataSource={textList}
                  rowKey="_id"
                  loading={textLoading}
                  rowSelection={textTab === 'pending' ? textRowSelection : undefined}
                  rowClassName={(record) => isUrgent(record.createdAt) && textTab === 'pending' ? 'urgent-row' : ''}
                  pagination={{
                    ...textPagination,
                    size: 'small',
                    showTotal: (total) => `共 ${total} 条`,
                    onChange: (page) => {
                      setTextPagination({ ...textPagination, current: page });
                      fetchTextList(page, globalKeyword, textTab, textOrderSubTab);
                    },
                  }}
                  size="small"
                  scroll={{ x: 500 }}
                />
              ) : (
                <Empty description={textLoading ? '加载中...' : '暂无数据'} />
              )}
            </Card>
          </Col>
        </Row>
      </Content>

      {/* 批量审核确认弹窗 */}
      <Modal
        title={`确认批量${quickReviewType === 'approve' ? '通过' : '拒绝'}`}
        open={quickReviewModalVisible}
        onOk={handleQuickReviewConfirm}
        onCancel={() => setQuickReviewModalVisible(false)}
        confirmLoading={quickReviewLoading}
        okText={quickReviewType === 'approve' ? '确认通过' : '确认拒绝'}
        okType={quickReviewType === 'approve' ? 'primary' : 'default'}
        okButtonProps={quickReviewType === 'reject' ? { danger: true } : {}}
      >
        <p>
          {quickReviewType === 'approve' 
            ? `确定要通过选中的 ${quickReviewIds.length} 项内容吗？`
            : `确定要拒绝选中的 ${quickReviewIds.length} 项内容吗？`
          }
        </p>
        {quickReviewType === 'approve' && (
          <p style={{ color: '#faad14', fontSize: 12 }}>
            提示：通过后视频将直接上架，请确认已审核内容
          </p>
        )}
      </Modal>
    </Layout>
  );
};
