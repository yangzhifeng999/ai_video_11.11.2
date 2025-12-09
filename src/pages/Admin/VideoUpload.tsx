import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Upload,
  message,
  Space,
  Progress,
} from 'antd';
import {
  RollbackOutlined,
  UploadOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { ROUTES } from '@/constants/routes';
import './VideoUpload.css';

const { Header, Content } = Layout;
const { TextArea } = Input;

export const VideoUpload: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [coverFileList, setCoverFileList] = useState<UploadFile[]>([]);
  const [videoFileList, setVideoFileList] = useState<UploadFile[]>([]);

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      
      // 检查是否上传了封面和视频
      if (coverFileList.length === 0) {
        message.error('请上传封面图');
        return;
      }
      if (videoFileList.length === 0) {
        message.error('请上传视频文件');
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      // TODO: 实际的上传逻辑
      // 1. 上传封面到 COS
      // 2. 上传视频到 COS/VOD
      // 3. 调用后端 API 创建视频记录

      // 模拟上传进度
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 300);

      // 模拟上传完成
      setTimeout(() => {
        clearInterval(interval);
        setUploadProgress(100);
        message.success('视频上传成功！');
        setTimeout(() => {
          navigate(ROUTES.ADMIN_VIDEOS);
        }, 1000);
      }, 3000);

    } catch (error: any) {
      console.error('上传失败:', error);
      message.error(error?.message || '上传失败');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCoverChange = ({ fileList }: { fileList: UploadFile[] }) => {
    setCoverFileList(fileList.slice(-1)); // 只保留最后一个
  };

  const handleVideoChange = ({ fileList }: { fileList: UploadFile[] }) => {
    setVideoFileList(fileList.slice(-1)); // 只保留最后一个
  };

  const beforeUpload = (file: File, type: 'image' | 'video') => {
    if (type === 'image') {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件！');
        return Upload.LIST_IGNORE;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('图片大小不能超过 5MB！');
        return Upload.LIST_IGNORE;
      }
    } else if (type === 'video') {
      const isVideo = file.type.startsWith('video/');
      if (!isVideo) {
        message.error('只能上传视频文件！');
        return Upload.LIST_IGNORE;
      }
      const isLt500M = file.size / 1024 / 1024 < 500;
      if (!isLt500M) {
        message.error('视频大小不能超过 500MB！');
        return Upload.LIST_IGNORE;
      }
    }
    return false; // 阻止自动上传，我们手动控制
  };

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
            <h2 style={{ color: '#fff', margin: 0 }}>上传视频</h2>
          </Space>
        </div>
      </Header>
      <Content className="admin-content">
        <Card>
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              category: 'comprehensive',
              price: 0,
            }}
          >
            <Form.Item
              label="视频标题"
              name="title"
              rules={[
                { required: true, message: '请输入视频标题' },
                { max: 100, message: '标题不能超过100个字符' },
              ]}
            >
              <Input placeholder="请输入视频标题" maxLength={100} showCount />
            </Form.Item>

            <Form.Item
              label="视频描述"
              name="description"
              rules={[{ max: 500, message: '描述不能超过500个字符' }]}
            >
              <TextArea
                rows={4}
                placeholder="请输入视频描述"
                maxLength={500}
                showCount
              />
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
              rules={[
                { required: true, message: '请输入价格' },
                { type: 'number', min: 0, message: '价格不能为负数' },
              ]}
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

            <Form.Item
              label="封面图"
              required
              extra="支持 JPG、PNG 格式，大小不超过 5MB"
            >
              <Upload
                listType="picture-card"
                fileList={coverFileList}
                onChange={handleCoverChange}
                beforeUpload={(file) => beforeUpload(file, 'image')}
                accept="image/*"
                maxCount={1}
              >
                {coverFileList.length === 0 && (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>上传封面</div>
                  </div>
                )}
              </Upload>
            </Form.Item>

            <Form.Item
              label="视频文件"
              required
              extra="支持 MP4、MOV 等常见格式，大小不超过 500MB"
            >
              <Upload
                listType="text"
                fileList={videoFileList}
                onChange={handleVideoChange}
                beforeUpload={(file) => beforeUpload(file, 'video')}
                accept="video/*"
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>选择视频文件</Button>
              </Upload>
            </Form.Item>

            {uploading && (
              <Form.Item label="上传进度">
                <Progress percent={uploadProgress} status="active" />
              </Form.Item>
            )}

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  loading={uploading}
                  disabled={uploading}
                  size="large"
                >
                  {uploading ? '上传中...' : '提交'}
                </Button>
                <Button
                  onClick={() => navigate(ROUTES.ADMIN_VIDEOS)}
                  disabled={uploading}
                  size="large"
                >
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};
