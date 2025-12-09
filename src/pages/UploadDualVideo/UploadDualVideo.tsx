import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, TextArea, Toast, Popup } from 'antd-mobile';
import { NavBar } from '@/components/NavBar';
import { useRequireLogin } from '@/hooks/useRequireLogin';
import { ROUTES } from '@/constants/routes';
import type { VideoCategory } from '@/types';
import './UploadDualVideo.css';

// 视频分类选项
const categoryOptions = [
  { label: '母婴', value: 'mother_baby' },
  { label: '服饰', value: 'clothing' },
  { label: '百货', value: 'general_merchandise' },
  { label: '其它', value: 'other' },
];

export const UploadDualVideo: React.FC = () => {
  const navigate = useNavigate();
  const { requireLogin } = useRequireLogin();
  const creativeVideoInputRef = useRef<HTMLInputElement>(null);
  const adVideoInputRef = useRef<HTMLInputElement>(null);
  
  // 表单数据
  const [creativeVideoFile, setCreativeVideoFile] = useState<File | null>(null);
  const [creativeVideoPreviewUrl, setCreativeVideoPreviewUrl] = useState<string>('');
  const [adVideoFile, setAdVideoFile] = useState<File | null>(null);
  const [adVideoPreviewUrl, setAdVideoPreviewUrl] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<VideoCategory[]>([]);
  const [price, setPrice] = useState('');
  
  // 视频教程弹窗状态
  const [showTutorial, setShowTutorial] = useState(false);
  
  // 价格区间
  const [priceRange, setPriceRange] = useState({ min: 50, max: 100 });

  // 处理创意视频选择
  const handleCreativeVideoSelect = (file: File) => {
    if (!file.type.startsWith('video/')) {
      Toast.show({ content: '请选择视频文件', icon: 'fail' });
      return;
    }

    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      Toast.show({ content: '创意视频不能超过500MB', icon: 'fail' });
      return;
    }

    setCreativeVideoFile(file);
    
    // 创建预览 URL（不要释放，用于页面显示）
    const previewUrl = URL.createObjectURL(file);
    setCreativeVideoPreviewUrl(previewUrl);
    
    // 创建单独的 URL 用于计算时长（使用后释放）
    const metadataUrl = URL.createObjectURL(file);
    const videoElement = document.createElement('video');
    videoElement.preload = 'metadata';
    videoElement.onloadedmetadata = () => {
      const duration = videoElement.duration;
      let min = 50, max = 100;
      
      if (duration < 60) {
        min = 30; max = 60;
      } else if (duration < 180) {
        min = 50; max = 100;
      } else if (duration < 300) {
        min = 80; max = 150;
      } else {
        min = 100; max = 200;
      }
      
      setPriceRange({ min, max });
      // 释放用于计算时长的 URL，不影响预览 URL
      URL.revokeObjectURL(metadataUrl);
    };
    videoElement.src = metadataUrl;
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

  // 点击上传创意视频
  const handleClickUploadCreative = () => {
    creativeVideoInputRef.current?.click();
  };

  // 点击上传广告视频
  const handleClickUploadAd = () => {
    adVideoInputRef.current?.click();
  };

  // 文件输入变化
  const handleCreativeVideoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleCreativeVideoSelect(file);
  };

  const handleAdVideoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleAdVideoSelect(file);
  };

  // 删除视频
  const handleRemoveCreativeVideo = () => {
    setCreativeVideoFile(null);
    setCreativeVideoPreviewUrl('');
    if (creativeVideoInputRef.current) {
      creativeVideoInputRef.current.value = '';
    }
  };

  const handleRemoveAdVideo = () => {
    setAdVideoFile(null);
    setAdVideoPreviewUrl('');
    if (adVideoInputRef.current) {
      adVideoInputRef.current.value = '';
    }
  };

  // 表单验证
  const validateForm = (): boolean => {
    if (!creativeVideoFile) {
      Toast.show({ content: '请上传创意视频', icon: 'fail' });
      return false;
    }

    if (!adVideoFile) {
      Toast.show({ content: '请上传广告视频', icon: 'fail' });
      return false;
    }

    if (!title.trim()) {
      Toast.show({ content: '请输入视频标题', icon: 'fail' });
      return false;
    }

    if (title.trim().length < 2) {
      Toast.show({ content: '标题至少需要2个字符', icon: 'fail' });
      return false;
    }

    if (title.trim().length > 25) {
      Toast.show({ content: '标题不能超过25个字符', icon: 'fail' });
      return false;
    }

    if (category.length === 0) {
      Toast.show({ content: '请选择视频分类', icon: 'fail' });
      return false;
    }

    if (!price || price.trim() === '') {
      Toast.show({ content: '请输入价格', icon: 'fail' });
      return false;
    }

    const priceNum = parseFloat(price);
    
    if (isNaN(priceNum) || priceNum <= 0) {
      Toast.show({ content: '请输入有效的价格', icon: 'fail' });
      return false;
    }

    if (priceNum < priceRange.min) {
      Toast.show({ content: `价格不能低于¥${priceRange.min}元`, icon: 'fail' });
      return false;
    }

    if (priceNum > priceRange.max) {
      Toast.show({ content: `价格不能超过¥${priceRange.max}元`, icon: 'fail' });
      return false;
    }

    // 价格最多保留2位小数
    if (!/^\d+(\.\d{1,2})?$/.test(price)) {
      Toast.show({ content: '价格最多保留2位小数', icon: 'fail' });
      return false;
    }

    return true;
  };

  // 提交表单
  const handleSubmit = () => {
    // 统一的提交逻辑
    const doSubmit = () => {
      if (!validateForm()) return;

      navigate(ROUTES.UPLOAD_VIDEO_REVIEW, {
        state: {
          creativeVideoFile,
          adVideoFile,
          title: title.trim(),
          description: description.trim(),
          category: category[0],
          price: parseFloat(price),
        },
      });
    };

    // 检查登录状态
    // 注意：requireLogin 如果已登录会直接执行回调
    if (!requireLogin(doSubmit)) {
      return; // 未登录，弹出登录弹窗，登录成功后会执行 doSubmit
    }
    // 已登录时，回调已在 requireLogin 中执行
  };

  // 取消上传
  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="upload-dual-video-page">
      <NavBar title="上传视频" onBack={handleCancel} />

      {/* 步骤指示器 */}
      <div className="upload-steps-new">
        <div className="steps-container">
          <div className="step-item active">
            <div className="step-circle">
              <span className="step-icon">📹</span>
            </div>
            <div className="step-label">上传视频</div>
          </div>
          <div className="step-line"></div>
          <div className="step-item">
            <div className="step-circle">
              <span className="step-icon">✓</span>
            </div>
            <div className="step-label">审核支付</div>
          </div>
          <div className="step-line"></div>
          <div className="step-item">
            <div className="step-circle">
              <span className="step-icon">🎉</span>
            </div>
            <div className="step-label">完成</div>
          </div>
        </div>
      </div>

      <div className="upload-dual-video-content">
        {/* 温馨提示 - 双视频说明 */}
        <div className="tip-card">
          <div className="tip-icon">💡</div>
          <div className="tip-content">
            <div className="tip-title">温馨提示</div>
            <div className="tip-text">
              您需要上传2个视频，系统会自动合并：
            </div>
            <div className="tip-list">
              <div className="tip-item">
                <span className="tip-bullet">•</span>
                <span>创意视频：上传您的创意视频内容</span>
              </div>
              <div className="tip-item">
                <span className="tip-bullet">•</span>
                <span>广告视频：为你的创意视频加加油，限时10秒，包含"嘿哈"2个字</span>
              </div>
            </div>
          </div>
        </div>

        {/* 创意视频上传区 */}
        <div className="video-upload-section creative">
          <div className="section-header">
            <div className="section-icon">🎬</div>
            <div className="section-info">
              <div className="section-title-new">
                <span className="required-star">*</span>
                创意视频
              </div>
              <div className="section-subtitle">展示您的产品创意，赚取创作收益</div>
            </div>
            <Button
              size="small"
              fill="outline"
              color="primary"
              onClick={() => setShowTutorial(true)}
              className="tutorial-button-section"
            >
              📖 视频教程
            </Button>
          </div>
          
          <div className="video-upload-card">
            {creativeVideoFile ? (
              <div className="video-preview-wrapper">
                <div className="video-player-container">
                  <video
                    className="video-player"
                    src={creativeVideoPreviewUrl}
                    controls
                    preload="metadata"
                  />
                </div>
                <div className="video-details">
                  <div className="video-detail-item">
                    <span className="detail-icon">📄</span>
                    <span className="detail-text">{creativeVideoFile.name}</span>
                  </div>
                  <div className="video-detail-item">
                    <span className="detail-icon">💾</span>
                    <span className="detail-text">
                      {(creativeVideoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                </div>
                <Button
                  color="danger"
                  fill="outline"
                  size="middle"
                  onClick={handleRemoveCreativeVideo}
                  className="remove-video-button"
                >
                  🗑️ 删除视频
                </Button>
              </div>
            ) : (
              <div className="upload-empty-state">
                <div className="upload-icon-wrapper">
                  <div className="upload-icon-large">🎬</div>
                </div>
                <div className="upload-subtitle-large">点击下方按钮选择文件</div>
                <div className="upload-formats">
                  <span className="format-tag">MP4</span>
                  <span className="format-tag">MOV</span>
                  <span className="format-tag">AVI</span>
                  <span className="format-divider">•</span>
                  <span className="format-size">最大 500MB</span>
                </div>
                <Button
                  color="primary"
                  size="large"
                  onClick={handleClickUploadCreative}
                  className="select-video-button"
                >
                  <span className="button-icon">📁</span>
                  选择创意视频
                </Button>
              </div>
            )}
          </div>

          <input
            ref={creativeVideoInputRef}
            type="file"
            accept="video/*"
            onChange={handleCreativeVideoInputChange}
            style={{ display: 'none' }}
          />
        </div>

        {/* 温馨提示 - 视频方向 */}
        <div className="orientation-tip">
          <span className="tip-icon-small">⚠️</span>
          <span className="tip-text-small">温馨提示：请确保两个视频的方向一致（都是横屏或都是竖屏）</span>
        </div>

        {/* 广告视频上传区 */}
        <div className="video-upload-section ad">
          <div className="section-header">
            <div className="section-icon">📢</div>
            <div className="section-info">
              <div className="section-title-new">
                <span className="required-star">*</span>
                广告视频
              </div>
              <div className="section-subtitle">为您的创意视频加加油</div>
            </div>
          </div>
          
          <div className="video-upload-card">
            {adVideoFile ? (
              <div className="video-preview-wrapper">
                <div className="video-player-container">
                  <video
                    className="video-player"
                    src={adVideoPreviewUrl}
                    controls
                    preload="metadata"
                  />
                </div>
                <div className="video-details">
                  <div className="video-detail-item">
                    <span className="detail-icon">📄</span>
                    <span className="detail-text">{adVideoFile.name}</span>
                  </div>
                  <div className="video-detail-item">
                    <span className="detail-icon">💾</span>
                    <span className="detail-text">
                      {(adVideoFile.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                </div>
                <Button
                  color="danger"
                  fill="outline"
                  size="middle"
                  onClick={handleRemoveAdVideo}
                  className="remove-video-button"
                >
                  🗑️ 删除视频
                </Button>
              </div>
            ) : (
              <div className="upload-empty-state">
                <div className="upload-icon-wrapper">
                  <div className="upload-icon-large">📢</div>
                </div>
                <div className="upload-subtitle-large">点击下方按钮选择文件</div>
                <div className="upload-formats">
                  <span className="format-tag">MP4</span>
                  <span className="format-tag">MOV</span>
                  <span className="format-tag">AVI</span>
                  <span className="format-divider">•</span>
                  <span className="format-size">最大 100MB</span>
                </div>
                <Button
                  color="primary"
                  size="large"
                  onClick={handleClickUploadAd}
                  className="select-video-button ad-button"
                >
                  <span className="button-icon">📁</span>
                  选择广告视频
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

        {/* 信息填写区域 */}
        <div className="info-section-new">
          <div className="section-header">
            <div className="section-icon section-icon-small">✏️</div>
            <div className="section-info">
              <div className="section-title-new">填写视频信息</div>
              <div className="section-subtitle">完善信息，让更多人发现您的作品</div>
            </div>
          </div>

          {/* 标题输入 */}
          <div className="form-field">
            <div className="field-header">
              <div className="field-label">
                <span className="required-star">*</span>
                <span className="label-text">视频标题</span>
              </div>
              <div className="field-counter">{title.length}/25</div>
            </div>
            <div className="input-wrapper">
              <Input
                placeholder="给您的视频起个吸引人的标题吧"
                value={title}
                onChange={setTitle}
                maxLength={25}
                clearable
                className="custom-input"
              />
            </div>
            {title.length > 0 && title.length < 2 && (
              <div className="field-error">标题至少需要2个字符</div>
            )}
          </div>

          {/* 描述输入 */}
          <div className="form-field">
            <div className="field-header">
              <div className="field-label">
                <span className="label-text">视频描述</span>
                <span className="optional-tag">选填</span>
              </div>
            </div>
            <div className="textarea-wrapper">
              <TextArea
                placeholder="介绍一下您的视频内容，让用户更了解..."
                value={description}
                onChange={setDescription}
                maxLength={200}
                rows={4}
                showCount
                className="custom-textarea"
              />
            </div>
          </div>

          {/* 分类选择 */}
          <div className="form-field">
            <div className="field-header">
              <div className="field-label">
                <span className="required-star">*</span>
                <span className="label-text">视频分类</span>
              </div>
            </div>
            <div className="category-grid">
              {categoryOptions.map((option) => (
                <div
                  key={option.value}
                  className={`category-card ${category.includes(option.value as VideoCategory) ? 'selected' : ''}`}
                  onClick={() => setCategory([option.value as VideoCategory])}
                >
                  <div className="category-icon">
                    {option.value === 'mother_baby' && '👶'}
                    {option.value === 'clothing' && '👗'}
                    {option.value === 'general_merchandise' && '🛍️'}
                    {option.value === 'other' && '📦'}
                  </div>
                  <div className="category-name">{option.label}</div>
                  {category.includes(option.value as VideoCategory) && (
                    <div className="category-check">✓</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 价格设置 */}
          <div className="form-field">
            <div className="field-header">
              <div className="field-label">
                <span className="required-star">*</span>
                <span className="label-text">定价</span>
              </div>
            </div>
            <div className="price-input-wrapper">
              <span className="price-symbol">¥</span>
              <Input
                placeholder={`请输入价格 (${priceRange.min}-${priceRange.max}元)`}
                value={price}
                onChange={setPrice}
                type="number"
                min={priceRange.min}
                max={priceRange.max}
                clearable
                className="price-input"
              />
            </div>
            <div className="field-hint">
              <span className="hint-icon">💰</span>
              <span className="hint-text">
                合理定价可以获得更多购买，根据大数据分析，请在{priceRange.min}-{priceRange.max}之间选择一个您认为合理的价格，作为对外的标价
              </span>
            </div>
          </div>

          {/* 收益预估卡片 */}
          {price && parseFloat(price) > 0 && (
            <div className="earnings-preview">
              <div className="earnings-title">💎 预估收益</div>
              <div className="earnings-content">
                <div className="earnings-item">
                  <span className="earnings-label">每次销售收益</span>
                  <span className="earnings-value">¥{(parseFloat(price) * 0.7).toFixed(2)}</span>
                </div>
                <div className="earnings-divider"></div>
                <div className="earnings-item">
                  <span className="earnings-label">平台分成比例</span>
                  <span className="earnings-value">70%</span>
                </div>
              </div>
              <div className="earnings-tip">销售10次预计收益：¥{(parseFloat(price) * 0.7 * 10).toFixed(2)}</div>
            </div>
          )}
        </div>
      </div>

      {/* 底部操作按钮 */}
      <div className="upload-actions-new">
        <Button
          block
          size="large"
          fill="outline"
          onClick={handleCancel}
          className="cancel-button-new"
        >
          取消
        </Button>
        <Button
          block
          size="large"
          color="primary"
          onClick={handleSubmit}
          className="submit-button-new"
        >
          下一步
        </Button>
      </div>

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
            <h3 className="tutorial-modal-title">视频上传教程</h3>
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

