import { useState } from 'react';
import { Popup, Toast, Tabs, Input, Button } from 'antd-mobile';
import { EyeInvisibleOutline, EyeOutline } from 'antd-mobile-icons';
import { useUserStore } from '@/store/userStore';
import { userService } from '@/services/userService';
import './LoginModal.css';

interface LoginModalProps {
  visible: boolean;
  onClose: () => void;
}

type TabKey = 'phone' | 'wechat';
type Mode = 'login' | 'register';

export const LoginModal: React.FC<LoginModalProps> = ({ visible, onClose }) => {
  const { loginWithWechat } = useUserStore();
  const [activeTab, setActiveTab] = useState<TabKey>('phone');
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // 表单数据
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');

  // 重置表单
  const resetForm = () => {
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setNickname('');
    setShowPassword(false);
  };

  // 切换模式
  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    resetForm();
  };

  // 验证手机号
  const isValidPhone = (phone: string) => {
    return /^1[3-9]\d{9}$/.test(phone);
  };

  // 处理手机号登录
  const handlePhoneLogin = async () => {
    if (!phone.trim()) {
      Toast.show({ content: '请输入手机号', icon: 'fail' });
      return;
    }
    if (!isValidPhone(phone)) {
      Toast.show({ content: '请输入正确的手机号', icon: 'fail' });
      return;
    }
    if (!password.trim()) {
      Toast.show({ content: '请输入密码', icon: 'fail' });
      return;
    }
    if (password.length < 6) {
      Toast.show({ content: '密码至少6位', icon: 'fail' });
      return;
    }

    try {
      setLoading(true);
      const response = await userService.login({ phone, password });
      
      // 更新用户状态
      useUserStore.getState().setUser(response.user);
      
      Toast.show({ content: '登录成功！', icon: 'success' });
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('登录失败:', error);
      Toast.show({ 
        content: error.response?.data?.message || error.message || '登录失败，请重试', 
        icon: 'fail' 
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理注册
  const handleRegister = async () => {
    if (!nickname.trim()) {
      Toast.show({ content: '请输入昵称', icon: 'fail' });
      return;
    }
    if (nickname.length < 2 || nickname.length > 20) {
      Toast.show({ content: '昵称需要2-20个字符', icon: 'fail' });
      return;
    }
    if (!phone.trim()) {
      Toast.show({ content: '请输入手机号', icon: 'fail' });
      return;
    }
    if (!isValidPhone(phone)) {
      Toast.show({ content: '请输入正确的手机号', icon: 'fail' });
      return;
    }
    if (!password.trim()) {
      Toast.show({ content: '请输入密码', icon: 'fail' });
      return;
    }
    if (password.length < 6) {
      Toast.show({ content: '密码至少6位', icon: 'fail' });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({ content: '两次密码输入不一致', icon: 'fail' });
      return;
    }

    try {
      setLoading(true);
      const response = await userService.register({ nickname, phone, password });
      
      // 更新用户状态
      useUserStore.getState().setUser(response.user);
      
      Toast.show({ content: '注册成功！', icon: 'success' });
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('注册失败:', error);
      Toast.show({ 
        content: error.response?.data?.message || error.message || '注册失败，请重试', 
        icon: 'fail' 
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理微信登录
  const handleWechatLogin = async () => {
    try {
      setLoading(true);
      
      if (import.meta.env.DEV) {
        Toast.show({
          content: '开发模式：使用模拟登录',
          icon: 'success',
          duration: 1000,
        });
      }
      
      await loginWithWechat();
      
      if (import.meta.env.DEV) {
        onClose();
        Toast.show({
          content: '登录成功！',
          icon: 'success',
        });
      }
    } catch (error) {
      console.error('微信登录失败:', error);
      Toast.show({
        content: '微信登录失败，请重试',
        icon: 'fail',
      });
      setLoading(false);
    }
  };

  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      onClose={onClose}
      bodyStyle={{
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',
      }}
    >
      <div className="login-modal">
        {/* 关闭按钮 */}
        <div className="login-modal-close" onClick={onClose}>
          ×
        </div>

        {/* 标题 */}
        <div className="login-modal-header">
          <h2 className="login-modal-title">
            {mode === 'login' ? '欢迎登录' : '注册账号'}
          </h2>
          <p className="login-modal-subtitle">
            {mode === 'login' ? '登录后享受更多功能' : '创建账号开始使用'}
          </p>
        </div>

        {/* Tab切换 - 仅登录模式显示 */}
        {mode === 'login' && (
          <Tabs 
            activeKey={activeTab} 
            onChange={(key) => setActiveTab(key as TabKey)}
            className="login-tabs"
          >
            <Tabs.Tab title="手机登录" key="phone" />
            <Tabs.Tab title="微信登录" key="wechat" />
          </Tabs>
        )}

        {/* 登录/注册表单 */}
        <div className="login-modal-body">
          {mode === 'register' ? (
            // 注册表单
            <div className="login-form">
              <div className="form-item">
                <Input
                  placeholder="请输入昵称"
                  value={nickname}
                  onChange={setNickname}
                  maxLength={20}
                  clearable
                />
              </div>
              <div className="form-item">
                <Input
                  placeholder="请输入手机号"
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  maxLength={11}
                  clearable
                />
              </div>
              <div className="form-item password-item">
                <Input
                  placeholder="请输入密码（至少6位）"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={setPassword}
                  clearable
                />
                <div 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOutline /> : <EyeInvisibleOutline />}
                </div>
              </div>
              <div className="form-item password-item">
                <Input
                  placeholder="请确认密码"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  clearable
                />
              </div>
              <Button
                block
                color="primary"
                size="large"
                loading={loading}
                onClick={handleRegister}
                className="submit-btn"
              >
                注册
              </Button>
              <div className="switch-mode">
                已有账号？
                <span className="switch-link" onClick={toggleMode}>
                  立即登录
                </span>
              </div>
            </div>
          ) : activeTab === 'phone' ? (
            // 手机号登录表单
            <div className="login-form">
              <div className="form-item">
                <Input
                  placeholder="请输入手机号"
                  type="tel"
                  value={phone}
                  onChange={setPhone}
                  maxLength={11}
                  clearable
                />
              </div>
              <div className="form-item password-item">
                <Input
                  placeholder="请输入密码"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={setPassword}
                  clearable
                />
                <div 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOutline /> : <EyeInvisibleOutline />}
                </div>
              </div>
              <Button
                block
                color="primary"
                size="large"
                loading={loading}
                onClick={handlePhoneLogin}
                className="submit-btn"
              >
                登录
              </Button>
              <div className="switch-mode">
                没有账号？
                <span className="switch-link" onClick={toggleMode}>
                  立即注册
                </span>
              </div>
            </div>
          ) : (
            // 微信登录
            <div className="wechat-login-section">
              <button
                className="wechat-login-btn"
                onClick={handleWechatLogin}
                disabled={loading}
              >
                <span className="wechat-icon">🟢</span>
                <span className="wechat-text">
                  {loading ? '登录中...' : '微信登录'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* 底部说明 */}
        <div className="login-modal-footer">
          <p className="login-modal-tips">
            {mode === 'login' ? '登录' : '注册'}即表示同意
            <span className="login-modal-link">《用户协议》</span>
            和
            <span className="login-modal-link">《隐私政策》</span>
          </p>
        </div>
      </div>
    </Popup>
  );
};
