import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { adminService } from '@/services/adminService';
import { ROUTES } from '@/constants/routes';
import './AdminLogin.css';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      setLoading(true);
      await adminService.login(values.username, values.password);
      message.success('登录成功');
      navigate(ROUTES.ADMIN_DASHBOARD);
    } catch (error: any) {
      console.error('登录失败:', error);
      message.error(error?.response?.data?.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-container">
        <Card className="admin-login-card">
          <div className="admin-login-header">
            <h1>管理后台</h1>
            <p>AI视频交易平台</p>
          </div>
          <Form
            name="admin-login"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="用户名"
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{ height: 40 }}
              >
                登录
              </Button>
            </Form.Item>
          </Form>
          <div className="admin-login-footer">
            <p>默认账号：admin / yang0313</p>
          </div>
        </Card>
      </div>
    </div>
  );
};



