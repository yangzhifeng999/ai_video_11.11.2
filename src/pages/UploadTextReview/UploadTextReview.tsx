import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Toast, Dialog, Checkbox, TextArea } from 'antd-mobile';
import { NavBar } from '@/components/NavBar';
import { useRequireLogin } from '@/hooks/useRequireLogin';
import { ROUTES } from '@/constants/routes';
import './UploadTextReview.css';

// 订单状态类型（方案二：简化版）
type OrderStatus = 
  | 'pending'    // 审核中（待报价）
  | 'quoted'     // 已报价（待付款）
  | 'paid'       // 已付款（制作中/修改中/已完成）

interface UploadData {
  title: string;
  ideaType: string;
  content: string;
  requirements: string;
  expectedDifficulty: string;
  referenceImages: number;
  budget: number | null;
}

interface QuoteData {
  totalFee: number;
  estimatedDays: number;
  platformNote: string;
  quoteTime: string;
}

// 制作状态子类型
type ProductionStatus = 'making' | 'revising' | 'completed';

export const UploadTextReview: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { requireLogin } = useRequireLogin();
  const uploadData = location.state as UploadData;

  // 订单状态
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('pending');
  
  // 制作状态（当orderStatus为paid时的子状态）
  const [productionStatus, setProductionStatus] = useState<ProductionStatus>('making');
  
  // 报价数据（将来从后端获取时会使用 setQuoteData）
  const [quoteData, _setQuoteData] = useState<QuoteData | null>(null);
  void _setQuoteData; // 标记为将来使用
  
  // 支付方式
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  
  // 用户协议
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // 提交状态
  const [submitting, setSubmitting] = useState(false);
  
  // 修改申请
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionComment, setRevisionComment] = useState('');

  // 不再自动报价 - 需要等待后台管理员审核并报价
  // 提交后显示等待审核状态
  useEffect(() => {
    if (!uploadData) return;
    // 保持 pending 状态，等待后台报价
    // 后续可通过轮询或 WebSocket 获取报价结果
  }, [uploadData]);

  // 制作流程由后台管理，不再前端模拟
  // 后续可通过轮询或 WebSocket 获取制作进度

  // 如果没有上传数据，返回上传页
  if (!uploadData) {
    navigate(ROUTES.UPLOAD_TEXT);
    return null;
  }


  // 取消订单
  const handleCancel = () => {
    Dialog.confirm({
      content: '确定要取消此订单吗？取消后将无法恢复',
      confirmText: '确定取消',
      cancelText: '再想想',
      onConfirm: () => {
        Toast.show({ content: '订单已取消', icon: 'success' });
        navigate(ROUTES.HOME);
      },
    });
  };

  // 确认付款
  const handlePayment = async () => {
    // 统一的支付逻辑
    const doPayment = () => {
      if (!agreedToTerms) {
        Toast.show({ content: '请先阅读并同意服务协议', icon: 'fail' });
        return;
      }

      setSubmitting(true);

      setTimeout(() => {
        setSubmitting(false);
        setOrderStatus('paid');
        setProductionStatus('making');
        Toast.show({ 
          content: '支付成功！我们将尽快开始制作', 
          icon: 'success',
          duration: 3000
        });
      }, 2000);
    };

    // 检查登录状态
    // 注意：requireLogin 如果已登录会直接执行回调
    if (!requireLogin(doPayment)) {
      return; // 未登录，弹出登录弹窗，登录成功后会执行 doPayment
    }
    // 已登录时，回调已在 requireLogin 中执行
  };

  // 申请修改
  const handleRequestRevision = () => {
    if (!revisionComment.trim()) {
      Toast.show({ content: '请说明需要修改的地方', icon: 'fail' });
      return;
    }

    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      setShowRevisionForm(false);
      setProductionStatus('revising');
      Toast.show({ 
        content: '修改要求已提交，我们将尽快处理', 
        icon: 'success',
        duration: 3000
      });

      // 模拟修改完成
      setTimeout(() => {
        setProductionStatus('completed');
        Toast.show({ 
          content: '修改完成！已通过站内消息发送给您', 
          icon: 'success'
        });
      }, 6000);
    }, 1500);
  };

  // 返回处理
  const handleBack = () => {
    if (orderStatus === 'pending' || orderStatus === 'quoted') {
      // 未付款前，确认是否返回
      Dialog.confirm({
        content: '确定要返回吗？',
        onConfirm: () => {
          navigate(ROUTES.HOME);
        },
      });
    } else {
      // 已付款后，直接返回首页
      navigate(ROUTES.HOME);
    }
  };

  // 获取当前状态显示信息
  const getStatusInfo = () => {
    if (orderStatus === 'pending') {
      return {
        icon: '⏳',
        title: '审核中',
        desc: '平台正在评估您的需求，预计24小时内给出报价',
        color: 'pending'
      };
    }
    
    if (orderStatus === 'quoted') {
      return {
        icon: '💰',
        title: '已报价',
        desc: '请查看报价详情并确认付款',
        color: 'quoted'
      };
    }
    
    if (orderStatus === 'paid') {
      if (productionStatus === 'making') {
        return {
          icon: '🎨',
          title: '制作中',
          desc: `我们正在为您精心制作，预计 ${quoteData?.estimatedDays} 个工作日完成`,
          color: 'making'
        };
      } else if (productionStatus === 'revising') {
        return {
          icon: '🔄',
          title: '修改中',
          desc: '我们正在根据您的要求进行修改，请耐心等待',
          color: 'revising'
        };
      } else {
        return {
          icon: '✅',
          title: '已完成',
          desc: '文案已制作完成，请查收站内消息',
          color: 'completed'
        };
      }
    }

    return { icon: '❓', title: '未知状态', desc: '', color: 'unknown' };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="upload-text-review-page">
      <NavBar title="文案订单详情" onBack={handleBack} />

      <div className="review-content">
        {/* 订单状态横幅 */}
        <div className={`status-banner ${statusInfo.color}`}>
          <div className="status-icon">{statusInfo.icon}</div>
          <div className="status-info">
            <div className="status-title">{statusInfo.title}</div>
            <div className="status-desc">{statusInfo.desc}</div>
          </div>
          {orderStatus === 'pending' && (
            <div className="loading-animation">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
          )}
        </div>

        {/* 需求信息 */}
        <div className="review-section">
          <div className="section-title">
            <span className="title-icon">📝</span>
            <span className="title-text">需求信息</span>
          </div>
          
          <div className="info-card">
            <div className="info-row">
              <div className="info-label">创意标题</div>
              <div className="info-value">{uploadData.title}</div>
            </div>
            {uploadData.budget && (
              <div className="info-row">
                <div className="info-label">预算范围</div>
                <div className="info-value">¥{uploadData.budget}</div>
              </div>
            )}
            <div className="info-row full">
              <div className="info-label">创意描述</div>
              <div className="info-value desc">{uploadData.content}</div>
            </div>
            {uploadData.requirements && (
              <div className="info-row full">
                <div className="info-label">具体要求</div>
                <div className="info-value desc">{uploadData.requirements}</div>
              </div>
            )}
            {uploadData.referenceImages > 0 && (
              <div className="info-row">
                <div className="info-label">参考文件</div>
                <div className="info-value">{uploadData.referenceImages} 个</div>
              </div>
            )}
          </div>
        </div>

        {/* 报价信息（已报价后显示） */}
        {quoteData && orderStatus !== 'pending' && (
          <div className="review-section">
            <div className="section-title">
              <span className="title-icon">💰</span>
              <span className="title-text">平台报价</span>
            </div>

            <div className="quote-card">
              <div className="quote-header">
                <div className="quote-amount">¥{quoteData.totalFee.toFixed(2)}</div>
                <div className="quote-label">制作费用</div>
              </div>

              <div className="quote-details">
                <div className="detail-item">
                  <span className="detail-icon">⏰</span>
                  <span className="detail-text">预计完成时间：{quoteData.estimatedDays} 个工作日</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">🔄</span>
                  <span className="detail-text">包含 1 次免费修改</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">📧</span>
                  <span className="detail-text">完成后通过站内消息通知</span>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">💬</span>
                  <span className="detail-text">修改沟通请联系客服</span>
                </div>
              </div>

              {quoteData.platformNote && (
                <div className="quote-note">
                  <div className="note-title">平台说明</div>
                  <div className="note-text">{quoteData.platformNote}</div>
                </div>
              )}

              <div className="quote-time">报价时间：{quoteData.quoteTime}</div>
            </div>
          </div>
        )}

        {/* 支付方式（已报价且未付款时显示） */}
        {orderStatus === 'quoted' && (
          <>
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
                      e.stopPropagation();
                      navigate(ROUTES.TEXT_SERVICE_AGREEMENT, {
                        state: {
                          from: ROUTES.UPLOAD_TEXT_REVIEW,
                          uploadData: uploadData,
                        },
                      });
                    }}
                  >
                    《文案制作服务协议》
                  </span>
                </Checkbox>
              </div>
            </div>
          </>
        )}

        {/* 已付款后的状态展示 */}
        {orderStatus === 'paid' && (
          <div className="review-section">
            <div className="production-card">
              {productionStatus === 'making' && (
                <>
                  <div className="production-header">
                    <div className="production-icon">🎨</div>
                    <div className="production-info">
                      <div className="production-title">制作中</div>
                      <div className="production-desc">专业团队正在为您精心制作</div>
                    </div>
                  </div>
                  <div className="production-timeline">
                    <div className="timeline-item">
                      <span className="timeline-label">开始时间</span>
                      <span className="timeline-value">{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="timeline-item">
                      <span className="timeline-label">预计完成</span>
                      <span className="timeline-value">
                        {new Date(Date.now() + (quoteData?.estimatedDays || 3) * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {productionStatus === 'revising' && (
                <>
                  <div className="production-header">
                    <div className="production-icon">🔄</div>
                    <div className="production-info">
                      <div className="production-title">修改中</div>
                      <div className="production-desc">我们正在根据您的要求进行修改</div>
                    </div>
                  </div>
                  {revisionComment && (
                    <div className="revision-display">
                      <div className="revision-title">您的修改要求：</div>
                      <div className="revision-text">{revisionComment}</div>
                    </div>
                  )}
                </>
              )}

              {productionStatus === 'completed' && (
                <>
                  <div className="production-header">
                    <div className="production-icon">✅</div>
                    <div className="production-info">
                      <div className="production-title">制作完成</div>
                      <div className="production-desc">文案已完成，请查收站内消息</div>
                    </div>
                  </div>
                  <div className="completion-actions">
                    <Button 
                      block 
                      color="primary"
                      size="large"
                      onClick={() => navigate(ROUTES.MESSAGES)}
                      className="check-message-button"
                    >
                      📧 查看消息
                    </Button>
                    {!showRevisionForm && (
                      <Button 
                        block 
                        fill="outline"
                        size="large"
                        onClick={() => setShowRevisionForm(true)}
                        className="revision-request-button"
                      >
                        🔄 申请修改
                      </Button>
                    )}
                  </div>

                  {showRevisionForm && (
                    <div className="revision-form">
                      <div className="form-title">请说明需要修改的地方</div>
                      <TextArea
                        placeholder="例如：标题需要更简洁有力，正文第二段需要增加具体数据支撑..."
                        rows={4}
                        value={revisionComment}
                        onChange={setRevisionComment}
                        maxLength={300}
                        showCount
                        className="revision-textarea"
                      />
                      <div className="form-actions">
                        <Button 
                          block
                          fill="outline"
                          onClick={() => setShowRevisionForm(false)}
                          disabled={submitting}
                        >
                          取消
                        </Button>
                        <Button 
                          block 
                          color="primary"
                          onClick={handleRequestRevision}
                          loading={submitting}
                        >
                          提交修改要求
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* 联系客服 */}
              <div className="contact-info">
                <div className="contact-title">需要帮助？</div>
                <div className="contact-methods">
                  <div className="contact-item-wechat">
                    <div className="wechat-info">
                      <span className="contact-icon">💬</span>
                      <span className="contact-text">添加客服微信</span>
                    </div>
                    <div className="wechat-qrcode">
                      <div className="qrcode-placeholder">
                        <div className="qrcode-icon">📱</div>
                        <div className="qrcode-text">扫码添加客服</div>
                      </div>
                    </div>
                  </div>
                  <div className="contact-item">
                    <span className="contact-icon">⏰</span>
                    <span className="contact-text">服务时间：9:00-17:00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 服务说明 */}
        <div className="review-section">
          <div className="service-notice">
            <div className="notice-title">📢 服务流程</div>
            <div className="notice-steps">
              <div className="step-item-notice">
                <span className="step-number">1</span>
                <span className="step-text">平台审核需求并给出报价</span>
              </div>
              <div className="step-item-notice">
                <span className="step-number">2</span>
                <span className="step-text">您确认报价并完成付款</span>
              </div>
              <div className="step-item-notice">
                <span className="step-number">3</span>
                <span className="step-text">专业团队开始制作文案</span>
              </div>
              <div className="step-item-notice">
                <span className="step-number">4</span>
                <span className="step-text">完成后通过站内消息交付</span>
              </div>
              <div className="step-item-notice">
                <span className="step-number">5</span>
                <span className="step-text">如需修改请联系客服沟通</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部操作按钮（已报价且未付款时显示） */}
      {orderStatus === 'quoted' && (
        <div className="review-actions">
          <Button
            block
            size="large"
            fill="outline"
            onClick={handleCancel}
            className="cancel-button"
            disabled={submitting}
          >
            取消订单
          </Button>
          <Button
            block
            size="large"
            color="primary"
            onClick={handlePayment}
            className="submit-button"
            loading={submitting}
            disabled={!agreedToTerms}
          >
            确认付款
          </Button>
        </div>
      )}
    </div>
  );
};