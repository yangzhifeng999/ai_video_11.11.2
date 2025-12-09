import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Swiper, Toast, Image, Popup, TextArea, Button } from 'antd-mobile';
import { SwiperRef } from 'antd-mobile/es/components/swiper';
import { LeftOutline, HeartOutline, HeartFill, MessageOutline, StarOutline, CloseOutline } from 'antd-mobile-icons';
import { Loading } from '@/components/Loading';
import { formatPrice } from '@/utils';
import { ROUTES } from '@/constants/routes';
import { mockVideos } from '@/utils/mockData';
import type { IVideo, IComment } from '@/types';
import './VideoDetail.css';

export const VideoDetail: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const swiperRef = useRef<SwiperRef>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  
  // 使用 mockVideos 作为视频列表
  const videos = mockVideos;
  
  useEffect(() => {
    // 页面加载时定位到当前视频
    const index = videos.findIndex(v => v.id === videoId);
    if (index !== -1) {
      setActiveIndex(index);
      // 如果不是第一个视频，需要滚动到对应位置
      if (index > 0 && swiperRef.current) {
        // 使用 setTimeout 确保 Swiper 初始化完成
        setTimeout(() => {
          swiperRef.current?.swipeTo(index);
        }, 0);
      }
    }
  }, []); // 仅在组件挂载时执行

  const handleIndexChange = (index: number) => {
    setActiveIndex(index);
    // 切换视频时，更新 URL 但不刷新页面
    const newVideoId = videos[index].id;
    window.history.replaceState(null, '', `/video/${newVideoId}`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (!videos.length) return <Loading />;

  return (
    <div className="video-feed-container">
      {/* 返回按钮 */}
      <div className="video-feed-back" onClick={handleBack}>
        <LeftOutline fontSize={24} />
      </div>

      {/* 垂直 Swiper 实现上下滑动切换 */}
      <Swiper
        direction='vertical'
        className="video-feed-swiper"
        indicator={() => null}
        onIndexChange={handleIndexChange}
        defaultIndex={activeIndex}
        ref={swiperRef}
        loop={false} // 不循环，更像抖音
        stuckAtBoundary={false}
      >
        {videos.map((video, index) => (
          <Swiper.Item key={video.id}>
            {/* 只渲染当前视频和相邻视频，优化性能 */}
            <SingleVideoItem 
              video={video} 
              isActive={index === activeIndex}
              shouldRender={Math.abs(index - activeIndex) <= 1}
            />
          </Swiper.Item>
        ))}
      </Swiper>
    </div>
  );
};

// 单个视频组件
const SingleVideoItem: React.FC<{ 
  video: IVideo; 
  isActive: boolean;
  shouldRender: boolean;
}> = ({ video, isActive, shouldRender }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments] = useState<IComment[]>([
    {
      id: '1',
      videoId: video.id,
      userId: 'user-1',
      user: {
        id: 'user-1',
        nickname: '用户1',
        avatar: 'https://picsum.photos/seed/user1/40/40',
      },
      content: '这个视频太棒了！点赞！',
      likeCount: 5,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      videoId: video.id,
      userId: 'user-2',
      user: {
        id: 'user-2',
        nickname: '用户2',
        avatar: 'https://picsum.photos/seed/user2/40/40',
      },
      content: '我也想试试这个效果！',
      likeCount: 3,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    },
  ]);
  const [commentText, setCommentText] = useState('');
  const navigate = useNavigate();

  // 监听激活状态，控制播放/暂停
  useEffect(() => {
    if (!videoRef.current) return;

    if (isActive) {
      // 这里的 play() 可能会因为浏览器策略被阻止，但在用户已有交互的情况下通常可行
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0; // 重置进度
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleMakeVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(ROUTES.MAKE_VIDEO.replace(':videoId', video.id));
  };

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/creator/${video.creatorId}`);
  };

  const handleSendComment = () => {
    if (!commentText.trim()) {
      Toast.show({ content: '请输入评论内容' });
      return;
    }

    const newComment: IComment = {
      id: Date.now().toString(),
      videoId: video.id,
      userId: 'current-user',
      user: {
        id: 'current-user',
        nickname: '我',
        avatar: 'https://picsum.photos/seed/current-user/40/40',
      },
      content: commentText.trim(),
      likeCount: 0,
      createdAt: new Date().toISOString(),
    };

    setComments([newComment, ...comments]);
    setCommentText('');
    Toast.show({ content: '评论成功' });
  };

  if (!shouldRender) {
    // 渲染占位图，优化长列表性能
    return (
      <div className="video-item-container placeholder">
        <Image src={video.coverUrl} fit='cover' className="video-placeholder-img" />
      </div>
    );
  }

  return (
    <div className="video-item-container" onClick={togglePlay}>
      {/* 视频播放器 */}
      <video
        ref={videoRef}
        src={video.videoUrl}
        poster={video.coverUrl}
        className="video-player"
        playsInline
        webkit-playsinline="true"
        loop
        // 确保视频填充模式
        style={{ objectFit: 'contain' }} 
      />

      {/* 播放按钮覆盖层 (暂停时显示) */}
      {!isPlaying && (
        <div className="play-icon-overlay">
          <div className="play-icon-triangle" />
        </div>
      )}

      {/* 右侧操作栏 */}
      <div className="right-sidebar">
        {/* 头像 */}
        <div className="sidebar-item avatar-item" onClick={handleCreatorClick}>
          <div className="avatar-border">
            <Image 
              src={video.creator?.avatar || ''} 
              className="creator-avatar" 
              width={48} 
              height={48} 
              fit='cover'
            />
          </div>
          <div className="follow-btn">+</div>
        </div>

        {/* 点赞 */}
        <div className="sidebar-item" onClick={(e) => { e.stopPropagation(); setLiked(!liked); Toast.show(liked ? '取消点赞' : '点赞成功') }}>
          {liked ? <HeartFill fontSize={36} color="#fe2c55" /> : <HeartOutline fontSize={36} color="#fff" />}
          <span className="sidebar-text">{video.likeCount + (liked ? 1 : 0)}</span>
        </div>

        {/* 评论 */}
        <div className="sidebar-item" onClick={(e) => { e.stopPropagation(); setCommentsVisible(true); }}>
          <MessageOutline fontSize={36} color="#fff" />
          <span className="sidebar-text">{comments.length}</span>
        </div>

        {/* 收藏 */}
        <div className="sidebar-item" onClick={(e) => { e.stopPropagation(); Toast.show('收藏成功') }}>
          <StarOutline fontSize={36} color="#fff" />
          <span className="sidebar-text">收藏</span>
        </div>
      </div>

      {/* 底部信息栏 */}
      <div className="bottom-info-bar">
        <div className="creator-name" onClick={handleCreatorClick}>@{video.creator?.nickname}</div>
        <div className="video-desc">{video.title} - {video.description || '暂无描述'}</div>
        
        <div className="make-same-btn-wrapper">
           <button className="make-same-btn" onClick={handleMakeVideo}>
             <div className="music-note-icon">🎵</div>
             <div className="btn-text">拍同款 {video.price ? formatPrice(video.price * 100) : ''}</div>
           </button>
        </div>
      </div>

      {/* 评论弹窗 */}
      <Popup
        visible={commentsVisible}
        onMaskClick={() => setCommentsVisible(false)}
        position="bottom"
        bodyStyle={{
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="comments-drawer">
          {/* 评论弹窗头部 */}
          <div className="comments-header">
            <h2>评论 ({comments.length})</h2>
            <div className="close-btn" onClick={() => setCommentsVisible(false)}>
              <CloseOutline fontSize={24} />
            </div>
          </div>

          {/* 评论列表 */}
          <div className="comments-list">
            {comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <Image
                  src={comment.user.avatar}
                  alt={comment.user.nickname}
                  fit="cover"
                  className="comment-avatar"
                  width={36}
                  height={36}
                />
                <div className="comment-content">
                  <div className="comment-user-info">
                    <span className="comment-user">{comment.user.nickname}</span>
                    <span className="comment-time">
                      {new Date(comment.createdAt).toLocaleString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="comment-text">{comment.content}</div>
                  <div className="comment-actions">
                    <span className="comment-like">👍 {comment.likeCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 评论输入框 */}
          <div className="comments-input-box">
            <TextArea
              placeholder="说点什么..."
              value={commentText}
              onChange={setCommentText}
              rows={2}
              maxLength={200}
              showCount
            />
            <Button
              color="primary"
              size="small"
              onClick={handleSendComment}
              className="comment-send-btn"
            >
              发送
            </Button>
          </div>
        </div>
      </Popup>
    </div>
  );
};