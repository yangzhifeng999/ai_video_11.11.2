import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Layout,
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  message,
  Spin,
  Select,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  CheckCircleOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { adminService } from '@/services/adminService';
import { ROUTES } from '@/constants/routes';
import type { UserListItem } from '@/types/admin';
import './UserDetail.css';

const { Header, Content } = Layout;

export const UserDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      fetchUserDetail();
    }
  }, [id]);

  const fetchUserDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await adminService.getUserDetail(id);
      setUser(data);
      form.setFieldsValue({
        nickname: data.nickname,
        points: data.points,
        balance: data.balance,
        isCreator: data.isCreator,
        isAdmin: data.isAdmin,
        status: data.status,
      });
    } catch (error: any) {
      console.error('获取用户详情失败:', error);
      if (error?.response?.status === 401) {
        message.error('登录已过期，请重新登录');
        navigate(ROUTES.ADMIN_LOGIN);
      } else {
        message.error('获取用户详情失败');
        navigate(ROUTES.ADMIN_USERS);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!id) return;

      await adminService.updateUser(id, values);
      message.success('更新成功');
      setEditModalVisible(false);
      fetchUserDetail();
    } catch (error: any) {
      console.error('更新失败:', error);
      message.error(error?.response?.data?.message || '更新失败');
    }
  };

  const handleBan = () => {
    if (!user || !id) return;

    Modal.confirm({
      title: user.status === 'active' ? '确认封禁用户？' : '确认解封用户？',
      content: user.status === 'active'
        ? '封禁后用户将无法登录和使用平台功能'
        : '解封后用户将恢复正常使用',
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: user.status === 'active' },
      onOk: async () => {
        try {
          await adminService.banUser(id, user.status === 'active' ? '违规操作' : undefined);
          message.success(user.status === 'active' ? '封禁成功' : '解封成功');
          fetchUserDetail();
        } catch (error: any) {
          console.error('操作失败:', error);
          message.error(error?.response?.data?.message || '操作失败');
        }
      },
    });
  };

  const handleDelete = () => {
    if (!user || !id) return;

    Modal.confirm({
      title: '确认删除用户？',
      content: '删除后数据无法恢复，请谨慎操作！',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        message.warning('删除功能暂未实现');
      },
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate(ROUTES.ADMIN_LOGIN);
    message.success('已退出登录');
  };

  if (loading) {
    return (
      <Layout className="admin-dashboard-layout">
        <Header className="admin-header">
          <div className="admin-header-content">
            <h2 style={{ color: '#fff', margin: 0 }}>用户详情</h2>
          </div>
        </Header>
        <Content className="admin-content">
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Spin size="large" />
          </div>
        </Content>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Layout className="admin-dashboard-layout">
      <Header className="admin-header">
        <div className="admin-header-content">
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(ROUTES.ADMIN_USERS)}
              style={{ color: '#fff' }}
            >
              返回列表
            </Button>
            <h2 style={{ color: '#fff', margin: 0 }}>用户详情</h2>
          </Space>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>
            退出登录
          </Button>
        </div>
      </Header>
      <Content className="admin-content">
        <Card
          title="基本信息"
          extra={
            <Space>
              <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
                编辑
              </Button>
              <Button
                danger={user.status === 'active'}
                type={user.status === 'active' ? 'default' : 'primary'}
                icon={user.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
                onClick={handleBan}
              >
                {user.status === 'active' ? '封禁' : '解封'}
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                删除
              </Button>
            </Space>
          }
        >
          <Descriptions column={2} bordered>
            <Descriptions.Item label="用户ID">{user._id}</Descriptions.Item>
            <Descriptions.Item label="手机号">{user.phone}</Descriptions.Item>
            <Descriptions.Item label="昵称">{user.nickname || '未设置'}</Descriptions.Item>
            <Descriptions.Item label="头像">
              {user.avatar ? (
                <img src={user.avatar} alt="头像" style={{ width: 50, height: 50, borderRadius: '50%' }} />
              ) : (
                '未设置'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="积分">{user.points}</Descriptions.Item>
            <Descriptions.Item label="余额">¥{user.balance.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={user.status === 'active' ? 'success' : 'error'}>
                {user.status === 'active' ? '正常' : '已禁用'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="角色">
              <Space>
                {user.isAdmin && <Tag color="red">管理员</Tag>}
                {user.isCreator && <Tag color="blue">创作者</Tag>}
                {!user.isAdmin && !user.isCreator && <Tag>普通用户</Tag>}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="注册时间">
              {new Date(user.createdAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
            <Descriptions.Item label="最后登录">
              {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('zh-CN') : '未登录'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 编辑弹窗 */}
        <Modal
          title="编辑用户"
          open={editModalVisible}
          onOk={handleEditSubmit}
          onCancel={() => setEditModalVisible(false)}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="昵称" name="nickname" rules={[{ required: true, message: '请输入昵称' }]}>
              <Input placeholder="请输入昵称" />
            </Form.Item>
            <Form.Item label="积分" name="points" rules={[{ required: true, message: '请输入积分' }]}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入积分" />
            </Form.Item>
            <Form.Item label="余额" name="balance" rules={[{ required: true, message: '请输入余额' }]}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="请输入余额" />
            </Form.Item>
            <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
              <Select>
                <Select.Option value="active">正常</Select.Option>
                <Select.Option value="disabled">已禁用</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="创作者" name="isCreator" valuePropName="checked">
              <Switch checkedChildren="是" unCheckedChildren="否" />
            </Form.Item>
            <Form.Item label="管理员" name="isAdmin" valuePropName="checked">
              <Switch checkedChildren="是" unCheckedChildren="否" />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};
