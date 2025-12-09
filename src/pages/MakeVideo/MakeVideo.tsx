import { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Image, Toast, Dialog, Checkbox, Radio, Space, ProgressCircle } from 'antd-mobile';
import { NavBar } from '@/components/NavBar';
import { Loading } from '@/components/Loading';
import { useVideoDetail } from '@/hooks/useVideo';
import { formatPrice } from '@/utils';
import { ROUTES } from '@/constants/routes';
import { USE_MOCK_DATA } from '@/constants/api';
import type { UploadItemType } from '@/types';
import './MakeVideo.css';

type PaymentMethod = 'wechat' | 'alipay' | 'balance';

// 每个上传项的数据状态
interface UploadItemData {
  image: string | null;
  file: File | null;
  isValid: boolean;
}

// 获取上传项类型的图标
const getUploadIcon = (type: UploadItemType): string => {
  const icons: Record<UploadItemType, string> = {
    face: '👤',
    ingredient: '🥕',
    object: '📦',
    scene: '🖼️',
    other: '📎',
  };
  return icons[type] || icons.other;
};

// 获取上传项类型的名称
const getUploadTypeName = (type: UploadItemType): string => {
  const names: Record<UploadItemType, string> = {
    face: '人脸照片',
    ingredient: '食材照片',
    object: '物品照片',
    scene: '场景照片',
    other: '其他照片',
  };
  return names[type] || names.other;
};

export const MakeVideo: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { video, loading } = useVideoDetail(videoId || '');
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const currentUploadItemId = useRef<string | null>(null);
  
  // 动态存储每个上传项的数据
  const [uploadData, setUploadData] = useState<Map<string, UploadItemData>>(new Map());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wechat');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 初始化上传数据
  useEffect(() => {
    if (!video?.uploadConfig?.items) return;
    
    const newMap = new Map<string, UploadItemData>();
    video.uploadConfig.items.forEach(item => {
      newMap.set(item.id, {
        image: null,
        file: null,
        isValid: false,
      });
    });
    setUploadData(newMap);
  }, [video?.uploadConfig?.items]);

  // 计算上传进度
  const uploadProgress = useMemo(() => {
    if (!video?.uploadConfig?.items) return { current: 0, total: 0, percent: 0 };
    
    const requiredItems = video.uploadConfig.items.filter(item => item.required);
    const total = requiredItems.length;
    const current = requiredItems.filter(item => {
      const data = uploadData.get(item.id);
      return data?.isValid === true;
    }).length;
    
    return { 
      current, 
      total, 
      percent: total > 0 ? Math.round((current / total) * 100) : 0 
    };
  }, [uploadData, video?.uploadConfig?.items]);

  // 检查是否所有必填项都已完成
  const allRequiredCompleted = useMemo(() => {
    if (!video?.uploadConfig?.items) return false;
    
    return video.uploadConfig.items.every(item => {
      if (!item.required) return true;
      const data = uploadData.get(item.id);
      return data?.isValid === true;
    });
  }, [uploadData, video?.uploadConfig?.items]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const itemId = currentUploadItemId.current;
    
    if (!file || !itemId) return;

    const item = video?.uploadConfig?.items.find(i => i.id === itemId);
    if (!item) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      Toast.show({ content: '请上传图片文件' });
      return;
    }

    // 验证文件大小
    const maxSize = item.validation?.maxSize || 10 * 1024 * 1024;
    if (file.size > maxSize) {
      Toast.show({ content: `图片大小不能超过${Math.round(maxSize / 1024 / 1024)}MB` });
      return;
    }

    // 读取预览并标记为有效
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadData(prev => {
        const newMap = new Map(prev);
        newMap.set(itemId, {
          image: e.target?.result as string,
          file: file,
          isValid: true,
        });
        return newMap;
      });
      Toast.show({ content: '上传成功', icon: 'success' });
    };
    reader.readAsDataURL(file);

    // 清空 input 值，允许重复上传同一文件
    event.target.value = '';
  };

  const handleUploadClick = (itemId: string) => {
    currentUploadItemId.current = itemId;
    const input = fileInputRefs.current.get(itemId);
    input?.click();
  };

  const handleRemoveImage = (itemId: string) => {
    Dialog.confirm({
      content: '确定要重新上传吗？',
      onConfirm: () => {
        setUploadData(prev => {
          const newMap = new Map(prev);
          newMap.set(itemId, {
            image: null,
            file: null,
            isValid: false,
          });
          return newMap;
        });
      },
    });
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (!allRequiredCompleted) {
      Toast.show({ content: '请完成所有必填项的上传' });
      return;
    }

    if (!agreedToTerms) {
      Toast.show({ content: '请阅读并同意用户协议和隐私政策' });
      return;
    }

    setSubmitting(true);

    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        Toast.show({
          icon: 'success',
          content: '订单创建成功，正在跳转支付...',
          duration: 2000,
        });

        setTimeout(() => {
          Dialog.alert({
            content: '支付功能开发中，订单已创建成功',
            confirmText: '返回首页',
            onConfirm: () => {
              navigate(ROUTES.HOME);
            },
          });
        }, 2000);
      }
    } catch {
      Toast.show({ content: '提交失败，请重试' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loading text="加载中..." />;
  }

  if (!video) {
    return (
      <div className="make-video-error">
        <div className="make-video-error-text">视频不存在</div>
        <Button color="primary" onClick={() => navigate(-1)}>返回</Button>
      </div>
    );
  }

  const uploadConfig = video.uploadConfig;
  const canSubmit = allRequiredCompleted && agreedToTerms && !submitting;

  return (
    <div className="make-video-page">
      <NavBar title="制作同款" />
      
      <div className="make-video-content">
        {/* 上传进度指示器 */}
        {uploadConfig && uploadConfig.items.length > 1 && (
          <div className="make-video-progress-card">
            <div className="progress-info">
              <ProgressCircle 
                percent={uploadProgress.percent} 
                style={{ '--size': '60px', '--track-width': '4px', '--fill-color': '#1677ff' }}
              >
                <span className="progress-text">{uploadProgress.current}/{uploadProgress.total}</span>
              </ProgressCircle>
              <div className="progress-detail">
                <div className="progress-title">上传进度</div>
                <div className="progress-subtitle">
                  已完成 {uploadProgress.current} / {uploadProgress.total} 项必填内容
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 上传配置标题 */}
        {uploadConfig && (
          <div className="make-video-card upload-header-card">
            <h2 className="make-video-card-title">{uploadConfig.title || '上传素材'}</h2>
            {uploadConfig.description && (
              <p className="make-video-card-subtitle">{uploadConfig.description}</p>
            )}
          </div>
        )}

        {/* 动态上传项列表 */}
        {uploadConfig?.items.map((item) => {
          const data = uploadData.get(item.id);
          const isUploaded = data?.image !== null;
          const isValid = data?.isValid === true;

          return (
            <div key={item.id} className="make-video-card upload-item-card">
              {/* 上传项头部 */}
              <div className="upload-item-header">
                <div className="upload-item-icon">{getUploadIcon(item.type)}</div>
                <div className="upload-item-info">
                  <h3 className="upload-item-label">
                    {item.label}
                    {item.required && <span className="required-mark">*</span>}
                  </h3>
                  <p className="upload-item-type">{getUploadTypeName(item.type)}</p>
                </div>
                {isUploaded && isValid && (
                  <div className="upload-status-badge success">✓ 已上传</div>
                )}
              </div>

              {/* 上传项说明 */}
              {item.description && (
                <p className="upload-item-desc">{item.description}</p>
              )}

              {/* 示例图片 */}
              {item.exampleImageUrl && !isUploaded && (
                <div className="upload-item-example">
                  <span className="example-label">参考示例：</span>
                  <Image 
                    src={item.exampleImageUrl} 
                    width={80} 
                    height={80}
                    fit="cover"
                    style={{ borderRadius: '8px' }}
                  />
                </div>
              )}

              {/* 上传区域或预览 */}
              {!isUploaded ? (
                <div className="make-video-upload-zone" onClick={() => handleUploadClick(item.id)}>
                  <div className="make-video-upload-icon-large">
                    {item.type === 'face' ? (
                      <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
                        <circle cx="32" cy="32" r="30" stroke="#1677ff" strokeWidth="2" strokeDasharray="4 4"/>
                        <circle cx="32" cy="24" r="10" stroke="#1677ff" strokeWidth="2"/>
                        <path d="M16 52c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="#1677ff" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="48" height="48" viewBox="0 0 64 64" fill="none">
                        <circle cx="32" cy="32" r="30" stroke="#1677ff" strokeWidth="2" strokeDasharray="4 4"/>
                        <path d="M32 20V44M20 32H44" stroke="#1677ff" strokeWidth="3" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                  <div className="make-video-upload-main-text">
                    {item.type === 'face' ? '点击拍照或上传自拍' : `点击上传${item.label}`}
                  </div>
                  <div className="make-video-upload-sub-text">
                    {item.type === 'face' ? '请上传清晰的正面照片' : '支持JPG、PNG格式'}
                  </div>
                  <input
                    ref={(el) => {
                      if (el) fileInputRefs.current.set(item.id, el);
                    }}
                    type="file"
                    accept="image/*"
                    capture={item.type === 'face' ? 'user' : undefined}
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                  />
                </div>
              ) : (
                <div className="upload-preview-container">
                  <div className="make-video-face-preview-card">
                    <Image
                      src={data?.image || ''}
                      alt={item.label}
                      fit="cover"
                      style={{ width: '100%', borderRadius: '12px' }}
                    />
                  </div>

                  {/* 上传成功提示 */}
                  {isValid && (
                    <div className="make-video-detection-result success">
                      <div className="make-video-result-icon">✓</div>
                      <div className="make-video-result-message">
                        {item.type === 'face' ? '照片上传成功' : '上传成功'}
                      </div>
                    </div>
                  )}

                  <Button 
                    size="small" 
                    fill="outline" 
                    onClick={() => handleRemoveImage(item.id)}
                    className="reupload-btn"
                  >
                    重新上传
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {/* 模板信息卡片 */}
        <div className="make-video-card">
          <div className="make-video-template-header">
            <div>
              <h3 className="make-video-template-name">{video.title}</h3>
              <p className="make-video-template-time">预计5-10分钟完成</p>
            </div>
            <div className="make-video-template-price">
              {video.price ? formatPrice(video.price * 100) : '¥0.00'}
            </div>
          </div>

          <div className="make-video-template-preview">
            <video
              src={video.videoUrl}
              controls
              poster={video.coverUrl}
              style={{ width: '100%', borderRadius: '8px' }}
            />
          </div>
        </div>

        {/* 支付方式卡片 - 只有所有必填项完成后才显示 */}
        {allRequiredCompleted && (
          <div className="make-video-card">
            <h2 className="make-video-card-title">选择支付方式</h2>
            
            <div className="make-video-payment-group">
              <Radio.Group 
                value={paymentMethod} 
                onChange={(val) => setPaymentMethod(val as PaymentMethod)}
              >
                <Space direction="vertical" style={{ width: '100%', gap: '12px' }}>
                  <Radio value="wechat" className="make-video-payment-option-new">
                    <div className="make-video-payment-content">
                      <div className="make-video-payment-icon">💚</div>
                      <div className="make-video-payment-name">微信支付</div>
                    </div>
                  </Radio>
                  <Radio value="alipay" className="make-video-payment-option-new">
                    <div className="make-video-payment-content">
                      <div className="make-video-payment-icon">💙</div>
                      <div className="make-video-payment-name">支付宝</div>
                    </div>
                  </Radio>
                  <Radio value="balance" className="make-video-payment-option-new">
                    <div className="make-video-payment-content">
                      <div className="make-video-payment-icon">💰</div>
                      <div className="make-video-payment-name">余额支付</div>
                      <div className="make-video-payment-balance">余额: ¥0.00</div>
                    </div>
                  </Radio>
                </Space>
              </Radio.Group>
            </div>

            <Checkbox
              checked={agreedToTerms}
              onChange={setAgreedToTerms}
              className="make-video-terms-checkbox"
            >
              <span className="make-video-terms-text">
                我已阅读并同意<span className="make-video-terms-link">《用户协议》</span>
              </span>
            </Checkbox>
          </div>
        )}
      </div>

      {/* 底部固定按钮 */}
      <div className="make-video-footer">
        <div className="make-video-footer-info">
          <div className="make-video-footer-label">总计</div>
          <div className="make-video-footer-price">
            {video.price ? formatPrice(video.price * 100) : '¥0.00'}
          </div>
        </div>
        <Button
          color="primary"
          size="large"
          onClick={handleSubmit}
          disabled={!canSubmit}
          loading={submitting}
          className="make-video-pay-button"
        >
          {submitting ? '处理中...' : allRequiredCompleted ? '立即支付' : `请完成上传 (${uploadProgress.current}/${uploadProgress.total})`}
        </Button>
      </div>
    </div>
  );
};
