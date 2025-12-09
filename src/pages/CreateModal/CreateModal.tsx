import { useNavigate } from 'react-router-dom';
import { Popup } from 'antd-mobile';
import { ROUTES } from '@/constants/routes';
import './CreateModal.css';

interface CreateModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CreateModal: React.FC<CreateModalProps> = ({ visible, onClose }) => {
  const navigate = useNavigate();

  const handleUploadVideo = () => {
    onClose();
    navigate(ROUTES.UPLOAD_DUAL_VIDEO);
  };

  const handleUploadText = () => {
    onClose();
    navigate(ROUTES.UPLOAD_TEXT);
  };

  const handleRevenueShare = () => {
    onClose();
    navigate(ROUTES.REVENUE_SHARE);
  };

  return (
    <Popup
      visible={visible}
      onMaskClick={onClose}
      onClose={onClose}
      bodyStyle={{
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',
        minHeight: '50vh',
        paddingBottom: '20px',
      }}
    >
      <div className="create-modal">
        {/* 顶部拖拽指示器 */}
        <div className="create-modal-drag-indicator" />

        {/* 顶部："卖文案赚分成" 利益点提示 */}
        <div className="create-modal-header">
          <div className="create-modal-benefit-card">
            <div className="benefit-icon">💰</div>
            <div className="benefit-content">
              <div className="benefit-title">卖文案赚分成</div>
              <div className="benefit-subtitle">上传优质内容，轻松赚取收益</div>
            </div>
          </div>
        </div>

        {/* 中间：创作选项 */}
        <div className="create-modal-body">
          {/* 上半部：上传视频按钮 */}
          <div className="create-option-card" onClick={handleUploadVideo}>
            <div className="option-icon-wrapper video-icon">
              <span className="option-icon">📹</span>
            </div>
            <div className="option-content">
              <div className="option-title">上传视频</div>
              <div className="option-description">分享您的视频创作，获得更多曝光</div>
            </div>
            <div className="option-arrow">›</div>
          </div>

          {/* 下半部：上传文案按钮 */}
          <div className="create-option-card" onClick={handleUploadText}>
            <div className="option-icon-wrapper text-icon">
              <span className="option-icon">✍️</span>
            </div>
            <div className="option-content">
              <div className="option-title">上传文案</div>
              <div className="option-description">分享您的文字创意，赚取分成收益</div>
            </div>
            <div className="option-arrow">›</div>
          </div>
        </div>

        {/* 底部：创作分成说明 */}
        <div className="create-modal-footer">
          <div className="revenue-info-card" onClick={handleRevenueShare}>
            <div className="revenue-info-icon">ℹ️</div>
            <div className="revenue-info-text">
              <span>创作分成说明</span>
              <span className="revenue-info-arrow">→</span>
            </div>
          </div>
        </div>

        {/* 底部：取消按钮 */}
        <div className="create-modal-actions">
          <button className="create-modal-cancel-btn" onClick={onClose}>
            取消
          </button>
        </div>
      </div>
    </Popup>
  );
};

