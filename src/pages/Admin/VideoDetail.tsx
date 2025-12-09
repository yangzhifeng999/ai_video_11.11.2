import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Layout,
  Card,
  Descriptions,
  Button,
  Space,
  message,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Tag,
  Image,
  Spin,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  RollbackOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { adminService } from '@/services/adminService';
import { ROUTES } from '@/constants/routes';
import type { VideoListItem } from '@/types/admin';
import './VideoDetail.css';

const { Header, Content } = Layout;
const { TextArea } = Input;

export const VideoDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<VideoListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved');
  const [form] = Form.useForm();
  const [reviewForm] = Form.useForm();

  const fetchVideoDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await adminService.getVideoDetail(id);
      setVideo(data);
      form.setFieldsValue(data);
    } catch (error: any) {
      console.error('获取视频详情失败:', error);
      if (error?.response?.status === 401) {
        message.error('登录已过期，请重新登录');
        navigate(ROUTES.ADMIN_LOGIN);
      } else {
        message.error('获取视频详情失败');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideoDetail();
  }, [id]);

  const handleEdit = () => {
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!id) return;
      await adminService.updateVideo(id, values);
      message.success('更新成功');
      setEditModalVisible(false);
      fetchVideoDetail();
    } catch (error: any) {
      console.error('更新失败:', error);
      message.error(error?.response?.data?.message || '更新失败');
    }
  };

  const handleReview = (status: 'approved' | 'rejected') => {
    setReviewStatus(status);
    setReviewModalVisible(true);
    reviewForm.resetFields();
  };

  const handleReviewSubmit = async () => {
    try {
      const values = await reviewForm.validateFields();
      if (!id) return;
      await adminService.reviewVideo(id, reviewStatus, values.rejectReason);
      message.success(`审核${reviewStatus === 'approved' ? '通过' : '拒绝'}成功`);
      setReviewModalVisible(false);
      fetchVideoDetail();
    } catch (error: any) {
      console.error('审核失败:', error);
      message.error(error?.response?.data?.message || '审核失败');
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除视频？',
      content: `视频《${video?.title}》删除后无法恢复`,
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          if (!id) return;
          await adminService.deleteVideo(id);
          message.success('删除成功');
          navigate(ROUTES.ADMIN_VIDEOS);
        } catch (error: any) {
          console.error('删除失败:', error);
          message.error(error?.response?.data?.message || '删除失败');
        }
      },
    });
  };

  const categoryMap: Record<string, string> = {
    comprehensive: '综合',
    mother_baby: '母婴',
    clothing: '服装',
    general_merchandise: '百货',
  };

  const statusConfig: Record<string, { color: string; text: string }> = {
    pending: { color: 'warning', text: '待审核' },
    approved: { color: 'success', text: '已通过' },
    rejected: { color: 'error', text: '已拒绝' },
  };

  if (loading) {
    return (
      <Layout className="admin-dashboard-layout">
        <Header className="admin-header">
          <div className="admin-header-content">
            <h2 style={{ color: '#fff', margin: 0 }}>视频详情</h2>
          </div>
        </Header>
        <Content className="admin-content">
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <Spin size="large" />
          </div>
        </Content>
      </Layout>
    );
  }

  if (!video) {
    return (
      <Layout className="admin-dashboard-layout">
        <Header className="admin-header">
          <div className="admin-header-content">
            <h2 style={{ color: '#fff', margin: 0 }}>视频详情</h2>
          </div>
        </Header>
        <Content className="admin-content">
          <Card>
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <p>视频不存在</p>
              <Button type="primary" onClick={() => navigate(ROUTES.ADMIN_VIDEOS)}>
                返回列表
              </Button>
            </div>
          </Card>
        </Content>
      </Layout>
    );
  }

  const statusInfo = statusConfig[video.status] || { color: 'default', text: video.status };

  return (
    <Layout className="admin-dashboard-layout">
      <Header className="admin-header">
        <div className="admin-header-content">
          <Space>
            <Button
              type="text"
              icon={<RollbackOutlined />}
              onClick={() => navigate(ROUTES.ADMIN_VIDEOS)}
              style={{ color: '#fff' }}
            >
              返回列表
            </Button>
            <h2 style={{ color: '#fff', margin: 0 }}>视频详情</h2>
          </Space>
        </div>
      </Header>
      <Content className="admin-content">
        <Card
          title="视频信息"
          extra={
            <Space>
              {video.status === 'pending' && (
                <>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleReview('approved')}
                  >
                    通过审核
                  </Button>
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => handleReview('rejected')}
                  >
                    拒绝审核
                  </Button>
                </>
              )}
              <Button icon={<EditOutlined />} onClick={handleEdit}>
                编辑
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                删除
              </Button>
            </Space>
          }
        >
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* 视频预览 */}
            <Card type="inner" title="视频预览">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div>
                  <strong>封面图：</strong>
                  <div style={{ marginTop: 8 }}>
                    <Image
                      src={video.coverUrl}
                      alt="封面"
                      width={300}
                      style={{ borderRadius: 8 }}
                      fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23f0f0f0' width='300' height='200'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3E暂无封面%3C/text%3E%3C/svg%3E"
                    />
                  </div>
                </div>
                <div>
                  <strong>视频链接：</strong>
                  <div style={{ marginTop: 8 }}>
                    <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                      <Button icon={<PlayCircleOutlined />}>播放视频</Button>
                    </a>
                  </div>
                </div>
              </Space>
            </Card>

            {/* 基本信息 */}
            <Descriptions bordered column={2}>
              <Descriptions.Item label="视频ID">{video._id}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="标题" span={2}>
                {video.title}
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {video.description || '无'}
              </Descriptions.Item>
              <Descriptions.Item label="分类">
                {categoryMap[video.category] || video.category}
              </Descriptions.Item>
              <Descriptions.Item label="价格">¥{video.price.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="创作者ID">{video.creatorId}</Descriptions.Item>
              <Descriptions.Item label="创作者名称">
                {video.creatorName || '未知'}
              </Descriptions.Item>
              <Descriptions.Item label="播放量">{video.viewCount || 0}</Descriptions.Item>
              <Descriptions.Item label="点赞数">{video.likeCount || 0}</Descriptions.Item>
              <Descriptions.Item label="订单数">{video.orderCount || 0}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(video.createdAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {new Date(video.updatedAt).toLocaleString('zh-CN')}
              </Descriptions.Item>
            </Descriptions>
          </Space>
        </Card>

        {/* 编辑弹窗 */}
        <Modal
          title="编辑视频"
          open={editModalVisible}
          onOk={handleEditSubmit}
          onCancel={() => setEditModalVisible(false)}
          width={600}
          okText="保存"
          cancelText="取消"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              label="标题"
              name="title"
              rules={[{ required: true, message: '请输入标题' }]}
            >
              <Input placeholder="请输入视频标题" />
            </Form.Item>
            <Form.Item label="描述" name="description">
              <TextArea rows={4} placeholder="请输入视频描述" />
            </Form.Item>
            <Form.Item
              label="分类"
              name="category"
              rules={[{ required: true, message: '请选择分类' }]}
            >
              <Select placeholder="请选择分类">
                <Select.Option value="comprehensive">综合</Select.Option>
                <Select.Option value="mother_baby">母婴</Select.Option>
                <Select.Option value="clothing">服装</Select.Option>
                <Select.Option value="general_merchandise">百货</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="价格"
              name="price"
              rules={[{ required: true, message: '请输入价格' }]}
            >
              <InputNumber
                min={0}
                step={0.01}
                precision={2}
                style={{ width: '100%' }}
                placeholder="请输入价格"
                addonBefore="¥"
              />
            </Form.Item>
          </Form>
        </Modal>

        {/* 审核弹窗 */}
        <Modal
          title={`${reviewStatus === 'approved' ? '通过' : '拒绝'}审核`}
          open={reviewModalVisible}
          onOk={handleReviewSubmit}
          onCancel={() => setReviewModalVisible(false)}
          okText="确认"
          cancelText="取消"
        >
          <Form form={reviewForm} layout="vertical">
            {reviewStatus === 'rejected' && (
              <Form.Item
                label="拒绝原因"
                name="rejectReason"
                rules={[{ required: true, message: '请输入拒绝原因' }]}
              >
                <TextArea rows={4} placeholder="请输入拒绝原因" />
              </Form.Item>
            )}
            {reviewStatus === 'approved' && (
              <p>确认通过视频《{video.title}》的审核吗？</p>
            )}
          </Form>
        </Modal>
      </Content>
    </Layout>
  );
};
