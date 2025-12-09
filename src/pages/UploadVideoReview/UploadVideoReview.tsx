import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Toast, Dialog, Checkbox, ProgressBar } from 'antd-mobile';
import { NavBar } from '@/components/NavBar';
import { useRequireLogin } from '@/hooks/useRequireLogin';
import { ROUTES } from '@/constants/routes';
import { videoService } from '@/services/videoService';
import './UploadVideoReview.css';

interface UploadData {
  videoFile?: File;
  creativeVideoFile?: File;
  adVideoFile?: File;
  title: string;
  description: string;
  category: string;
  price: number;
}

export const UploadVideoReview: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { requireLogin } = useRequireLogin();
  const uploadData = location.state as UploadData;

  // 支付方式
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  
  // 用户协议
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // 提交状态
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ step: '', percent: 0 });

  // 审核费用（应付金额），实际项目中由后台管理，这里使用固定80元做示例
  const REVIEW_FEE = 80;

  // 如果没有上传数据，返回首页
  if (!uploadData) {
    navigate(ROUTES.HOME);
    return null;
  }

  // 获取分类中文名
  const getCategoryName = (category: string) => {
    const categoryMap: Record<string, string> = {
      mother_baby: '母婴',
      clothing: '服饰',
      general_merchandise: '百货',
      other: '其它',
    };
    return categoryMap[category] || category;
  };

  // 获取上传步骤文字
  const getUploadStepText = (step: string) => {
    switch (step) {
      case 'uploading_creative':
        return '正在上传创意视频...';
      case 'uploading_ad':
        return '正在上传广告视频...';
      case 'creating':
        return '正在创建视频记录...';
      default:
        return '正在处理...';
    }
  };

  // 处理支付
  const handlePayment = async () => {
    // 统一的支付逻辑
    const doPayment = async () => {
      if (!agreedToTerms) {
        Toast.show({ content: '请先阅读并同意用户协议', icon: 'fail' });
        return;
      }

      // 获取视频文件
      const creativeVideoFile = uploadData.creativeVideoFile || uploadData.videoFile;
      if (!creativeVideoFile) {
        Toast.show({ content: '视频文件不存在，请重新上传', icon: 'fail' });
        return;
      }

      setSubmitting(true);
      setUploadProgress({ step: 'uploading_creative', percent: 0 });

      try {
        // 调用后端API提交审核
        await videoService.submitVideoForReview(
          {
            creativeVideoFile,
            adVideoFile: uploadData.adVideoFile,
            title: uploadData.title,
            description: uploadData.description,
            category: uploadData.category,
            price: uploadData.price,
          },
          (step, percent) => {
            setUploadProgress({ step, percent });
          }
        );

        Toast.show({ 
          content: '提交成功！等待审核...', 
          icon: 'success',
          duration: 2000,
        });

        // 跳转到我的作品页面的"审核中"筛选
        setTimeout(() => {
          navigate(ROUTES.WORKS, { state: { filter: 'pending' } });
        }, 2000);
      } catch (error: any) {
        console.error('提交失败:', error);
        const errorMsg = error?.response?.data?.message || error?.message || '提交失败，请重试';
        Toast.show({ content: errorMsg, icon: 'fail' });
        setSubmitting(false);
        setUploadProgress({ step: '', percent: 0 });
      }
    };

    // 检查登录状态
    // 注意：requireLogin 如果已登录会直接执行回调，不需要再次调用
    if (!requireLogin(doPayment)) {
      return; // 未登录，弹出登录弹窗，登录成功后会执行 doPayment
    }
    // 已登录时，回调已在 requireLogin 中执行，这里不需要再次调用
  };

  // 取消
  const handleCancel = () => {
    Dialog.confirm({
      content: '确定要取消吗？已填写的信息将丢失',
      onConfirm: () => {
        navigate(-1);
      },
    });
  };

  return (
    <div className="upload-review-page">
      {/* 顶部导航栏 */}
      <NavBar title="审核与支付" onBack={handleCancel} />

      {/* 步骤指示器 */}
      <div className="review-steps">
        <div className="steps-container">
          <div className="step-item completed">
            <div className="step-circle">
              <span className="step-icon">✓</span>
            </div>
            <div className="step-label">上传视频</div>
          </div>
          <div className="step-line active"></div>
          <div className="step-item active">
            <div className="step-circle">
              <span className="step-icon">💳</span>
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

      <div className="review-content">
        {/* 视频信息确认 */}
        <div className="review-section">
          <div className="section-title">
            <span className="title-icon">📋</span>
            <span className="title-text">视频信息确认</span>
          </div>
          
          <div className="info-card">
            <div className="info-row">
              <span className="info-label">视频标题</span>
              <span className="info-value">{uploadData.title}</span>
            </div>
            {uploadData.description && (
              <div className="info-row full">
                <span className="info-label">视频描述</span>
                <span className="info-value desc">{uploadData.description}</span>
              </div>
            )}
            <div className="info-row">
              <span className="info-label">视频分类</span>
              <span className="info-value">{getCategoryName(uploadData.category)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">定价</span>
              <span className="info-value price">¥{uploadData.price.toFixed(2)}</span>
            </div>
            {uploadData.videoFile && (
              <div className="info-row">
                <span className="info-label">视频文件</span>
                <span className="info-value">{uploadData.videoFile.name}</span>
              </div>
            )}
            {uploadData.creativeVideoFile && (
              <div className="info-row">
                <span className="info-label">创意视频</span>
                <span className="info-value">{uploadData.creativeVideoFile.name}</span>
              </div>
            )}
            {uploadData.adVideoFile && (
              <div className="info-row">
                <span className="info-label">广告视频</span>
                <span className="info-value">{uploadData.adVideoFile.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* 审核说明 */}
        <div className="review-section">
          <div className="section-title">
            <span className="title-icon">📝</span>
            <span className="title-text">审核说明</span>
          </div>
          
          <div className="review-notice">
            <div className="notice-item">
              <span className="notice-icon">⏱️</span>
              <div className="notice-content">
                <div className="notice-title">审核时间</div>
                <div className="notice-desc">通常在24小时内完成审核</div>
              </div>
            </div>
            <div className="notice-item">
              <span className="notice-icon">✅</span>
              <div className="notice-content">
                <div className="notice-title">审核通过</div>
                <div className="notice-desc">视频将自动上架，开始销售，并移至"我的作品"中</div>
              </div>
            </div>
            <div className="notice-item">
              <span className="notice-icon">❌</span>
              <div className="notice-content">
                <div className="notice-title">审核未通过</div>
                <div className="notice-desc">审核费用将全额退还</div>
              </div>
            </div>
          </div>
        </div>

        {/* 费用说明 */}
        <div className="review-section">
          <div className="section-title">
            <span className="title-icon">💰</span>
            <span className="title-text">费用说明</span>
          </div>
          
          <div className="fee-card">
            <div className="fee-item">
              <span className="fee-label">审核服务费</span>
              <span className="fee-value">¥{REVIEW_FEE.toFixed(2)}</span>
            </div>
            <div className="fee-divider"></div>
            <div className="fee-item total">
              <span className="fee-label">应付金额</span>
              <span className="fee-value">¥{REVIEW_FEE.toFixed(2)}</span>
            </div>
          </div>

          <div className="fee-notice">
            <span className="notice-icon-small">ℹ️</span>
            <span className="notice-text">审核费用用于平台审核服务，审核未通过将全额退还</span>
          </div>
        </div>

        {/* 支付方式 */}
        <div className="review-section">
          <div className="section-title">
            <span className="title-icon">💳</span>
            <span className="title-text">支付方式</span>
          </div>
          
          <div className="payment-methods">
            <div
              className={`payment-method ${paymentMethod === 'wechat' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('wechat')}
            >
              <img src="/images/wechat-icon.png" alt="微信支付" className="payment-icon-img" />
              <div className="payment-info">
                <div className="payment-name">微信支付</div>
                <div className="payment-desc">推荐使用</div>
              </div>
              {paymentMethod === 'wechat' && (
                <div className="payment-check">✓</div>
              )}
            </div>

            <div
              className={`payment-method ${paymentMethod === 'alipay' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('alipay')}
            >
              <img src="/images/alipay-icon.png" alt="支付宝" className="payment-icon-img" />
              <div className="payment-info">
                <div className="payment-name">支付宝</div>
                <div className="payment-desc">安全便捷</div>
              </div>
              {paymentMethod === 'alipay' && (
                <div className="payment-check">✓</div>
              )}
            </div>
          </div>
        </div>

        {/* 用户协议 */}
        <div className="review-section">
          <div className="agreement-checkbox">
            <Checkbox
              checked={agreedToTerms}
              onChange={setAgreedToTerms}
              style={{
                '--icon-size': '24px',
                '--font-size': '15px',
              } as React.CSSProperties}
            >
              我已阅读并同意
              <span 
                className="agreement-link" 
                onClick={(e) => {
                  e.preventDefault();
                  navigate(ROUTES.CREATOR_AGREEMENT, {
                    state: { from: ROUTES.UPLOAD_VIDEO_REVIEW, uploadData }
                  });
                }}
              >
                《创作者协议与平台规范》
              </span>
            </Checkbox>
          </div>
        </div>
      </div>

      {/* 上传进度 */}
      {submitting && uploadProgress.step && (
        <div className="upload-progress-overlay">
          <div className="upload-progress-card">
            <div className="upload-progress-title">{getUploadStepText(uploadProgress.step)}</div>
            <ProgressBar 
              percent={uploadProgress.percent} 
              style={{ '--track-width': '8px' } as React.CSSProperties}
            />
            <div className="upload-progress-percent">{uploadProgress.percent}%</div>
          </div>
        </div>
      )}

      {/* 底部操作按钮 */}
      <div className="review-actions">
        <Button
          block
          size="large"
          fill="outline"
          onClick={handleCancel}
          className="cancel-button"
          disabled={submitting}
        >
          取消
        </Button>
        <Button
          block
          size="large"
          color="primary"
          onClick={handlePayment}
          className="submit-button"
          loading={submitting}
          disabled={!agreedToTerms || submitting}
        >
          <span className="button-content">
            <span>确认支付 ¥{REVIEW_FEE.toFixed(2)}</span>
          </span>
        </Button>
      </div>
    </div>
  );
};
