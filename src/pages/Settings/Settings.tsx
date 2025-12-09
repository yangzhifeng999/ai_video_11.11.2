import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Button, Dialog, Toast, Switch, Popup, Input, TextArea } from 'antd-mobile';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { NavBar } from '@/components/NavBar';
import { BottomTabBar } from '@/components/BottomTabBar';
import { useUserStore } from '@/store';
import { ROUTES } from '@/constants/routes';
import type { IUser } from '@/types/user';
import './Settings.css';

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { logout, clearAuth, isAuthenticated, user, setUser } = useUserStore();
  
  // 通知设置状态
  const [notificationSettings, setNotificationSettings] = useState({
    orderNotification: true,
    messageNotification: true,
    systemNotification: true,
    marketingNotification: false,
  });

  // 通知管理弹窗状态
  const [notificationSettingsVisible, setNotificationSettingsVisible] = useState(false);

  // 反馈弹窗状态
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackContact, setFeedbackContact] = useState('');

  // 账号与安全页面状态
  const [accountSecurityVisible, setAccountSecurityVisible] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 资料编辑表单状态
  const [profileForm, setProfileForm] = useState({
    nickname: user?.nickname || '',
    gender: user?.gender || 'secret',
    bio: user?.bio || '',
  });
  
  // 头像状态
  const [avatar, setAvatar] = useState(user?.avatar || 'https://via.placeholder.com/100');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 图片裁剪相关状态
  const [imgSrc, setImgSrc] = useState('');
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  
  // 表单错误状态
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 初始化表单数据
  useEffect(() => {
    if (user) {
      setProfileForm({
        nickname: user.nickname || '',
        gender: user.gender || 'secret',
        bio: user.bio || '',
      });
      setAvatar(user.avatar || 'https://via.placeholder.com/100');
    }
  }, [user]);

  // 验证表单
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!profileForm.nickname.trim()) {
      newErrors.nickname = '昵称不能为空';
    } else if (profileForm.nickname.trim().length < 2) {
      newErrors.nickname = '昵称至少需要2个字符';
    } else if (profileForm.nickname.trim().length > 20) {
      newErrors.nickname = '昵称不能超过20个字符';
    }
    
    if (profileForm.bio && profileForm.bio.length > 200) {
      newErrors.bio = '个人简介不能超过200个字符';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理头像选择
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      Toast.show({ content: '请选择图片文件', icon: 'fail' });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      Toast.show({ content: '图片大小不能超过 5MB', icon: 'fail' });
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImgSrc(reader.result as string);
      setCropModalVisible(true);
    };
    reader.readAsDataURL(file);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 创建圆形裁剪区域
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const size = Math.min(naturalWidth, naturalHeight);
    const x = (naturalWidth - size) / 2;
    const y = (naturalHeight - size) / 2;
    
    setCrop({
      unit: 'px',
      x,
      y,
      width: size,
      height: size,
    });
  }, []);

  // 生成裁剪后的图片
  const getCroppedImg = (image: HTMLImageElement, crop: PixelCrop): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('无法创建画布上下文');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = crop.width;
    canvas.height = crop.height;
    
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve('');
          return;
        }
        const url = URL.createObjectURL(blob);
        resolve(url);
      }, 'image/png');
    });
  };

  // 确认裁剪
  const handleCropConfirm = async () => {
    if (!imgRef.current || !completedCrop) {
      Toast.show({ content: '请选择裁剪区域', icon: 'fail' });
      return;
    }

    try {
      const croppedImageUrl = await getCroppedImg(imgRef.current, completedCrop);
      setAvatar(croppedImageUrl);
      setCropModalVisible(false);
      setImgSrc('');
      Toast.show({ content: '头像已更新', icon: 'success' });
    } catch (error) {
      Toast.show({ content: '裁剪失败，请重试', icon: 'fail' });
    }
  };

  // 取消裁剪
  const handleCropCancel = () => {
    setCropModalVisible(false);
    setImgSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  // 处理表单输入变化
  const handleInputChange = (field: string, value: string) => {
    setProfileForm(prev => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // 保存资料
  const handleSaveProfile = async () => {
    if (!validateForm()) {
      Toast.show({ content: '请检查表单信息', icon: 'fail' });
      return;
    }

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));

      if (user) {
        const updatedUser: IUser = {
          ...user,
          nickname: profileForm.nickname.trim(),
          gender: profileForm.gender as 'male' | 'female' | 'secret',
          bio: profileForm.bio.trim(),
          avatar: avatar,
          updatedAt: new Date().toISOString(),
        };
        
        setUser(updatedUser);
        setIsEditingProfile(false);
        Toast.show({ content: '保存成功', icon: 'success' });
      }
    } catch (error) {
      Toast.show({ content: '保存失败，请重试', icon: 'fail' });
    } finally {
      setIsLoading(false);
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    if (user) {
      setProfileForm({
        nickname: user.nickname || '',
        gender: user.gender || 'secret',
        bio: user.bio || '',
      });
      setAvatar(user.avatar || 'https://via.placeholder.com/100');
    }
    setErrors({});
    setIsEditingProfile(false);
  };

  // 退出登录 - 直接退出，无需确认
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      // 即使 API 调用失败，也清除本地状态
      console.log('退出登录 API 失败，已在本地清除');
    }
    // 确保清除本地状态
    clearAuth();
    Toast.show({
      content: '已退出登录',
      icon: 'success',
    });
    navigate(ROUTES.HOME);
  };

  // 开发环境：清除登录状态（用于测试）
  const handleClearAuth = () => {
    Dialog.confirm({
      content: '确定要清除所有登录状态吗？这将清除 localStorage 中的所有用户数据。',
      onConfirm: () => {
        clearAuth();
        Toast.show({
          content: '已清除登录状态，页面将刷新',
          icon: 'success',
        });
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      },
    });
  };

  // 复制联系方式
  const handleCopyContact = (text: string, type: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        Toast.show({ content: `${type}已复制到剪贴板`, icon: 'success' });
      });
    } else {
      Toast.show({ content: `${type}: ${text}`, duration: 3000 });
    }
  };

  // 提交反馈
  const handleSubmitFeedback = () => {
    if (!feedbackContent.trim()) {
      Toast.show({ content: '请输入反馈内容', icon: 'fail' });
      return;
    }

    Toast.show({
      content: '反馈提交成功，感谢您的建议！',
      icon: 'success',
    });
    setFeedbackVisible(false);
    setFeedbackContent('');
    setFeedbackContact('');
  };


  return (
    <div className="settings-page">
      <NavBar title="设置" />
      <div className="settings-content">
        <List header="账号设置">
          <List.Item 
            arrow 
            onClick={() => setAccountSecurityVisible(true)}
          >
            账号与安全
          </List.Item>
          <List.Item 
            arrow 
            onClick={() => setNotificationSettingsVisible(true)}
          >
            通知管理
          </List.Item>
        </List>

        <List header="帮助与支持">
          <List.Item 
            arrow 
            onClick={() => {
              Dialog.alert({
                title: '帮助中心',
                content: (
                  <div className="help-content">
                    <div className="help-section">
                      <h4>常见问题</h4>
                      <div className="help-item">
                        <p className="help-question">Q: 如何上传视频？</p>
                        <p className="help-answer">A: 在首页点击"创作"按钮，选择双视频上传或文案上传，填写相关信息后提交审核。</p>
                      </div>
                      <div className="help-item">
                        <p className="help-question">Q: 审核需要多长时间？</p>
                        <p className="help-answer">A: 通常1-3个工作日内完成审核，审核结果将通过消息中心通知您。</p>
                      </div>
                      <div className="help-item">
                        <p className="help-question">Q: 如何提现？</p>
                        <p className="help-answer">A: 在"我的"页面进入"收益与提现"，输入提现金额，选择提现方式后提交申请。提现需扣除3%手续费。</p>
                      </div>
                      <div className="help-item">
                        <p className="help-question">Q: 如何获得积分？</p>
                        <p className="help-answer">A: 每天登录即可获得100积分，积分可用于兑换优惠券或参与活动。</p>
                      </div>
                    </div>
                    <div className="help-section">
                      <h4>联系客服</h4>
                      <p className="help-contact">微信：heiha_service</p>
                      <p className="help-contact">邮箱：service@heiha.com</p>
                    </div>
                  </div>
                ),
                confirmText: '知道了',
              });
            }}
          >
            帮助中心
          </List.Item>
          <List.Item 
            arrow 
            onClick={() => {
              Dialog.alert({
                title: '联系客服',
                content: (
                  <div style={{ padding: '16px 0' }}>
                    <p style={{ marginBottom: '12px', color: '#333' }}>客服工作时间：9:00 - 18:00</p>
                    <div style={{ marginBottom: '12px' }}>
                      <p style={{ color: '#666', marginBottom: '4px' }}>微信客服</p>
                      <Button 
                        size="small" 
                        fill="outline"
                        onClick={() => handleCopyContact('heiha_service', '微信号')}
                      >
                        heiha_service (点击复制)
                      </Button>
                    </div>
                    <div>
                      <p style={{ color: '#666', marginBottom: '4px' }}>邮箱客服</p>
                      <Button 
                        size="small" 
                        fill="outline"
                        onClick={() => handleCopyContact('service@heiha.com', '邮箱')}
                      >
                        service@heiha.com (点击复制)
                      </Button>
                    </div>
                  </div>
                ),
                confirmText: '关闭',
              });
            }}
          >
            联系客服
          </List.Item>
          <List.Item 
            arrow 
            onClick={() => setFeedbackVisible(true)}
          >
            意见反馈
          </List.Item>
        </List>

        <List header="关于我们">
          <List.Item 
            arrow 
            onClick={() => {
              Dialog.alert({
                title: '关于我们',
                content: (
                  <div className="about-content">
                    <div className="about-section">
                      <h4>嘿哈 - AI视频交易平台</h4>
                      <p>嘿哈是一个基于AI技术的视频交易平台，为创作者提供视频上传、交易和收益管理服务。用户可以购买喜欢的视频模板，使用AI技术制作同款视频。</p>
                    </div>
                    <div className="about-section">
                      <h4>核心功能</h4>
                      <ul>
                        <li>视频/文案上传与交易</li>
                        <li>AI人脸识别与视频制作</li>
                        <li>收益管理与提现</li>
                        <li>作品数据分析</li>
                      </ul>
                    </div>
                    <div className="about-section">
                      <h4>联系我们</h4>
                      <p>官网：www.heiha.com</p>
                      <p>微信：heiha_official</p>
                      <p>邮箱：contact@heiha.com</p>
                    </div>
                  </div>
                ),
                confirmText: '知道了',
              });
            }}
          >
            关于我们
          </List.Item>
          <List.Item 
            arrow 
            onClick={() => {
              Dialog.alert({
                title: '用户协议',
                content: (
                  <div className="agreement-content">
                    <h4>用户协议</h4>
                    <p>欢迎使用嘿哈AI视频交易平台！</p>
                    <p>在使用本平台服务前，请仔细阅读以下条款。使用本平台即表示您同意遵守以下协议：</p>
                    <h5>1. 服务条款</h5>
                    <p>本平台为用户提供视频上传、交易、AI制作等服务。用户需保证上传内容的合法性和原创性。</p>
                    <h5>2. 用户责任</h5>
                    <p>用户应妥善保管账号信息，对账号下的所有行为负责。不得上传违法、侵权内容。</p>
                    <h5>3. 知识产权</h5>
                    <p>用户上传的内容，知识产权归用户所有。平台有权在服务范围内使用用户内容。</p>
                    <h5>4. 隐私保护</h5>
                    <p>平台承诺保护用户隐私，不会泄露用户个人信息。</p>
                    <h5>5. 免责声明</h5>
                    <p>平台不对用户上传内容的合法性承担责任，用户需自行承担相关风险。</p>
                    <p style={{ marginTop: '16px', color: '#999', fontSize: '12px' }}>
                      本协议最终解释权归嘿哈平台所有。
                    </p>
                  </div>
                ),
                confirmText: '我已阅读',
              });
            }}
          >
            用户协议
          </List.Item>
          <List.Item 
            arrow 
            onClick={() => {
              Dialog.alert({
                title: '隐私政策',
                content: (
                  <div className="agreement-content">
                    <h4>隐私政策</h4>
                    <p>嘿哈平台非常重视用户隐私保护，本政策说明我们如何收集、使用和保护您的个人信息。</p>
                    <h5>1. 信息收集</h5>
                    <p>我们收集的信息包括：账号信息、联系方式、作品数据、交易记录等。</p>
                    <h5>2. 信息使用</h5>
                    <p>我们使用收集的信息用于：提供服务、改善用户体验、发送通知等。</p>
                    <h5>3. 信息保护</h5>
                    <p>我们采用加密技术保护您的个人信息，不会向第三方泄露。</p>
                    <h5>4. 信息共享</h5>
                    <p>除法律要求外，我们不会与第三方共享您的个人信息。</p>
                    <h5>5. 用户权利</h5>
                    <p>您有权查看、修改、删除您的个人信息，或要求我们停止使用。</p>
                    <p style={{ marginTop: '16px', color: '#999', fontSize: '12px' }}>
                      如有疑问，请联系客服：service@heiha.com
                    </p>
                  </div>
                ),
                confirmText: '我已阅读',
              });
            }}
          >
            隐私政策
          </List.Item>
          <List.Item onClick={() => {
            Dialog.alert({
              title: '版本信息',
              content: (
                <div style={{ padding: '16px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '16px' }}>📱</div>
                  <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>嘿哈 v1.0.0</p>
                  <p style={{ color: '#666', marginBottom: '16px' }}>AI视频交易平台</p>
                  <p style={{ color: '#999', fontSize: '12px' }}>© 2024 嘿哈平台 版权所有</p>
                </div>
              ),
              confirmText: '知道了',
            });
          }}>
            版本信息
          </List.Item>
        </List>

        <div className="settings-logout">
          <Button 
            color="danger" 
            block 
            onClick={handleLogout}
            disabled={!isAuthenticated}
          >
            退出登录
          </Button>
        </div>

        {/* 开发环境：清除登录状态按钮 */}
        {import.meta.env.DEV && (
          <div className="settings-logout" style={{ marginTop: '16px' }}>
            <Button 
              color="warning" 
              block 
              onClick={handleClearAuth}
              style={{ fontSize: '12px' }}
            >
              🧪 开发工具：清除登录状态
            </Button>
            <div style={{ 
              marginTop: '8px', 
              padding: '8px', 
              background: '#fff3cd', 
              borderRadius: '4px',
              fontSize: '12px',
              color: '#856404'
            }}>
              当前状态: {isAuthenticated ? '✅ 已登录' : '❌ 未登录'}
            </div>
          </div>
        )}
      </div>

      {/* 账号与安全弹窗 */}
      <Popup
        visible={accountSecurityVisible}
        onMaskClick={() => {
          if (isEditingProfile) {
            handleCancelEdit();
          } else {
            setAccountSecurityVisible(false);
          }
        }}
        position="bottom"
        bodyStyle={{ height: '90vh', borderRadius: '16px 16px 0 0' }}
      >
        <div className="popup-content-wrapper">
          <div className="popup-header">
            <h3>账号与安全</h3>
            <Button fill="none" size="small" onClick={() => {
              if (isEditingProfile) {
                handleCancelEdit();
              } else {
                setAccountSecurityVisible(false);
              }
            }}>关闭</Button>
          </div>
          <div className="popup-body">
            {isEditingProfile ? (
              <div style={{ padding: '16px' }}>
                {/* 头像编辑 */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img 
                      src={avatar} 
                      alt="用户头像" 
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        cursor: 'pointer',
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    />
                    <div 
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        borderRadius: '50%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        opacity: 0,
                        transition: 'opacity 0.3s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span style={{ fontSize: '24px' }}>📷</span>
                      <span style={{ fontSize: '12px', color: '#fff', fontWeight: '500' }}>更改</span>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    style={{ display: 'none' }}
                  />
                  <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>点击头像可以更换</p>
                </div>

                {/* 昵称 */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    昵称 <span style={{ color: '#ff4d4f' }}>*</span>
                  </label>
                  <Input
                    value={profileForm.nickname}
                    onChange={val => handleInputChange('nickname', val)}
                    placeholder="请输入昵称（2-20字符）"
                    maxLength={20}
                    className={errors.nickname ? 'input-error' : ''}
                  />
                  {errors.nickname && (
                    <div style={{ fontSize: '12px', color: '#ff4d4f', marginTop: '4px' }}>
                      {errors.nickname}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px', textAlign: 'right' }}>
                    {profileForm.nickname.length}/20
                  </div>
                </div>

                {/* 性别 */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    性别
                  </label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        value="male"
                        checked={profileForm.gender === 'male'}
                        onChange={e => handleInputChange('gender', e.target.value)}
                        style={{ accentColor: '#667eea' }}
                      />
                      <span>男</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        value="female"
                        checked={profileForm.gender === 'female'}
                        onChange={e => handleInputChange('gender', e.target.value)}
                        style={{ accentColor: '#667eea' }}
                      />
                      <span>女</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        value="secret"
                        checked={profileForm.gender === 'secret'}
                        onChange={e => handleInputChange('gender', e.target.value)}
                        style={{ accentColor: '#667eea' }}
                      />
                      <span>保密</span>
                    </label>
                  </div>
                </div>

                {/* 个人简介 */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    个人简介
                  </label>
                  <TextArea
                    value={profileForm.bio}
                    onChange={val => handleInputChange('bio', val)}
                    placeholder="请输入个人简介，让别人更了解你（最多200字符）"
                    maxLength={200}
                    rows={4}
                    className={errors.bio ? 'input-error' : ''}
                  />
                  {errors.bio && (
                    <div style={{ fontSize: '12px', color: '#ff4d4f', marginTop: '4px' }}>
                      {errors.bio}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px', textAlign: 'right' }}>
                    {profileForm.bio.length}/200
                  </div>
                </div>

                {/* 操作按钮 */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <Button block fill="outline" onClick={handleCancelEdit} disabled={isLoading}>
                    取消
                  </Button>
                  <Button block color="primary" onClick={handleSaveProfile} loading={isLoading} disabled={isLoading}>
                    保存
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <List>
                  <List.Item 
                    extra={
                      <img 
                        src={user?.avatar || 'https://via.placeholder.com/100'} 
                        alt="头像"
                        style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    }
                    arrow
                    onClick={() => setIsEditingProfile(true)}
                  >
                    头像
                  </List.Item>
                  <List.Item 
                    extra={user?.nickname || '未设置'}
                    arrow
                    onClick={() => setIsEditingProfile(true)}
                  >
                    昵称
                  </List.Item>
                  <List.Item 
                    extra={
                      user?.gender === 'male' ? '男' : 
                      user?.gender === 'female' ? '女' : 
                      '保密'
                    }
                    arrow
                    onClick={() => setIsEditingProfile(true)}
                  >
                    性别
                  </List.Item>
                  <List.Item 
                    extra={user?.bio || '未设置'}
                    arrow
                    onClick={() => setIsEditingProfile(true)}
                  >
                    个人简介
                  </List.Item>
                </List>
                <div style={{ padding: '16px', color: '#999', fontSize: '12px' }}>
                  <p>• 点击任意项可进行编辑</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Popup>

      {/* 通知管理弹窗 */}
      <Popup
        visible={notificationSettingsVisible}
        onMaskClick={() => setNotificationSettingsVisible(false)}
        position="bottom"
        bodyStyle={{ height: '60vh', borderRadius: '16px 16px 0 0' }}
      >
        <div className="popup-content-wrapper">
          <div className="popup-header">
            <h3>通知管理</h3>
            <Button fill="none" size="small" onClick={() => setNotificationSettingsVisible(false)}>关闭</Button>
          </div>
          <div className="popup-body">
            <List>
              <List.Item
                extra={
                  <Switch
                    checked={notificationSettings.orderNotification}
                    onChange={(checked) => {
                      setNotificationSettings(prev => ({ ...prev, orderNotification: checked }));
                      Toast.show({ content: checked ? '已开启订单通知' : '已关闭订单通知', icon: 'success' });
                    }}
                  />
                }
              >
                订单通知
              </List.Item>
              <List.Item
                extra={
                  <Switch
                    checked={notificationSettings.messageNotification}
                    onChange={(checked) => {
                      setNotificationSettings(prev => ({ ...prev, messageNotification: checked }));
                      Toast.show({ content: checked ? '已开启消息通知' : '已关闭消息通知', icon: 'success' });
                    }}
                  />
                }
              >
                消息通知
              </List.Item>
              <List.Item
                extra={
                  <Switch
                    checked={notificationSettings.systemNotification}
                    onChange={(checked) => {
                      setNotificationSettings(prev => ({ ...prev, systemNotification: checked }));
                      Toast.show({ content: checked ? '已开启系统通知' : '已关闭系统通知', icon: 'success' });
                    }}
                  />
                }
              >
                系统通知
              </List.Item>
              <List.Item
                extra={
                  <Switch
                    checked={notificationSettings.marketingNotification}
                    onChange={(checked) => {
                      setNotificationSettings(prev => ({ ...prev, marketingNotification: checked }));
                      Toast.show({ content: checked ? '已开启营销通知' : '已关闭营销通知', icon: 'success' });
                    }}
                  />
                }
              >
                营销通知
              </List.Item>
            </List>
          </div>
        </div>
      </Popup>

      {/* 意见反馈弹窗 */}
      <Popup
        visible={feedbackVisible}
        onMaskClick={() => setFeedbackVisible(false)}
        position="bottom"
        bodyStyle={{ height: '70vh', borderRadius: '16px 16px 0 0' }}
      >
        <div className="popup-content-wrapper">
          <div className="popup-header">
            <h3>意见反馈</h3>
            <Button fill="none" size="small" onClick={() => setFeedbackVisible(false)}>取消</Button>
          </div>
          <div className="popup-body">
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  反馈内容 <span style={{ color: '#ff4d4f' }}>*</span>
                </label>
                <TextArea
                  value={feedbackContent}
                  onChange={setFeedbackContent}
                  placeholder="请详细描述您遇到的问题或建议..."
                  rows={6}
                  maxLength={500}
                  showCount
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  联系方式（选填）
                </label>
                <Input
                  value={feedbackContact}
                  onChange={setFeedbackContact}
                  placeholder="手机号或邮箱，方便我们联系您"
                />
              </div>
              <Button 
                block 
                color="primary" 
                onClick={handleSubmitFeedback}
                disabled={!feedbackContent.trim()}
              >
                提交反馈
              </Button>
            </div>
          </div>
        </div>
      </Popup>

      {/* 图片裁剪弹窗 */}
      <Popup
        visible={cropModalVisible}
        onMaskClick={handleCropCancel}
        bodyStyle={{
          borderRadius: '16px 16px 0 0',
          padding: '16px',
          background: '#fff',
          maxHeight: '90vh',
        }}
        position="bottom"
      >
        <div className="crop-modal">
          <div className="crop-modal-header">
            <h3>裁剪头像</h3>
            <Button size="small" fill="none" onClick={handleCropCancel}>取消</Button>
          </div>
          <div className="crop-modal-content">
            {imgSrc && (
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imgSrc}
                  style={{ maxWidth: '100%', maxHeight: '60vh' }}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            )}
          </div>
          <div className="crop-modal-footer">
            <Button block color="primary" onClick={handleCropConfirm}>
              确认
            </Button>
          </div>
        </div>
      </Popup>

      {/* 底部导航栏 */}
      <BottomTabBar />
    </div>
  );
};
