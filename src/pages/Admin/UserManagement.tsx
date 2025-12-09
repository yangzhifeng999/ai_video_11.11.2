import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Table, Input, Button, Tag, Space, message, Card, Select, Modal } from 'antd';
import { SearchOutlined, UserOutlined, LogoutOutlined, DownloadOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { adminService } from '@/services/adminService';
import { ROUTES } from '@/constants/routes';
import type { UserListItem } from '@/types/admin';
import './UserManagement.css';

const { Header, Content } = Layout;
const { Search } = Input;

export const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'disabled' | undefined>(undefined);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  const fetchUsers = async (page = 1, searchKeyword = '', status?: 'active' | 'disabled') => {
    try {
      setLoading(true);
      const response = await adminService.getUserList({
        page,
        pageSize: pagination.pageSize,
        keyword: searchKeyword.trim() || undefined,
        status,
      });
      setUsers(response.list);
      setPagination({
        ...pagination,
        current: response.page,
        total: response.total,
      });
    } catch (error: any) {
      console.error('获取用户列表失败:', error);
      if (error?.response?.status === 401) {
        message.error('登录已过期，请重新登录');
        navigate(ROUTES.ADMIN_LOGIN);
      } else {
        message.error('获取用户列表失败');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (value: string) => {
    setKeyword(value);
    setPagination({ ...pagination, current: 1 });
    fetchUsers(1, value, statusFilter);
  };

  const handleStatusFilterChange = (value: 'active' | 'disabled' | undefined) => {
    setStatusFilter(value);
    setPagination({ ...pagination, current: 1 });
    fetchUsers(1, keyword, value);
  };

  const handleTableChange = (newPagination: any) => {
    setPagination(newPagination);
    fetchUsers(newPagination.current, keyword, statusFilter);
  };

  const handleRefresh = () => {
    fetchUsers(pagination.current, keyword, statusFilter);
  };

  const handleExport = () => {
    // 导出为 CSV
    const headers = ['用户ID', '手机号', '昵称', '积分', '余额', '状态', '注册时间'];
    const csvContent = [
      headers.join(','),
      ...users.map(user => [
        user._id,
        user.phone,
        user.nickname || '',
        user.points,
        user.balance,
        user.status === 'active' ? '正常' : '已禁用',
        new Date(user.createdAt).toLocaleString('zh-CN'),
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `用户列表_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    message.success('导出成功');
  };

  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要删除的用户');
      return;
    }

    Modal.confirm({
      title: `确认删除 ${selectedRowKeys.length} 个用户？`,
      content: '删除后数据无法恢复，请谨慎操作！',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        message.warning('批量删除功能暂未实现');
        setSelectedRowKeys([]);
      },
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate(ROUTES.ADMIN_LOGIN);
    message.success('已退出登录');
  };

  const columns = [
    {
      title: '用户ID',
      dataIndex: '_id',
      key: '_id',
      width: 120,
      ellipsis: true,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 120,
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      width: 100,
      align: 'right' as const,
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 100,
      align: 'right' as const,
      render: (balance: number) => `¥${balance.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '正常' : '已禁用'}
        </Tag>
      ),
    },
    {
      title: '角色',
      key: 'roles',
      width: 150,
      render: (_: any, record: UserListItem) => (
        <Space>
          {record.isAdmin && <Tag color="red">管理员</Tag>}
          {record.isCreator && <Tag color="blue">创作者</Tag>}
          {!record.isAdmin && !record.isCreator && <Tag>普通用户</Tag>}
        </Space>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: UserListItem) => (
        <Button
          type="link"
          onClick={() => navigate(ROUTES.ADMIN_USER_DETAIL.replace(':id', record._id))}
        >
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <Layout className="admin-dashboard-layout">
      <Header className="admin-header">
        <div className="admin-header-content">
          <Space>
            <Button
              type="text"
              icon={<UserOutlined />}
              onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}
              style={{ color: '#fff' }}
            >
              返回首页
            </Button>
            <h2 style={{ color: '#fff', margin: 0 }}>用户管理</h2>
          </Space>
          <Button
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            退出登录
          </Button>
        </div>
      </Header>
      <Content className="admin-content">
        <Card>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {/* 搜索和筛选 */}
            <Space wrap>
              <Search
                placeholder="搜索手机号或昵称"
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
                style={{ width: 300 }}
              />
              <Select
                placeholder="状态筛选"
                allowClear
                style={{ width: 120 }}
                onChange={handleStatusFilterChange}
                value={statusFilter}
              >
                <Select.Option value="active">正常</Select.Option>
                <Select.Option value="disabled">已禁用</Select.Option>
              </Select>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
              >
                刷新
              </Button>
            </Space>

            {/* 操作按钮 */}
            <Space wrap>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => message.info('添加用户功能开发中')}
              >
                添加用户
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
              >
                导出数据
              </Button>
              {selectedRowKeys.length > 0 && (
                <Button
                  danger
                  onClick={handleBatchDelete}
                >
                  批量删除 ({selectedRowKeys.length})
                </Button>
              )}
            </Space>
          </Space>
          <Table
            columns={columns}
            dataSource={users}
            rowKey="_id"
            loading={loading}
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
          />
        </Card>
      </Content>
    </Layout>
  );
};

