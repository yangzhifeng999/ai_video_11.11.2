import { useState, useEffect } from 'react';
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
  Select,
  Modal,
  Image,
  Tabs,
  Tooltip,
  InputNumber,
  Dropdown,
  Form,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  StarOutlined,
  StarFilled,
  DownOutlined,
  SwapOutlined,
  VerticalAlignTopOutlined,
  StopOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { adminService } from '@/services/adminService';
import { ROUTES } from '@/constants/routes';
import type { VideoListItem } from '@/types/admin';
import { CATEGORY_OPTIONS } from '@/types/admin';
import './VideoManagement.css';

const { Header, Content } = Layout;
const { Search } = Input;

// 分类Tab配置
const CATEGORY_TABS = [
  { key: 'all', label: '全部' },
  { key: 'comprehensive', label: '综合推荐' },
  { key: 'mother_baby', label: '母婴亲子' },
  { key: 'clothing', label: '时尚穿搭' },
  { key: 'general_merchandise', label: '居家百货' },
  { key: 'other', label: '其他' },
];

export const VideoManagement: React.FC = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState<VideoListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('published');
  const [recommendFilter, setRecommendFilter] = useState<string | undefined>(undefined);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // 弹窗状态
  const [batchCategoryModalVisible, setBatchCategoryModalVisible] = useState(false);
  const [batchSortModalVisible, setBatchSortModalVisible] = useState(false);
  const [targetCategory, setTargetCategory] = useState<string>('');
  const [sortStartValue, setSortStartValue] = useState(10);
  const [sortIncrement, setSortIncrement] = useState(10);


  // 获取视频列表
  const fetchVideos = async (
    page = 1, 
    searchKeyword = '', 
    category?: string, 
    status?: string,
    isHomeRecommended?: string
  ) => {
    try {
      setLoading(true);
      const response = await adminService.getVideoList({
        page,
        pageSize: pagination.pageSize,
        keyword: searchKeyword.trim() || undefined,
        category: category === 'all' ? undefined : category,
        status: status || 'published',
        isHomeRecommended: isHomeRecommended,
      });
      setVideos(response.list);
      setPagination({
        ...pagination,
        current: response.page,
        total: response.total,
      });
    } catch (error: any) {
      console.error('获取视频列表失败:', error);
      if (error?.response?.status === 401) {
        message.error('登录已过期，请重新登录');
        navigate(ROUTES.ADMIN_LOGIN);
      } else {
        message.error('获取视频列表失败');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos(1, '', categoryFilter, statusFilter, recommendFilter);
  }, []);

  const handleSearch = (value: string) => {
    setKeyword(value);
    setSelectedRowKeys([]);
    setPagination({ ...pagination, current: 1 });
    fetchVideos(1, value, categoryFilter, statusFilter, recommendFilter);
  };

  const handleCategoryTabChange = (key: string) => {
    setCategoryFilter(key);
    setSelectedRowKeys([]);
    setPagination({ ...pagination, current: 1 });
    fetchVideos(1, keyword, key, statusFilter, recommendFilter);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setSelectedRowKeys([]);
    setPagination({ ...pagination, current: 1 });
    fetchVideos(1, keyword, categoryFilter, value, recommendFilter);
  };

  const handleRecommendFilterChange = (value: string | undefined) => {
    setRecommendFilter(value);
    setSelectedRowKeys([]);
    setPagination({ ...pagination, current: 1 });
    fetchVideos(1, keyword, categoryFilter, statusFilter, value);
  };

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
    fetchVideos(newPagination.current, keyword, categoryFilter, statusFilter, recommendFilter);
  };

  const handleRefresh = () => {
    fetchVideos(pagination.current, keyword, categoryFilter, statusFilter, recommendFilter);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate(ROUTES.ADMIN_LOGIN);
    message.success('已退出登录');
  };

  // 切换推荐状态
  const handleToggleRecommend = async (video: VideoListItem) => {
    try {
      await adminService.setRecommend(video._id, !video.isHomeRecommended);
      message.success(video.isHomeRecommended ? '已取消推荐' : '已设为推荐');
      handleRefresh();
    } catch (error: any) {
      message.error(error?.response?.data?.message || '操作失败');
    }
  };

  // 切换上架状态
  const handleToggleStatus = async (video: VideoListItem) => {
    const newStatus = video.reviewStatus === 'published' ? 'offline' : 'published';
    Modal.confirm({
      title: newStatus === 'offline' ? '确认下架？' : '确认上架？',
      content: `视频《${video.title}》将被${newStatus === 'offline' ? '下架' : '上架'}`,
      onOk: async () => {
        try {
          await adminService.setVideoStatus(video._id, newStatus);
          message.success(newStatus === 'offline' ? '已下架' : '已上架');
          handleRefresh();
        } catch (error: any) {
          message.error(error?.response?.data?.message || '操作失败');
        }
      },
    });
  };

  // 删除视频
  const handleDelete = (video: VideoListItem) => {
    Modal.confirm({
      title: '确认删除？',
      content: `视频《${video.title}》删除后无法恢复`,
      okText: '确认删除',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await adminService.deleteVideo(video._id);
          message.success('删除成功');
          handleRefresh();
        } catch (error: any) {
          message.error(error?.response?.data?.message || '删除失败');
        }
      },
    });
  };

  // 快速修改分类
  const handleQuickCategoryChange = async (video: VideoListItem, category: string) => {
    try {
      await adminService.updateVideo(video._id, { category });
      message.success('分类已更新');
      handleRefresh();
    } catch (error: any) {
      message.error(error?.response?.data?.message || '更新失败');
    }
  };

  // 快速修改排序值
  const handleQuickSortChange = async (video: VideoListItem, sortOrder: number) => {
    try {
      await adminService.updateVideo(video._id, { sortOrder });
      message.success('排序值已更新');
    } catch (error: any) {
      message.error(error?.response?.data?.message || '更新失败');
    }
  };

  // 批量操作菜单
  const batchMenuItems: MenuProps['items'] = [
    {
      key: 'updateCategory',
      icon: <SwapOutlined />,
      label: '批量修改分类',
      onClick: () => {
        if (selectedRowKeys.length === 0) {
          message.warning('请先选择视频');
          return;
        }
        setTargetCategory('');
        setBatchCategoryModalVisible(true);
      },
    },
    {
      key: 'setRecommend',
      icon: <StarFilled />,
      label: '批量设为推荐',
      onClick: () => handleBatchOperation('setHomeRecommended', { isHomeRecommended: true }),
    },
    {
      key: 'removeRecommend',
      icon: <StarOutlined />,
      label: '批量取消推荐',
      onClick: () => handleBatchOperation('setHomeRecommended', { isHomeRecommended: false }),
    },
    {
      key: 'setSortOrder',
      icon: <VerticalAlignTopOutlined />,
      label: '批量设置排序',
      onClick: () => {
        if (selectedRowKeys.length === 0) {
          message.warning('请先选择视频');
          return;
        }
        setSortStartValue(10);
        setSortIncrement(10);
        setBatchSortModalVisible(true);
      },
    },
    { type: 'divider' },
    {
      key: 'online',
      icon: <CheckCircleOutlined />,
      label: '批量上架',
      onClick: () => handleBatchOperation('online', {}),
    },
    {
      key: 'offline',
      icon: <StopOutlined />,
      label: '批量下架',
      danger: true,
      onClick: () => handleBatchOperation('offline', {}),
    },
  ];

  // 执行批量操作
  const handleBatchOperation = async (action: string, data: any) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择视频');
      return;
    }

    Modal.confirm({
      title: '确认批量操作？',
      content: `将对 ${selectedRowKeys.length} 个视频执行此操作`,
      onOk: async () => {
        try {
          const result = await adminService.batchOperation(
            action, 
            selectedRowKeys as string[], 
            data
          );
          message.success(`成功更新 ${result.updatedCount} 个视频`);
          setSelectedRowKeys([]);
          handleRefresh();
        } catch (error: any) {
          message.error(error?.response?.data?.message || '操作失败');
        }
      },
    });
  };

  // 批量修改分类
  const handleBatchCategorySubmit = async () => {
    if (!targetCategory) {
      message.warning('请选择目标分类');
      return;
    }
    setBatchCategoryModalVisible(false);
    await handleBatchOperation('updateCategory', { category: targetCategory });
  };

  // 批量设置排序
  const handleBatchSortSubmit = async () => {
    setBatchSortModalVisible(false);
    await handleBatchOperation('setSortOrder', { 
      startOrder: sortStartValue, 
      increment: sortIncrement 
    });
  };

  // 表格列定义
  const columns = [
    {
      title: '封面',
      dataIndex: 'coverUrl',
      key: 'coverUrl',
      width: 100,
      render: (url: string) => (
        <Image
          src={url}
          alt="封面"
          width={80}
          height={60}
          style={{ objectFit: 'cover', borderRadius: 4 }}
          fallback="/placeholder.png"
          preview={false}
        />
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      render: (title: string, record: VideoListItem) => (
        <div>
          <div className="video-title">{title}</div>
          {record.isPinned && <Tag color="red">置顶</Tag>}
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string, record: VideoListItem) => (
        <Select
          value={category}
          size="small"
          style={{ width: 100 }}
          onChange={(value) => handleQuickCategoryChange(record, value)}
        >
          {CATEGORY_OPTIONS.map(opt => (
            <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: '首页推荐',
      dataIndex: 'isHomeRecommended',
      key: 'isHomeRecommended',
      width: 100,
      render: (isRecommended: boolean, record: VideoListItem) => (
        <Tooltip title={isRecommended ? '点击取消推荐' : '点击设为推荐'}>
          <Tag 
            color={isRecommended ? 'gold' : 'default'}
            style={{ cursor: 'pointer' }}
            onClick={() => handleToggleRecommend(record)}
          >
            {isRecommended ? <><StarFilled /> 推荐</> : '普通'}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: '排序值',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 100,
      render: (sortOrder: number | undefined, record: VideoListItem) => (
        <InputNumber
          value={sortOrder}
          min={0}
          size="small"
          style={{ width: 70 }}
          onChange={(value) => value !== null && handleQuickSortChange(record, value)}
          placeholder="-"
        />
      ),
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 80,
      render: (price: number) => <span className="price">¥{price}</span>,
    },
    {
      title: '状态',
      dataIndex: 'reviewStatus',
      key: 'reviewStatus',
      width: 90,
      render: (status: string) => (
        <Tag color={status === 'published' ? 'success' : 'default'}>
          {status === 'published' ? '已上架' : '已下架'}
        </Tag>
      ),
    },
    {
      title: '数据',
      key: 'stats',
      width: 120,
      render: (_: any, record: VideoListItem) => (
        <div className="video-stats">
          <div>播放：{record.viewCount || 0}</div>
          <div>订单：{record.orderCount || 0}</div>
        </div>
      ),
    },
    {
      title: '上架时间',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      width: 160,
      render: (time: string) => time ? new Date(time).toLocaleString('zh-CN') : '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: VideoListItem) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/admin/videos/${record._id}`)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/admin/videos/${record._id}?edit=true`)}
            />
          </Tooltip>
          <Tooltip title={record.reviewStatus === 'published' ? '下架' : '上架'}>
            <Button
              type="link"
              size="small"
              icon={record.reviewStatus === 'published' ? <StopOutlined /> : <CheckCircleOutlined />}
              onClick={() => handleToggleStatus(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  };

  return (
    <Layout className="video-management-layout">
      <Header className="admin-header">
        <div className="admin-header-content">
          <Space>
            <Button
              icon={<HomeOutlined />}
              onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}
            >
              返回首页
            </Button>
            <h2 style={{ color: '#fff', margin: 0 }}>视频管理</h2>
          </Space>
          <Button
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            退出登录
          </Button>
        </div>
      </Header>
      <Content className="video-management-content">
        <div className="page-header">
          <h1>视频管理</h1>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
              刷新
            </Button>
            {/* 暂时隐藏：正常流程应该从APP端上传，经过审核后自动进入视频管理 */}
            {/* <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => navigate(ROUTES.ADMIN_VIDEO_UPLOAD)}
            >
              新增视频
            </Button> */}
          </Space>
        </div>

        {/* 分类Tab */}
        <Card className="filter-card">
          <Tabs
            activeKey={categoryFilter}
            onChange={handleCategoryTabChange}
            items={CATEGORY_TABS.map(tab => ({
              key: tab.key,
              label: tab.label,
            }))}
          />
          
          <div className="filter-row">
            <Space>
              <Search
                placeholder="搜索标题或创作者"
                allowClear
                onSearch={handleSearch}
                style={{ width: 250 }}
                prefix={<SearchOutlined />}
              />
              <Select
                placeholder="状态"
                style={{ width: 120 }}
                value={statusFilter}
                onChange={handleStatusFilterChange}
              >
                <Select.Option value="published">已上架</Select.Option>
                <Select.Option value="offline">已下架</Select.Option>
              </Select>
              <Select
                placeholder="推荐筛选"
                allowClear
                style={{ width: 120 }}
                value={recommendFilter}
                onChange={handleRecommendFilterChange}
              >
                <Select.Option value="true">仅推荐</Select.Option>
                <Select.Option value="false">非推荐</Select.Option>
              </Select>
            </Space>

            {/* 批量操作 */}
            <Space>
              {selectedRowKeys.length > 0 && (
                <span className="selected-count">
                  已选择 {selectedRowKeys.length} 项
                </span>
              )}
              <Dropdown menu={{ items: batchMenuItems }} disabled={selectedRowKeys.length === 0}>
                <Button>
                  批量操作 <DownOutlined />
                </Button>
              </Dropdown>
            </Space>
          </div>
        </Card>

        {/* 视频列表 */}
        <Card className="table-card">
          <Table
            columns={columns}
            dataSource={videos}
            rowKey="_id"
            loading={loading}
            rowSelection={rowSelection}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1400 }}
          />
        </Card>

        {/* 批量修改分类弹窗 */}
        <Modal
          title="批量修改分类"
          open={batchCategoryModalVisible}
          onCancel={() => setBatchCategoryModalVisible(false)}
          onOk={handleBatchCategorySubmit}
          okText="确认修改"
        >
          <div style={{ marginBottom: 16 }}>
            已选择 <strong>{selectedRowKeys.length}</strong> 个视频
          </div>
          <Form.Item label="目标分类">
            <Select
              placeholder="选择目标分类"
              style={{ width: '100%' }}
              value={targetCategory}
              onChange={setTargetCategory}
            >
              {CATEGORY_OPTIONS.map(opt => (
                <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Modal>

        {/* 批量设置排序弹窗 */}
        <Modal
          title="批量设置排序"
          open={batchSortModalVisible}
          onCancel={() => setBatchSortModalVisible(false)}
          onOk={handleBatchSortSubmit}
          okText="确认设置"
        >
          <div style={{ marginBottom: 16 }}>
            已选择 <strong>{selectedRowKeys.length}</strong> 个视频，将按选择顺序设置排序值
          </div>
          <Form layout="vertical">
            <Form.Item label="起始排序值">
              <InputNumber
                min={0}
                value={sortStartValue}
                onChange={(v) => v !== null && setSortStartValue(v)}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item label="递增间隔">
              <InputNumber
                min={1}
                value={sortIncrement}
                onChange={(v) => v !== null && setSortIncrement(v)}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <div className="sort-preview">
              预览：{selectedRowKeys.slice(0, 5).map((_, i) => 
                sortStartValue + i * sortIncrement
              ).join(', ')}{selectedRowKeys.length > 5 && ', ...'}
            </div>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};
