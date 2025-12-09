import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, TextArea, Toast, Popup, ImageUploader } from 'antd-mobile';
import { NavBar } from '@/components/NavBar';
import { useRequireLogin } from '@/hooks/useRequireLogin';
import { ROUTES } from '@/constants/routes';
import type { ImageUploadItem } from 'antd-mobile/es/components/image-uploader';
import './UploadText.css';

// 模拟审核状态数据（实际应该从后端获取）
interface ReviewStatus {
  id: string;
  title: string;
  status: 'pending' | 'quoted' | 'paid' | 'completed';
  statusText: string;
  quotedPrice?: number;
  submitTime: string;
}

export const UploadText: React.FC = () => {
  const navigate = useNavigate();
  const { requireLogin } = useRequireLogin();
  
  // 表单数据
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [referenceImages, setReferenceImages] = useState<ImageUploadItem[]>([]);
  
  // 广告视频相关状态
  const adVideoInputRef = React.useRef<HTMLInputElement>(null);
  const [adVideoFile, setAdVideoFile] = useState<File | null>(null);
  const [adVideoPreviewUrl, setAdVideoPreviewUrl] = useState<string>('');
  
  // 提交状态
  const [submitting, setSubmitting] = useState(false);
  
  // 视频教程弹窗
  const [showTutorial, setShowTutorial] = useState(false);
  
  // 模拟审核状态列表（实际应该从后端获取）
  const [reviewStatusList] = useState<ReviewStatus[]>([
    {
      id: '1',
      title: '母婴产品推广文案创意',
      status: 'quoted',
      statusText: '已报价',
      quotedPrice: 200,
      submitTime: '2024-01-20 10:30',
    },
    // 可以添加更多状态
  ]);

  // 表单验证
  const validateForm = (): boolean => {
    if (!title.trim()) {
      Toast.show({ content: '请输入创意标题', icon: 'fail' });
      return false;
    }

    if (title.trim().length < 2) {
      Toast.show({ content: '标题至少需要2个字符', icon: 'fail' });
      return false;
    }

    if (title.trim().length > 30) {
      Toast.show({ content: '标题不能超过30个字符', icon: 'fail' });
      return false;
    }

    if (!content.trim()) {
      Toast.show({ content: '请详细描述您的创意想法', icon: 'fail' });
      return false;
    }

    if (content.trim().length < 10) {
      Toast.show({ content: '创意描述至少需要10个字符，请详细说明', icon: 'fail' });
      return false;
    }

    if (content.trim().length > 500) {
      Toast.show({ content: '创意描述不能超过500个字符', icon: 'fail' });
      return false;
    }

    return true;
  };

  // 提交表单
  const handleSubmit = async () => {
    // 统一的提交逻辑
    const doSubmit = async () => {
      if (!validateForm()) return;

      setSubmitting(true);

      try {
        // 真实提交到后端
        const { videoService } = await import('@/services/videoService');
        
        // 收集参考图片 URL（如果有）
        const imageUrls = referenceImages.map(img => img.url);
        
        await videoService.submitTextIdea({
          title: title.trim(),
          content: content.trim(),
          ideaType: 'other',
          requirements: '',
          expectedDifficulty: 'medium',
          referenceImages: imageUrls,
          budget: null,
        });

        setSubmitting(false);
        Toast.show({ 
          content: '提交成功！等待后台审核报价', 
          icon: 'success',
          duration: 2000
        });
        
        // 跳转到我的作品页面（审核中）
        navigate(ROUTES.WORKS, {
          state: {
            filter: 'pending',
            refresh: true,
          },
        });
      } catch (err: any) {
        setSubmitting(false);
        console.error('提交文案失败:', err);
        Toast.show({ 
          content: err?.response?.data?.message || '提交失败，请重试', 
          icon: 'fail' 
        });
      }
    };

    // 检查登录状态
    // 注意：requireLogin 如果已登录会直接执行回调
    if (!requireLogin(doSubmit)) {
      return; // 未登录，弹出登录弹窗，登录成功后会执行 doSubmit
    }
    // 已登录时，回调已在 requireLogin 中执行
  };

  // 取消
  const handleCancel = () => {
    navigate(-1);
  };

  // 文件上传（图片或视频）
  const handleImageUpload = async (file: File) => {
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');
    
    return {
      url,
      extra: { isVideo, fileName: file.name },
    };
  };

  // 处理广告视频选择
  const handleAdVideoSelect = (file: File) => {
    if (!file.type.startsWith('video/')) {
      Toast.show({ content: '请选择视频文件', icon: 'fail' });
      return;
    }

    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      Toast.show({ content: '广告视频不能超过100MB', icon: 'fail' });
      return;
    }
    
    // 验证视频时长（广告视频限制10秒）
    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    videoElement.onloadedmetadata = () => {
      const duration = videoElement.duration;
      if (duration > 10) {
        Toast.show({ content: '广告视频时长不能超过10秒', icon: 'fail' });
        URL.revokeObjectURL(videoElement.src);
        return;
      }
      URL.revokeObjectURL(videoElement.src);
    };
    videoElement.src = URL.createObjectURL(file);

    setAdVideoFile(file);
    const url = URL.createObjectURL(file);
    setAdVideoPreviewUrl(url);
  };

  // 点击上传广告视频
  const handleClickUploadAd = () => {
    adVideoInputRef.current?.click();
  };

  // 文件输入变化
  const handleAdVideoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleAdVideoSelect(file);
  };

  // 删除广告视频
  const handleRemoveAdVideo = () => {
    setAdVideoFile(null);
    setAdVideoPreviewUrl('');
    if (adVideoInputRef.current) {
      adVideoInputRef.current.value = '';
    }
  };

  // 点击审核状态卡片
  const handleClickReviewStatus = (status: ReviewStatus) => {
    if (status.status === 'quoted') {
      // 如果是已报价状态，跳转到付款页面
      navigate(ROUTES.UPLOAD_TEXT_REVIEW, {
        state: {
          title: status.title,
          ideaType: 'other',
          content: '',
          requirements: '',
          expectedDifficulty: 'medium',
          referenceImages: 0,
          budget: null,
        },
      });
    } else {
      // 其他状态也跳转到审核页面查看详情
      navigate(ROUTES.UPLOAD_TEXT_REVIEW);
    }
  };

  return (
    <div className="upload-text-page">
      <NavBar title="提交创意文案" onBack={handleCancel} />

      {/* 步骤指示器 */}
      <div className="upload-text-steps">
        <div className="steps-container">
          <div className="step-item active">
            <div className="step-circle">
              <span className="step-icon">✍️</span>
            </div>
            <div className="step-label">提交创意</div>
          </div>
          <div className="step-line"></div>
          <div className="step-item">
            <div className="step-circle">
              <span className="step-icon">💰</span>
            </div>
            <div className="step-label">平台报价</div>
          </div>
          <div className="step-line"></div>
          <div className="step-item">
            <div className="step-circle">
              <span className="step-icon">✅</span>
            </div>
            <div className="step-label">确认付款</div>
          </div>
          <div className="step-line"></div>
          <div className="step-item">
            <div className="step-circle">
              <span className="step-icon">🎉</span>
            </div>
            <div className="step-label">制作交付</div>
          </div>
        </div>
      </div>

      <div className="upload-text-content">
        {/* 说明卡片 - 修改后的布局 */}
        <div className="info-card">
          <div className="info-header">
            <span className="info-icon">💡</span>
            <span className="info-title">如何提交创意？</span>
            <Button
              size="small"
              fill="outline"
              onClick={() => setShowTutorial(true)}
              className="tutorial-button-inline"
            >
              📹 视频教程
            </Button>
          </div>
          <div className="info-text">
            1. 详细描述您的创意想法和需求<br/>
            2. 平台将在24小时内审核并给出报价<br/>
            3. 您确认报价后付款，我们开始制作<br/>
            4. 支持1次免费修改，确保满意交付
          </div>
        </div>

        {/* 审核状态卡片 */}
        <div className="form-section">
          <div className="section-header">
            <span className="section-icon">📊</span>
            <span className="section-title">审核状态</span>
          </div>
          {reviewStatusList.length > 0 ? (
            <div className="review-status-list">
              {reviewStatusList.map((status) => (
                <div
                  key={status.id}
                  className={`review-status-card ${status.status}`}
                  onClick={() => handleClickReviewStatus(status)}
                >
                  <div className="status-header">
                    <div className="status-title-text">{status.title}</div>
                    <div className={`status-badge ${status.status}`}>
                      {status.statusText}
                    </div>
                  </div>
                  <div className="status-info">
                    <span className="status-time">提交时间：{status.submitTime}</span>
                    {status.quotedPrice && (
                      <span className="status-price">报价：¥{status.quotedPrice}</span>
                    )}
                  </div>
                  {status.status === 'quoted' && (
                    <div className="status-action-hint">
                      点击查看详情并付款 →
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-review-status">
              <div className="no-status-icon">📝</div>
              <div className="no-status-text">暂无审核中的文案</div>
            </div>
          )}
        </div>

        {/* 创意标题与描述合并卡片 */}
        <div className="form-section">
          <div className="section-header">
            <span className="section-icon">✏️</span>
            <span className="section-title">填写创意信息</span>
            <span className="required-mark">*</span>
          </div>
          
          <div className="unified-form-card">
            {/* 创意标题 */}
            <div className="form-item">
              <div className="item-label">
                <span className="label-text">创意标题</span>
                <span className="label-required">*</span>
              </div>
              <Input
                placeholder="给您的创意起个简洁明了的标题（2-30字）"
                value={title}
                onChange={setTitle}
                maxLength={30}
                clearable
                className="unified-input"
              />
              <div className="item-counter">{title.length}/30</div>
            </div>

            {/* 创意描述 */}
            <div className="form-item">
              <div className="item-label">
                <span className="label-text">创意描述</span>
                <span className="label-required">*</span>
              </div>
              <div className="item-hint">
                请详细描述您的创意想法，包括目标、风格、重点等
              </div>
              <TextArea
                placeholder="例如：我想要一个关于母婴产品的推广文案，目标用户是年轻妈妈，风格要温馨感人，重点突出产品的安全性和实用性..."
                value={content}
                onChange={setContent}
                maxLength={500}
                rows={8}
                showCount
                className="unified-textarea"
              />
            </div>
          </div>
        </div>

        {/* 参考文件 */}
        <div className="form-section">
          <div className="section-header">
            <span className="section-icon">📁</span>
            <span className="section-title">参考文件</span>
            <span className="optional-tag">选填</span>
          </div>
          <div className="field-hint">
            <span className="hint-icon">ℹ️</span>
            <span className="hint-text">上传参考文件（图片或视频）有助于我们更好地理解您的需求（最多5个）</span>
          </div>
          <ImageUploader
            value={referenceImages}
            onChange={setReferenceImages}
            upload={handleImageUpload}
            maxCount={5}
            accept="image/*,video/*"
            className="image-uploader"
          />
        </div>

        {/* 广告视频上传区 */}
        <div className="form-section">
          <div className="section-header">
            <span className="section-icon">📢</span>
            <span className="section-title">广告视频</span>
            <span className="required-mark">*</span>
          </div>
          <div className="field-hint">
            <span className="hint-icon">ℹ️</span>
            <span className="hint-text">为您的创意文案加加油，限时10秒，包含"嘿哈"2个字</span>
          </div>
          
          <div className="ad-video-upload-area">
            {adVideoFile ? (
              <div className="ad-video-preview">
                <div className="ad-video-player-container">
                  <video
                    className="ad-video-player"
                    src={adVideoPreviewUrl}
                    controls
                    preload="metadata"
                  />
                </div>
                <div className="ad-video-info">
                  <div className="ad-video-info-item">
                    <span>📄</span>
                    <span>{adVideoFile.name}</span>
                  </div>
                  <div className="ad-video-info-item">
                    <span>💾</span>
                    <span>{(adVideoFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                </div>
                <Button
                  color="danger"
                  fill="outline"
                  size="small"
                  onClick={handleRemoveAdVideo}
                  className="ad-video-remove-btn"
                >
                  🗑️ 删除视频
                </Button>
              </div>
            ) : (
              <div className="ad-video-upload-placeholder">
                <div className="ad-video-upload-icon">📢</div>
                <div className="ad-video-upload-text">点击选择广告视频</div>
                <div className="ad-video-upload-formats">
                  <span>MP4</span>
                  <span>MOV</span>
                  <span>AVI</span>
                  <span>•</span>
                  <span>最大 100MB</span>
                </div>
                <Button
                  color="primary"
                  size="middle"
                  onClick={handleClickUploadAd}
                  className="ad-video-select-btn"
                >
                  📁 选择广告视频
                </Button>
              </div>
            )}
          </div>

          <input
            ref={adVideoInputRef}
            type="file"
            accept="video/*"
            onChange={handleAdVideoInputChange}
            style={{ display: 'none' }}
          />
        </div>

      </div>

      {/* 底部操作按钮 */}
      <div className="upload-text-actions">
        <Button
          size="large"
          fill="outline"
          onClick={handleCancel}
          className="cancel-button"
          disabled={submitting}
        >
          取消
        </Button>
        <Button
          size="large"
          color="primary"
          onClick={handleSubmit}
          className="submit-button"
          loading={submitting}
        >
          提交创意
        </Button>
      </div>

      {/* 视频教程弹窗 */}
      {/* 视频教程弹窗 */}
      <Popup
        visible={showTutorial}
        onMaskClick={() => setShowTutorial(false)}
        bodyStyle={{
          borderRadius: '16px',
          padding: '16px',
          background: '#fff',
          maxHeight: '80vh',
          width: '100vw',
          maxWidth: '100vw',
          margin: '0',
          left: '0',
          right: '0',
        }}
      >
        <div className="tutorial-modal-content">
          <div className="tutorial-modal-header">
            <h3 className="tutorial-modal-title">提交文案教程</h3>
            <button
              className="tutorial-modal-close"
              onClick={() => setShowTutorial(false)}
              title="关闭"
            >
              ✕
            </button>
          </div>

          <div className="tutorial-modal-video">
            <video
              className="tutorial-modal-video-element"
              autoPlay
              controls
              controlsList="nodownload nofullscreen noremoteplayback"
              disablePictureInPicture
              style={{ width: '100%', display: 'block', backgroundColor: '#000', borderRadius: '8px' }}
            >
              <source
                src="https://www.w3schools.com/html/mov_bbb.mp4"
                type="video/mp4"
              />
              您的浏览器不支持视频标签
            </video>
          </div>
        </div>
      </Popup>
    </div>
  );
};

