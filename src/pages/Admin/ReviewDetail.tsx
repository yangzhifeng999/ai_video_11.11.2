import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Layout,
  Card,
  Button,
  Tag,
  Space,
  message,
  Descriptions,
  Image,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Timeline,
  Spin,
  Divider,
  Row,
  Col,
  Alert,
} from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DollarOutlined,
  SendOutlined,
  UploadOutlined,
  UserOutlined,
  ClockCircleOutlined,
  HomeOutlined,
  LogoutOutlined,
  CloudUploadOutlined,
  MergeCellsOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import { Upload, Progress } from 'antd';
import type { UploadProps } from 'antd';
import { adminService } from '@/services/adminService';
import { ROUTES } from '@/constants/routes';
import type { ReviewItem, ReviewStatus, ReviewLog } from '@/types/admin';
import { REVIEW_STATUS_CONFIG, CATEGORY_MAP, CATEGORY_OPTIONS } from '@/types/admin';
import './ReviewDetail.css';

const { Header, Content } = Layout;
const { TextArea } = Input;

// 常用拒绝原因
const REJECT_REASONS = [
  '内容涉嫌违规',
  '视频质量过低',
  '素材不完整',
  '内容与描述不符',
  '涉及敏感内容',
  '其他原因',
];

// 报价模板
const QUOTE_TEMPLATES = [
  { label: '标准换脸', price: 29.9, days: 1 },
  { label: '双人换脸', price: 49.9, days: 2 },
  { label: '定制制作-简单', price: 99, days: 3 },
  { label: '定制制作-中等', price: 199, days: 5 },
  { label: '定制制作-复杂', price: 299, days: 7 },
];

export const ReviewDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<ReviewItem | null>(null);
  
  // 弹窗状态
  const [initialReviewModalVisible, setInitialReviewModalVisible] = useState(false);
  const [quoteModalVisible, setQuoteModalVisible] = useState(false);
  const [productionModalVisible, setProductionModalVisible] = useState(false);
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  
  // 表单
  const [initialReviewForm] = Form.useForm();
  const [quoteForm] = Form.useForm();
  const [productionForm] = Form.useForm();
  const [publishForm] = Form.useForm();
  const [messageForm] = Form.useForm();
  
  const [submitting, setSubmitting] = useState(false);
  
  // 上传状态
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState('');
  const [merging, setMerging] = useState(false);

  // 获取详情
  const fetchDetail = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const data = await adminService.getReviewDetail(id);
      setReview(data);
    } catch (error: any) {
      console.error('获取详情失败:', error);
      if (error?.response?.status === 401) {
        message.error('登录已过期，请重新登录');
        navigate(ROUTES.ADMIN_LOGIN);
      } else {
        message.error('获取详情失败');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // 获取状态标签
  const getStatusTag = (status: ReviewStatus) => {
    const config = REVIEW_STATUS_CONFIG[status] || { label: status, color: 'default' };
    return <Tag color={config.color} style={{ fontSize: 14, padding: '4px 12px' }}>{config.label}</Tag>;
  };

  // 获取操作提示
  const getActionTip = (status: ReviewStatus) => {
    const tips: Record<string, string> = {
      pending_initial: '请查看视频内容，决定是否通过初审',
      pending: '请查看视频内容，决定是否通过初审',
      pending_quote: '初审已通过，请为客户报价',
      quoted: '等待客户确认报价并付款',
      pending_payment: '等待客户付款',
      production: '客户已付款，请制作视频并提交成品',
      pending_confirm: '等待客户确认成品',
      modifying: '客户申请修改，请修改后重新提交',
      pending_reconfirm: '等待客户再次确认',
      pending_final: '客户已确认，请终审并上架',
      published: '视频已上架',
      offline: '视频已下架',
    };
    return tips[status] || '';
  };

  // 初审操作
  const handleInitialReview = async (values: any) => {
    if (!id) return;
    
    try {
      setSubmitting(true);
      await adminService.initialReview(
        id, 
        values.passed, 
        values.rejectReason, 
        values.note
      );
      message.success(values.passed ? '初审通过' : '已拒绝');
      setInitialReviewModalVisible(false);
      fetchDetail();
    } catch (error: any) {
      message.error(error?.response?.data?.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 报价操作
  const handleQuote = async (values: any) => {
    if (!id) return;
    
    try {
      setSubmitting(true);
      await adminService.quote(id, values.price, values.estimatedDays, values.quoteNote);
      message.success('报价已发送');
      setQuoteModalVisible(false);
      fetchDetail();
    } catch (error: any) {
      message.error(error?.response?.data?.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 制作完成
  const handleProductionComplete = async (values: any) => {
    if (!id) return;
    
    try {
      setSubmitting(true);
      const isModifying = review?.reviewStatus === 'modifying';
      if (isModifying) {
        await adminService.modificationComplete(id, values.resultVideoUrl, values.note);
      } else {
        await adminService.productionComplete(id, values.resultVideoUrl, values.note);
      }
      message.success('已提交客户确认');
      setProductionModalVisible(false);
      fetchDetail();
    } catch (error: any) {
      message.error(error?.response?.data?.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 终审上架
  const handlePublish = async (values: any) => {
    if (!id) return;
    
    try {
      setSubmitting(true);
      await adminService.publish(id, values.category, values.isHomeRecommended, values.sortOrder);
      message.success('视频已上架');
      setPublishModalVisible(false);
      fetchDetail();
    } catch (error: any) {
      message.error(error?.response?.data?.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 发送消息
  const handleSendMessage = async (values: any) => {
    if (!id) return;
    
    try {
      setSubmitting(true);
      await adminService.sendReviewMessage(id, values.content);
      message.success('消息已发送');
      setMessageModalVisible(false);
      messageForm.resetFields();
      fetchDetail();
    } catch (error: any) {
      message.error(error?.response?.data?.message || '发送失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 选择报价模板
  const handleSelectQuoteTemplate = (template: typeof QUOTE_TEMPLATES[0]) => {
    quoteForm.setFieldsValue({
      price: template.price,
      estimatedDays: template.days,
    });
  };

  // 合并视频并上架（调用 RunningHub）
  const handleMergeAndPublish = async () => {
    if (!id || !review) return;
    
    Modal.confirm({
      title: '合并视频并上架',
      content: (
        <div>
          <p>将会调用 RunningHub API 合并两个视频：</p>
          <ul>
            <li>创意视频</li>
            <li>广告视频</li>
          </ul>
          <p>合并完成后视频将自动上架。</p>
        </div>
      ),
      okText: '确认合并',
      cancelText: '取消',
      onOk: async () => {
        try {
          setMerging(true);
          message.loading({ content: '正在合并视频...', key: 'merge', duration: 0 });
          
          await adminService.mergeAndPublish(id, review.price);
          
          message.success({ content: '视频合并完成并已上架！', key: 'merge' });
          fetchDetail();
        } catch (error: any) {
          message.error({ content: error?.response?.data?.message || '合并失败', key: 'merge' });
        } finally {
          setMerging(false);
        }
      },
    });
  };

  // 本地上传视频并上架
  const handleUploadAndPublish = async () => {
    if (!id || !uploadedVideoUrl) {
      message.error('请先上传视频');
      return;
    }
    
    try {
      setSubmitting(true);
      await adminService.uploadAndPublish(id, uploadedVideoUrl, review?.price);
      message.success('上传成功并已上架！');
      setUploadModalVisible(false);
      setUploadedVideoUrl('');
      fetchDetail();
    } catch (error: any) {
      message.error(error?.response?.data?.message || '上架失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 使用签名上传视频到COS（管理后台专用）
  const handleVideoUpload = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      // 使用 adminService 的签名上传方法
      const url = await adminService.uploadVideoToCOS(file, (percent) => {
        setUploadProgress(percent);
      });

      setUploadedVideoUrl(url);
      message.success('视频上传成功！');
    } catch (error: any) {
      console.error('上传失败:', error);
      message.error('上传失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }

    return false; // 阻止默认上传行为
  };

  const uploadProps: UploadProps = {
    beforeUpload: handleVideoUpload,
    showUploadList: false,
    accept: 'video/*',
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate(ROUTES.ADMIN_LOGIN);
    message.success('已退出登录');
  };

  if (loading) {
    return (
      <Layout className="review-detail-layout">
        <Header className="admin-header">
          <div className="admin-header-content">
            <Space>
              <Button
                icon={<HomeOutlined />}
                onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}
              >
                返回首页
              </Button>
              <h2 style={{ color: '#fff', margin: 0 }}>审核详情</h2>
            </Space>
            <Button
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              退出登录
            </Button>
          </div>
        </Header>
        <Content className="review-detail-content">
          <div className="loading-container">
            <Spin size="large" />
          </div>
        </Content>
      </Layout>
    );
  }

  if (!review) {
    return (
      <Layout className="review-detail-layout">
        <Header className="admin-header">
          <div className="admin-header-content">
            <Space>
              <Button
                icon={<HomeOutlined />}
                onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}
              >
                返回首页
              </Button>
              <h2 style={{ color: '#fff', margin: 0 }}>审核详情</h2>
            </Space>
            <Button
              icon={<LogoutOutlined />}
              onClick={handleLogout}
            >
              退出登录
            </Button>
          </div>
        </Header>
        <Content className="review-detail-content">
          <div className="not-found">视频不存在</div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout className="review-detail-layout">
      <Header className="admin-header">
        <div className="admin-header-content">
          <Space>
            <Button
              icon={<HomeOutlined />}
              onClick={() => navigate(ROUTES.ADMIN_DASHBOARD)}
            >
              返回首页
            </Button>
            <h2 style={{ color: '#fff', margin: 0 }}>审核详情</h2>
          </Space>
          <Button
            icon={<LogoutOutlined />}
            onClick={handleLogout}
          >
            退出登录
          </Button>
        </div>
      </Header>
      <Content className="review-detail-content">
        {/* 顶部导航 */}
        <div className="page-header">
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/admin/review')}
          >
            返回列表
          </Button>
          <h1>审核详情</h1>
          <div className="status-area">
            {getStatusTag(review.reviewStatus)}
          </div>
        </div>

        {/* 操作提示 */}
        <Alert
          message={getActionTip(review.reviewStatus)}
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Row gutter={24}>
          {/* 左侧：内容预览 */}
          <Col span={14}>
            <Card 
              title={
                <span>
                  内容预览
                  {(review as any).contentType === 'text' && (
                    <Tag color="blue" style={{ marginLeft: 8 }}>文案创意</Tag>
                  )}
                </span>
              } 
              className="preview-card"
            >
              {/* 判断内容类型：视频还是文案 */}
              {(review as any).contentType === 'text' || (!review.videoUrl && review.description) ? (
                // 文案类型 - 显示文案内容
                <div className="text-content-section">
                  <div className="text-label" style={{ fontWeight: 500, color: '#666', marginBottom: 8 }}>创意内容</div>
                  <div 
                    className="text-content" 
                    style={{ 
                      padding: 16, 
                      background: '#f5f5f5', 
                      borderRadius: 8, 
                      minHeight: 150,
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.6,
                    }}
                  >
                    {review.description || '暂无内容'}
                  </div>
                  
                  {/* 参考图片（如有） */}
                  {(review as any).referenceImages && (review as any).referenceImages.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <Divider>参考图片 ({(review as any).referenceImages.length}张)</Divider>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                        {(review as any).referenceImages.map((url: string, idx: number) => (
                          <Image
                            key={idx}
                            src={url}
                            alt={`参考图片${idx + 1}`}
                            width={120}
                            height={120}
                            style={{ objectFit: 'cover', borderRadius: 8 }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // 视频类型 - 显示视频
                <>
                  {/* 视频预览 - 左右显示两个视频 */}
                  <div className="video-preview-container" style={{ display: 'flex', gap: 16 }}>
                    {/* 原始视频 */}
                    <div className="video-item" style={{ flex: 1 }}>
                      <div style={{ marginBottom: 8, fontWeight: 500, color: '#666' }}>
                        {review.comparisonVideoUrl ? '创意视频' : '上传视频'}
                      </div>
                      {review.videoUrl ? (
                        <video 
                          src={review.videoUrl} 
                          controls 
                          style={{ width: '100%', maxHeight: 300, borderRadius: 8, background: '#000' }}
                          poster={review.coverUrl}
                        />
                      ) : (
                        <div style={{ 
                          width: '100%', 
                          height: 200, 
                          background: '#f0f0f0', 
                          borderRadius: 8,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#999'
                        }}>
                          暂无视频
                        </div>
                      )}
                    </div>
                    
                    {/* 对比视频（如有） */}
                    {review.comparisonVideoUrl && (
                      <div className="video-item" style={{ flex: 1 }}>
                        <div style={{ marginBottom: 8, fontWeight: 500, color: '#666' }}>广告视频</div>
                        <video 
                          src={review.comparisonVideoUrl} 
                          controls 
                          style={{ width: '100%', maxHeight: 300, borderRadius: 8, background: '#000' }}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* 上传的素材列表（如有） */}
              {review.uploadConfig?.materials && review.uploadConfig.materials.length > 0 && (
                <div className="materials-section" style={{ marginTop: 16 }}>
                  <Divider>上传素材 ({review.uploadConfig.materials.length}个)</Divider>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {review.uploadConfig.materials.map((material, index) => (
                      <div key={index} style={{ width: 'calc(50% - 6px)' }}>
                        {material.type === 'video' ? (
                          <video 
                            src={material.url} 
                            controls 
                            style={{ width: '100%', maxHeight: 200, borderRadius: 8, background: '#000' }}
                          />
                        ) : (
                          <Image
                            src={material.url}
                            alt={material.name || `素材${index + 1}`}
                            style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }}
                          />
                        )}
                        {material.name && (
                          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>{material.name}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 成品视频（如有） */}
              {review.resultVideoUrl && (
                <div className="result-video-section">
                  <Divider>成品视频</Divider>
                  <video 
                    src={review.resultVideoUrl} 
                    controls 
                    style={{ width: '100%', maxHeight: 300, borderRadius: 8 }}
                  />
                </div>
              )}

              {/* 基本信息 */}
              <Descriptions column={2} style={{ marginTop: 24 }}>
                <Descriptions.Item label="标题" span={2}>{review.title}</Descriptions.Item>
                <Descriptions.Item label="描述" span={2}>{review.description || '-'}</Descriptions.Item>
                <Descriptions.Item label="分类">{CATEGORY_MAP[review.category] || review.category}</Descriptions.Item>
                <Descriptions.Item label="原价">¥{review.price}</Descriptions.Item>
                <Descriptions.Item label="提交时间">{new Date(review.createdAt).toLocaleString('zh-CN')}</Descriptions.Item>
                {review.quotePrice && (
                  <Descriptions.Item label="报价">
                    <span className="quote-price">¥{review.quotePrice}</span>
                    {review.estimatedDays && <span>（预计{review.estimatedDays}天）</span>}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* 审核日志 */}
            <Card title="审核记录" className="logs-card" style={{ marginTop: 24 }}>
              <Timeline>
                {review.reviewLogs && review.reviewLogs.length > 0 ? (
                  review.reviewLogs.map((log: ReviewLog) => (
                    <Timeline.Item 
                      key={log._id}
                      color={log.operatorType === 'admin' ? 'blue' : 'green'}
                    >
                      <div className="log-item">
                        <div className="log-header">
                          <Tag color={log.operatorType === 'admin' ? 'blue' : 'green'}>
                            {log.operatorType === 'admin' ? '审核员' : '客户'}
                          </Tag>
                          <span className="log-time">
                            {new Date(log.createdAt).toLocaleString('zh-CN')}
                          </span>
                        </div>
                        <div className="log-content">{log.content}</div>
                      </div>
                    </Timeline.Item>
                  ))
                ) : (
                  <Timeline.Item>暂无审核记录</Timeline.Item>
                )}
              </Timeline>
            </Card>
          </Col>

          {/* 右侧：操作区 */}
          <Col span={10}>
            {/* 创作者信息 */}
            <Card title="创作者信息" className="creator-card">
              {review.creator ? (
                <div className="creator-info">
                  <div className="creator-avatar">
                    {review.creator.avatar ? (
                      <Image src={review.creator.avatar} width={60} height={60} style={{ borderRadius: '50%' }} />
                    ) : (
                      <div className="avatar-placeholder"><UserOutlined /></div>
                    )}
                  </div>
                  <div className="creator-detail">
                    <div className="creator-name">{review.creator.nickname}</div>
                    {review.creator.phone && (
                      <div className="creator-phone">{review.creator.phone}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div>-</div>
              )}
            </Card>

            {/* 操作面板 */}
            <Card title="审核操作" className="action-card" style={{ marginTop: 24 }}>
              {/* ===== 视频审核流程（简化：待审核→通过/拒绝）===== */}
              {/* 视频类型 - 待审核 */}
              {(review as any).contentType !== 'text' && 
               (review.reviewStatus === 'pending_initial' || review.reviewStatus === 'pending') && (
                <div className="action-buttons">
                  <Alert
                    message="视频审核"
                    description="选择以下任一方式完成审核并上架"
                    type="info"
                    style={{ marginBottom: 16 }}
                  />
                  
                  {/* 方式一：合并视频并上架（调用 RunningHub） */}
                  {review.videoUrl && review.comparisonVideoUrl && (
                    <Button 
                      type="primary" 
                      icon={merging ? <LoadingOutlined /> : <MergeCellsOutlined />}
                      onClick={handleMergeAndPublish}
                      block
                      size="large"
                      disabled={merging}
                    >
                      {merging ? '合并处理中...' : '合并视频并上架'}
                    </Button>
                  )}
                  
                  {/* 方式二：本地上传上架 */}
                  <Button 
                    type="primary" 
                    icon={<CloudUploadOutlined />}
                    onClick={() => setUploadModalVisible(true)}
                    block
                    size="large"
                    style={{ marginTop: 12 }}
                    ghost
                  >
                    本地上传上架
                  </Button>
                  
                  <Divider style={{ margin: '16px 0' }}>或</Divider>
                  
                  {/* 直接通过（不合并） */}
                  <Button 
                    icon={<CheckCircleOutlined />}
                    onClick={() => {
                      initialReviewForm.setFieldsValue({ passed: true });
                      setInitialReviewModalVisible(true);
                    }}
                    block
                    size="large"
                  >
                    直接审核通过
                  </Button>
                  
                  <Button 
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => {
                      initialReviewForm.setFieldsValue({ passed: false });
                      setInitialReviewModalVisible(true);
                    }}
                    block
                    size="large"
                    style={{ marginTop: 12 }}
                  >
                    拒绝
                  </Button>
                </div>
              )}

              {/* ===== 文案审核流程 ===== */}
              {/* 文案类型 - 待审核（待报价）*/}
              {(review as any).contentType === 'text' && 
               (review.reviewStatus === 'pending_initial' || review.reviewStatus === 'pending' || review.reviewStatus === 'pending_quote') && (
                <div className="action-buttons">
                  <Alert
                    message="文案审核"
                    description="请审核创意内容并填写报价"
                    type="info"
                    style={{ marginBottom: 16 }}
                  />
                  <Button 
                    type="primary" 
                    icon={<DollarOutlined />}
                    onClick={() => {
                      quoteForm.resetFields();
                      setQuoteModalVisible(true);
                    }}
                    block
                    size="large"
                  >
                    填写报价
                  </Button>
                  <Button 
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => {
                      initialReviewForm.setFieldsValue({ passed: false });
                      setInitialReviewModalVisible(true);
                    }}
                    block
                    size="large"
                    style={{ marginTop: 12 }}
                  >
                    拒绝
                  </Button>
                </div>
              )}

              {/* 文案类型 - 已报价（等待客户付款） */}
              {(review as any).contentType === 'text' && review.reviewStatus === 'quoted' && (
                <div className="waiting-section">
                  <ClockCircleOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                  <div className="waiting-text">等待客户确认报价并付款</div>
                  <div className="quote-info">
                    报价：<span className="quote-price">¥{review.quotePrice}</span>
                    {review.estimatedDays && <span style={{ marginLeft: 8 }}>预计 {review.estimatedDays} 天</span>}
                  </div>
                  <Button 
                    onClick={() => setMessageModalVisible(true)}
                    style={{ marginTop: 16 }}
                  >
                    发送提醒
                  </Button>
                </div>
              )}

              {/* 文案类型 - 已付款（制作中） */}
              {(review as any).contentType === 'text' && review.reviewStatus === 'production' && (
                <div className="action-buttons">
                  <Alert
                    message="客户已付款"
                    description="请开始制作，完成后上传成品视频交付"
                    type="success"
                    style={{ marginBottom: 16 }}
                  />
                  <Button 
                    type="primary" 
                    icon={<UploadOutlined />}
                    onClick={() => {
                      productionForm.resetFields();
                      setProductionModalVisible(true);
                    }}
                    block
                    size="large"
                  >
                    上传成品并交付
                  </Button>
                </div>
              )}

              {/* 文案类型 - 待交付（pending_confirm） */}
              {(review as any).contentType === 'text' && review.reviewStatus === 'pending_confirm' && (
                <div className="action-buttons">
                  <Alert
                    message="待交付"
                    description="请上传成品视频完成交付"
                    type="warning"
                    style={{ marginBottom: 16 }}
                  />
                  <Button 
                    type="primary" 
                    icon={<UploadOutlined />}
                    onClick={() => {
                      productionForm.resetFields();
                      setProductionModalVisible(true);
                    }}
                    block
                    size="large"
                  >
                    上传成品并交付
                  </Button>
                </div>
              )}

              {/* 已上架/已下架 */}
              {(review.reviewStatus === 'published' || review.reviewStatus === 'offline') && (
                <div className="completed-section">
                  <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                  <div className="completed-text">
                    {review.reviewStatus === 'published' ? '视频已上架' : '视频已下架'}
                  </div>
                  {review.publishedAt && (
                    <div className="publish-time">
                      上架时间：{new Date(review.publishedAt).toLocaleString('zh-CN')}
                    </div>
                  )}
                  <Button 
                    onClick={() => navigate(`/admin/videos/${review._id}`)}
                    style={{ marginTop: 16 }}
                  >
                    前往视频管理
                  </Button>
                </div>
              )}

              {/* 发送消息按钮（通用） */}
              {!['published', 'offline', 'initial_rejected'].includes(review.reviewStatus) && (
                <Divider />
              )}
              {!['published', 'offline', 'initial_rejected'].includes(review.reviewStatus) && (
                <Button 
                  icon={<SendOutlined />}
                  onClick={() => setMessageModalVisible(true)}
                  block
                >
                  发送消息给客户
                </Button>
              )}
            </Card>
          </Col>
        </Row>

        {/* 初审弹窗 */}
        <Modal
          title="初审操作"
          open={initialReviewModalVisible}
          onCancel={() => setInitialReviewModalVisible(false)}
          footer={null}
          width={500}
        >
          <Form
            form={initialReviewForm}
            layout="vertical"
            onFinish={handleInitialReview}
          >
            <Form.Item name="passed" hidden>
              <Input />
            </Form.Item>
            
            {initialReviewForm.getFieldValue('passed') === false && (
              <Form.Item
                name="rejectReason"
                label="拒绝原因（可选）"
              >
                <Select placeholder="选择常见原因（可不选）" allowClear>
                  {REJECT_REASONS.map(reason => (
                    <Select.Option key={reason} value={reason}>{reason}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            )}
            
            <Form.Item name="note" label="备注">
              <TextArea rows={3} placeholder="可选，填写备注信息" />
            </Form.Item>
            
            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setInitialReviewModalVisible(false)}>取消</Button>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={submitting}
                  danger={initialReviewForm.getFieldValue('passed') === false}
                >
                  {initialReviewForm.getFieldValue('passed') ? '确认通过' : '确认拒绝'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 报价弹窗 */}
        <Modal
          title="填写报价"
          open={quoteModalVisible}
          onCancel={() => setQuoteModalVisible(false)}
          footer={null}
          width={600}
        >
          <div className="quote-templates">
            <div className="template-label">快速选择：</div>
            <Space wrap>
              {QUOTE_TEMPLATES.map(template => (
                <Button 
                  key={template.label}
                  size="small"
                  onClick={() => handleSelectQuoteTemplate(template)}
                >
                  {template.label}（¥{template.price}）
                </Button>
              ))}
            </Space>
          </div>
          <Divider />
          <Form
            form={quoteForm}
            layout="vertical"
            onFinish={handleQuote}
          >
            <Form.Item
              name="price"
              label="报价金额（元）"
              rules={[{ required: true, message: '请填写报价金额' }]}
            >
              <InputNumber 
                min={0} 
                precision={2} 
                style={{ width: '100%' }} 
                placeholder="请输入报价金额"
                prefix="¥"
              />
            </Form.Item>
            
            <Form.Item
              name="estimatedDays"
              label="预计制作天数"
              rules={[{ required: true, message: '请填写预计天数' }]}
            >
              <InputNumber min={1} max={30} style={{ width: '100%' }} placeholder="请输入预计天数" />
            </Form.Item>
            
            <Form.Item name="quoteNote" label="报价说明（客户可见）">
              <TextArea rows={3} placeholder="填写报价说明，例如：根据您的需求..." />
            </Form.Item>
            
            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setQuoteModalVisible(false)}>取消</Button>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  发送报价
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 提交成品弹窗 */}
        <Modal
          title={review.reviewStatus === 'modifying' ? '提交修改版本' : '提交成品'}
          open={productionModalVisible}
          onCancel={() => setProductionModalVisible(false)}
          footer={null}
          width={500}
        >
          <Form
            form={productionForm}
            layout="vertical"
            onFinish={handleProductionComplete}
          >
            <Form.Item
              name="resultVideoUrl"
              label="成品视频URL"
              rules={[{ required: true, message: '请填写成品视频URL' }]}
            >
              <Input placeholder="请填写成品视频的URL地址" />
            </Form.Item>
            
            <Form.Item name="note" label="备注">
              <TextArea rows={3} placeholder="可选，填写备注信息" />
            </Form.Item>
            
            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setProductionModalVisible(false)}>取消</Button>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  提交
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 终审上架弹窗 */}
        <Modal
          title="终审上架"
          open={publishModalVisible}
          onCancel={() => setPublishModalVisible(false)}
          footer={null}
          width={500}
        >
          <Form
            form={publishForm}
            layout="vertical"
            onFinish={handlePublish}
          >
            <Form.Item
              name="category"
              label="上架分类"
              rules={[{ required: true, message: '请选择分类' }]}
            >
              <Select placeholder="选择分类">
                {CATEGORY_OPTIONS.map(opt => (
                  <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="isHomeRecommended"
              label="首页推荐"
              valuePropName="checked"
            >
              <Select defaultValue={false}>
                <Select.Option value={true}>是</Select.Option>
                <Select.Option value={false}>否</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item name="sortOrder" label="排序值（可选，数字越小越靠前）">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="留空则按时间排序" />
            </Form.Item>
            
            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setPublishModalVisible(false)}>取消</Button>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  确认上架
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 发送消息弹窗 */}
        <Modal
          title="发送消息"
          open={messageModalVisible}
          onCancel={() => setMessageModalVisible(false)}
          footer={null}
          width={500}
        >
          <Form
            form={messageForm}
            layout="vertical"
            onFinish={handleSendMessage}
          >
            <Form.Item
              name="content"
              label="消息内容"
              rules={[{ required: true, message: '请填写消息内容' }]}
            >
              <TextArea rows={4} placeholder="请输入要发送的消息..." />
            </Form.Item>
            
            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => setMessageModalVisible(false)}>取消</Button>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  发送
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>

        {/* 本地上传上架弹窗 */}
        <Modal
          title="本地上传上架"
          open={uploadModalVisible}
          onCancel={() => {
            setUploadModalVisible(false);
            setUploadedVideoUrl('');
            setUploadProgress(0);
          }}
          footer={null}
          width={600}
        >
          <Alert
            message="上传最终视频"
            description="上传完成后点击确认上架，视频将直接显示在视频管理和用户的我的作品中"
            type="info"
            style={{ marginBottom: 24 }}
          />
          
          <div className="upload-section" style={{ textAlign: 'center', padding: '24px 0' }}>
            {!uploadedVideoUrl ? (
              <>
                <Upload {...uploadProps}>
                  <Button 
                    icon={<UploadOutlined />} 
                    size="large"
                    loading={uploading}
                    type="primary"
                  >
                    {uploading ? '上传中...' : '选择视频文件'}
                  </Button>
                </Upload>
                {uploading && (
                  <Progress 
                    percent={uploadProgress} 
                    style={{ marginTop: 16, maxWidth: 300, margin: '16px auto 0' }} 
                  />
                )}
                <div style={{ color: '#999', marginTop: 12 }}>
                  支持 MP4、MOV、AVI 等格式，建议大小不超过 500MB
                </div>
              </>
            ) : (
              <div className="upload-success">
                <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                <div style={{ marginTop: 12, fontWeight: 500 }}>视频上传成功！</div>
                <div style={{ marginTop: 8 }}>
                  <video 
                    src={uploadedVideoUrl} 
                    controls 
                    style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, marginTop: 12 }}
                  />
                </div>
                <Button 
                  type="link" 
                  onClick={() => {
                    setUploadedVideoUrl('');
                    setUploadProgress(0);
                  }}
                  style={{ marginTop: 8 }}
                >
                  重新上传
                </Button>
              </div>
            )}
          </div>
          
          <Divider />
          
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => {
              setUploadModalVisible(false);
              setUploadedVideoUrl('');
            }}>
              取消
            </Button>
            <Button 
              type="primary" 
              onClick={handleUploadAndPublish}
              loading={submitting}
              disabled={!uploadedVideoUrl}
            >
              确认上架
            </Button>
          </Space>
        </Modal>
      </Content>
    </Layout>
  );
};

