import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavBar, Button, Input, TextArea, Toast, Dialog, Popup } from 'antd-mobile';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useUserStore } from '@/store/userStore';
import { ROUTES } from '@/constants/routes';
import type { IUser } from '@/types/user';
import './ProfileEdit.css';

export const ProfileEdit: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUserStore();
  
  // 表单状态
  const [formData, setFormData] = useState({
    nickname: user?.nickname || '',
    gender: user?.gender || 'secret',
    bio: user?.bio || '',
  });
  
  // 头像状态
  const [avatar, setAvatar] = useState(user?.avatar || 'https://via.placeholder.com/100');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 图片裁剪相关状态
  const [imgSrc, setImgSrc] = useState('');
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  
  // 表单错误状态
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 验证表单
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.nickname.trim()) {
      newErrors.nickname = '昵称不能为空';
    } else if (formData.nickname.trim().length < 2) {
      newErrors.nickname = '昵称至少需要2个字符';
    } else if (formData.nickname.trim().length > 20) {
      newErrors.nickname = '昵称不能超过20个字符';
    }
    
    if (formData.bio && formData.bio.length > 200) {
      newErrors.bio = '个人简介不能超过200个字符';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理头像选择
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      Toast.show({ content: '请选择图片文件', icon: 'fail' });
      return;
    }
    
    // 验证文件大小（限制为 5MB）
    if (file.size > 5 * 1024 * 1024) {
      Toast.show({ content: '图片大小不能超过 5MB', icon: 'fail' });
      return;
    }
    
    // 读取文件并打开裁剪弹窗
    const reader = new FileReader();
    reader.onloadend = () => {
      setImgSrc(reader.result as string);
      setCropModalVisible(true);
    };
    reader.readAsDataURL(file);
    
    // 重置文件输入
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
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // 清除该字段的错误提示
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // 保存用户信息
  const handleSave = async () => {
    if (!validateForm()) {
      Toast.show({ content: '请检查表单信息', icon: 'fail' });
      return;
    }

    setIsLoading(true);
    try {
      let finalAvatarUrl = avatar;

      // 如果头像是 blob URL（新上传的），需要先上传到 COS
      if (avatar.startsWith('blob:')) {
        Toast.show({ content: '正在上传头像...', icon: 'loading', duration: 0 });
        
        // 将 blob URL 转换为 Blob 对象
        const response = await fetch(avatar);
        const blob = await response.blob();
        
        // 上传到 COS
        const { userService } = await import('@/services/userService');
        finalAvatarUrl = await userService.uploadAvatar(blob, (percent) => {
          console.log('头像上传进度:', percent + '%');
        });
        
        Toast.clear();
        console.log('头像上传成功:', finalAvatarUrl);
      }

      // 更新用户信息到后端
      if (user) {
        const updateData = {
          nickname: formData.nickname.trim(),
          gender: formData.gender as 'male' | 'female' | 'secret',
          bio: formData.bio.trim(),
          avatar: finalAvatarUrl,
        };
        
        // 调用后端API更新
        const { userService } = await import('@/services/userService');
        console.log('调用后端API，数据:', updateData);
        
        let backendUser: any = null;
        try {
          backendUser = await userService.updateProfile(updateData);
          console.log('后端返回:', backendUser);
        } catch (apiError) {
          console.error('后端API调用失败:', apiError);
          // 即使后端失败，也使用本地数据
        }
        
        // 合并当前用户信息和后端返回的信息
        // 后端返回 _id，前端使用 id
        const updatedUser: IUser = {
          ...user,
          ...(backendUser || {}),
          id: backendUser?._id || backendUser?.id || user.id,
          avatar: finalAvatarUrl,  // 确保使用最新的头像URL
          nickname: formData.nickname.trim(),
          gender: formData.gender as 'male' | 'female' | 'secret',
          bio: formData.bio.trim(),
          updatedAt: new Date().toISOString(),
        };
        
        console.log('最终用户信息:', updatedUser);
        console.log('最终头像URL:', updatedUser.avatar);
        
        // 保存到全局状态
        setUser(updatedUser);
        
        // 手动刷新 localStorage（确保持久化）
        const storageData = {
          state: {
            user: updatedUser,
            isAuthenticated: true,
          },
          version: 0,
        };
        localStorage.setItem('user-storage', JSON.stringify(storageData));
        console.log('已保存到 localStorage:', storageData);
        
        Toast.show({ 
          content: '保存成功', 
          icon: 'success',
          duration: 1500,
        });
        
        // 延迟返回，让用户看到成功提示
        setTimeout(() => {
          navigate(ROUTES.PROFILE);
        }, 500);
      }
    } catch (error: any) {
      console.error('保存失败:', error);
      Toast.show({ 
        content: error?.response?.data?.message || '保存失败，请重试', 
        icon: 'fail' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    if (
      formData.nickname !== user?.nickname ||
      formData.gender !== user?.gender ||
      formData.bio !== user?.bio ||
      avatar !== user?.avatar
    ) {
      Dialog.confirm({
        content: '您有未保存的更改，是否放弃？',
        cancelText: '继续编辑',
        confirmText: '放弃',
        onConfirm: () => navigate(-1),
      });
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="profile-edit-page">
      <NavBar onBack={handleCancel}>编辑资料</NavBar>

      <div className="profile-edit-content">
        {/* 头像编辑区 */}
        <div className="profile-edit-avatar-section">
          <div className="avatar-container">
            <img 
              src={avatar} 
              alt="用户头像" 
              className="avatar-image"
              onClick={() => fileInputRef.current?.click()}
            />
            <div className="avatar-overlay" onClick={() => fileInputRef.current?.click()}>
              <span className="avatar-icon">📷</span>
              <span className="avatar-text">更改头像</span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarSelect}
            style={{ display: 'none' }}
          />
          <p className="avatar-tip">点击头像可以更换</p>
        </div>

        {/* 表单区 */}
        <form className="profile-edit-form">
          {/* 昵称 */}
          <div className="form-group">
            <label className="form-label">昵称 <span className="required">*</span></label>
            <Input
              value={formData.nickname}
              onChange={val => handleInputChange('nickname', val)}
              placeholder="请输入昵称（2-20字符）"
              maxLength={20}
              className={errors.nickname ? 'input-error' : ''}
            />
            {errors.nickname && <div className="error-message">{errors.nickname}</div>}
            <div className="form-counter">{formData.nickname.length}/20</div>
          </div>

          {/* 性别 */}
          <div className="form-group">
            <label className="form-label">性别</label>
            <div className="gender-options">
              <label className="gender-option">
                <input
                  type="radio"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={e => handleInputChange('gender', e.target.value)}
                />
                <span>男</span>
              </label>
              <label className="gender-option">
                <input
                  type="radio"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={e => handleInputChange('gender', e.target.value)}
                />
                <span>女</span>
              </label>
              <label className="gender-option">
                <input
                  type="radio"
                  value="secret"
                  checked={formData.gender === 'secret'}
                  onChange={e => handleInputChange('gender', e.target.value)}
                />
                <span>保密</span>
              </label>
            </div>
          </div>

          {/* 个人简介 */}
          <div className="form-group">
            <label className="form-label">个人简介</label>
            <TextArea
              value={formData.bio}
              onChange={val => handleInputChange('bio', val)}
              placeholder="请输入个人简介，让别人更了解你（最多200字符）"
              maxLength={200}
              rows={4}
              className={errors.bio ? 'input-error' : ''}
            />
            {errors.bio && <div className="error-message">{errors.bio}</div>}
            <div className="form-counter">{formData.bio.length}/200</div>
          </div>
        </form>

        {/* 底部按钮 */}
        <div className="profile-edit-actions">
          <Button 
            block 
            fill="outline" 
            onClick={handleCancel}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button 
            block 
            color="primary" 
            onClick={handleSave}
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

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
    </div>
  );
};

export default ProfileEdit;
